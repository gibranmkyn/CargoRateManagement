// TripsPage — row state cell (Phase 2).
// Replaces the Status + Verification <td> pair in the trip row.
//
// Drop-in:
//   Before:
//     <td>{renderStatusChip(trip.derivedStatus)}</td>
//     <td>{renderVerifChip(trip.derivedVerification)}</td>
//
//   After:
//     <td style={{ minWidth: 180 }}><TripStateCell trip={trip}/></td>

import type { Trip } from '@shared/mockData';
import { deriveTripStatus, deriveTripVerification, getTripVerification, tripHasRejectedJob } from '@shared/types';

export default function TripStateCell({ trip }: { trip: Trip }) {
  const status = deriveTripStatus(trip);
  const verif = deriveTripVerification(trip);
  const { verified, total } = getTripVerification(trip);
  const hasRejected = tripHasRejectedJob(trip);
  const hasCancelled = trip.jobs.some((j) => j.status === 'Cancelled');

  // Terminal: fully verified
  if (verif === 'Verified' && status === 'Completed') {
    return (
      <Row
        dot="#059669" color="#059669" weight={600}
        label="Verified"
        subline={`${verified}/${total} jobs`}
      />
    );
  }

  // Rejected surfaces first — red with inline count
  if (hasRejected) {
    const n = trip.jobs.filter((j) => j.verificationStatus === 'Rejected').length;
    return (
      <Row
        dot="#dc2626" color="#dc2626" weight={600}
        label={`${n} rejected`}
        subline={`${verified}/${total} verified`}
      />
    );
  }

  // Cancelled trip overall
  if (status === 'Completed' && total === 0) {
    return <Row dot="#dc2626" color="#dc2626" weight={600} label="Cancelled" />;
  }

  // Progress — fraction is the primary signal
  const progress = total === 0 ? 0 : verified / total;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 500,
          color: status === 'In Progress' ? '#111827' : '#374151',
        }}
      >
        <span
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: status === 'In Progress' ? '#152CFF' : status === 'Completed' ? '#a16207' : '#d1d5db',
          }}
        />
        {status === 'Completed' ? 'Awaiting verify' : status}
        <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 4 }}>· {verified}/{total}</span>
      </span>
      <div
        style={{
          width: 80, height: 2, background: '#f3f4f6', borderRadius: 2, position: 'relative',
        }}
      >
        <div
          style={{
            width: `${Math.round(progress * 100)}%`, height: '100%',
            background: progress === 1 ? '#059669' : '#a16207',
            borderRadius: 2, transition: 'width 120ms ease',
          }}
        />
      </div>
      {hasCancelled && (
        <span style={{ fontSize: 10, color: '#9ca3af' }}>
          + {trip.jobs.filter((j) => j.status === 'Cancelled').length} cancelled
        </span>
      )}
    </div>
  );
}

function Row({ dot, color, weight, label, subline }: { dot: string; color: string; weight: 500 | 600; label: string; subline?: string }) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: weight, color }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />
        {label}
      </span>
      {subline && <span style={{ fontSize: 10, color: '#9ca3af' }}>{subline}</span>}
    </div>
  );
}
