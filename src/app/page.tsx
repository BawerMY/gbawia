"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { ItalyMap } from "@/components/ItalyMap";

export default function HomePage() {
  const { t, dict } = useLanguage();
  const cases = dict.landing.cases;
  const steps = dict.landing.steps;
  const points = dict.landing.about.points;

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-16 md:grid-cols-[1.15fr_0.85fr] md:items-center md:pt-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-dim px-3 py-1 text-sm text-ink-soft">
            <span className="h-2 w-2 rounded-full bg-green" />
            {t("landing.heroKicker")}
          </p>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            {t("landing.heroTitle")}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            {t("landing.heroSub")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/pianifica"
              className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-green"
            >
              {t("landing.ctaPlan")}
            </Link>
            <Link
              href="/monitor"
              className="rounded-full border border-line-strong px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              {t("landing.ctaWatch")}
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-4 -top-4 h-24 w-24 rounded-2xl border border-line" />
          <div className="absolute -bottom-5 -right-4 h-32 w-32 rounded-full bg-paper-dim" />
          <div className="relative rounded-3xl border border-line bg-paper p-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <ItalyMap mode="truck" className="h-auto w-full opacity-90" />
          </div>
        </div>
      </section>

      <section id="process" className="scroll-mt-20 border-y border-line bg-paper-dim/50">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {t("landing.processTitle")}
          </h2>
          <p className="mt-3 max-w-2xl text-ink-soft">{t("landing.processIntro")}</p>

          <ol className="mt-10 divide-y divide-line">
            {steps.map((step, i) => (
              <li key={i} className="grid grid-cols-[3rem_1fr] items-start gap-4 py-6 md:grid-cols-[5rem_1fr_1fr] md:gap-8">
                <span className="font-display text-2xl font-semibold text-green">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-xl font-semibold tracking-tight">{step.title}</h3>
                <p className="col-start-2 text-ink-soft md:col-start-3 md:mt-0.5">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="cases" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 md:py-20">
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          {t("landing.casesTitle")}
        </h2>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <CaseCard icon={<PackageIcon />} title={cases[0].title} body={cases[0].body} accent="green" />
          <CaseCard icon={<SofaIcon />} title={cases[1].title} body={cases[1].body} accent="amber" />
          <CaseCard icon={<FactoryIcon />} title={cases[2].title} body={cases[2].body} accent="ink" />
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-20">
        <div className="grid gap-10 rounded-3xl border border-line bg-paper p-8 md:grid-cols-[1fr_1.3fr] md:p-12">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              {dict.landing.about.title}
            </h2>
            <p className="mt-4 max-w-md text-ink-soft">{dict.landing.about.lead}</p>
          </div>
          <div className="divide-y divide-line">
            {points.map((p, i) => (
              <div key={i} className="py-5 first:pt-0 last:pb-0">
                <h3 className="font-display text-lg font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-2 max-w-md text-ink-soft">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function CaseCard({
  icon,
  title,
  body,
  accent,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  accent: "green" | "amber" | "ink";
}) {
  const border =
    accent === "green"
      ? "border-t-green"
      : accent === "amber"
        ? "border-t-amber"
        : "border-t-ink";
  return (
    <Link href="/pianifica" className="group">
      <article
        className={`h-full rounded-2xl border border-line border-t-4 bg-paper p-6 transition-shadow hover:shadow-sm ${border}`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-paper-dim text-ink">
          {icon}
        </div>
        <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
      </article>
    </Link>
  );
}

function PackageIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 3.5 7v10L12 21l8.5-4V7L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3.5 7 12 11l8.5-4M12 11v10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function SofaIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 13a2 2 0 0 1 4 0v1h8v-1a2 2 0 0 1 4 0v3H4v-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6 17v1M18 17v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function FactoryIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 20V9l5 3V9l5 3V9l5 3v8H3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7 16h1M12 16h1M17 16h1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}