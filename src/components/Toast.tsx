import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'warning' | 'error';
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const icons = { success: CheckCircle2, warning: AlertTriangle, error: XCircle };
const colors = {
  success: { bg: '#059669', text: '#fff' },
  warning: { bg: '#6b7280', text: '#fff' },
  error: { bg: '#dc2626', text: '#fff' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((type: Toast['type'], message: string) => {
    const id = `t${Date.now()}${Math.random()}`;
    setToasts((prev) => [...prev.slice(-2), { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const remove = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const value: ToastContextValue = {
    success: useCallback((m: string) => add('success', m), [add]),
    warning: useCallback((m: string) => add('warning', m), [add]),
    error: useCallback((m: string) => add('error', m), [add]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', top: 48, right: 16, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none' }}>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          const c = colors[toast.type];
          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: c.bg, color: c.text, boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                minWidth: 200, animation: 'slideIn 0.25s ease-out',
                fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif",
              }}
            >
              <Icon size={14} />
              <span style={{ flex: 1 }}>{toast.message}</span>
              <button onClick={() => remove(toast.id)} style={{ opacity: 0.6, cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', padding: 0 }}>
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
