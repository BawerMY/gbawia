"use client";

import { useLanguage } from "@/lib/i18n";
import { MonitorStage } from "@/components/MonitorStage";

export default function MonitorPage() {
  const { t } = useLanguage();
  return (
    <div className="px-4 py-14 md:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
        {t("monitor.title")}
      </h1>
      <p className="mt-3 max-w-2xl text-ink-soft">{t("monitor.intro")}</p>

      <div className="mt-8">
        <MonitorStage />
      </div>
    </div>
  );
}