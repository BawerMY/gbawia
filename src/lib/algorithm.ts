import type { Quotation, QuotationInput } from "./types";
import { routeDistanceKm } from "./geo";
import { addDays } from "./dates";

let counter = 0;

export function computeQuotation(input: QuotationInput): Quotation {
  const distanceKm = routeDistanceKm(input.from, input.to);
  const { widthCm, heightCm, depthCm, weightKg, count } = input.boxes;
  const boxCount = Math.max(1, count);
  const volumeM3 = (boxCount * widthCm * heightCm * depthCm) / 1_000_000;
  const totalWeightKg = boxCount * weightKg;

  const base = round2((6 + distanceKm * 0.28 + volumeM3 * 900 + totalWeightKg * 0.12) * 0.04);
  const pickup = input.pickup === "address" ? 8 : 0;
  const delivery = input.delivery === "address" ? 8 : 0;
  const fragile = input.fragile ? 2.5 : 0;
  const price = round2(base + pickup + delivery + fragile);

  const expectedDate = addDays(input.deliveryDate, -1);
  const slack = 1 + (input.fragile ? 1 : 0) + Math.min(2, Math.round(distanceKm / 400));
  const guaranteedDate = addDays(input.deliveryDate, slack);

  counter += 1;

  return {
    id: `quote-${Date.now()}-${counter}`,
    createdAt: Date.now(),
    input,
    price,
    breakdown: { base, pickup, delivery, fragile },
    expectedDate,
    guaranteedDate,
    distanceKm,
    weightKg: totalWeightKg,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}