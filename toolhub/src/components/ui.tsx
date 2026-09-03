import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, PackageOpen, X } from "lucide-react";

// --- Toasts ---------------------------------------------------------------

type ToastTone = "success" | "error" | "info";
interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: ToastTone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, tone, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200);
  }, []);

  const icons = { success: CheckCircle2, error: AlertTriangle, info: Info };

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = icons[toast.tone];
          return (
            <div className={`toast toast-${toast.tone}`} key={toast.id}>
              <Icon size={15} />
              <span>{toast.message}</span>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// --- Confirmation modal ---------------------------------------------------

interface ConfirmProps {
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

export function ConfirmDialog({ title, message, confirmLabel = "Confirm", tone = "default", onConfirm, onCancel, busy }: ConfirmProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <div className="modal confirm-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close">
            <X />
          </button>
        </div>
        <p className="confirm-text">{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
          <button type="button" className={tone === "danger" ? "btn danger" : "btn primary"} onClick={onConfirm} disabled={busy}>
            {busy ? <Loader2 size={15} className="spin" /> : null} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- States ---------------------------------------------------------------

export const Skeleton = ({ height = 16, width = "100%", radius = 8 }: { height?: number; width?: number | string; radius?: number }) => (
  <span className="skeleton" style={{ height, width, borderRadius: radius }} />
);

export function SkeletonCards({ count = 4, variant = "card" }: { count?: number; variant?: "card" | "row" | "kpi" }) {
  return (
    <div className={variant === "row" ? "product-list" : variant === "kpi" ? "kpi-grid" : "product-grid"}>
      {Array.from({ length: count }).map((_, index) => (
        <div className={`skeleton-block skeleton-${variant}`} key={index}>
          <Skeleton height={variant === "card" ? 150 : 44} radius={10} />
          <Skeleton height={12} width="70%" />
          <Skeleton height={10} width="45%" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="state-panel">
      <div className="cat-icon"><PackageOpen /></div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", error, onRetry }: { title?: string; error?: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "Please try again in a moment.";
  return (
    <div className="state-panel error">
      <div className="cat-icon"><AlertTriangle /></div>
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="btn ghost" onClick={onRetry}>Try again</button>
      ) : null}
    </div>
  );
}

export const Spinner = ({ size = 16 }: { size?: number }) => <Loader2 size={size} className="spin" />;

// --- Small helpers --------------------------------------------------------

export function useDebounced<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function StarRating({ value, size = 13 }: { value: number; size?: number }) {
  const stars = useMemo(() => Array.from({ length: 5 }, (_, index) => index < Math.round(value)), [value]);
  return (
    <span className="star-row" aria-label={`Rated ${value} out of 5`}>
      {stars.map((filled, index) => (
        <span key={index} className={filled ? "star on" : "star"} style={{ fontSize: size }}>★</span>
      ))}
    </span>
  );
}
