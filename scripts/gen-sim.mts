// ---------------------------------------------------------------------------
// Reference "smart algorithm" that GENERATES src/data/movements.json.
//
// Implements the fill / direction-consolidation logic:
//   - a truck leaves a hub toward a direction only when that direction's load
//     reaches FILL (90%) of the truck, OR it has waited MAX_WAIT_MS ("1 week",
//     compressed) — whichever first. It never exceeds 100% (loads up to CAP).
//   - at each hub, cargo (on the truck + waiting in the warehouse) is grouped
//     by next direction; the fullest direction departs, others wait.
//   - goods are dropped off at their destination hub and continue hub-to-hub.
//
// Stand-in you can replace with your own generator. The simulator
// (src/lib/scenario.ts) only *runs* the JSON — it does none of this.
// ---------------------------------------------------------------------------
import { writeFileSync } from "node:fs";
import { CAPITALS, TRUCK_ROUTES, SEA_ROUTES, edgeLengthKm } from "../src/lib/geo";
import type { CapitalId } from "../src/lib/types";

// ------------------------- parameters --------------------------------------
const TRUCK_CAP = 10; // units per truck (1 unit = 10% of a truck)
const SHIP_CAP = 20; // units per ship
const FILL = 0.9; // leave only when >= 90% full
const MAX_WAIT_MS = 35_000; // "1 week", compressed to 35 sim-seconds
const TRUCK_SPEED = 30; // km per sim-second
const SHIP_SPEED = 10;
const MIN_TRAVEL_MS = 4_000;
const SEED = 0x9e3779b9;

// ------------------------- graph -------------------------------------------
const pairKey = (a: string, b: string) => [a, b].sort().join("|");
const seaPairs = new Set(SEA_ROUTES.map((e) => pairKey(e.from, e.to)));
const isSea = (a: string, b: string) => seaPairs.has(pairKey(a, b));
const travelMs = (a: string, b: string) => {
  const km = edgeLengthKm(a as CapitalId, b as CapitalId);
  return Math.max(MIN_TRAVEL_MS, Math.round((km / (isSea(a, b) ? SHIP_SPEED : TRUCK_SPEED)) * 1000));
};
const adj = new Map<string, string[]>();
const cost = new Map<string, number>();
for (const e of [...TRUCK_ROUTES, ...SEA_ROUTES]) {
  const k = pairKey(e.from, e.to);
  cost.set(k, travelMs(e.from, e.to));
  adj.set(e.from, [...(adj.get(e.from) ?? []), e.to]);
  adj.set(e.to, [...(adj.get(e.to) ?? []), e.from]);
}
function shortestPath(from: string, to: string): string[] {
  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, string>();
  const q = [from];
  while (q.length) {
    let mi = 0;
    for (let i = 1; i < q.length; i++) if ((dist.get(q[i]) ?? Infinity) < (dist.get(q[mi]) ?? Infinity)) mi = i;
    const cur = q.splice(mi, 1)[0];
    if (cur === to) break;
    const d = dist.get(cur) ?? Infinity;
    for (const nx of adj.get(cur) ?? []) {
      const nd = d + (cost.get(pairKey(cur, nx)) ?? 0);
      if (nd < (dist.get(nx) ?? Infinity)) {
        dist.set(nx, nd);
        prev.set(nx, cur);
        if (!q.includes(nx)) q.push(nx);
      }
    }
  }
  const path = [to];
  let cur = to;
  while (cur !== from && prev.has(cur)) {
    cur = prev.get(cur)!;
    path.unshift(cur);
  }
  return path[0] === from ? path : [from];
}

// ------------------------- RNG ---------------------------------------------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
const range = (a: number, b: number) => a + rnd() * (b - a);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

const PRODUCTS = {
  BOX: { label: "Box", color: "#12A02E" },
} as const;

// time scale: MAX_WAIT_MS == "1 week" (7 days), so a day is MAX_WAIT_MS / 7
const DAY_MS = MAX_WAIT_MS / 7;
const PICKUP_DELAY_MS = 2 * DAY_MS; // a delivered order is collected 2 days later

