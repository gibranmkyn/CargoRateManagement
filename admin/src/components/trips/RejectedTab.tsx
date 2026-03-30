import { useTrips } from '@shared/TripContext';
import type { Job } from '@shared/mockData';
import ServiceTag from './ServiceTag';
import { AlertTriangle } from 'lucide-react';

function fmtDate(dt: string) {
  const d = new Date(dt.replace(' ', 'T'));
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface RejectedJob extends Job {
  tripId: string;
  customerName: string;
  mawb: string;
}

export default function RejectedTab() {
  const { trips } = useTrips();

  const rejected: RejectedJob[] = [];
  trips.forEach((trip) => {
    trip.jobs.forEach((job) => {
      if (job.status === 'Cancelled') {
        rejected.push({ ...job, tripId: trip.id, customerName: trip.customer.name, mawb: trip.mawb });
      }
    });
  });

  if (rejected.length === 0) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0fdf4', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <span style={{ color: '#059669', fontSize: 16 }}>✓</span>
        </div>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No cancelled jobs</p>
        <p style={{ fontSize: 12, color: '#d1d5db', marginTop: 2 }}>All vendors are delivering as expected</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rejected.map((job) => {
        // Find replacement job if it exists
        const trip = trips.find((t) => t.id === job.tripId);
        const replacedByJob = job.replacedByJobId ? trip?.jobs.find((j) => j.id === job.replacedByJobId) : null;

        return (
          <div key={job.id} style={{ border: '1px solid #fecaca', borderRadius: 6, background: '#fff', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px' }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: '#9ca3af' }}>{job.tripId}</span>
                  <span style={{ color: '#d1d5db' }}>·</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{job.id.split('-').pop()}</span>
                  <span style={{ color: '#d1d5db' }}>·</span>
                  <span style={{ fontSize: 11, color: '#374151' }}>{job.customerName}</span>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                  <AlertTriangle size={10} /> Cancelled
                </span>
              </div>

              {/* Details row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>Vendor </span>
                  <span style={{ fontWeight: 600, color: '#9ca3af', textDecoration: 'line-through' }}>{job.vendor.name}</span>
                </div>
                <ServiceTag service={job.service} />
                <span style={{ color: '#374151' }}>{job.origin.location}{job.origin.location !== job.destination.location ? ` → ${job.destination.location}` : ''}</span>
              </div>

              {/* Cancel reason */}
              {job.cancelReason && (
                <div style={{ padding: '6px 8px', background: '#fff', border: '1px solid #fecaca', borderRadius: 4, fontSize: 11, color: '#dc2626' }}>
                  {job.cancelReason}
                </div>
              )}

              {/* Replacement link */}
              {replacedByJob && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
                  <span style={{ color: '#9ca3af' }}>Replaced by</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#152CFF' }}>{replacedByJob.id}</span>
                  <span style={{ color: '#374151' }}>{replacedByJob.vendor.name}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: replacedByJob.status === 'Pending' ? '#f9fafb' : 'rgba(21,44,255,0.04)', color: replacedByJob.status === 'Pending' ? '#9ca3af' : '#152CFF', border: `1px solid ${replacedByJob.status === 'Pending' ? '#e5e7eb' : 'rgba(21,44,255,0.15)'}` }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: replacedByJob.status === 'Pending' ? '#9ca3af' : '#152CFF', display: 'inline-block' }} />
                    {replacedByJob.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
