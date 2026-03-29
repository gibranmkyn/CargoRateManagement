import type { JobStatus } from '@shared/mockData';

function getStatusColors(status: JobStatus): { bg: string; border: string; text: string; dot: string } {
  switch (status) {
    case 'In Progress':
      return { bg: 'rgba(21,44,255,0.04)', border: 'rgba(21,44,255,0.15)', text: '#152CFF', dot: '#152CFF' };
    case 'Completed':
      return { bg: '#fefce8', border: '#fde68a', text: '#a16207', dot: '#a16207' };
    case 'Verified':
      return { bg: '#f0fdf4', border: '#a7f3d0', text: '#059669', dot: '#059669' };
    case 'Cancelled':
      return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#dc2626' };
    case 'Cancelled':
    case 'Pending':
    default:
      return { bg: '#f9fafb', border: '#e5e7eb', text: '#9ca3af', dot: '#9ca3af' };
  }
}

export default function StatusBadge({ status }: { status: JobStatus }) {
  const c = getStatusColors(status);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '1px 7px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 600,
        border: `1px solid ${c.border}`,
        background: c.bg,
        color: c.text,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: c.dot,
        }}
      />
      {status}
    </span>
  );
}
