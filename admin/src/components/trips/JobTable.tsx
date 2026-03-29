import { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, ArrowRight } from 'lucide-react';
import type { Job, JobStatus } from '@shared/mockData';
import StatusBadge from './StatusBadge';
import ServiceTag from './ServiceTag';

const allStatuses: JobStatus[] = ['Pending', 'In Progress', 'Completed', 'Verified', 'Cancelled', 'Cancelled'];

function fmt(dt: string) {
  const d = new Date(dt.replace(' ', 'T'));
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

interface JobTableProps {
  jobs: Job[];
  tripId?: string;
  onStatusChange?: (tripId: string, jobId: string, status: JobStatus) => void;
}

export default function JobTable({ jobs, tripId, onStatusChange }: JobTableProps) {
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenStatusId(null);
      }
    }
    if (openStatusId) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openStatusId]);

  function handleStatusSelect(job: Job, newStatus: JobStatus) {
    if (!tripId || !onStatusChange) return;

    // Out-of-sequence check
    const jobIndex = jobs.findIndex((j) => j.id === job.id);
    const statusRank: Record<JobStatus, number> = {
      Pending: 0, 'In Progress': 1, Completed: 2, Verified: 3, Rejected: -1, Cancelled: -1,
    };

    if (statusRank[newStatus] >= 1 && jobIndex > 0) {
      const earlierPending = jobs.slice(0, jobIndex).some(
        (j) => j.status === 'Pending' && statusRank[newStatus] > statusRank[j.status]
      );
      if (earlierPending) {
        const confirmed = window.confirm(
          `Job J${String(jobIndex + 1).padStart(2, '0')} would progress before earlier jobs are started. Continue anyway?`
        );
        if (!confirmed) {
          setOpenStatusId(null);
          return;
        }
      }
    }

    onStatusChange(tripId, job.id, newStatus);
    setOpenStatusId(null);
  }

  return (
    <div>
      {jobs.map((job, i) => {
        const orig = job.origin.date ? fmt(job.origin.date) : null;
        const dest = job.destination.date ? fmt(job.destination.date) : null;
        return (
          <div
            key={job.id}
            className={`group flex items-center gap-6 py-3.5 ${
              i > 0 ? 'border-t border-[var(--color-border-subtle)]' : ''
            }`}
          >
            {/* Job indicator */}
            <div className="w-6 text-center">
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-mono font-medium
                ${job.status === 'Verified' ? 'bg-emerald-100 text-emerald-700'
                : job.status === 'Completed' ? 'bg-amber-100 text-amber-700'
                : job.status === 'In Progress' ? 'bg-blue-100 text-blue-700'
                : job.status === 'Cancelled' ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                {i + 1}
              </span>
            </div>

            {/* Services + Vendor */}
            <div className="w-[200px] shrink-0">
              <div className="text-[13px] text-[var(--color-ink)] font-medium mb-0.5">{job.vendor.name}</div>
              <ServiceTag service={job.service} />
            </div>

            {/* Route: origin → destination */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <div className="min-w-0">
                <div className="text-[13px] text-[var(--color-ink-secondary)] truncate">{job.origin.location}</div>
                {orig && (
                  <div className="text-[11px] text-[var(--color-ink-faint)]">{orig.date} · {orig.time}</div>
                )}
              </div>
              <ArrowRight size={12} className="text-[var(--color-ink-faint)] shrink-0" />
              <div className="min-w-0">
                <div className="text-[13px] text-[var(--color-ink-secondary)] truncate">{job.destination.location}</div>
                {dest && (
                  <div className="text-[11px] text-[var(--color-ink-faint)]">{dest.date} · {dest.time}</div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="w-[110px] shrink-0 relative">
              <button
                onClick={() => onStatusChange && setOpenStatusId(openStatusId === job.id ? null : job.id)}
                className={onStatusChange ? 'cursor-pointer' : 'cursor-default'}
              >
                <StatusBadge status={job.status} />
              </button>
              {openStatusId === job.id && (
                <div ref={popoverRef} className="absolute top-full right-0 mt-1 z-20 bg-white border border-[var(--color-border)] rounded-lg shadow-lg py-1 min-w-[140px]">
                  {allStatuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusSelect(job, s)}
                      className={`w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--color-surface-raised)] ${
                        s === job.status ? 'font-medium text-[var(--color-ink)]' : 'text-[var(--color-ink-secondary)]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Duration */}
            <div className="w-[60px] shrink-0 text-right">
              {job.duration ? (
                <span className="font-mono text-[12px] text-[var(--color-ink-muted)]">{job.duration}</span>
              ) : (
                <span className="text-[12px] text-[var(--color-ink-faint)]">—</span>
              )}
            </div>

            {/* Actions */}
            <div className="w-[56px] shrink-0 flex justify-end">
              <div className="inline-flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                <button className="p-1.5 rounded text-[var(--color-ink-faint)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-colors">
                  <Pencil size={14} />
                </button>
                <button className="p-1.5 rounded text-[var(--color-ink-faint)] hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
