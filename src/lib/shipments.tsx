"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { Quotation } from "./types";

interface ShipmentsContextValue {
  plans: Quotation[];
  addPlan: (quote: Quotation) => void;
  clear: () => void;
}

const ShipmentsContext = createContext<ShipmentsContextValue | null>(null);

export function ShipmentsProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<Quotation[]>([]);

  const addPlan = useCallback((quote: Quotation) => {
    setPlans((prev) => [quote, ...prev].slice(0, 10));
  }, []);

  const clear = useCallback(() => setPlans([]), []);

  return (
    <ShipmentsContext.Provider value={{ plans, addPlan, clear }}>
      {children}
    </ShipmentsContext.Provider>
  );
}

export function useShipments() {
  const ctx = useContext(ShipmentsContext);
  if (!ctx) throw new Error("useShipments must be used within ShipmentsProvider");
  return ctx;
}