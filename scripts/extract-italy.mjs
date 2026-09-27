import { feature } from "topojson-client";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const topo = JSON.parse(readFileSync(new URL("./world-50m.json", import.meta.url), "utf8"));
const fc = feature(topo, topo.objects.countries);
const italy = fc.features.find((f) => f.properties?.name === "Italy");
if (!italy) throw new Error("Italy not found in world-atlas countries");

mkdirSync(new URL("../src/data", import.meta.url), { recursive: true });
writeFileSync(new URL("../src/data/italy.geo.json", import.meta.url), JSON.stringify(italy));
console.log("extracted Italy, geometry:", italy.geometry.type);
console.log("bytes:", JSON.stringify(italy).length);