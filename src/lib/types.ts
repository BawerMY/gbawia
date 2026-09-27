export type Carrier = "truck" | "ship";

export type Mode = "truck" | "intermodal";

export interface BoxSpec {
  widthCm: number;
  heightCm: number;
  depthCm: number;
  /** weight of a single box (kg) */
  weightKg: number;
  /** number of boxes */
  count: number;
}

export type PickupMode = "warehouse" | "address";
export type DeliveryMode = "warehouse" | "address";

export interface QuotationInput {
  from: CapitalId;
  to: CapitalId;
  deliveryDate: string;
  fragile: boolean;
  boxes: BoxSpec;
  pickup: PickupMode;
  pickupAddress?: string;
  delivery: DeliveryMode;
  deliveryAddress?: string;
}

export interface PriceBreakdown {
  base: number;
  pickup: number;
  delivery: number;
  fragile: number;
}

export interface Quotation {
  id: string;
  createdAt: number;
  input: QuotationInput;
  price: number;
  breakdown: PriceBreakdown;
  expectedDate: string;
  guaranteedDate: string;
  distanceKm: number;
  weightKg: number;
}

export type OrderKind = "private" | "move" | "production";

export interface ScenarioOrder {
  id: string;
  kind: OrderKind;
  from: CapitalId;
  to: CapitalId;
  appearsAt: number;
  /** set when loaded onto a truck/ship */
  loadsAt?: number;
  truckId?: string;
  /** delivered */
  deliversAt?: number;
  carrier: Carrier;
}

export interface FullnessKeyframe {
  at: number;
  value: number;
}

export interface ScenarioVehicle {
  id: string;
  carrier: Carrier;
  from: CapitalId;
  to: CapitalId;
  departAt: number;
  arriveAt: number;
  fullness: FullnessKeyframe[];
}

export interface Scenario {
  duration: number;
  vehicles: ScenarioVehicle[];
  orders: ScenarioOrder[];
}

export type CapitalId =
  | "aosta"
  | "torino"
  | "milano"
  | "trento"
  | "trieste"
  | "venezia"
  | "genova"
  | "bologna"
  | "firenze"
  | "perugia"
  | "ancona"
  | "roma"
  | "laquila"
  | "campobasso"
  | "napoli"
  | "bari"
  | "potenza"
  | "catanzaro"
  | "cagliari"
  | "palermo";