// Varied origin→destination pairs that share backbone legs (so corridors
// consolidate and fill to ~90%), but with no two identical shipments starting
// at the same time.
const OD_PAIRS: [string, string][] = [
  ["torino", "napoli"], ["milano", "bologna"], ["genova", "roma"],
  ["bologna", "torino"], ["firenze", "milano"], ["roma", "bologna"],
  ["milano", "roma"], ["genova", "bologna"], ["torino", "firenze"],
  ["roma", "genova"], ["bologna", "ancona"], ["napoli", "milano"],
  ["venezia", "firenze"], ["firenze", "venezia"], ["bologna", "napoli"],
  ["catanzaro", "palermo"],
];

// ------------------------- demand (varied, spread over time) ---------------
interface Order {
  id: string;
  product: string;
  origin: string;
  dest: string;
  size: number;
  availableAt: number;
  path: string[];
  pos: number;
  deliveredAt?: number;
}
const NUM_ORDERS = 120;
const ARRIVAL_WINDOW_MS = 220_000; // orders arrive steadily across the timeline
const SIZES = [4, 5, 5, 5]; // two boxes ~= a full truck, so legs reach 90%+ fast

// shuffle the pair pool so consecutive orders differ
const pool = [...OD_PAIRS];
for (let i = pool.length - 1; i > 0; i--) {
  const j = Math.floor(rnd() * (i + 1));
  [pool[i], pool[j]] = [pool[j], pool[i]];
}
const orders: Order[] = [];
const spacing = ARRIVAL_WINDOW_MS / NUM_ORDERS;
for (let i = 0; i < NUM_ORDERS; i++) {
  const [origin, dest] = pool[i % pool.length];
  orders.push({
    id: `S${i}`,
    product: "BOX",
    origin,
    dest,
    size: pick(SIZES),
    availableAt: Math.round(i * spacing + range(0, spacing * 0.6)),
    path: shortestPath(origin, dest),
    pos: 0,
  });
}
const byId = new Map(orders.map((o) => [o.id, o]));

// ------------------------- consolidation engine ----------------------------
interface Entry {
  oid: string;
  at: number;
}
interface Leg {
  key: string;
  from: string;
  to: string;
  entries: Entry[];
  units: number;
  departed: boolean;
  pendingChecks: number;
}
const ledger = new Map<string, Leg>();
const minAt = (leg: Leg) => Math.min(...leg.entries.map((e) => e.at));

interface Move {
  id: string;
  truck: string;
  from: string;
  to: string;
  start: number;
  durationMs: number;
  load: { product: string; qty: number; shipment: string }[];
}
const movements: Move[] = [];
let m = 0;
const pickups: { at: number; warehouse: string; product: string; qty: number; shipment: string }[] = [];

interface Veh {
  id: string;
  carrier: "truck" | "ship";
  lastEnd: number;
}
const fleet: Veh[] = [];
let truckN = 0;
let shipN = 0;
function assignVehicle(carrier: "truck" | "ship", start: number, end: number): string {
  for (const v of fleet) if (v.carrier === carrier && v.lastEnd <= start) {
    v.lastEnd = end;
    return v.id;
  }
  const id = carrier === "ship" ? `SHP-${String(++shipN).padStart(2, "0")}` : `TRK-${String(++truckN).padStart(2, "0")}`;
  fleet.push({ id, carrier, lastEnd: end });
  return id;
}

type Ev = { t: number; kind: "arrive" | "check"; orderId?: string; legKey?: string };
const events: Ev[] = orders.map((o) => ({ t: o.availableAt, kind: "arrive", orderId: o.id }));

