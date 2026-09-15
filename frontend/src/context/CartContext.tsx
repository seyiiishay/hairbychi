import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Service } from "../api/types";

interface CartContextValue {
  items: Service[];
  addService: (service: Service) => void;
  removeService: (serviceId: string) => void;
  clear: () => void;
  totalPrice: number;
  totalDurationMinutes: number;
  // Guest details & payment carry across wizard steps too.
  guestDetails: { name: string; email: string; phone: string } | null;
  setGuestDetails: (details: { name: string; email: string; phone: string }) => void;
  policyAcknowledged: boolean;
  setPolicyAcknowledged: (v: boolean) => void;
  selectedSlotStart: string | null;
  setSelectedSlotStart: (iso: string | null) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "bbc_cart_v1";

interface StoredCart {
  items: Service[];
  guestDetails: { name: string; email: string; phone: string } | null;
  policyAcknowledged: boolean;
  selectedSlotStart: string | null;
}

function loadStored(): StoredCart {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupted storage
  }
  return { items: [], guestDetails: null, policyAcknowledged: false, selectedSlotStart: null };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredCart>(loadStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // best-effort only — cart still works in-memory this session
    }
  }, [state]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      addService: (service) =>
        setState((s) => (s.items.some((i) => i.id === service.id) ? s : { ...s, items: [...s.items, service] })),
      removeService: (serviceId) =>
        setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== serviceId) })),
      clear: () => setState({ items: [], guestDetails: null, policyAcknowledged: false, selectedSlotStart: null }),
      totalPrice: state.items.reduce((sum, i) => sum + parseFloat(i.price), 0),
      totalDurationMinutes: state.items.reduce((sum, i) => sum + i.duration_minutes, 0),
      guestDetails: state.guestDetails,
      setGuestDetails: (details) => setState((s) => ({ ...s, guestDetails: details })),
      policyAcknowledged: state.policyAcknowledged,
      setPolicyAcknowledged: (v) => setState((s) => ({ ...s, policyAcknowledged: v })),
      selectedSlotStart: state.selectedSlotStart,
      setSelectedSlotStart: (iso) => setState((s) => ({ ...s, selectedSlotStart: iso })),
    }),
    [state]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
