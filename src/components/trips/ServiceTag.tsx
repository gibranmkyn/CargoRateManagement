import type { ServiceType } from '../../data/mockData';

export default function ServiceTag({ service }: { service: ServiceType }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '1px 5px',
        borderRadius: 99,
        fontSize: 9,
        fontWeight: 600,
        background: 'rgba(13,148,136,0.06)',
        border: '1px solid rgba(13,148,136,0.1)',
      }}
    >
      <span
        style={{
          color: '#0D9488',
          fontFamily: "var(--font-mono)",
        }}
      >
        {service.code}
      </span>
      <span style={{ color: '#374151' }}>{service.label}</span>
    </span>
  );
}