function getOrCreateLeg(from: string, to: string): Leg {
  const key = `${from}>${to}`;
  let leg = ledger.get(key);
  if (!leg) {
    leg = { key, from, to, entries: [], units: 0, departed: false, pendingChecks: 0 };
    ledger.set(key, leg);
  }
  return leg;
}
function scheduleCheck(leg: Leg, at: number) {
  events.push({ t: at, kind: "check", legKey: leg.key });
  leg.pendingChecks += 1;
}
// load the front of the queue up to one vehicle, emit a departure
function takeTruck(leg: Leg, t: number) {
  const cap = isSea(leg.from, leg.to) ? SHIP_CAP : TRUCK_CAP;
  const take: Entry[] = [];
  let loaded = 0;
  for (const e of leg.entries) {
    const o = byId.get(e.oid)!;
    if (loaded + o.size > cap) break;
    take.push(e);
    loaded += o.size;
  }
  if (!take.length) return false;
  const takeSet = new Set(take.map((e) => e.oid));
  leg.entries = leg.entries.filter((e) => !takeSet.has(e.oid));
  leg.units -= loaded;
  const carrier = isSea(leg.from, leg.to) ? "ship" : "truck";
  const duration = cost.get(pairKey(leg.from, leg.to)) ?? 5000;
  const end = t + duration;
  const truck = assignVehicle(carrier, t, end);
  movements.push({
    id: `M-${String(++m).padStart(3, "0")}`,
    truck,
    from: leg.from,
    to: leg.to,
    start: Math.round(t),
    durationMs: Math.round(duration),
    load: take.map((e) => {
      const o = byId.get(e.oid)!;
      return { product: o.product, qty: o.size, shipment: o.id };
    }),
  });
  for (const e of take) {
    const o = byId.get(e.oid)!;
    o.pos += 1;
    if (o.pos >= o.path.length - 1) {
      o.deliveredAt = end;
      // stays in the destination warehouse, then the customer collects it in 2 days
      pickups.push({
        at: Math.round(end + PICKUP_DELAY_MS),
        warehouse: o.dest,
        product: o.product,
        qty: o.size,
        shipment: o.id,
      });
    } else events.push({ t: end, kind: "arrive", orderId: o.id });
  }
  if (leg.entries.length === 0) {
    leg.departed = true;
    ledger.delete(leg.key);
  }
  return true;
}
function tryDepart(leg: Leg, t: number) {
  if (leg.departed || leg.entries.length === 0) return;
  const fillUnits = FILL * (isSea(leg.from, leg.to) ? SHIP_CAP : TRUCK_CAP);
  const full = leg.units >= fillUnits;
  const timedOut = t - minAt(leg) >= MAX_WAIT_MS;
  if (!full && !timedOut) {
    if (leg.pendingChecks === 0) scheduleCheck(leg, minAt(leg) + MAX_WAIT_MS);
    return;
  }
  // keep sending full (or timed-out) vehicles until the leg is below threshold
  while (
    !leg.departed &&
    leg.entries.length > 0 &&
    (leg.units >= fillUnits || t - minAt(leg) >= MAX_WAIT_MS)
  ) {
    takeTruck(leg, t);
  }
  if (!leg.departed && leg.entries.length > 0 && leg.pendingChecks === 0) {
    scheduleCheck(leg, minAt(leg) + MAX_WAIT_MS);
  }
}
function arriveOrder(oid: string, t: number) {
  const o = byId.get(oid)!;
  const leg = getOrCreateLeg(o.path[o.pos], o.path[o.pos + 1]);
  leg.entries.push({ oid, at: t });
  leg.units += o.size;
  tryDepart(leg, t);
}

while (events.length) {
  let mi = 0;
  for (let i = 1; i < events.length; i++) if (events[i].t < events[mi].t) mi = i;
  const ev = events.splice(mi, 1)[0];
  if (ev.kind === "arrive") arriveOrder(ev.orderId!, ev.t);
  else {
    const leg = ledger.get(ev.legKey!);
    if (leg && !leg.departed) {
      leg.pendingChecks -= 1;
      tryDepart(leg, ev.t);
    }
  }
}

