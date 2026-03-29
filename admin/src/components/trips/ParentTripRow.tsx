import { useState, useRef, useEffect } from 'react';
import { ChevronRight, MapPin, Package, Scale } from 'lucide-react';
import type { Trip, JobStatus } from '../../data/mockData';
import JobCard from './JobCard';

function buildRoute(trip: Trip): string {
  const locs: string[] = [];
  trip.jobs.forEach((j, i) => {
    if (i === 0) locs.push(j.origin.location);
    locs.push(j.destination.location);
  });
  return locs.filter((l, i) => i === 0 || l !== locs[i - 1]).join(' → ');
}

function getStatusCounts(trip: Trip) {
  const c: Partial<Record<JobStatus, number>> = {};
  trip.jobs.forEach((j) => { c[j.status] = (c[j.status] || 0) + 1; });
  return c;
}

const pillColors: Record<JobStatus, { bg: string; text: string; border: string }> = {
  Pending:       { bg: '#f9fafb', text: '#9ca3af', border: '#e5e7eb' },
  'In Progress': { bg: 'rgba(21,44,255,0.04)', text: '#152CFF', border: 'rgba(21,44,255,0.15)' },
  Completed:     { bg: '#fefce8', text: '#a16207', border: '#fde68a' },
  Verified:      { bg: '#f0fdf4', text: '#059669', border: '#a7f3d0' },
  Cancelled:      { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  Cancelled:     { bg: '#f9fafb', text: '#9ca3af', border: '#e5e7eb' },
};
const pillOrder: JobStatus[] = ['Verified', 'Completed', 'In Progress', 'Pending', 'Cancelled', 'Cancelled'];

interface Props {
  trip: Trip;
  isFirst: boolean;
  isLast: boolean;
  onStatusChange?: (t: string, j: string, s: JobStatus) => void;
  onUploadProof?: (t: string, j: string, f: File) => void;
  onRemoveProof?: (t: string, j: string, d: string) => void;
}

export default function ParentTripRow({ trip, isFirst, onStatusChange, onUploadProof, onRemoveProof }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);

  useEffect(() => { if (ref.current) setH(ref.current.scrollHeight); }, [open, trip.jobs]);

  const route = buildRoute(trip);
  const sc = getStatusCounts(trip);

  return (
    <div className={!isFirst ? 'border-t border-[var(--color-border)]' : ''}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full text-left px-6 py-[18px] flex items-start gap-4 transition-all duration-150 cursor-pointer group
          ${open ? 'bg-[var(--color-surface-raised)]' : 'hover:bg-[var(--color-surface-raised)]'}`}
      >
        {/* Chevron */}
        <ChevronRight
          size={15}
          className={`text-[var(--color-ink-faint)] mt-[3px] shrink-0 transition-transform duration-200 ${
            open ? 'rotate-90 !text-[var(--color-accent)]' : 'group-hover:translate-x-0.5'}`}
          strokeWidth={2.5}
        />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Customer name + Trip ID chip */}
          <div className="flex items-center gap-2.5 mb-1.5">
            <span
              className="text-[15px] font-bold text-[var(--color-ink)] tracking-[-0.3px] leading-tight"
              style={{ fontFamily: "'Instrument Sans', system-ui" }}
            >
              {trip.customer.name}
            </span>
            <span className="font-mono text-[10px] px-1.5 py-[2px] rounded-md bg-[var(--color-surface-inset)] text-[var(--color-ink-muted)] border border-[var(--color-border)] leading-none">
              {trip.id}
            </span>
          </div>

          {/* Row 2: Route with MapPin */}
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin size={12} className="text-[var(--color-accent)] shrink-0" strokeWidth={2.5} />
            <span className="text-[12px] text-[var(--color-ink-secondary)] truncate leading-tight">{route}</span>
          </div>

          {/* Row 3: Metadata line — MAWB, bags, weight, remarks */}
          <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-ink-muted)] leading-tight">
            <span className="font-mono text-[10px] bg-[var(--color-surface-inset)] px-1.5 py-[1px] rounded border border-[var(--color-border-subtle)]">
              {trip.mawb}
            </span>
            <span className="flex items-center gap-1">
              <Package size={10} className="text-[var(--color-ink-faint)]" />
              {trip.bags} bags
            </span>
            <span className="flex items-center gap-1">
              <Scale size={10} className="text-[var(--color-ink-faint)]" />
              {trip.weight} kg
            </span>
            {trip.remarks && (
              <span className="text-[var(--color-ink-faint)] italic truncate max-w-[180px]">
                {trip.remarks}
              </span>
            )}
          </div>
        </div>

        {/* Right side: status pills + date */}
        <div className="shrink-0 flex flex-col items-end gap-2 pt-0.5">
          <div className="flex gap-1.5">
            {pillOrder.map((s) => {
              const n = sc[s];
              if (!n) return null;
              const pc = pillColors[s];
              return (
                <span
                  key={s}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 9999,
                    fontSize: 10,
                    fontWeight: 700,
                    lineHeight: '1.25',
                    border: `1px solid ${pc.border}`,
                    background: pc.bg,
                    color: pc.text,
                  }}
                >
                  {n} {s === 'In Progress' ? 'Active' : s}
                </span>
              );
            })}
          </div>
          <span className="text-[10px] text-[var(--color-ink-faint)] font-mono">{trip.createdAt}</span>
        </div>
      </button>

      {/* Expanded jobs panel */}
      <div
        style={{ maxHeight: open ? `${h}px` : '0px', opacity: open ? 1 : 0 }}
        className="overflow-hidden transition-all duration-200 ease-out"
      >
        <div ref={ref} className="border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] px-6 py-5 pl-[56px]">
          <div className="text-[10px] font-bold text-[var(--color-ink-muted)] uppercase tracking-[0.08em] mb-3">
            Jobs ({trip.jobs.length})
          </div>
          <div className="flex gap-4 flex-wrap">
            {trip.jobs.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
                tripId={trip.id}
                totalJobs={trip.jobs.length}
                onStatusChange={onStatusChange}
                onUploadProof={onUploadProof}
                onRemoveProof={onRemoveProof}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
