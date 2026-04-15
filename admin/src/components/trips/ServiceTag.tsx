import type { ServiceType } from '@shared/mockData';

export default function ServiceTag({ service }: { service: ServiceType }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 5px',
        borderRadius: 99,
        fontSize: 9,
        fontWeight: 600,
        background: 'rgba(21,44,255,0.06)',
        border: '1px solid rgba(21,44,255,0.1)',
      }}
    >
      <span
        style={{
          color: '#152CFF',
          fontFamily: "var(--font-mono)",
        }}
      >
        {service.code}
      </span>
    </span>
  );
}
