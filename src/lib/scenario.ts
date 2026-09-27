import type { CapitalId, Carrier, Mode } from "./types";
import { SEA_ROUTES, edgeLengthKm, getCapital } from "./geo";
import { projectPoint } from "./mapProjection";
import { normalizePlan, type Plan, type RawPlan } from "./plan";
import rawPlan from "@/data/movements.json";

// ---------------------------------------------------------------------------
// The simulator is a pure "player" for a plan.
//
//   plan (src/data/movements.json)  ->  normalize + precompute  ->  buildSnapshot(mode, t)
//
// The plan lists trucks, warehouses (with capacities) and a timeline of
// movements. The engine derives, for any time t:
//   - which trucks are on the road and where they are (interpolated),
//   - how full each truck is,
//   - how much stock sits in every warehouse (respecting capacity),
//   - recent events (departures / arrivals),
//   - the status of every logical shipment (waiting / in transit / delivered).
//
// Products can wait in an intermediate warehouse and continue on a different
// vehicle; a truck can carry only a fraction of its capacity and load goods
// that other vehicles dropped off earlier (consolidation).
// ---------------------------------------------------------------------------

const plan: Plan = normalizePlan(rawPlan as RawPlan);

const SEA_PAIRS = new Set(SEA_ROUTES.map((e) => [e.from, e.to].sort().join("|")));
const isSea = (a: CapitalId, b: CapitalId) => SEA_PAIRS.has([a, b].sort().join("|"));

const TRUCK_SPEED = 22; // km per simulated second
const SHIP_SPEED = 8; // slower
const MIN_TRAVEL_MS = 5000;