// ------------------------- derive warehouses -------------------------------
const deltas = new Map<string, { t: number; d: number }[]>();
const pushDelta = (hub: string, t: number, d: number) => {
  const a = deltas.get(hub) ?? [];
  a.push({ t, d });
  deltas.set(hub, a);
};
for (const o of orders) pushDelta(o.origin, o.availableAt, o.size); // arrivals
for (const mv of movements)
  for (const l of mv.load) {
    pushDelta(mv.from, mv.start, -l.qty);
    pushDelta(mv.to, mv.start + mv.durationMs, l.qty);
  }
for (const p of pickups) pushDelta(p.warehouse, p.at, -p.qty); // final pickup leaves the warehouse
const activeHubs = new Set<string>();
for (const mv of movements) {
  activeHubs.add(mv.from);
  activeHubs.add(mv.to);
}
for (const o of orders) activeHubs.add(o.origin);
const peakOf = (hub: string) => {
  let cur = 0;
  let peak = 0;
  for (const e of [...(deltas.get(hub) ?? [])].sort((a, b) => a.t - b.t)) {
    cur += e.d;
    peak = Math.max(peak, cur);
  }
  return peak;
};
const uniformCapacity = Math.max(12, ...[...activeHubs].map(peakOf));
const warehouses = [...activeHubs]
  .map((hub) => ({ id: hub, capacity: uniformCapacity, initialStock: {} }))
  .sort((a, b) => a.id.localeCompare(b.id));

const trucks = fleet.map((v) => ({ id: v.id, capacity: v.carrier === "ship" ? 20 : TRUCK_CAP }));
const capById = new Map(trucks.map((t) => [t.id, t.capacity]));
const shipments = orders.map((o) => ({ id: o.id, product: o.product, origin: o.origin, destination: o.dest, qty: o.size }));
const arrivals = orders.map((o) => ({ at: o.availableAt, warehouse: o.origin, product: o.product, qty: o.size, shipment: o.id }));
// end the run when ~90% of the goods have been collected — trims the sparse tail
const pickupTimes = pickups.map((p) => p.at).sort((a, b) => a - b);
const cutoff = pickupTimes.length ? pickupTimes[Math.floor(pickupTimes.length * 0.9)] : 0;
const durationMs = Math.round(cutoff + 6000);

const plan = {
  meta: {
    name: "generated-network",
    durationMs,
    note: "Generated by scripts/gen-sim.mts (reference fill/direction algorithm). Replace with your own plan.",
  },
  products: PRODUCTS,
  warehouses,
  trucks,
  shipments,
  arrivals,
  pickups,
  movements,
};

writeFileSync(new URL("../src/data/movements.json", import.meta.url), JSON.stringify(plan, null, 2));

// ------------------------- report ------------------------------------------
let full = 0;
let partial = 0;
const timeouts: string[] = [];
for (const mv of movements) {
  const units = mv.load.reduce((s, l) => s + l.qty, 0);
  const cap = capById.get(mv.truck) ?? TRUCK_CAP;
  if (units >= FILL * cap) full += 1;
  else {
    partial += 1;
    timeouts.push(`${mv.truck} ${mv.from}->${mv.to} ${units}/${cap}`);
  }
}
// true max instantaneous concurrency (sweep line)
const marks: [number, number][] = [];
for (const mv of movements) {
  marks.push([mv.start, 1]);
  marks.push([mv.start + mv.durationMs, -1]);
}
marks.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
let cur = 0;
let maxConc = 0;
for (const [, d] of marks) {
  cur += d;
  maxConc = Math.max(maxConc, cur);
}
console.log("orders:", orders.length, "(arrivals spread over ~" + Math.round(ARRIVAL_WINDOW_MS / 1000) + "s)");
console.log("movements:", movements.length, "| pickups:", pickups.length, "| trucks:", truckN, "ships:", shipN, "| hubs:", warehouses.length);
console.log("duration:", durationMs, "ms (~" + Math.round((durationMs / 60000) * 10) / 10 + " min)");
console.log(`departures >=90%: ${full}  |  timed-out (<90%): ${partial}`);
if (timeouts.length) console.log("timed-out legs:", timeouts.join("  "));
console.log("max concurrent vehicles:", maxConc);
console.log("undelivered:", orders.filter((o) => o.deliveredAt == null).length || "none");
