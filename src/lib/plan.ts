import type { CapitalId } from "./types";
import { CAPITALS } from "./geo";

// ---------------------------------------------------------------------------
// The "plan" is the single source of truth the simulator runs. It is a JSON
// file (src/data/movements.json) that your smart algorithm will generate. The
// simulator is a pure player: it does not invent movements — it executes the
// plan, tracks warehouse stock + truck loads over time, and renders the result.
// ---------------------------------------------------------------------------

export interface PlanLoad {
  product: string;
  qty: number;
  /** optional: link this cargo to a logical shipment (flow) */
  shipment?: string;
}

export interface PlanMovement {
  id: string;
  /** truck (or ship) id — must exist in `trucks` */
  truck: string;
  from: string;
  to: string;
  /** ms: when the vehicle leaves `from` */
  start: number;
  /** optional travel time override in ms (default: derived from the route) */
  durationMs?: number;
  load: PlanLoad[];
}

export interface PlanWarehouse {
  id: string;
  /** max stock in units — larger than any truck */
  capacity: number;
  /** units already sitting here at t=0, by product */
  initialStock?: Record<string, number>;
}

export interface PlanTruck {
  id: string;
  /** max load in units */
  capacity: number;
}

export interface PlanShipment {
  id: string;
  product: string;
  origin: string;
  destination: string;
  qty: number;
}

/** Goods appearing in a warehouse at a given time (units added to stock). */
export interface PlanArrival {
  at: number;
  warehouse: string;
  product: string;
  qty: number;
  /** optional: link to a logical shipment */
  shipment?: string;
}

/** Goods leaving a warehouse at a given time (units removed from stock). */
export interface PlanPickup {
  at: number;
  warehouse: string;
  product: string;
  qty: number;
  /** optional: link to a logical shipment */
  shipment?: string;
}

export interface PlanProduct {
  label?: string;
  color?: string;
}

/** A movement after validation: endpoints are guaranteed to be real capitals. */
export interface NormalizedMovement {
  id: string;
  truck: string;
  from: CapitalId;
  to: CapitalId;
  start: number;
  durationMs?: number;
  load: PlanLoad[];
}

/** Shape of the raw JSON as written on disk. */
export interface RawPlan {
  meta?: { name?: string; durationMs?: number; note?: string };
  products?: Record<string, PlanProduct>;
  warehouses?: PlanWarehouse[];
  trucks?: PlanTruck[];
  shipments?: PlanShipment[];
  arrivals?: PlanArrival[];
  pickups?: PlanPickup[];
  movements?: PlanMovement[];
}

export const VALID_CAPITALS: ReadonlySet<string> = new Set(CAPITALS.map((c) => c.id));

export function isCapital(id: string): id is CapitalId {
  return VALID_CAPITALS.has(id);
}

// Normalized, validated plan used by the simulator.
export interface Plan {
  /** declared duration; the simulator extends it to cover the last movement */
  durationMs: number;
  products: Record<string, PlanProduct>;
  warehouses: { id: CapitalId; capacity: number; initialStock: Record<string, number> }[];
  /** truck id -> capacity */
  trucks: Map<string, number>;
  /** declared shipment flows (optional) */
  shipments: { id: string; product: string; origin: CapitalId; destination: CapitalId; qty: number }[];
  /** timed stock additions to warehouses */
  arrivals: { at: number; warehouse: CapitalId; product: string; qty: number; shipment?: string }[];
  /** timed stock removals from warehouses (e.g. final delivery / pickup) */
  pickups: { at: number; warehouse: CapitalId; product: string; qty: number; shipment?: string }[];
  /** validated movements */
  movements: NormalizedMovement[];
}

const DEFAULT_WH_CAPACITY = 50;
const DEFAULT_TRUCK_CAPACITY = 10;

/**
 * Validate + normalize the raw JSON. Unknown capitals / duplicate trucks are
 * dropped (with a warning) rather than throwing, so a bad row never crashes the
 * build. Everything else keeps its declared values.
 */
export function normalizePlan(raw: RawPlan): Plan {
  const movements: NormalizedMovement[] = (raw.movements ?? [])
    .filter((m) => {
      const ok = m && isCapital(m.from) && isCapital(m.to) && m.from !== m.to && m.start >= 0;
      if (!ok) {
        // eslint-disable-next-line no-console
        console.warn(`[plan] skipping invalid movement ${m?.id ?? "?"}`, m);
      }
      return ok;
    })
    .map((m) => ({
      id: m.id,
      truck: m.truck,
      from: m.from as CapitalId,
      to: m.to as CapitalId,
      start: Math.round(m.start),
      durationMs: m.durationMs,
      load: (m.load ?? []).filter((l) => l && typeof l.qty === "number" && l.qty > 0),
    }));

  const warehouses = (raw.warehouses ?? [])
    .filter((w) => {
      const ok = w && isCapital(w.id);
      if (!ok) console.warn(`[plan] skipping invalid warehouse`, w);
      return ok;
    })
    .map((w) => ({
      id: w.id as CapitalId,
      capacity: w.capacity > 0 ? Math.round(w.capacity) : DEFAULT_WH_CAPACITY,
      initialStock: w.initialStock ?? {},
    }));

  const trucks = new Map<string, number>();
  for (const t of raw.trucks ?? []) {
    if (!t?.id || trucks.has(t.id)) continue;
    trucks.set(t.id, t.capacity > 0 ? Math.round(t.capacity) : DEFAULT_TRUCK_CAPACITY);
  }
  // any movement referencing a truck not listed still gets a default capacity
  for (const m of movements) {
    if (!trucks.has(m.truck)) trucks.set(m.truck, DEFAULT_TRUCK_CAPACITY);
  }

  const shipments = (raw.shipments ?? [])
    .filter((s) => s && isCapital(s.origin) && isCapital(s.destination))
    .map((s) => ({
      id: s.id,
      product: s.product,
      origin: s.origin as CapitalId,
      destination: s.destination as CapitalId,
      qty: s.qty,
    }));

  const arrivals = (raw.arrivals ?? [])
    .filter((a) => a && isCapital(a.warehouse) && a.qty > 0 && a.at >= 0)
    .map((a) => ({
      at: Math.round(a.at),
      warehouse: a.warehouse as CapitalId,
      product: a.product,
      qty: a.qty,
      shipment: a.shipment,
    }));

  const pickups = (raw.pickups ?? [])
    .filter((p) => p && isCapital(p.warehouse) && p.qty > 0 && p.at >= 0)
    .map((p) => ({
      at: Math.round(p.at),
      warehouse: p.warehouse as CapitalId,
      product: p.product,
      qty: p.qty,
      shipment: p.shipment,
    }));

  return {
    durationMs: raw.meta?.durationMs ?? 0,
    products: raw.products ?? {},
    warehouses,
    trucks,
    shipments,
    arrivals,
    pickups,
    movements,
  };
}
