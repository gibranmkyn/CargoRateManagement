import { useState } from 'react';
import { useTrips } from '@shared/TripContext';
import type { Job } from '@shared/mockData';
import { vendors } from '@shared/mockData';
import ServiceTag from './ServiceTag';
import { RefreshCw, AlertTriangle } from 'lucide-react';

function fmtDate(dt: string) {
  const d = new Date(dt.replace(' ', 'T'));
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface RejectedJob extends Job {
  tripId: string;
  customerName: string;
  mawb: string;
  tripRemarks: string;
}

export default function RejectedTab() {
  const { trips, updateJob } = useTrips();
  const [selectedVendors, setSelectedVendors] = useState<Record<string, string>>({});

  const rejected: RejectedJob[] = [];
  trips.forEach((trip) => {
    trip.jobs.forEach((job) => {
      if (job.status === 'Cancelled') {
        rejected.push({
          ...job,
          tripId: trip.id,
          customerName: trip.customer.name,
          mawb: trip.mawb,
          tripRemarks: trip.remarks,
        });
      }
    });
  });

  function handleReassign(job: RejectedJob) {
    const vendorCode = selectedVendors[job.id];
    if (!vendorCode) return;
    const vendor = vendors.find((v) => v.code === vendorCode);
    if (!vendor) return;
    updateJob(job.tripId, job.id, {
      vendor: { code: vendor.code, name: vendor.name },
      status: 'Pending',
      cancelReason: undefined,
    });
  }

  if (rejected.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
          <span className="text-emerald-500 text-[16px]">✓</span>
        </div>
        <p className="text-[13px] text-[var(--color-ink-muted)]">No rejected jobs</p>
        <p className="text-[12px] text-[var(--color-ink-faint)] mt-0.5">All vendors are delivering as expected</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rejected.map((job) => (
        <div key={job.id} className="border border-red-200 rounded-xl bg-white overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[13px] font-semibold text-[var(--color-ink)]">{job.tripId}</span>
                  <span className="text-[var(--color-ink-faint)]">·</span>
                  <span className="text-[13px] font-medium text-[var(--color-ink-secondary)]">Job {job.id.split('-').pop()}</span>
                </div>
                <div className="text-[12px] text-[var(--color-ink-muted)] mt-1">
                  {job.customerName} · {job.mawb}
                  {job.tripRemarks && <> · <em className="text-[var(--color-ink-faint)]">{job.tripRemarks}</em></>}
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium bg-red-50 text-red-600">
                <AlertTriangle size={12} />
                Rejected
              </span>
            </div>

            {/* Details grid */}
            <div className="flex gap-8 text-[12px]">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)] mb-1">Previous Vendor</div>
                <div className="font-medium text-[var(--color-ink-muted)] line-through">{job.vendor.name}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)] mb-1">Reason</div>
                <div className="font-medium text-red-600">{job.cancelReason || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)] mb-1">Services</div>
                <ServiceTag service={job.service} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)] mb-1">Route</div>
                <div className="text-[var(--color-ink-secondary)]">
                  {job.origin.location} → {job.destination.location}
                  {job.origin.date && <span className="text-[var(--color-ink-faint)]"> · {fmtDate(job.origin.date)}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Reassignment bar */}
          <div className="flex items-center gap-3 px-6 py-3 bg-red-50/50 border-t border-red-100">
            <span className="text-[12px] font-medium text-[var(--color-ink-secondary)]">Reassign to:</span>
            <select
              value={selectedVendors[job.id] || ''}
              onChange={(e) => setSelectedVendors((prev) => ({ ...prev, [job.id]: e.target.value }))}
              className="text-[13px] border border-[var(--color-border)] rounded-lg px-2.5 py-[5px] bg-white text-[var(--color-ink-secondary)] shadow-[0_1px_2px_rgba(0,0,0,0.03)] w-[200px]"
            >
              <option value="">Select vendor...</option>
              {vendors
                .filter((v) => v.code !== job.vendor.code)
                .map((v) => (
                  <option key={v.code} value={v.code}>{v.name}</option>
                ))}
            </select>
            <button
              onClick={() => handleReassign(job)}
              disabled={!selectedVendors[job.id]}
              className="inline-flex items-center gap-1.5 px-3 py-[5px] bg-[var(--color-accent)] text-white text-[13px] font-medium rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.1)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw size={13} />
              Reassign
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
