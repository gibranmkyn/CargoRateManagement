import { AlertTriangle } from 'lucide-react';
import { useTrips } from '@shared/TripContext';

interface RejectionBannerProps {
  onViewRejected: () => void;
}

export default function RejectionBanner({ onViewRejected }: RejectionBannerProps) {
  const { trips } = useTrips();

  const cancelled: { customerName: string; vendorName: string; reason: string }[] = [];
  trips.forEach((t) => {
    t.jobs.forEach((j) => {
      if (j.status === 'Cancelled') {
        cancelled.push({ customerName: t.customer.name, vendorName: j.vendor.name, reason: j.rejectionReason || 'No reason' });
      }
    });
  });

  if (cancelled.length === 0) return null;
  const first = cancelled[0];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 16px',
      background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6,
        background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <AlertTriangle size={14} style={{ color: '#fff' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>
          {cancelled.length} cancelled assignment{cancelled.length !== 1 ? 's' : ''} need{cancelled.length === 1 ? 's' : ''} reassignment
        </div>
        <div style={{ fontSize: 11, color: '#92400e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {first.customerName} — {first.vendorName} ({first.reason})
          {cancelled.length > 1 && ` + ${cancelled.length - 1} more`}
        </div>
      </div>
      <button
        onClick={onViewRejected}
        style={{
          flexShrink: 0, padding: '5px 12px', fontSize: 11, fontWeight: 700,
          color: '#fff', background: '#dc2626', border: 'none', borderRadius: 6,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        View & Reassign →
      </button>
    </div>
  );
}
