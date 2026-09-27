import type { CapitalId, Carrier, Mode } from "./types";

export interface Capital {
  id: CapitalId;
  labelIt: string;
  labelEn: string;
  lon: number;
  lat: number;
  island: boolean;
}

export interface Route {
  from: CapitalId;
  to: CapitalId;
  carrier: Carrier;
}

// All 20 Italian region capitals. Coordinates are real (lon / lat).
export const CAPITALS: Capital[] = [
  { id: "aosta", labelIt: "Aosta", labelEn: "Aosta", lon: 7.3156, lat: 45.7374, island: false },
  { id: "torino", labelIt: "Torino", labelEn: "Turin", lon: 7.6869, lat: 45.0703, island: false },
  { id: "milano", labelIt: "Milano", labelEn: "Milan", lon: 9.19, lat: 45.4642, island: false },
  { id: "trento", labelIt: "Trento", labelEn: "Trento", lon: 11.1199, lat: 46.069, island: false },
  { id: "trieste", labelIt: "Trieste", labelEn: "Trieste", lon: 13.7728, lat: 45.6496, island: false },
  { id: "venezia", labelIt: "Venezia", labelEn: "Venice", lon: 12.3155, lat: 45.4408, island: false },
  { id: "genova", labelIt: "Genova", labelEn: "Genoa", lon: 8.9463, lat: 44.4056, island: false },
  { id: "bologna", labelIt: "Bologna", labelEn: "Bologna", lon: 11.3426, lat: 44.4949, island: false },
  { id: "firenze", labelIt: "Firenze", labelEn: "Florence", lon: 11.2558, lat: 43.7696, island: false },
  { id: "perugia", labelIt: "Perugia", labelEn: "Perugia", lon: 12.3896, lat: 43.1107, island: false },
  { id: "ancona", labelIt: "Ancona", labelEn: "Ancona", lon: 13.5034, lat: 43.6158, island: false },
  { id: "roma", labelIt: "Roma", labelEn: "Rome", lon: 12.4964, lat: 41.9028, island: false },
  { id: "laquila", labelIt: "L'Aquila", labelEn: "L'Aquila", lon: 13.3995, lat: 42.3498, island: false },
  { id: "campobasso", labelIt: "Campobasso", labelEn: "Campobasso", lon: 14.6647, lat: 41.5601, island: false },
  { id: "napoli", labelIt: "Napoli", labelEn: "Naples", lon: 14.2681, lat: 40.8518, island: false },
  { id: "bari", labelIt: "Bari", labelEn: "Bari", lon: 16.8719, lat: 41.1171, island: false },
  { id: "potenza", labelIt: "Potenza", labelEn: "Potenza", lon: 15.7989, lat: 40.6423, island: false },
  { id: "catanzaro", labelIt: "Catanzaro", labelEn: "Catanzaro", lon: 16.5987, lat: 38.91, island: false },
  { id: "cagliari", labelIt: "Cagliari", labelEn: "Cagliari", lon: 9.1195, lat: 39.2238, island: true },
  { id: "palermo", labelIt: "Palermo", labelEn: "Palermo", lon: 13.3615, lat: 38.1157, island: true },
];

export const TRUCK_ROUTES: Route[] = [
  { from: "torino", to: "milano", carrier: "truck" },
  { from: "milano", to: "venezia", carrier: "truck" },
  { from: "venezia", to: "bologna", carrier: "truck" },
  { from: "bologna", to: "ancona", carrier: "truck" },
  { from: "ancona", to: "laquila", carrier: "truck" },
  { from: "laquila", to: "campobasso", carrier: "truck" },
  { from: "campobasso", to: "bari", carrier: "truck" },
  { from: "bari", to: "potenza", carrier: "truck" },
  { from: "potenza", to: "napoli", carrier: "truck" },
  { from: "napoli", to: "roma", carrier: "truck" },
  { from: "roma", to: "perugia", carrier: "truck" },
  { from: "perugia", to: "firenze", carrier: "truck" },
  { from: "firenze", to: "genova", carrier: "truck" },
  { from: "genova", to: "torino", carrier: "truck" },
  { from: "aosta", to: "torino", carrier: "truck" },
  { from: "venezia", to: "trento", carrier: "truck" },
  { from: "venezia", to: "trieste", carrier: "truck" },
  { from: "firenze", to: "bologna", carrier: "truck" },
  { from: "perugia", to: "ancona", carrier: "truck" },
  { from: "roma", to: "laquila", carrier: "truck" },
  { from: "campobasso", to: "napoli", carrier: "truck" },
  { from: "potenza", to: "catanzaro", carrier: "truck" },
];

