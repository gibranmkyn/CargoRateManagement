import type { Trip } from '@shared/types';
import { getVerificationDot, getTripVerificationDisplay } from '@shared/statusStyles';

interface Props {
  trip: Trip;
  fontSize?: number;
}

export default function TripVerificationCell({ trip, fontSize = 11 }: Props) {
  const state = getTripVerificationDisplay(trip);
  const s = getVerificationDot(state);
  const nonCancelled = trip.jobs.filter((j) => j.status !== 'Cancelled');
  const verifiedCount = nonCancelled.filter((j) => j.verificationStatus === 'Verified').length;
  const rejectedCount = trip.jobs.filter((j) => j.verificationStatus === 'Rejected').length;
  const total = nonCancelled.length;

  let subline = '';
  if (state === 'Rejected') {
    subline = rejectedCount === 1 ? '1 rejected' : `${rejectedCount} rejected`;
  } else if (total > 0) {
    subline = `${verifiedCount}/${total} verified`;
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize,
          color: s.color,
          fontWeight: s.fontWeight,
          lineHeight: 1.2,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: s.dot,
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
        {s.label}
      </span>
      {subline ? (
        <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'var(--font-mono)', lineHeight: 1.3 }}>
          {subline}
        </span>
      ) : null}
    </div>
  );
}
