import type { JobStatus } from '../../data/mockData';

function getStatusColors(status: JobStatus): { bg: string; border: string; text: string; dot: string } {
  switch (status) {
    case 'Completed':
      return { bg: '#f0fdf4', border: '#a7f3d0', text: '#059669', dot: '#059669' };
    case 'Rejected':
      return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#dc2626' };
    default:
      return { bg: '#fff', border: '#e5e7eb', text: '#6b7280', dot: '#9ca3af' };
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
