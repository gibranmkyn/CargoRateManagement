import { useState } from 'react';
import { ALL_REGIONS, REGION_STATS } from '../../data/chinaRegions';
import type { ChinaProvince, ChinaCity, ChinaDistrict } from '../../data/chinaRegions';

export default function RegionsTab() {
  const [expandedProvinces, setExpandedProvinces] = useState<Set<string>>(new Set());
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  function toggleProvince(code: string) {
    setExpandedProvinces((prev) => { const next = new Set(prev); if (next.has(code)) next.delete(code); else next.add(code); return next; });
  }

  function toggleCity(code: string) {
    setExpandedCities((prev) => { const next = new Set(prev); if (next.has(code)) next.delete(code); else next.add(code); return next; });
  }

  function matchesSearch(text: string): boolean {
    if (!search) return true;
    return text.toLowerCase().includes(search.toLowerCase());
  }

  function cityMatchesSearch(city: ChinaCity): boolean {
    if (matchesSearch(city.name)) return true;
    return city.districts.some((d) => matchesSearch(d.name));
  }

  const th: React.CSSProperties = { textAlign: 'left', padding: '6px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' };
  const td: React.CSSProperties = { padding: '6px 10px', fontSize: 11, color: '#374151', borderBottom: '1px solid #f3f4f6' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <input type="text" placeholder="Search city or district..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ fontSize: 11, padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 4, outline: 'none', width: 200 }} />
        <div style={{ fontSize: 11, color: '#6b7280', marginLeft: 'auto' }}>
          <strong style={{ color: '#111827' }}>{REGION_STATS.provinces}</strong> provinces &middot;{' '}
          <strong style={{ color: '#111827' }}>{REGION_STATS.cities}</strong> cities &middot;{' '}
          <strong style={{ color: '#111827' }}>{REGION_STATS.districts}</strong> districts
          <span style={{ fontSize: 9, color: '#9ca3af', marginLeft: 8 }}>GB/T 2260</span>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: 6 }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 30 }}></th>
            <th style={{ ...th, width: 100 }}>Code</th>
            <th style={th}>Name</th>
            <th style={{ ...th, width: 80 }}>English</th>
            <th style={{ ...th, width: 60 }}>Level</th>
            <th style={{ ...th, width: 80 }}>Count</th>
          </tr>
        </thead>
        <tbody>
          {ALL_REGIONS.map((province) => {
            const isProvExpanded = expandedProvinces.has(province.code);
            const filteredCities = province.cities.filter((c) => !search || cityMatchesSearch(c));
            if (search && filteredCities.length === 0) return null;
            const totalDistricts = province.cities.reduce((s, c) => s + c.districts.length, 0);

            return (
              <ProvRows key={province.code} province={province} filteredCities={filteredCities} totalDistricts={totalDistricts} isExpanded={isProvExpanded || !!search} expandedCities={expandedCities} onToggleProv={() => toggleProvince(province.code)} onToggleCity={toggleCity} search={search} matchesSearch={matchesSearch} td={td} />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProvRows({ province, filteredCities, totalDistricts, isExpanded, expandedCities, onToggleProv, onToggleCity, search, matchesSearch, td }: {
  province: ChinaProvince; filteredCities: ChinaCity[]; totalDistricts: number; isExpanded: boolean; expandedCities: Set<string>;
  onToggleProv: () => void; onToggleCity: (c: string) => void; search: string; matchesSearch: (t: string) => boolean; td: React.CSSProperties;
}) {
  return (
    <>
      <tr onClick={onToggleProv} style={{ background: '#f9fafb', cursor: 'pointer' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f3f4f6'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}>
        <td style={{ ...td, color: '#152CFF', fontWeight: 600 }}>{isExpanded ? '▾' : '▸'}</td>
        <td style={td}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#9ca3af' }}>{province.code}</span></td>
        <td style={{ ...td, fontWeight: 700, color: '#111827' }}>{province.name}</td>
        <td style={td}>{province.nameEn}</td>
        <td style={td}><span style={{ fontSize: 9, fontWeight: 600, color: '#6b7280', padding: '1px 5px', background: '#f3f4f6', borderRadius: 3, border: '1px solid #e5e7eb' }}>Province</span></td>
        <td style={{ ...td, color: '#6b7280' }}>{province.cities.length} cities · {totalDistricts}</td>
      </tr>
      {isExpanded && filteredCities.map((city) => {
        const isCityExp = expandedCities.has(city.code) || !!search;
        const filteredDist = city.districts.filter((d) => !search || matchesSearch(d.name) || matchesSearch(city.name));
        return (
          <CityRows key={city.code} city={city} filteredDist={filteredDist} isExpanded={isCityExp} onToggle={() => onToggleCity(city.code)} td={td} />
        );
      })}
    </>
  );
}

function CityRows({ city, filteredDist, isExpanded, onToggle, td }: {
  city: ChinaCity; filteredDist: ChinaDistrict[]; isExpanded: boolean; onToggle: () => void; td: React.CSSProperties;
}) {
  return (
    <>
      <tr onClick={onToggle} style={{ cursor: 'pointer' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}>
        <td style={{ ...td, paddingLeft: 24, color: isExpanded ? '#152CFF' : '#9ca3af', fontWeight: 600 }}>{isExpanded ? '▾' : '▸'}</td>
        <td style={td}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#9ca3af' }}>{city.code}</span></td>
        <td style={{ ...td, fontWeight: 600, paddingLeft: 24 }}>{city.name}</td>
        <td style={td}></td>
        <td style={td}><span style={{ fontSize: 9, fontWeight: 600, color: '#152CFF', padding: '1px 5px', background: 'rgba(21,44,255,0.06)', borderRadius: 3, border: '1px solid rgba(21,44,255,0.12)' }}>City</span></td>
        <td style={{ ...td, color: '#6b7280' }}>{city.districts.length}</td>
      </tr>
      {isExpanded && filteredDist.map((d) => (
        <tr key={d.code}>
          <td style={td}></td>
          <td style={td}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#9ca3af' }}>{d.code}</span></td>
          <td style={{ ...td, paddingLeft: 44 }}>{d.name}</td>
          <td style={td}></td>
          <td style={td}><span style={{ fontSize: 9, fontWeight: 600, color: '#6b7280', padding: '1px 5px', background: '#f3f4f6', borderRadius: 3, border: '1px solid #e5e7eb' }}>District</span></td>
          <td style={td}></td>
        </tr>
      ))}
    </>
  );
}
