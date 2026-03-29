import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface SlideOutPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export default function SlideOutPanel({ isOpen, onClose, children, title }: SlideOutPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.1)', zIndex: 40, transition: 'opacity 0.15s' }}
      />
      <div
        ref={panelRef}
        style={{
          position: 'fixed', top: 0, right: 0, height: '100%', width: 380, maxWidth: '90vw',
          background: '#fff', borderLeft: '1px solid #e5e7eb',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', zIndex: 50, overflowY: 'auto',
          animation: 'slideInPanel 0.2s ease-out',
        }}
      >
        <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
          {title && (
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '-0.2px', fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif" }}>
              {title}
            </span>
          )}
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: 16 }}>
          {children}
        </div>
      </div>
    </>
  );
}
