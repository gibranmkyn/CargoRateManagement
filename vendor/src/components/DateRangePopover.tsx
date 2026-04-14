import { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePopoverProps {
  startDate: string | null;  // "YYYY-MM-DD" or null
  endDate: string | null;
  onChange: (start: string | null, end: string | null) => void;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getPresetRange(preset: string): { start: string; end: string } | null {
  const now = new Date();
  switch (preset) {
    case 'today': return { start: toISO(now), end: toISO(now) };
    case 'week': {
      const s = new Date(now);
      // Monday-based week
      const day = s.getDay() === 0 ? 6 : s.getDay() - 1;
      s.setDate(s.getDate() - day);
      const e = new Date(s);
      e.setDate(e.getDate() + 6);
      return { start: toISO(s), end: toISO(e) };
    }
    case 'month': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: toISO(s), end: toISO(e) };
    }
    case 'last-month': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: toISO(s), end: toISO(e) };
    }
    default: return null;
  }
}

function buildCalendarDays(year: number, month: number): Array<{ dateStr: string; inMonth: boolean }> {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1);
  // Monday-based: Mon=0 ... Sun=6
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Array<{ dateStr: string; inMonth: boolean }> = [];

  // Prev month fill
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ dateStr: toISO(d), inMonth: false });
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push({ dateStr: toISO(d), inMonth: true });
  }
  // Next month fill to complete grid (6 rows = 42 cells)
  while (days.length < 42) {
    const d = new Date(year, month + 1, days.length - startOffset - daysInMonth + 1);
    days.push({ dateStr: toISO(d), inMonth: false });
  }
  return days;
}

export default function DateRangePopover({ startDate, endDate, onChange }: DateRangePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const today = toISO(new Date());

  // View state (which month the calendar shows)
  const [viewYear, setViewYear] = useState(() => {
    if (startDate) return parseInt(startDate.slice(0, 4));
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (startDate) return parseInt(startDate.slice(5, 7)) - 1;
    return new Date().getMonth();
  });

  // Draft state while popover is open
  const [draftStart, setDraftStart] = useState<string | null>(startDate);
  const [draftEnd, setDraftEnd] = useState<string | null>(endDate);
  const [selectingEnd, setSelectingEnd] = useState(false);

  // Sync draft with props when opening
  useEffect(() => {
    if (isOpen) {
      setDraftStart(startDate);
      setDraftEnd(endDate);
      setSelectingEnd(false);
      if (startDate) {
        setViewYear(parseInt(startDate.slice(0, 4)));
        setViewMonth(parseInt(startDate.slice(5, 7)) - 1);
      }
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') setIsOpen(false); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  const calendarDays = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  function onDayClick(dateStr: string) {
    if (!selectingEnd || !draftStart) {
      setDraftStart(dateStr);
      setDraftEnd(null);
      setSelectingEnd(true);
    } else {
      if (dateStr < draftStart) {
        setDraftEnd(draftStart);
        setDraftStart(dateStr);
      } else {
        setDraftEnd(dateStr);
      }
      setSelectingEnd(false);
    }
  }

  function getDayState(dateStr: string): 'start' | 'end' | 'in-range' | 'none' {
    if (!draftStart) return 'none';
    if (dateStr === draftStart) return 'start';
    if (draftEnd && dateStr === draftEnd) return 'end';
    if (draftEnd && dateStr > draftStart && dateStr < draftEnd) return 'in-range';
    return 'none';
  }

  function applyPreset(preset: string) {
    const range = getPresetRange(preset);
    if (range) {
      onChange(range.start, range.end);
    } else {
      onChange(null, null);
    }
    setIsOpen(false);
  }

  function handleApply() {
    onChange(draftStart, draftEnd);
    setIsOpen(false);
  }

  function handleClear() {
    onChange(null, null);
    setIsOpen(false);
  }

  // Trigger button label
  const label = useMemo(() => {
    if (!startDate && !endDate) return 'Date Range';
    const fmt = (s: string) => {
      const d = new Date(s + 'T00:00:00');
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    };
    if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
    if (startDate) return `From ${fmt(startDate)}`;
    if (endDate) return `To ${fmt(endDate)}`;
    return 'Date Range';
  }, [startDate, endDate]);

  const hasSelection = !!(startDate || endDate);

  const pillStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
    border: hasSelection ? '1px solid #152CFF' : '1px solid #e5e7eb',
    background: hasSelection ? 'rgba(21,44,255,0.06)' : '#fff',
    color: hasSelection ? '#152CFF' : '#6b7280',
  };

  const presets = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This week' },
    { key: 'month', label: 'This month' },
    { key: 'last-month', label: 'Last month' },
    { key: 'all-time', label: 'All time' },
  ];

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setIsOpen(!isOpen)} style={pillStyle}>
        <Calendar size={10} />
        {label}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          width: 280, zIndex: 100,
        }}>
          {/* Preset shortcuts */}
          <div style={{ display: 'flex', gap: 4, padding: '8px 10px', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap' }}>
            {presets.map(({ key, label: pLabel }) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                style={{
                  padding: '2px 7px', borderRadius: 99, fontSize: 9, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
              >
                {pLabel}
              </button>
            ))}
          </div>

          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px 4px' }}>
            <button
              onClick={prevMonth}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', padding: 2 }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', padding: 2 }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Calendar grid */}
          <div style={{ padding: '0 10px 4px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {DAY_HEADERS.map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', padding: '3px 0' }}>
                {d}
              </div>
            ))}
            {calendarDays.map(({ dateStr, inMonth }) => {
              const state = getDayState(dateStr);
              const isToday = dateStr === today;
              const isStart = state === 'start';
              const isEnd = state === 'end';
              const isInRange = state === 'in-range';
              return (
                <button
                  key={dateStr}
                  onClick={() => onDayClick(dateStr)}
                  style={{
                    textAlign: 'center',
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    padding: '4px 0',
                    borderRadius: 4,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: isToday ? 700 : 400,
                    background: (isStart || isEnd) ? '#152CFF' : isInRange ? 'rgba(21,44,255,0.07)' : 'transparent',
                    color: (isStart || isEnd) ? '#fff' : isInRange ? '#152CFF' : inMonth ? '#374151' : '#d1d5db',
                    outline: isToday && !isStart && !isEnd ? '1px solid rgba(21,44,255,0.3)' : 'none',
                  }}
                >
                  {parseInt(dateStr.slice(8))}
                </button>
              );
            })}
          </div>

          {/* From / To date inputs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderTop: '1px solid #f3f4f6' }}>
            <input
              type="date"
              value={draftStart ?? ''}
              onChange={(e) => { setDraftStart(e.target.value || null); setSelectingEnd(false); }}
              style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 10, borderRadius: 4, border: '1px solid #e5e7eb', padding: '3px 6px', outline: 'none', color: '#374151' }}
            />
            <span style={{ color: '#d1d5db', fontSize: 10 }}>–</span>
            <input
              type="date"
              value={draftEnd ?? ''}
              onChange={(e) => { setDraftEnd(e.target.value || null); }}
              style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 10, borderRadius: 4, border: '1px solid #e5e7eb', padding: '3px 6px', outline: 'none', color: '#374151' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, padding: '6px 10px 10px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleClear}
              style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Clear
            </button>
            <button
              onClick={handleApply}
              style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, border: 'none', background: '#152CFF', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
