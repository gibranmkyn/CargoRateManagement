import type { ServiceType } from '@shared/mockData';

export default function ServiceTag({ service }: { service: ServiceType }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 600,
        color: '#6b7280',
        letterSpacing: '0.02em',
      }}
    >
      {service.code}
    </span>
  );
}
