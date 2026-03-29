import { useTrips } from '@shared/TripContext';
import type { Job } from '@shared/mockData';
import JobTable from './JobTable';

export default function VendorViewTab() {
  const { trips } = useTrips();
  const vendorMap = new Map<string, { name: string; jobs: Job[] }>();

  trips.forEach((trip) => {
    trip.jobs.forEach((job) => {
      const key = job.vendor.code;
      if (!vendorMap.has(key)) {
        vendorMap.set(key, { name: job.vendor.name, jobs: [] });
      }
      vendorMap.get(key)!.jobs.push(job);
    });
  });

  const vendors = Array.from(vendorMap.entries());

  return (
    <div className="space-y-4">
      {vendors.map(([code, { name, jobs }]) => (
        <div key={code} className="border border-[var(--color-border)] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-baseline gap-2 px-8 py-3.5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]">
            <span className="text-[14px] font-semibold text-[var(--color-ink)]">{name}</span>
            <span className="font-mono text-[11px] text-[var(--color-ink-faint)]">{code}</span>
            <span className="ml-auto text-[12px] text-[var(--color-ink-muted)]">
              {jobs.length} job{jobs.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="px-8 py-3">
            <JobTable jobs={jobs} />
          </div>
        </div>
      ))}
    </div>
  );
}