export const SEA_ROUTES: Route[] = [
  { from: "napoli", to: "cagliari", carrier: "ship" },
  { from: "napoli", to: "palermo", carrier: "ship" },
  { from: "catanzaro", to: "palermo", carrier: "ship" },
];

export function routesForMode(mode: Mode): Route[] {
  return mode === "intermodal" ? [...TRUCK_ROUTES, ...SEA_ROUTES] : TRUCK_ROUTES;
}

const capitalMap = new Map(CAPITALS.map((c) => [c.id, c]));

export function getCapital(id: CapitalId): Capital {
  const c = capitalMap.get(id);
  if (!c) throw new Error(`Unknown capital: ${id}`);
  return c;
}

export function capitalLabel(id: CapitalId, lang: "it" | "en"): string {
  const c = getCapital(id);
  return lang === "it" ? c.labelIt : c.labelEn;
}

export function mainlandCapitals(): Capital[] {
  return CAPITALS.filter((c) => !c.island);
}

function haversineKm(a: Capital, b: Capital): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

export function edgeLengthKm(a: CapitalId, b: CapitalId): number {
  return haversineKm(getCapital(a), getCapital(b));
}

export function routeDistanceKm(from: CapitalId, to: CapitalId): number {
  const adj = new Map<CapitalId, CapitalId[]>();
  for (const e of TRUCK_ROUTES) {
    adj.set(e.from, [...(adj.get(e.from) ?? []), e.to]);
    adj.set(e.to, [...(adj.get(e.to) ?? []), e.from]);
  }

  const queue: { id: CapitalId; dist: number }[] = [{ id: from, dist: 0 }];
  const seen = new Set<CapitalId>([from]);
  const fallback = edgeLengthKm(from, to);

  while (queue.length) {
    queue.sort((a, b) => a.dist - b.dist);
    const cur = queue.shift()!;
    if (cur.id === to) return Math.max(cur.dist, fallback);
    for (const next of adj.get(cur.id) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push({ id: next, dist: cur.dist + edgeLengthKm(cur.id, next) });
    }
  }
  return fallback;
}

/** Shortest road path between two capitals (list of capital ids, incl. endpoints). */
export function routePath(from: CapitalId, to: CapitalId): CapitalId[] {
  const adj = new Map<CapitalId, CapitalId[]>();
  for (const e of TRUCK_ROUTES) {
    adj.set(e.from, [...(adj.get(e.from) ?? []), e.to]);
    adj.set(e.to, [...(adj.get(e.to) ?? []), e.from]);
  }
  const prev = new Map<CapitalId, CapitalId>();
  const dist = new Map<CapitalId, number>([[from, 0]]);
  const queue: { id: CapitalId; d: number }[] = [{ id: from, d: 0 }];
  const done = new Set<CapitalId>();
  while (queue.length) {
    queue.sort((a, b) => a.d - b.d);
    const cur = queue.shift()!;
    if (done.has(cur.id)) continue;
    done.add(cur.id);
    if (cur.id === to) break;
    for (const next of adj.get(cur.id) ?? []) {
      if (done.has(next)) continue;
      const nd = cur.d + edgeLengthKm(cur.id, next);
      if (nd < (dist.get(next) ?? Infinity)) {
        dist.set(next, nd);
        prev.set(next, cur.id);
        queue.push({ id: next, d: nd });
      }
    }
  }
  if (from === to) return [from];
  if (!prev.has(to)) return [from, to];
  const path: CapitalId[] = [to];
  let cur = to;
  while (cur !== from && prev.has(cur)) {
    cur = prev.get(cur)!;
    path.unshift(cur);
  }
  return path;
}