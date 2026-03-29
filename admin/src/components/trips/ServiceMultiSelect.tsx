import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { ServiceType } from '@shared/mockData';
import { serviceTypes } from '@shared/mockData';

interface ServiceMultiSelectProps {
  selected: ServiceType[];
  onChange: (services: ServiceType[]) => void;
}

export default function ServiceMultiSelect({ selected, onChange }: ServiceMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function toggle(svc: ServiceType) {
    const exists = selected.some((s) => s.code === svc.code);
    if (exists) {
      onChange(selected.filter((s) => s.code !== svc.code));
    } else {
      onChange([...selected, svc]);
    }
  }

  function remove(code: string) {
    onChange(selected.filter((s) => s.code !== code));
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 border border-[var(--color-border)] rounded-lg px-2.5 py-[7px] bg-white text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] min-h-[36px]"
      >
        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-1 flex-1">
            {selected.map((svc) => (
              <span
                key={svc.code}
                className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded bg-[var(--color-accent-soft)] text-[var(--color-accent)] text-[11px] font-medium"
              >
                {svc.code}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); remove(svc.code); }}
                  className="hover:text-red-500"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[13px] text-[var(--color-ink-faint)] flex-1">Select services...</span>
        )}
        <ChevronDown size={14} className={`text-[var(--color-ink-faint)] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white border border-[var(--color-border)] rounded-lg shadow-lg py-1">
          {serviceTypes.map((svc) => {
            const isSelected = selected.some((s) => s.code === svc.code);
            return (
              <button
                key={svc.code}
                type="button"
                onClick={() => toggle(svc)}
                className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-[var(--color-surface-raised)] ${
                  isSelected ? 'bg-[var(--color-accent-soft)]' : ''
                }`}
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                  isSelected
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                    : 'border-[var(--color-border)]'
                }`}>
                  {isSelected && '✓'}
                </span>
                <span className="font-mono text-[11px] text-[var(--color-ink-muted)] w-6">{svc.code}</span>
                <span className="text-[13px] text-[var(--color-ink-secondary)]">{svc.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
