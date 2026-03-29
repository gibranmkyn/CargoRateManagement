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
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: '50%', background: '#f0fdf4',
            border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 12px',
          }}
        >
          <span style={{ color: '#059669', fontSize: 16 }}>✓</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', margin: 0 }}>No cancelled jobs</p>
        <p style={{ fontSize: 12, color: 'var(--color-ink-faint)', marginTop: 2 }}>All vendors are delivering as expected</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rejected.map((job) => (
        <div key={job.id} style={{ border: '1px solid #fecaca', borderRadius: 6, background: '#fff', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>{job.tripId}</span>
                  <span style={{ color: 'var(--color-ink-faint)' }}>·</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink-secondary)' }}>Job {job.id.split('-').pop()}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 4 }}>
                  {job.customerName} · {job.mawb}
                  {job.tripRemarks && <> · <em style={{ color: 'var(--color-ink-faint)' }}>{job.tripRemarks}</em></>}
                </div>
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                borderRadius: 4, fontSize: 12, fontWeight: 500, background: '#fef2f2', color: '#dc2626',
              }}>
                <AlertTriangle size={12} />
                Cancelled
              </span>
            </div>

            {/* Details grid */}
            <div style={{ display: 'flex', gap: 32, fontSize: 12 }}>
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-ink-faint)', marginBottom: 4 }}>Previous Vendor</div>
                <div style={{ fontWeight: 500, color: 'var(--color-ink-muted)', textDecoration: 'line-through' }}>{job.vendor.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-ink-faint)', marginBottom: 4 }}>Reason</div>
                <div style={{ fontWeight: 500, color: '#dc2626' }}>{job.cancelReason || '\u2014'}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-ink-faint)', marginBottom: 4 }}>Services</div>
                <ServiceTag service={job.service} />
              </div>
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-ink-faint)', marginBottom: 4 }}>Route</div>
                <div style={{ color: 'var(--color-ink-secondary)' }}>
                  {job.origin.location} → {job.destination.location}
                  {job.origin.date && <span style={{ color: 'var(--color-ink-faint)' }}> · {fmtDate(job.origin.date)}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Reassignment bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px',
            background: 'rgba(254,242,242,0.5)', borderTop: '1px solid #fecaca',
          }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-ink-secondary)' }}>Reassign to:</span>
            <select
              value={selectedVendors[job.id] || ''}
              onChange={(e) => setSelectedVendors((prev) => ({ ...prev, [job.id]: e.target.value }))}
              style={{
                fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 4,
                padding: '5px 10px', background: '#fff', color: 'var(--color-ink-secondary)', width: 200,
              }}
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
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                background: 'var(--color-accent)', color: '#fff', fontSize: 13, fontWeight: 500,
                borderRadius: 4, border: 'none', cursor: selectedVendors[job.id] ? 'pointer' : 'not-allowed',
                opacity: selectedVendors[job.id] ? 1 : 0.4,
              }}
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
