import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRates } from '../context/RateContext';
import { vendors, serviceTypes, formatCurrency } from '../data/mockData';
import type { VendorRate } from '../data/mockData';
import SlideOutPanel from '../components/SlideOutPanel';
import AddRateSlideOut from '../components/rates/AddRateSlideOut';

const UNIT_LABELS: Record<string, string> = { flat: '/trip', 'per-kg': '/kg', 'per-bag': '/bag', 'per-cbm': '/CBM' };
const UNIT_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  flat: { text: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
  'per-kg': { text: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  'per-bag': { text: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  'per-cbm': { text: '#d97706', bg: '#fffbeb', border: '#fde68a' },
};

type Tab = 'vendor' | 'service';

export default function RatesPage() {
  const { rates, locations, getLocationById } = useRates();
  const [tab, setTab] = useState<Tab>('vendor');
  const [slideOutOpen, setSlideOutOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<VendorRate | null>(null);
  const activeRates = rates.filter((r) => r.isActive);
  const vendorCount = new Set(activeRates.map((r) => r.vendorCode)).size;
  const serviceCount = new Set(activeRates.map((r) => r.serviceCode)).size;

  function locationLabel(rate: VendorRate): string {
    if (rate.rateType === 'route') {
      const o = getLocationById(rate.originLocationId ?? '');
      const d = getLocationById(rate.destinationLocationId ?? '');
      return `${o?.name ?? '?'} → ${d?.name ?? '?'}`;
    }
    const loc = getLocationById(rate.locationId ?? '');
    return loc?.name ?? '?';
  }

  // Group rates
  const byVendor = new Map<string, VendorRate[]>();
  const byService = new Map<string, VendorRate[]>();
  for (const r of activeRates) {
    byVendor.set(r.vendorCode, [...(byVendor.get(r.vendorCode) ?? []), r]);
    byService.set(r.serviceCode, [...(byService.get(r.serviceCode) ?? []), r]);
  }

  const th: React.CSSProperties = { textAlign: 'left', padding: '6px 12px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' };
  const td: React.CSSProperties = { padding: '8px 12px', fontSize: 11, color: '#374151', borderBottom: '1px solid #f3f4f6' };

  function renderRateRow(r: VendorRate) {
    const u = UNIT_COLORS[r.unit] ?? UNIT_COLORS.flat;
    return (
      <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingRate(r); setSlideOutOpen(true); }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}>
        <td style={td}>{tab === 'vendor' ? serviceTypes.find((s) => s.code === r.serviceCode)?.label ?? r.serviceCode : vendors.find((v) => v.code === r.vendorCode)?.name ?? r.vendorCode}</td>
        <td style={td}>{locationLabel(r)}</td>
        <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#111827' }}>{formatCurrency(r.currency, r.amount)}</td>
        <td style={td}>
          <span style={{ padding: '1px 5px', borderRadius: 4, fontSize: 9, fontWeight: 600, color: u.text, background: u.bg, border: `1px solid ${u.border}` }}>
            {UNIT_LABELS[r.unit] ?? r.unit}
          </span>
        </td>
        <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#9ca3af' }}>{r.effectiveFrom}</td>
      </tr>
    );
  }

  const noBanner = locations.length === 0;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Dependency banner */}
      {noBanner && (
        <div style={{ padding: '8px 16px', background: '#fefce8', borderBottom: '1px solid #fde68a', fontSize: 11, color: '#b45309', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Add locations first.</span> Rate cards require managed locations for lookups to work.
          <a href="/master-data" style={{ color: '#152CFF', fontWeight: 600, textDecoration: 'none', marginLeft: 4 }}>Go to Locations →</a>
        </div>
      )}

      {/* Stats bar */}
      <div style={{ padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 11, color: '#6b7280', display: 'flex', gap: 16 }}>
        <span><strong style={{ color: '#111827' }}>{activeRates.length}</strong> active rates</span>
        <span>{vendorCount} vendors</span>
        <span>{serviceCount} services</span>
      </div>

      {/* Header */}
      <div style={{ padding: '16px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', color: '#111827', margin: 0 }}>Rates</h1>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Manage vendor rate cards</p>
        </div>
        <button onClick={() => { setEditingRate(null); setSlideOutOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 6, border: 'none', background: '#152CFF', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={12} /> Add Rate
        </button>
      </div>

      {/* Tabs */}
      <div style={{ padding: '12px 16px 0', display: 'flex', gap: 2 }}>
        {([['vendor', 'By Vendor'], ['service', 'By Service']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: tab === key ? 'rgba(21,44,255,0.06)' : 'transparent', color: tab === key ? '#152CFF' : '#9ca3af', fontWeight: tab === key ? 600 : 400, fontSize: 12, cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {tab === 'vendor' && Array.from(byVendor.entries()).map(([vc, rts]) => {
          const v = vendors.find((v) => v.code === vc);
          return (
            <div key={vc} style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 8px' }}>{v?.name ?? vc}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                <thead><tr><th style={th}>Service</th><th style={th}>Route / Location</th><th style={th}>Rate</th><th style={th}>Unit</th><th style={th}>Effective</th></tr></thead>
                <tbody>{rts.map(renderRateRow)}</tbody>
              </table>
            </div>
          );
        })}

        {tab === 'service' && Array.from(byService.entries()).map(([sc, rts]) => {
          const s = serviceTypes.find((s) => s.code === sc);
          return (
            <div key={sc} style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 8px' }}>{s?.label ?? sc}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                <thead><tr><th style={th}>Vendor</th><th style={th}>Route / Location</th><th style={th}>Rate</th><th style={th}>Unit</th><th style={th}>Effective</th></tr></thead>
                <tbody>{rts.map(renderRateRow)}</tbody>
              </table>
            </div>
          );
        })}

        {activeRates.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No rate cards yet</div>
            <div style={{ fontSize: 11 }}>Add vendor rates to see costs during order creation</div>
          </div>
        )}
      </div>

      {/* Add/Edit Rate Slide-Out */}
      <SlideOutPanel isOpen={slideOutOpen} onClose={() => setSlideOutOpen(false)} title={editingRate ? 'Edit Rate' : 'Add Rate'}>
        <AddRateSlideOut editingRate={editingRate} onClose={() => setSlideOutOpen(false)} />
      </SlideOutPanel>
    </div>
  );
}
