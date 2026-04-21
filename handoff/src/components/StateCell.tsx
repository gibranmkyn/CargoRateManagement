// StateCell.tsx — single-signal replacement for <StatusChip/> + <VerificationChip/>
//
// Drop next to your other shared components (e.g. src/components/trips/).
// Usage in table:
//   <td><StateCell job={j} withSubline /></td>

import type { Job } from '@shared/types';
import { getStateStyle } from '@shared/statusStyles';

interface Props {
  job: Pick<Job, 'status' | 'verificationStatus' | 'cancelReason' | 'rejectionReason'>;
  /** Show rejection / cancellation reason on line 2 (default: true in slide-out, false in dense tables) */
  withSubline?: boolean;
  /** Override the size (default 11 for data rows; 12 for slide-out header) */
  fontSize?: number;
}

export default function StateCell({ job, withSubline = false, fontSize = 11 }: Props) {
  const s = getStateStyle(job);
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
      {withSubline && s.subline ? (
        <span
          style={{
            fontSize: 10,
            color: '#9ca3af',
            lineHeight: 1.3,
            maxWidth: 260,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={s.subline}
        >
          {s.subline}
        </span>
      ) : null}
    </div>
  );
}
