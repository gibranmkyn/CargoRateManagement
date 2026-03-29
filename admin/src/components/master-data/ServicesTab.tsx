import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Layers } from 'lucide-react';
import { useRates } from '../../context/RateContext';
import { SERVICE_HIERARCHY } from '@shared/mockData';
import type { RateUnit } from '@shared/mockData';

// --- Style helpers (matches LocationsTab pattern) ---

const th: React.CSSProperties = {
  textAlign: 'left', padding: '6px 12px', fontSize: 9, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af',
  background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
};

const td: React.CSSProperties = {
  padding: '8px 12px', fontSize: 11, color: '#374151', borderBottom: '1px solid #f3f4f6',
};

const UNIT_BADGE_STYLES: Record<RateUnit, { color: string; bg: string; border: string }> = {
  'flat':    { color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
  'per-kg':  { color: '#152CFF', bg: 'rgba(21,44,255,0.04)', border: 'rgba(21,44,255,0.15)' },
  'per-bag': { color: '#152CFF', bg: 'rgba(21,44,255,0.04)', border: 'rgba(21,44,255,0.15)' },
  'per-cbm': { color: '#152CFF', bg: 'rgba(21,44,255,0.04)', border: 'rgba(21,44,255,0.15)' },
  'per-km':  { color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
};

const UNIT_LABELS: Record<RateUnit, string> = {
  'flat': 'flat', 'per-kg': '/kg', 'per-bag': '/bag', 'per-cbm': '/cbm', 'per-km': '/km',
};

function UnitBadge({ unit }: { unit: RateUnit }) {
  const s = UNIT_BADGE_STYLES[unit];
  return (
    <span style={{
      display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: 9,
      fontWeight: 600, color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      {UNIT_LABELS[unit]}
    </span>
  );
}

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
  const { rates } = useRates();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Pre-compute rate counts per costId and vendor counts per costId
  const { rateCounts, vendorCounts } = useMemo(() => {
    const rc: Record<string, number> = {};
    const vc: Record<string, Set<string>> = {};
    for (const r of rates) {
      if (!r.isActive) continue;
      rc[r.costId] = (rc[r.costId] || 0) + 1;
      if (!vc[r.costId]) vc[r.costId] = new Set();
      vc[r.costId].add(r.vendorCode);
    }
    const vendorCountsFlat: Record<string, number> = {};
    for (const [k, v] of Object.entries(vc)) vendorCountsFlat[k] = v.size;
    return { rateCounts: rc, vendorCounts: vendorCountsFlat };
  }, [rates]);

  // Aggregate counts per L1
  const l1RateCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const l1 of SERVICE_HIERARCHY) {
      out[l1.code] = l1.l2Services.reduce((sum, l2) => sum + (rateCounts[l2.costId] || 0), 0);
    }
    return out;
  }, [rateCounts]);

  const l1VendorCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const l1 of SERVICE_HIERARCHY) {
      const vendors = new Set<string>();
      for (const l2 of l1.l2Services) {
        for (const r of rates) {
          if (r.isActive && r.costId === l2.costId) vendors.add(r.vendorCode);
        }
      }
      out[l1.code] = vendors.size;
    }
    return out;
  }, [rates]);

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
            <th style={{ ...th, width: 70 }}>Unit Type</th>
            <th style={{ ...th, width: 70, textAlign: 'center' }}>Vendors</th>
            <th style={{ ...th, width: 70, textAlign: 'center' }}>Rates</th>
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
                rateCount={l1RateCounts[l1.code] || 0}
                vendorCount={l1VendorCounts[l1.code] || 0}
                rateCounts={rateCounts}
                vendorCounts={vendorCounts}
              />
            );
          })}
          {SERVICE_HIERARCHY.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: '#9ca3af' }}>
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
  rateCount: number;
  vendorCount: number;
  rateCounts: Record<string, number>;
  vendorCounts: Record<string, number>;
}

function L1Row({ l1, isOpen, onToggle, rateCount, vendorCount, rateCounts, vendorCounts }: L1RowProps) {
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
        <td style={{ ...td, fontWeight: 600, color: '#111827', borderBottom: isOpen ? '1px solid #e5e7eb' : td.borderBottom }}>
          {l1.label}
          <span style={{ fontSize: 9, fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>
            {l1.l2Services.length} L2
          </span>
        </td>
        <td style={{ ...td, borderBottom: isOpen ? '1px solid #e5e7eb' : td.borderBottom }}>
          <span style={{ fontSize: 9, color: '#9ca3af' }}>{l1.rateType}</span>
        </td>
        <td style={{ ...td, textAlign: 'center', fontSize: 10, color: '#6b7280', borderBottom: isOpen ? '1px solid #e5e7eb' : td.borderBottom }}>
          {vendorCount || <span style={{ color: '#d1d5db' }}>&mdash;</span>}
        </td>
        <td style={{ ...td, textAlign: 'center', fontSize: 10, color: '#6b7280', borderBottom: isOpen ? '1px solid #e5e7eb' : td.borderBottom }}>
          {rateCount || <span style={{ color: '#d1d5db' }}>&mdash;</span>}
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
            <td style={{ ...td, paddingLeft: 24, borderBottom: isLast ? '1px solid #e5e7eb' : td.borderBottom }}>
              {l2.name}
            </td>
            <td style={{ ...td, borderBottom: isLast ? '1px solid #e5e7eb' : td.borderBottom }}>
              <UnitBadge unit={l2.unit} />
            </td>
            <td style={{ ...td, textAlign: 'center', fontSize: 10, color: '#6b7280', borderBottom: isLast ? '1px solid #e5e7eb' : td.borderBottom }}>
              {vendorCounts[l2.costId] || <span style={{ color: '#d1d5db' }}>&mdash;</span>}
            </td>
            <td style={{ ...td, textAlign: 'center', fontSize: 10, color: '#6b7280', borderBottom: isLast ? '1px solid #e5e7eb' : td.borderBottom }}>
              {rateCounts[l2.costId] || <span style={{ color: '#d1d5db' }}>&mdash;</span>}
            </td>
          </tr>
        );
      })}
    </>
  );
}
