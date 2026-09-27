"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { useShipments } from "@/lib/shipments";
import { capitalLabel, mainlandCapitals } from "@/lib/geo";
import { computeQuotation } from "@/lib/algorithm";
import { addDays, formatDate, formatMoney, toIso } from "@/lib/dates";
import type { PickupMode, DeliveryMode, Quotation } from "@/lib/types";

export default function PianificaPage() {
  const { t, lang } = useLanguage();
  const { addPlan } = useShipments();

  const [from, setFrom] = useState("milano");
  const [to, setTo] = useState("roma");
  const [deliveryDate, setDeliveryDate] = useState(() =>
    addDays(toIso(new Date()), 7),
  );
  const [fragile, setFragile] = useState(false);
  const [width, setWidth] = useState(40);
  const [height, setHeight] = useState(30);
  const [depth, setDepth] = useState(30);
  const [weight, setWeight] = useState(5);
  const [boxes, setBoxes] = useState(1);
  const [pickup, setPickup] = useState<PickupMode>("warehouse");
  const [pickupAddress, setPickupAddress] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMode>("warehouse");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const capitals = useMemo(() => mainlandCapitals(), []);

  const quote: Quotation | null = useMemo(() => {
    if (!from || !to || !deliveryDate || width < 1 || height < 1 || depth < 1) return null;
    return computeQuotation({
      from: from as Quotation["input"]["from"],
      to: to as Quotation["input"]["to"],
      deliveryDate,
      fragile,
      boxes: { widthCm: width, heightCm: height, depthCm: depth, weightKg: weight, count: boxes },
      pickup,
      pickupAddress: pickup === "address" ? pickupAddress : undefined,
      delivery,
      deliveryAddress: delivery === "address" ? deliveryAddress : undefined,
    });
  }, [from, to, deliveryDate, fragile, width, height, depth, weight, boxes, pickup, pickupAddress, delivery, deliveryAddress]);

  const [savedId, setSavedId] = useState<string | null>(null);

  function handleSave() {
    if (!quote) return;
    addPlan(quote);
    setSavedId(quote.id);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
        {t("pianifica.title")}
      </h1>
      <p className="mt-3 max-w-xl text-ink-soft">{t("pianifica.intro")}</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-line bg-paper p-6 md:p-8">
          <Field label={t("pianifica.from")}>
            <Select
              value={from}
              onChange={(v) => setFrom(v)}
              options={capitals.map((c) => ({ value: c.id, label: capitalLabel(c.id, lang) }))}
            />
          </Field>

          <Field label={t("pianifica.to")}>
            <Select
              value={to}
              onChange={(v) => setTo(v)}
              options={capitals.map((c) => ({ value: c.id, label: capitalLabel(c.id, lang) }))}
            />
          </Field>

          <Field label={t("pianifica.deliveryDate")}>
            <input
              type="date"
              value={deliveryDate}
              min={toIso(new Date())}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-ink outline-none transition-colors focus:border-green"
            />
          </Field>

          <div className="mt-7 border-t border-line pt-7">
            <h2 className="font-display text-lg font-semibold">{t("pianifica.shipmentTitle")}</h2>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <Field label={t("pianifica.boxWidth")}>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={width}
                  onChange={(e) => setWidth(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-ink outline-none focus:border-green"
                />
              </Field>
              <Field label={t("pianifica.boxHeight")}>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={height}
                  onChange={(e) => setHeight(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-ink outline-none focus:border-green"
                />
              </Field>
              <Field label={t("pianifica.boxDepth")}>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={depth}
                  onChange={(e) => setDepth(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-ink outline-none focus:border-green"
                />
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <Field label={t("pianifica.boxWeight")}>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={weight}
                  onChange={(e) => setWeight(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-ink outline-none focus:border-green"
                />
              </Field>
              <Field label={t("pianifica.boxCount")}>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={boxes}
                  onChange={(e) => setBoxes(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-ink outline-none focus:border-green"
                />
              </Field>
              <Field label={t("pianifica.fragile")}>
                <button
                  type="button"
                  onClick={() => setFragile((f) => !f)}
                  aria-pressed={fragile}
                  className={`flex h-[46px] w-full items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
                    fragile ? "border-green bg-green/10 text-green-deep" : "border-line text-ink-soft"
                  }`}
                >
                  {fragile ? "✓ " : ""}
                  {t("pianifica.fragile")}
                </button>
              </Field>
            </div>
          </div>

          <div className="mt-7 border-t border-line pt-7">
            <Segment
              title={t("pianifica.pickupTitle")}
              value={pickup}
              onChange={(v) => setPickup(v as PickupMode)}
              optionA={t("pianifica.pickupWarehouse")}
              optionB={t("pianifica.pickupAddress")}
            />
            {pickup === "address" && (
              <input
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder={t("pianifica.addressPlaceholder")}
                className="mt-3 w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-ink outline-none focus:border-green"
              />
            )}
          </div>

          <div className="mt-7 border-t border-line pt-7">
            <Segment
              title={t("pianifica.deliveryTitle")}
              value={delivery}
              onChange={(v) => setDelivery(v as DeliveryMode)}
              optionA={t("pianifica.deliveryWarehouse")}
              optionB={t("pianifica.deliveryAddress")}
            />
            {delivery === "address" && (
              <input
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder={t("pianifica.addressPlaceholder")}
                className="mt-3 w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-ink outline-none focus:border-green"
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!quote}
            className="mt-8 w-full rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-green disabled:opacity-40"
          >
            {t("pianifica.calculate")}
          </button>
        </div>

        {quote && savedId === quote.id ? (
          <ResultPanel quote={quote} />
        ) : (
          <section className="flex h-fit items-center justify-center rounded-3xl border border-dashed border-line-strong bg-paper-dim/50 p-10 text-center">
            <p className="max-w-xs text-sm text-ink-faint">
              {t("pianifica.intro")}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

function ResultPanel({ quote }: { quote: Quotation }) {
  const { t, lang } = useLanguage();
  return (
    <aside className="h-fit rounded-3xl border border-line bg-paper p-6 md:sticky md:top-24 md:p-8">
      <p className="text-sm font-medium text-green">{t("pianifica.resultTitle")}</p>
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-paper-dim px-5 py-4">
        <span className="text-sm text-ink-soft">
          {capitalLabel(quote.input.from, lang)} → {capitalLabel(quote.input.to, lang)}
        </span>
        <span className="font-display text-xl font-semibold">
          {formatMoney(quote.price, lang)}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-ink-faint">{t("pianifica.guaranteed")}</p>
          <p className="mt-1 font-display text-lg font-semibold">
            {formatDate(quote.guaranteedDate, lang)}
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-faint">{t("pianifica.expected")}</p>
          <p className="mt-1 font-display text-lg font-semibold">
            {formatDate(quote.expectedDate, lang)}
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <p className="text-sm font-medium text-ink-soft">
          {t("pianifica.breakdownTitle")}
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          <Row label={t("pianifica.breakdownBase")} value={formatMoney(quote.breakdown.base, lang)} />
          {quote.breakdown.pickup > 0 && (
            <Row label={t("pianifica.breakdownPickup")} value={formatMoney(quote.breakdown.pickup, lang)} />
          )}
          {quote.breakdown.delivery > 0 && (
            <Row label={t("pianifica.breakdownDelivery")} value={formatMoney(quote.breakdown.delivery, lang)} />
          )}
          {quote.breakdown.fragile > 0 && (
            <Row label={t("pianifica.breakdownFragile")} value={formatMoney(quote.breakdown.fragile, lang)} />
          )}
        </ul>
        <p className="mt-3 text-xs text-ink-faint">
          {t("pianifica.boxDims", {
            count: quote.input.boxes.count,
            w: quote.input.boxes.widthCm,
            h: quote.input.boxes.heightCm,
            d: quote.input.boxes.depthCm,
            weight: quote.weightKg,
          })}
        </p>
      </div>

      <Link
        href="/monitora"
        className="mt-6 block w-full rounded-full bg-green px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-green-deep"
      >
        {t("pianifica.viewMap")}
      </Link>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium">{value}</span>
    </li>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`mt-4 ${className}`}>
      <label className="mb-1.5 block text-sm font-medium text-ink-soft">{label}</label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-ink outline-none transition-colors focus:border-green"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Segment({
  title,
  value,
  onChange,
  optionA,
  optionB,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  optionA: string;
  optionB: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink-soft">{title}</p>
      <div className="inline-flex rounded-xl border border-line bg-paper-dim p-1">
        <SegmentButton active={value === "warehouse"} onClick={() => onChange("warehouse")}>
          {optionA}
        </SegmentButton>
        <SegmentButton active={value === "address"} onClick={() => onChange("address")}>
          {optionB}
        </SegmentButton>
      </div>
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}