import { useState } from 'react';
import { ChevronRight, ChevronDown, Layers } from 'lucide-react';
import { SERVICE_HIERARCHY } from '@shared/mockData';

// --- Style helpers (matches LocationsTab pattern) ---

const th: React.CSSProperties = {
  textAlign: 'left', padding: '6px 12px', fontSize: 9, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af',
  background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
};

const td: React.CSSProperties = {
  padding: '8px 12px', fontSize: 11, color: '#374151', borderBottom: '1px solid #f3f4f6',
};

function ServiceBadge({ code, color }: { code: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '1px 6px', borderRadius: 99, fontSize: 9,
      fontWeight: 600, color, background: `${color}10`, border: `1px solid ${color}30`,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {code}
    </span>
  );
}

// --- Component ---

export default function ServicesTab() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const totalL2 = SERVICE_HIERARCHY.reduce((s, l1) => s + l1.l2Services.length, 0);

  function toggle(code: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
        <strong style={{ color: '#111827' }}>{SERVICE_HIERARCHY.length}</strong> services &middot;{' '}
        <strong style={{ color: '#111827' }}>{totalL2}</strong> sub-services (L2)
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: 6 }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 28, padding: '6px 4px' }} />
            <th style={{ ...th, width: 100 }}>Code / Cost ID</th>
            <th style={th}>Name</th>
          </tr>
        </thead>
        <tbody>
          {SERVICE_HIERARCHY.map((l1) => {
            const isOpen = expanded.has(l1.code);
            return (
              <L1Row
                key={l1.code}
                l1={l1}
                isOpen={isOpen}
                onToggle={() => toggle(l1.code)}
              />
            );
          })}
          {SERVICE_HIERARCHY.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: '48px 16px', textAlign: 'center', color: '#9ca3af' }}>
                <Layers size={20} style={{ color: '#152CFF', marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No services configured</div>
                <div style={{ fontSize: 11 }}>Service hierarchy is defined in code</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// --- L1 parent row + its L2 children ---

interface L1RowProps {
  l1: (typeof SERVICE_HIERARCHY)[number];
  isOpen: boolean;
  onToggle: () => void;
}

function L1Row({ l1, isOpen, onToggle }: L1RowProps) {
  const Chevron = isOpen ? ChevronDown : ChevronRight;

  return (
    <>
      {/* L1 row */}
      <tr
        onClick={onToggle}
        style={{ cursor: 'pointer', background: isOpen ? '#f9fafb' : undefined }}
        onMouseEnter={(e) => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
        onMouseLeave={(e) => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = ''; }}
      >
        <td style={{ ...td, padding: '8px 4px', textAlign: 'center', borderBottom: isOpen ? '1px solid #e5e7eb' : td.borderBottom }}>
          <Chevron size={12} style={{ color: '#9ca3af' }} />
        </td>
        <td style={{ ...td, borderBottom: isOpen ? '1px solid #e5e7eb' : td.borderBottom }}>
          <ServiceBadge code={l1.code} color={l1.color} />
        </td>
        <td colSpan={2} style={{ ...td, fontWeight: 600, color: '#111827', borderBottom: isOpen ? '1px solid #e5e7eb' : td.borderBottom }}>
          {l1.label}
          <span style={{ fontSize: 9, fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>
            {l1.l2Services.length} L2 &middot; {l1.rateType}
          </span>
        </td>
      </tr>

      {/* L2 child rows */}
      {isOpen && l1.l2Services.map((l2, idx) => {
        const isLast = idx === l1.l2Services.length - 1;
        return (
          <tr key={l2.costId} style={{ background: '#fafbfc' }}>
            <td style={{ ...td, padding: '6px 4px', borderBottom: isLast ? '1px solid #e5e7eb' : td.borderBottom }} />
            <td style={{
              ...td, paddingLeft: 24, fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, color: '#6b7280', borderBottom: isLast ? '1px solid #e5e7eb' : td.borderBottom,
            }}>
              {l2.costId}
            </td>
            <td colSpan={2} style={{ ...td, paddingLeft: 24, borderBottom: isLast ? '1px solid #e5e7eb' : td.borderBottom }}>
              {l2.name}
            </td>
          </tr>
        );
      })}
    </>
  );
}
