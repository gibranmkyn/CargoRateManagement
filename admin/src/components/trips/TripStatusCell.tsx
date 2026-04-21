import type { Trip } from '@shared/types';
import { deriveTripStatus, getTripStatusDot, isTripCancelled, getJobStatusDot } from '@shared/statusStyles';

interface Props {
  trip: Trip;
  fontSize?: number;
}

export default function TripStatusCell({ trip, fontSize = 11 }: Props) {
  const cancelled = isTripCancelled(trip);
  const s = cancelled ? getJobStatusDot('Cancelled') : getTripStatusDot(deriveTripStatus(trip));
  const nonCancelled = trip.jobs.filter((j) => j.status !== 'Cancelled');
  const completedCount = nonCancelled.filter((j) => j.status === 'Completed').length;
  const total = nonCancelled.length;

  let subline = '';
  if (cancelled) {
    subline = `${trip.jobs.length} cancelled`;
  } else if (total > 0) {
    subline = `${completedCount}/${total} completed`;
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
