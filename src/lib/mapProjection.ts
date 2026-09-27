import { geoMercator, geoPath } from "d3-geo";
import type { Feature, Geometry, GeoJsonProperties } from "geojson";
import italyData from "@/data/italy.geo.json";

export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 1400;

const PAD = 40;

const feature = italyData as unknown as Feature<Geometry, GeoJsonProperties>;

const projection = geoMercator().fitExtent(
  [
    [PAD, PAD],
    [MAP_WIDTH - PAD, MAP_HEIGHT - PAD],
  ],
  feature,
);

const pathGen = geoPath(projection);

export function italyOutlinePath(): string {
  return pathGen(feature) ?? "";
}

export function projectPoint(lon: number, lat: number): { x: number; y: number } {
  const p = projection([lon, lat]);
  return p ? { x: p[0], y: p[1] } : { x: 0, y: 0 };
}