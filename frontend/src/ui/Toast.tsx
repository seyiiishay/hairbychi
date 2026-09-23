import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

const ToastContext = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const push = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-8" aria-live="polite" role="status">
        {toasts.map((t) => (
          <div key={t.id} className="flex animate-fade-up items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-sm text-ivory shadow-xl">
            <CheckCircle2 className="size-4 text-gold" aria-hidden />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
