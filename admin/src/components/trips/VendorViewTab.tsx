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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {vendors.map(([code, { name, jobs }]) => (
        <div key={code} style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '8px 12px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{name}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#9ca3af' }}>{code}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>
              {jobs.length} job{jobs.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ padding: '6px 12px' }}>
            <JobTable jobs={jobs} />
          </div>
        </div>
      ))}
    </div>
  );
}
