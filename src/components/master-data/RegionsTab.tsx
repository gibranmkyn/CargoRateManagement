import { useState } from 'react';
import { CHINA_REGIONS, REGION_STATS } from '../../data/chinaRegions';
import type { ChinaProvince, ChinaCity, ChinaDistrict } from '../../data/chinaRegions';

export default function RegionsTab() {
  const [expandedProvinces, setExpandedProvinces] = useState<Set<string>>(new Set(['44'])); // Guangdong expanded by default
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set(['4403'])); // Shenzhen expanded by default
  const [search, setSearch] = useState('');

  function toggleProvince(code: string) {
    setExpandedProvinces((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  }

  function toggleCity(code: string) {
    setExpandedCities((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  }

  // Filter by search
  function matchesSearch(text: string): boolean {
    if (!search) return true;
    const q = search.toLowerCase();
    return text.toLowerCase().includes(q);
  }

  function cityMatchesSearch(city: ChinaCity): boolean {
    if (matchesSearch(city.name) || matchesSearch(city.nameEn)) return true;
    return city.districts.some((d) => matchesSearch(d.name) || matchesSearch(d.nameEn));
  }

  const th: React.CSSProperties = { textAlign: 'left', padding: '6px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' };
  const td: React.CSSProperties = { padding: '6px 10px', fontSize: 11, color: '#374151', borderBottom: '1px solid #f3f4f6' };

  return (
    <div>
      {/* Search + stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search city or district..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ fontSize: 11, padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 4, outline: 'none', width: 200 }}
        />
        <div style={{ fontSize: 11, color: '#6b7280', marginLeft: 'auto' }}>
          <strong style={{ color: '#111827' }}>{REGION_STATS.provinces}</strong> provinces &middot;{' '}
          <strong style={{ color: '#111827' }}>{REGION_STATS.cities}</strong> cities &middot;{' '}
          <strong style={{ color: '#111827' }}>{REGION_STATS.districts}</strong> districts/towns
          <span style={{ fontSize: 9, color: '#9ca3af', marginLeft: 8 }}>Source: GB/T 2260</span>
        </div>
      </div>

      {/* Tree table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: 6 }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 30 }}></th>
            <th style={{ ...th, width: 100 }}>Code</th>
            <th style={th}>名称 Name</th>
            <th style={th}>English</th>
            <th style={{ ...th, width: 60 }}>Level</th>
            <th style={{ ...th, width: 80 }}>Districts</th>
          </tr>
        </thead>
        <tbody>
          {CHINA_REGIONS.map((province) => {
            const isProvExpanded = expandedProvinces.has(province.code);
            const filteredCities = province.cities.filter((c) => cityMatchesSearch(c));
            if (search && filteredCities.length === 0) return null;

            return (
              <ProvinceRows
                key={province.code}
                province={province}
                filteredCities={filteredCities}
                isExpanded={isProvExpanded}
                expandedCities={expandedCities}
                onToggleProvince={() => toggleProvince(province.code)}
                onToggleCity={toggleCity}
                search={search}
                matchesSearch={matchesSearch}
                td={td}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Province + City + District Rows ───

interface ProvinceRowsProps {
  province: ChinaProvince;
  filteredCities: ChinaCity[];
  isExpanded: boolean;
  expandedCities: Set<string>;
  onToggleProvince: () => void;
  onToggleCity: (code: string) => void;
  search: string;
  matchesSearch: (text: string) => boolean;
  td: React.CSSProperties;
}

function ProvinceRows({ province, filteredCities, isExpanded, expandedCities, onToggleProvince, onToggleCity, search, matchesSearch, td }: ProvinceRowsProps) {
  const totalDistricts = province.cities.reduce((sum, c) => sum + c.districts.length, 0);

  return (
    <>
      {/* Province row */}
      <tr
        onClick={onToggleProvince}
        style={{ background: '#f9fafb', cursor: 'pointer' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f3f4f6'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
      >
        <td style={{ ...td, color: '#152CFF', fontWeight: 600 }}>{isExpanded ? '▾' : '▸'}</td>
        <td style={td}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#9ca3af' }}>{province.code}</span></td>
        <td style={{ ...td, fontWeight: 700, color: '#111827' }}>{province.name}</td>
        <td style={td}>{province.nameEn}</td>
        <td style={td}><span style={{ fontSize: 9, fontWeight: 600, color: '#6b7280', padding: '1px 5px', background: '#f3f4f6', borderRadius: 3, border: '1px solid #e5e7eb' }}>Province</span></td>
        <td style={{ ...td, color: '#6b7280' }}>{province.cities.length} cities · {totalDistricts} districts</td>
      </tr>

      {/* City rows */}
      {isExpanded && filteredCities.map((city) => {
        const isCityExpanded = expandedCities.has(city.code);
        const filteredDistricts = city.districts.filter((d) => !search || matchesSearch(d.name) || matchesSearch(d.nameEn) || matchesSearch(city.name) || matchesSearch(city.nameEn));
        const isDongguan = city.code === '4419';
        const isZhongshan = city.code === '4420';
        const isDistrictFree = isDongguan || isZhongshan;

        return (
          <CityRows
            key={city.code}
            city={city}
            filteredDistricts={filteredDistricts}
            isExpanded={isCityExpanded}
            isDistrictFree={isDistrictFree}
            onToggle={() => onToggleCity(city.code)}
            td={td}
          />
        );
      })}
    </>
  );
}

interface CityRowsProps {
  city: ChinaCity;
  filteredDistricts: ChinaDistrict[];
  isExpanded: boolean;
  isDistrictFree: boolean;
  onToggle: () => void;
  td: React.CSSProperties;
}

function CityRows({ city, filteredDistricts, isExpanded, isDistrictFree, onToggle, td }: CityRowsProps) {
  return (
    <>
      {/* City row */}
      <tr
        onClick={onToggle}
        style={{ cursor: 'pointer' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
      >
        <td style={{ ...td, paddingLeft: 24, color: isExpanded ? '#152CFF' : '#9ca3af', fontWeight: 600 }}>{isExpanded ? '▾' : '▸'}</td>
        <td style={td}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#9ca3af' }}>{city.code}</span></td>
        <td style={{ ...td, fontWeight: 600, paddingLeft: 24 }}>
          {city.name}
          {isDistrictFree && (
            <span style={{ fontSize: 8, fontWeight: 500, color: '#b45309', background: '#fefce8', padding: '1px 4px', borderRadius: 3, border: '1px solid #fde68a', marginLeft: 6 }}>
              Towns — no districts
            </span>
          )}
        </td>
        <td style={td}>{city.nameEn}</td>
        <td style={td}><span style={{ fontSize: 9, fontWeight: 600, color: '#152CFF', padding: '1px 5px', background: 'rgba(21,44,255,0.06)', borderRadius: 3, border: '1px solid rgba(21,44,255,0.12)' }}>City</span></td>
        <td style={{ ...td, color: '#6b7280' }}>{city.districts.length} {isDistrictFree ? 'towns' : 'districts'}</td>
      </tr>

      {/* District/Town rows */}
      {isExpanded && filteredDistricts.map((district) => (
        <tr key={district.code}>
          <td style={td}></td>
          <td style={td}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#9ca3af' }}>{district.code}</span></td>
          <td style={{ ...td, paddingLeft: 44 }}>{district.name}</td>
          <td style={td}>{district.nameEn}</td>
          <td style={td}>
            <span style={{ fontSize: 9, fontWeight: 600, color: '#6b7280', padding: '1px 5px', background: '#f3f4f6', borderRadius: 3, border: '1px solid #e5e7eb' }}>
              {isDistrictFree ? 'Town' : 'District'}
            </span>
          </td>
          <td style={td}></td>
        </tr>
      ))}
    </>
  );
}
