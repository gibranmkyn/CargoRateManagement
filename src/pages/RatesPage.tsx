import { useState, useRef, useMemo } from 'react';
import { useRates } from '../context/RateContext';
import { vendors, TRUCK_TYPES } from '../data/mockData';
import type { FtlRate, TruckType, Currency } from '../data/mockData';
import { ALL_DISTRICTS } from '../data/chinaRegions';

export default function RatesPage() {
  const { ftlRates, ftlLogs, setFtlRates } = useRates();
  const [selectedVendor, setSelectedVendor] = useState(vendors[0].code);
  const [search, setSearch] = useState('');
  const [collapsedCities, setCollapsedCities] = useState<Set<string>>(new Set());
  const [uploadResult, setUploadResult] = useState<{ filename: string; newCount: number; updatedCount: number; unchangedCount: number; errorCount: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const vendorRates = useMemo(() => ftlRates.filter((r) => r.vendorCode === selectedVendor && r.isActive), [ftlRates, selectedVendor]);
  const filtered = useMemo(() => {
    if (!search) return vendorRates;
    const q = search.toLowerCase();
    return vendorRates.filter((r) => r.originCity.toLowerCase().includes(q) || r.originDistrict.toLowerCase().includes(q) || r.originCode.includes(q) || r.destDistrict.toLowerCase().includes(q));
  }, [vendorRates, search]);

  const cityGroups = useMemo(() => {
    const map = new Map<string, FtlRate[]>();
    for (const r of filtered) map.set(r.originCity, [...(map.get(r.originCity) ?? []), r]);
    return map;
  }, [filtered]);

  function toggleCity(city: string) {
    setCollapsedCities((prev) => { const next = new Set(prev); if (next.has(city)) next.delete(city); else next.add(city); return next; });
  }

  function downloadCsv() {
    const header = 'origin_city,origin_district,dest_city,dest_district,currency,' + TRUCK_TYPES.map((t) => t.type).join(',');
    const rows = vendorRates.map((r) => {
      const truckCols = TRUCK_TYPES.map((t) => r.rates[t.type] ?? '').join(',');
      return `${r.originCity},${r.originDistrict},${r.destCity},${r.destDistrict},${r.currency},${truckCols}`;
    });
    const blob = new Blob(['\ufeff' + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${vendors.find((v) => v.code === selectedVendor)?.name ?? 'vendor'}_FTL_rates.csv`;
    a.click();
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) { setUploadResult({ filename: file.name, newCount: 0, updatedCount: 0, unchangedCount: 0, errorCount: 1, errors: ['No data rows'] }); return; }
      const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const truckCols = TRUCK_TYPES.map((t) => ({ type: t.type, idx: header.indexOf(t.type.toLowerCase()) })).filter((tc) => tc.idx >= 0);
      const oci = header.findIndex((h) => h.includes('origin') && h.includes('city'));
      const odi = header.findIndex((h) => h.includes('origin') && h.includes('district'));
      const dci = header.findIndex((h) => h.includes('dest') && h.includes('city'));
      const ddi = header.findIndex((h) => h.includes('dest') && h.includes('district'));
      const cci = header.findIndex((h) => h.includes('currency') || h === 'ccy');
      if (oci < 0 || odi < 0) { setUploadResult({ filename: file.name, newCount: 0, updatedCount: 0, unchangedCount: 0, errorCount: 1, errors: ['Missing origin_city or origin_district columns'] }); return; }

      const newRates: FtlRate[] = []; const errors: string[] = [];
      let newCount = 0, updatedCount = 0, unchangedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        const oc = cols[oci] || '', od = cols[odi] || '', dc = cols[dci] || '', dd = cols[ddi] || '';
        const ccy = (cols[cci] || 'MYR') as Currency;
        if (!oc || !od) { errors.push(`Row ${i + 1}: missing origin`); continue; }
        const md = ALL_DISTRICTS.find((d) => d.name === od || d.name.includes(od) || od.includes(d.name.replace(/[区镇街道]/g, '')));
        const mdd = ALL_DISTRICTS.find((d) => d.name === dd || d.name.includes(dd) || dd.includes(d.name.replace(/[区镇街道]/g, '')));
        const rates: Partial<Record<TruckType, number>> = {};
        for (const tc of truckCols) { const v = cols[tc.idx]; if (v) { const n = parseFloat(v.replace(/,/g, '')); if (!isNaN(n) && n > 0) rates[tc.type] = n; } }
        if (Object.keys(rates).length === 0) { errors.push(`Row ${i + 1}: no valid rates`); continue; }
        const existing = vendorRates.find((r) => r.originCity === oc && r.originDistrict === od && r.destCity === dc && r.destDistrict === dd);
        if (existing) {
          const changed = Object.entries(rates).some(([k, v]) => existing.rates[k as TruckType] !== v);
          if (changed) { updatedCount++; newRates.push({ ...existing, rates: { ...existing.rates, ...rates }, currency: ccy }); }
          else { unchangedCount++; newRates.push(existing); }
        } else {
          newCount++;
          newRates.push({ id: `FTL-${Date.now()}-${i}`, vendorCode: selectedVendor, originCity: oc, originDistrict: od, originCode: md?.code ?? '', destCity: dc, destDistrict: dd, destCode: mdd?.code ?? '', currency: ccy, rates, effectiveFrom: new Date().toISOString().split('T')[0], isActive: true });
        }
      }
      const otherRates = ftlRates.filter((r) => r.vendorCode !== selectedVendor || !r.isActive);
      setFtlRates([...otherRates, ...newRates], { id: `FL-${Date.now()}`, timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16), action: 'CSV uploaded', user: 'Ops Admin', details: `${newRates.length} routes — ${newCount} new, ${updatedCount} updated, ${unchangedCount} unchanged`, filename: file.name });
      setUploadResult({ filename: file.name, newCount, updatedCount, unchangedCount, errorCount: errors.length, errors });
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  const vendorName = vendors.find((v) => v.code === selectedVendor)?.name ?? selectedVendor;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 11, color: '#6b7280', display: 'flex', gap: 16 }}>
        <span><strong style={{ color: '#111827' }}>{vendors.filter((v) => ftlRates.some((r) => r.vendorCode === v.code)).length}</strong> vendors</span>
        <span><strong style={{ color: '#111827' }}>{ftlRates.filter((r) => r.isActive).length}</strong> FTL routes</span>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', margin: 0 }}>FTL Trucking Rates</h1>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Origin district → Destination district · per truck type</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={downloadCsv} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>↓ Download CSV</button>
            <label style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', background: '#152CFF', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>↑ Upload CSV<input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleUpload} /></label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {vendors.map((v) => {
            const count = ftlRates.filter((r) => r.vendorCode === v.code && r.isActive).length;
            if (count === 0 && v.code !== selectedVendor) return null;
            const isAct = v.code === selectedVendor;
            return <button key={v.code} onClick={() => { setSelectedVendor(v.code); setSearch(''); setUploadResult(null); }} style={{ padding: '4px 12px', borderRadius: 99, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', border: isAct ? '1px solid #152CFF' : '1px solid #e5e7eb', background: isAct ? 'rgba(21,44,255,0.06)' : '#fff', color: isAct ? '#152CFF' : '#6b7280', fontWeight: isAct ? 600 : 400 }}>{v.name} <span style={{ fontSize: 9, color: isAct ? '#152CFF' : '#d1d5db', marginLeft: 2 }}>{count}</span></button>;
          })}
        </div>

        {uploadResult && (
          <div style={{ padding: '10px 12px', marginBottom: 12, borderRadius: 6, background: uploadResult.errorCount > 0 && uploadResult.newCount + uploadResult.updatedCount === 0 ? '#fef2f2' : 'rgba(21,44,255,0.04)', border: `1px solid ${uploadResult.errorCount > 0 && uploadResult.newCount + uploadResult.updatedCount === 0 ? '#fecaca' : 'rgba(21,44,255,0.12)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}><span style={{ fontSize: 11, fontWeight: 600 }}>{uploadResult.filename}</span><button onClick={() => setUploadResult(null)} style={{ border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 14 }}>×</button></div>
            <div style={{ fontSize: 11, display: 'flex', gap: 12 }}>
              {uploadResult.newCount > 0 && <span style={{ color: '#059669', fontWeight: 600 }}>{uploadResult.newCount} new</span>}
              {uploadResult.updatedCount > 0 && <span style={{ color: '#152CFF', fontWeight: 600 }}>{uploadResult.updatedCount} updated</span>}
              {uploadResult.unchangedCount > 0 && <span style={{ color: '#9ca3af' }}>{uploadResult.unchangedCount} unchanged</span>}
              {uploadResult.errorCount > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}>{uploadResult.errorCount} errors</span>}
            </div>
            {uploadResult.errors.length > 0 && <div style={{ marginTop: 6, fontSize: 10, color: '#dc2626' }}>{uploadResult.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}</div>}
          </div>
        )}

        <input type="text" placeholder="Search origin... 福田, 440304" value={search} onChange={(e) => setSearch(e.target.value)} style={{ fontSize: 11, padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 4, width: 280, outline: 'none', marginBottom: 8 }} />

        {filtered.length > 0 ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
                <thead><tr>
                  <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#111827', color: '#fff', borderBottom: '1px solid #374151', minWidth: 180, position: 'sticky', left: 0, zIndex: 2 }}>Origin</th>
                  <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#111827', color: '#fff', borderBottom: '1px solid #374151', minWidth: 130 }}>Destination</th>
                  <th style={{ textAlign: 'center', padding: '6px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#111827', color: '#fff', borderBottom: '1px solid #374151', width: 36 }}>CCY</th>
                  {TRUCK_TYPES.map((t) => <th key={t.type} style={{ textAlign: 'right', padding: '6px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#111827', color: '#fff', borderBottom: '1px solid #374151', whiteSpace: 'nowrap', minWidth: 65 }}><div>{t.type}</div><div style={{ fontSize: 7, fontWeight: 400, color: '#9ca3af', textTransform: 'none', letterSpacing: 0 }}>&lt;{(t.maxKg/1000).toFixed(t.maxKg>=10000?0:1)}t</div></th>)}
                </tr></thead>
                <tbody>
                  {Array.from(cityGroups.entries()).map(([city, rates]) => {
                    const collapsed = collapsedCities.has(city);
                    return [
                      <tr key={`h-${city}`} onClick={() => toggleCity(city)} style={{ cursor: 'pointer' }}><td colSpan={11} style={{ padding: '5px 10px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 10, fontWeight: 600, color: '#152CFF' }}>{collapsed ? '▸' : '▾'} {city} <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 4 }}>{rates.length}</span></td></tr>,
                      ...(!collapsed ? rates.map((r) => (
                        <tr key={r.id}>
                          <td style={{ padding: '6px 10px', fontSize: 11, borderBottom: '1px solid #f3f4f6', position: 'sticky', left: 0, background: '#fff' }}><span style={{ fontWeight: 500 }}>{r.originDistrict}</span> <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#d1d5db' }}>{r.originCode}</span></td>
                          <td style={{ padding: '6px 10px', fontSize: 10, color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>{r.destDistrict} {r.destCity}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#9ca3af' }}>{r.currency === 'MYR' ? 'RMB' : r.currency}</span></td>
                          {TRUCK_TYPES.map((t) => <td key={t.type} style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '1px solid #f3f4f6', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500, color: r.rates[t.type] ? '#111827' : '#d1d5db' }}>{r.rates[t.type]?.toLocaleString() ?? '—'}</td>)}
                        </tr>
                      )) : []),
                    ];
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{vendorRates.length === 0 ? `No FTL rates for ${vendorName}` : 'No routes match search'}</div>
            <div style={{ fontSize: 11 }}>{vendorRates.length === 0 ? 'Upload a CSV to add rates' : 'Try a different search'}</div>
          </div>
        )}

        {ftlLogs.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 8 }}>Recent Activity</div>
            <div style={{ fontSize: 10, color: '#6b7280', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ftlLogs.slice().reverse().slice(0, 10).map((log) => (
                <div key={log.id}><span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#9ca3af' }}>{log.timestamp}</span><span style={{ marginLeft: 8 }}>{log.action}</span>{log.details && <span style={{ marginLeft: 4, color: '#111827' }}>— {log.details}</span>}{log.filename && <span style={{ marginLeft: 4, color: '#152CFF' }}>{log.filename}</span>}<span style={{ color: '#d1d5db', marginLeft: 4 }}>by {log.user}</span></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
