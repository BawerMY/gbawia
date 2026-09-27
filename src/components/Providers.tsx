"use client";

import type { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";
import { ShipmentsProvider } from "@/lib/shipments";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ShipmentsProvider>{children}</ShipmentsProvider>
    </LanguageProvider>
  );
}