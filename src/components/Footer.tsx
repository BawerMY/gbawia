"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { useLanguage } from "@/lib/i18n";
import { Logo } from "./Logo";

// Only links that resolve to a real page or a section on the landing page.
const PAGE_LINKS = [
  { href: "/pianifica", key: "nav.pianifica" },
  { href: "/monitora", key: "nav.monitora" },
  { href: "/monitor", key: "nav.monitor" },
  { href: "/docs", key: "nav.docs" },
];

const SECTION_LINKS = [
  { id: "process", key: "footer.process" },
  { id: "cases", key: "footer.cases" },
  { id: "about", key: "footer.about" },
];

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-paper-dim/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
            {t("footer.blurb")}
          </p>
        </div>

        <div>
          <p className="font-display text-sm font-semibold">{t("footer.product")}</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {PAGE_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-ink">
                  {t(l.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-display text-sm font-semibold">{t("footer.explore")}</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {SECTION_LINKS.map((l) => (
              <li key={l.id}>
                <SectionLink id={l.id}>{t(l.key)}</SectionLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-4 text-xs text-ink-faint">
          <span>© {year} {t("footer.rights")}</span>
        </div>
      </div>
    </footer>
  );
}

function SectionLink({ id, children }: { id: string; children: ReactNode }) {
  const pathname = usePathname();
  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (pathname === "/") {
      e.preventDefault();
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  return (
    <Link href={`/#${id}`} onClick={onClick} className="transition-colors hover:text-ink">
      {children}
    </Link>
  );
}
