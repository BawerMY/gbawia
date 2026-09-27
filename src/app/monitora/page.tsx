"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { useShipments } from "@/lib/shipments";
import { capitalLabel, routePath } from "@/lib/geo";
import { formatDate, formatMoney } from "@/lib/dates";
import type { Quotation } from "@/lib/types";

export default function MonitoraPage() {
  const { t, lang } = useLanguage();
  const { plans } = useShipments();
  const latest = plans[0] ?? null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
        {t("monitora.title")}
      </h1>

      {!latest ? (
        <EmptyState />
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <aside>
            <ShipmentCard quote={latest} />
          </aside>

          <WhereIsCard quote={latest} />
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  const { t } = useLanguage();
  return (
    <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-dashed border-line-strong bg-paper-dim/50 px-6 py-24 text-center">
      <p className="font-display text-2xl font-semibold">{t("monitora.empty")}</p>
      <p className="mt-2 max-w-sm text-ink-soft">{t("monitora.emptyBody")}</p>
      <Link
        href="/pianifica"
        className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-green"
      >
        {t("monitora.emptyCta")}
      </Link>
    </div>
  );
}

function ShipmentCard({ quote }: { quote: Quotation }) {
  const { t, lang } = useLanguage();
  return (
    <div className="rounded-3xl border border-line bg-paper p-6">
      <p className="text-sm font-medium text-green">{t("pianifica.resultTitle")}</p>
      <p className="mt-3 font-display text-2xl font-semibold">
        {capitalLabel(quote.input.from, lang)} → {capitalLabel(quote.input.to, lang)}
      </p>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl bg-paper-dim p-3">
          <dt className="text-xs text-ink-faint">{t("monitora.guaranteed")}</dt>
          <dd className="mt-1 font-medium">{formatDate(quote.guaranteedDate, lang)}</dd>
        </div>
        <div className="rounded-xl bg-paper-dim p-3">
          <dt className="text-xs text-ink-faint">{t("monitora.expected")}</dt>
          <dd className="mt-1 font-medium">{formatDate(quote.expectedDate, lang)}</dd>
        </div>
        <div className="rounded-xl bg-paper-dim p-3">
          <dt className="text-xs text-ink-faint">{t("monitora.price")}</dt>
          <dd className="mt-1 font-medium">{formatMoney(quote.price, lang)}</dd>
        </div>
      </dl>
    </div>
  );
}

function WhereIsCard({ quote }: { quote: Quotation }) {
  const { t, lang } = useLanguage();
  const path = routePath(quote.input.from, quote.input.to);
  const current = path[Math.floor(path.length / 2)] ?? quote.input.from;
  const idx = Math.max(0, path.indexOf(current));
  const progress = Math.round((idx / Math.max(1, path.length - 1)) * 100);
  return (
    <div className="flex flex-col justify-center rounded-3xl border border-line bg-paper p-6 md:p-8">
      <p className="text-sm font-medium text-ink-faint">{t("monitora.whereNow")}</p>
      <div className="mt-3 flex items-center gap-3">
        <span className="h-3.5 w-3.5 shrink-0 animate-pulse rounded-full bg-green" />
        <p className="font-display text-2xl font-semibold">{t("monitora.inTransit")}</p>
      </div>
      <p className="mt-6 text-sm text-ink-soft">{t("monitora.currentCity")}</p>
      <p className="font-display text-4xl font-semibold tracking-tight">{capitalLabel(current, lang)}</p>
      <p className="mt-4 text-sm text-ink-soft">
        {capitalLabel(quote.input.from, lang)} → {capitalLabel(quote.input.to, lang)}
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper-dim">
        <div className="h-full rounded-full bg-green" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}