const travelMs = (a: CapitalId, b: CapitalId, carrier: Carrier): number => {
  const km = edgeLengthKm(a, b);
  const speed = carrier === "ship" ? SHIP_SPEED : TRUCK_SPEED;
  return Math.max(MIN_TRAVEL_MS, Math.round((km / speed) * 1000));
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// --- precompute movements ---------------------------------------------------
interface Mov {
  id: string;
  truck: string;
  truckCap: number;
  from: CapitalId;
  to: CapitalId;
  start: number;
  end: number;
  carrier: Carrier;
  loadUnits: number;
  fullness: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  load: { product: string; qty: number; shipment?: string }[];
}

const MOVS: Mov[] = plan.movements.map((m) => {
  const carrier: Carrier = isSea(m.from, m.to) ? "ship" : "truck";
  const duration = m.durationMs && m.durationMs > 0 ? m.durationMs : travelMs(m.from, m.to, carrier);
  const start = m.start;
  const end = start + duration;
  const loadUnits = m.load.reduce((s, l) => s + l.qty, 0);
  const truckCap = plan.trucks.get(m.truck) ?? 10;
  const A = getCapital(m.from);
  const B = getCapital(m.to);
  const a = projectPoint(A.lon, A.lat);
  const b = projectPoint(B.lon, B.lat);
  return {
    id: m.id,
    truck: m.truck,
    truckCap,
    from: m.from,
    to: m.to,
    start,
    end,
    carrier,
    loadUnits,
    fullness: clamp01(loadUnits / truckCap),
    ax: a.x,
    ay: a.y,
    bx: b.x,
    by: b.y,
    load: m.load,
  };
});

const DURATION = Math.max(plan.durationMs, 1);

// --- warehouse stock timeline ----------------------------------------------
interface StockEvent {
  t: number;
  delta: number;
}
const stockTimeline = new Map<string, StockEvent[]>();
const stockKey = (wh: CapitalId, product: string) => `${wh}|${product}`;
const pushStock = (wh: CapitalId, product: string, t: number, delta: number) => {
  const key = stockKey(wh, product);
  const arr = stockTimeline.get(key) ?? [];
  arr.push({ t, delta });
  stockTimeline.set(key, arr);
};

for (const w of plan.warehouses) {
  for (const [product, qty] of Object.entries(w.initialStock)) {
    if (qty > 0) pushStock(w.id, product, 0, qty);
  }
}
for (const a of plan.arrivals) {
  if (a.qty > 0) pushStock(a.warehouse, a.product, a.at, a.qty);
}
for (const m of MOVS) {
  for (const l of m.load) {
    pushStock(m.from, l.product, m.start, -l.qty); // loaded onto the vehicle at origin
    pushStock(m.to, l.product, m.end, l.qty); // unloaded at destination
  }
}
for (const p of plan.pickups) {
  if (p.qty > 0) pushStock(p.warehouse, p.product, p.at, -p.qty); // final delivery: goods leave
}
for (const arr of stockTimeline.values()) arr.sort((a, b) => a.t - b.t);

function stockAt(wh: CapitalId, product: string, elapsed: number): number {
  const arr = stockTimeline.get(stockKey(wh, product));
  if (!arr) return 0;
  let sum = 0;
  for (const e of arr) {
    if (e.t <= elapsed) sum += e.delta;
    else break;
  }
  return Math.max(0, sum);
}

const warehouseProducts = new Map<CapitalId, Set<string>>();
const trackProduct = (wh: CapitalId, product: string) => {
  const set = warehouseProducts.get(wh) ?? new Set<string>();
  set.add(product);
  warehouseProducts.set(wh, set);
};
for (const w of plan.warehouses) for (const p of Object.keys(w.initialStock)) trackProduct(w.id, p);
for (const a of plan.arrivals) trackProduct(a.warehouse, a.product);
for (const m of MOVS)
  for (const l of m.load) {
    trackProduct(m.from, l.product);
    trackProduct(m.to, l.product);
  }

// --- shipments (logical flows) ---------------------------------------------
interface ShipLeg {
  start: number;
  end: number;
  from: CapitalId;
  to: CapitalId;
  carrier: Carrier;
  truck: string;
}
const shipmentLegs = new Map<string, ShipLeg[]>();
for (const m of MOVS) {
  for (const l of m.load) {
    if (!l.shipment) continue;
    const legs = shipmentLegs.get(l.shipment) ?? [];
    legs.push({ start: m.start, end: m.end, from: m.from, to: m.to, carrier: m.carrier, truck: m.truck });
    shipmentLegs.set(l.shipment, legs);
  }
}
for (const legs of shipmentLegs.values()) legs.sort((a, b) => a.start - b.start);

// when each shipment becomes available at its origin warehouse (before that it
// is not in the network yet, so it is kept out of the shipments list)
const arrivalAt = new Map<string, number>();
for (const a of plan.arrivals) {
  if (!a.shipment) continue;
  const prev = arrivalAt.get(a.shipment);
  if (prev == null || a.at < prev) arrivalAt.set(a.shipment, a.at);
}

// --- events -----------------------------------------------------------------
export interface PlanEvent {
  id: string;
  t: number;
  type: "departure" | "arrival";
  at: CapitalId;
  units: number;
  truck: string;
  to?: CapitalId;
  carrier: Carrier;
}
const EVENTS: PlanEvent[] = [];
for (const m of MOVS) {
  EVENTS.push({
    id: `${m.id}-dep`,
    t: m.start,
    type: "departure",
    at: m.from,
    units: m.loadUnits,
    truck: m.truck,
    to: m.to,
    carrier: m.carrier,
  });
  EVENTS.push({
    id: `${m.id}-arr`,
    t: m.end,
    type: "arrival",
    at: m.to,
    units: m.loadUnits,
    truck: m.truck,
    carrier: m.carrier,
  });
}
EVENTS.sort((a, b) => a.t - b.t);
const FEED_WINDOW_MS = 14000;

// --- exports ----------------------------------------------------------------
export const SIMULATION_DURATION = DURATION;
export const SCENARIO = { duration: DURATION };

export function productMeta(id: string): { label: string; color: string } {
  const m = plan.products[id];
  return { label: m?.label ?? id, color: m?.color ?? "#12A02E" };
}

export type VehiclePhase = "scheduled" | "moving" | "done";
export interface VehicleView {
  id: string;
  truckId: string;
  carrier: Carrier;
  from: CapitalId;
  to: CapitalId;
  x: number;
  y: number;
  phase: VehiclePhase;
  fullness: number;
  progress: number;
}
export interface WarehouseView {
  id: CapitalId;
  units: number;
  capacity: number;
  byProduct: { product: string; qty: number }[];
}
export interface ShipmentView {
  id: string;
  product: string;
  origin: CapitalId;
  destination: CapitalId;
  qty: number;
  status: "waiting" | "moving" | "done";
  at: CapitalId;
  truck?: string;
  legFrom?: CapitalId;
  legTo?: CapitalId;
  usesSea: boolean;
}
export interface Snapshot {
  vehicles: VehicleView[];
  warehouse: WarehouseView[];
  events: PlanEvent[];
  shipments: ShipmentView[];
  progress: number;
}

export function buildSnapshot(mode: Mode, elapsed: number): Snapshot {
  const showSea = mode === "intermodal";

  const vehicles: VehicleView[] = MOVS.filter(
    (m) => (showSea || m.carrier === "truck") && elapsed >= m.start && elapsed < m.end,
  ).map((m) => {
    const p = clamp01((elapsed - m.start) / (m.end - m.start));
    return {
      id: m.id,
      truckId: m.truck,
      carrier: m.carrier,
      from: m.from,
      to: m.to,
      x: m.ax + (m.bx - m.ax) * p,
      y: m.ay + (m.by - m.ay) * p,
      phase: "moving",
      fullness: m.fullness,
      progress: p,
    };
  });

  const warehouse: WarehouseView[] = plan.warehouses.map((w) => {
    const prods = warehouseProducts.get(w.id) ?? new Set<string>();
    const byProduct = [...prods]
      .map((product) => ({ product, qty: stockAt(w.id, product, elapsed) }))
      .filter((x) => x.qty > 0);
    const units = byProduct.reduce((s, x) => s + x.qty, 0);
    return { id: w.id, units, capacity: w.capacity, byProduct };
  });

  const events: PlanEvent[] = EVENTS.filter(
    (e) => (showSea || e.carrier === "truck") && e.t <= elapsed && e.t >= elapsed - FEED_WINDOW_MS,
  )
    .sort((a, b) => b.t - a.t)
    .slice(0, 8);

  const shipments: ShipmentView[] = plan.shipments
    .map((s) => {
      const legs = shipmentLegs.get(s.id);
      let status: ShipmentView["status"] = "waiting";
      let at: CapitalId = s.origin;
      let truck: string | undefined;
      let legFrom: CapitalId | undefined;
      let legTo: CapitalId | undefined;
      let usesSea = false;

      if (legs && legs.length) {
        usesSea = legs.some((l) => l.carrier === "ship");
        let last: ShipLeg | undefined;
        for (const leg of legs) if (leg.start <= elapsed) last = leg;
        if (last) {
          truck = last.truck;
          if (elapsed < last.end) {
            status = "moving";
            at = last.to;
            legFrom = last.from;
            legTo = last.to;
          } else if (last.to === s.destination) {
            status = "done";
            at = s.destination;
          } else {
            status = "waiting";
            at = last.to;
          }
        }
      }

      return { id: s.id, product: s.product, origin: s.origin, destination: s.destination, qty: s.qty, status, at, truck, legFrom, legTo, usesSea };
    })
    .filter((s) => elapsed >= (arrivalAt.get(s.id) ?? 0))
    .filter((s) => showSea || !s.usesSea)
    .sort(
      (a, b) =>
        (a.status === "moving" ? 0 : a.status === "waiting" ? 1 : 2) -
        (b.status === "moving" ? 0 : b.status === "waiting" ? 1 : 2),
    );

  return { vehicles, warehouse, events, shipments, progress: clamp01(elapsed / DURATION) };
}
