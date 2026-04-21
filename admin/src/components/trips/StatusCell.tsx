import type { Job } from '@shared/types';
import { getJobStatusDot, formatRelativeTime } from '@shared/statusStyles';

interface Props {
  job: Pick<Job, 'status' | 'statusChangedAt' | 'cancelReason'>;
  fontSize?: number;
  showReason?: boolean;
}

export default function StatusCell({ job, fontSize = 11, showReason = false }: Props) {
  const s = getJobStatusDot(job.status);
  const ts = job.statusChangedAt ? formatRelativeTime(job.statusChangedAt) : '';
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
      {ts ? (
        <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'var(--font-mono)', lineHeight: 1.3 }}>
          {ts}
        </span>
      ) : null}
      {showReason && job.status === 'Cancelled' && job.cancelReason ? (
        <span
          style={{
            fontSize: 10,
            color: '#9ca3af',
            lineHeight: 1.3,
            maxWidth: 240,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={job.cancelReason}
        >
          {job.cancelReason}
        </span>
      ) : null}
    </div>
  );
}
