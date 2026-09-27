"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLanguage } from "@/lib/i18n";
import { capitalLabel } from "@/lib/geo";
import { ItalyMap } from "@/components/ItalyMap";
import { buildSnapshot, SCENARIO } from "@/lib/scenario";
import type { ShipmentView } from "@/lib/scenario";
import type { Mode } from "@/lib/types";

export function MonitorStage() {
  const { t, lang } = useLanguage();
  const [mode, setMode] = useState<Mode>("truck");
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isFull, setIsFull] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onFs = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void gridRef.current?.requestFullscreen();
  }

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setElapsed((e) => (e + dt * speed) % SCENARIO.duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  const snapshot = useMemo(() => buildSnapshot(mode, elapsed), [mode, elapsed]);
  const progress = Math.round((elapsed / SCENARIO.duration) * 100);

  function reset() {
    setPlaying(false);
    setElapsed(0);
  }

  return (
    <div
      ref={gridRef}
      className={`${isFull ? "h-screen w-screen overflow-y-auto bg-paper p-4" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-line bg-paper-dim p-1">
          <button
            type="button"
            onClick={() => setPlaying(true)}
            disabled={playing}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              playing ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
            } disabled:opacity-60`}
          >
            {t("common.start")}
          </button>
          <button
            type="button"
            onClick={() => setPlaying(false)}
            disabled={!playing}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft disabled:opacity-40"
          >
            {t("common.pause")}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft"
          >
            {t("common.reset")}
          </button>
        </div>

        <div className="inline-flex items-center rounded-xl border border-line bg-paper px-3 py-2 text-sm">
          <span className="mr-2 text-ink-faint">{t("common.speed")}</span>
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`ml-1 rounded-lg px-2.5 py-1 text-sm font-medium ${
                speed === s ? "bg-ink text-paper" : "text-ink-soft"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        <div className="ml-auto inline-flex rounded-xl border border-line bg-paper-dim p-1">
          <ModeButton active={mode === "truck"} onClick={() => setMode("truck")}>
            {t("common.truck")}
          </ModeButton>
          <ModeButton active={mode === "intermodal"} onClick={() => setMode("intermodal")}>
            {t("common.intermodal")}
          </ModeButton>
        </div>
      </div>

      {mode === "intermodal" && (
        <p className="mt-3 text-sm text-sea">{t("monitor.futureNotice")}</p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_minmax(0,20rem)_minmax(0,24rem)] lg:items-start">
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFull ? "Exit fullscreen" : "Fullscreen"}
          title={isFull ? "Exit fullscreen" : "Fullscreen"}
          className={`fixed right-4 z-50 rounded-lg border border-line bg-paper/90 p-1.5 text-ink-soft shadow-sm backdrop-blur transition-colors hover:text-ink ${
            isFull ? "top-4" : "top-20"
          }`}
        >
          {isFull ? <ExitFsIcon /> : <EnterFsIcon />}
        </button>

        <div>
          <div className="rounded-3xl border border-line bg-paper p-3 md:p-5">
            <div className="mx-auto h-auto w-full lg:h-[90vh] lg:w-[64vh]">
              <ItalyMap
                mode={mode}
                vehicles={snapshot.vehicles}
                stock={snapshot.warehouse}
                className="h-auto w-full lg:h-full lg:w-full"
              />
            </div>
            <ProgressBar value={progress} />
            <Legend mode={mode} />
          </div>
        </div>

        <Panel className="lg:max-h-[84vh] lg:overflow-y-auto" title={t("monitor.warehouses")}>
          {snapshot.warehouse.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-faint">{t("monitor.warehousesEmpty")}</p>
          ) : (
            <ul className="divide-y divide-line">
              {snapshot.warehouse.map((w) => (
                <li key={w.id} className="py-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{capitalLabel(w.id, lang)}</span>
                    <span className="tabular-nums text-ink-soft">
                      {w.units} / {w.capacity} u
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-dim">
                    <div
                      className="h-full rounded-full bg-green transition-[width] duration-200"
                      style={{ width: `${Math.min(100, Math.round((w.units / w.capacity) * 100))}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="lg:max-h-[84vh] lg:overflow-y-auto" title={t("monitor.shipments")}>
          {snapshot.shipments.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-faint">{t("monitor.shipmentsEmpty")}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-2">
              {snapshot.shipments.map((s) => (
                <li key={s.id} className="min-w-0 rounded-xl border border-line px-3 py-2.5">
                  <p className="truncate text-sm font-medium">
                    {s.status === "moving" && s.legFrom && s.legTo
                      ? `${capitalLabel(s.legFrom, lang)} → ${capitalLabel(s.legTo, lang)}`
                      : `${capitalLabel(s.origin, lang)} → ${capitalLabel(s.destination, lang)}`}
                  </p>
                  <div className="mt-1.5">
                    <StatusBadge status={s.status} t={t} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-dim">
        <div className="h-full rounded-full bg-green" style={{ width: `${value}%` }} />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-ink-faint">{value}%</span>
    </div>
  );
}

function ModeButton({
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
      className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-ink text-paper" : "text-ink-soft"
      }`}
    >
      {children}
    </button>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-3xl border border-line bg-paper p-5 ${className}`}>
      <h2 className="font-display text-base font-semibold">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function StatusBadge({ status, t }: { status: ShipmentView["status"]; t: (k: string) => string }) {
  const cls =
    status === "moving"
      ? "bg-green/15 text-green"
      : status === "done"
        ? "bg-ink/10 text-ink-soft"
        : "bg-amber/15 text-amber";
  const label = status === "moving" ? t("monitor.statusMoving") : status === "done" ? t("monitor.statusDone") : t("monitor.statusWaiting");
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

function Legend({ mode }: { mode: Mode }) {
  const { t } = useLanguage();
  const items = [
    { color: "bg-ink", label: t("monitor.legendTruck") },
    { color: "bg-green", label: t("monitor.legendStock") },
  ];
  if (mode === "intermodal") items.push({ color: "bg-sea", label: t("monitor.legendSea") });
  return (
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 px-1 text-sm text-ink-soft">
      <span className="font-medium text-ink-faint">{t("monitor.legend")}</span>
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${it.color}`} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function EnterFsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function ExitFsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}
