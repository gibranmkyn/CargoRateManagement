import { useState, useRef, useEffect, useMemo } from 'react';
import { ALL_DISTRICTS, ALL_CITIES, getCityForDistrict, getProvinceByCityCode } from '../../data/chinaRegions';
import type { ChinaDistrict } from '../../data/chinaRegions';

export interface DistrictSelection {
  district: string;      // English name where available, Chinese otherwise
  districtCode: string;  // GB/T 2260 six-digit code
  city: string;          // English city name where available
  zone: string;          // City-level zone (English), suitable for LocationDropdown grouping
}

interface DistrictSearchDropdownProps {
  value?: string;
  onSelect: (result: DistrictSelection) => void;
  placeholder?: string;
  extraStyle?: React.CSSProperties;
}

// English names for districts in the primary logistics corridors
// (Guangdong PRD, Hong Kong, Macau, Shanghai, Beijing)
const DISTRICT_EN: Record<string, string> = {
  // Shenzhen
  '440303': 'Luohu District',
  '440304': 'Futian District',
  '440305': 'Nanshan District',
  '440306': "Bao'an District",
  '440307': 'Longgang District',
  '440308': 'Yantian District',
  '440309': 'Longhua District',
  '440310': 'Pingshan District',
  '440311': 'Guangming District',
  '440312': 'Dapeng New District',
  // Guangzhou
  '440103': 'Liwan District',
  '440104': 'Yuexiu District',
  '440105': 'Haizhu District',
  '440106': 'Tianhe District',
  '440111': 'Baiyun District',
  '440112': 'Huangpu District',
  '440113': 'Panyu District',
  '440114': 'Huadu District',
  '440115': 'Nansha District',
  '440117': 'Zengcheng District',
  '440118': 'Conghua District',
  // Foshan
  '440604': 'Chancheng District',
  '440605': 'Nanhai District',
  '440606': 'Shunde District',
  '440607': 'Sanshui District',
  '440608': 'Gaoming District',
  // Dongguan (prefecture-level city)
  '441900': 'Dongguan City',
  // Huizhou
  '441302': 'Huicheng District',
  '441303': 'Huiyang District',
  '441304': 'Boluo County',
  '441322': 'Huidong County',
  '441323': 'Longmen County',
  // Zhuhai
  '440402': 'Xiangzhou District',
  '440403': 'Doumen District',
  '440404': 'Jinwan District',
  // Zhongshan (prefecture-level)
  '442000': 'Zhongshan City',
  // Jiangmen
  '440703': 'Pengjiang District',
  '440704': 'Jianghai District',
  '440705': 'Xinhui District',
  // Hong Kong
  '810101': 'Central & Western District',
  '810102': 'Wan Chai District',
  '810103': 'Eastern District',
  '810104': 'Southern District',
  '810105': 'Yau Tsim Mong District',
  '810106': 'Sham Shui Po District',
  '810107': 'Kowloon City District',
  '810108': 'Wong Tai Sin District',
  '810109': 'Kwun Tong District',
  '810110': 'Tsuen Wan District',
  '810111': 'Tuen Mun District',
  '810112': 'Yuen Long District',
  '810113': 'North District',
  '810114': 'Tai Po District',
  '810115': 'Sha Tin District',
  '810116': 'Sai Kung District',
  '810117': 'Kwai Tsing District',
  '810118': 'Islands District',
  // Macau
  '820101': 'Macau Peninsula',
  '820102': 'Taipa',
  '820103': 'Coloane',
  // Shanghai (key districts)
  '310101': 'Huangpu District',
  '310104': 'Xuhui District',
  '310105': 'Changning District',
  '310106': "Jing'an District",
  '310107': 'Putuo District',
  '310109': 'Hongkou District',
  '310110': 'Yangpu District',
  '310112': 'Minhang District',
  '310113': 'Baoshan District',
  '310114': 'Jiading District',
  '310115': 'Pudong New Area',
  '310116': 'Jinshan District',
  '310117': 'Songjiang District',
  '310118': 'Qingpu District',
  '310120': 'Fengxian District',
  '310151': 'Chongming District',
  // Beijing (key districts)
  '110101': 'Dongcheng District',
  '110102': 'Xicheng District',
  '110105': 'Chaoyang District',
  '110106': 'Fengtai District',
  '110107': 'Shijingshan District',
  '110108': 'Haidian District',
  '110111': 'Fangshan District',
  '110112': 'Tongzhou District',
  '110113': 'Shunyi District',
  '110114': 'Changping District',
  '110115': 'Daxing District',
  '110116': 'Huairou District',
  '110117': 'Pinggu District',
  '110118': 'Miyun District',
  '110119': 'Yanqing District',
  // Yiwu (key for e-commerce)
  '330782': 'Yiwu City',
  // Ningbo
  '330203': 'Haishu District',
  '330205': 'Jiangbei District',
  '330206': 'Beilun District',
  '330211': 'Zhenhai District',
  '330212': 'Yinzhou District',
};

// English names for cities — keyed by city code (4-digit prefix)
const CITY_EN: Record<string, string> = {
  '4401': 'Guangzhou', '4403': 'Shenzhen', '4404': 'Zhuhai', '4405': 'Shantou',
  '4406': 'Foshan', '4407': 'Jiangmen', '4408': 'Zhanjiang', '4409': 'Maoming',
  '4412': 'Zhaoqing', '4413': 'Huizhou', '4414': 'Meizhou', '4415': 'Shanwei',
  '4416': 'Heyuan', '4417': 'Yangjiang', '4418': 'Qingyuan', '4419': 'Dongguan',
  '4420': 'Zhongshan', '4451': 'Chaozhou', '4452': 'Jieyang', '4453': 'Yunfu',
  '1101': 'Beijing', '1201': 'Tianjin',
  '3101': 'Shanghai', '3201': 'Nanjing', '3203': 'Xuzhou', '3205': 'Suzhou',
  '3301': 'Hangzhou', '3302': 'Ningbo', '3307': 'Jinhua', '3309': 'Zhoushan',
  '3501': 'Fuzhou', '3502': 'Xiamen',
  '4501': 'Nanning',
  '5101': 'Chengdu', '5106': 'Deyang',
  '6101': 'Xian',
  '8101': 'Hong Kong', '8201': 'Macau',
};

// English search aliases for common city names (for English-language search)
const CITY_EN_SEARCH: Record<string, string> = {
  shenzhen: '4403', guangzhou: '4401', guangzhou: '4401', dongguan: '4419',
  foshan: '4406', zhuhai: '4404', huizhou: '4413', zhongshan: '4420',
  jiangmen: '4407', shantou: '4405', hongkong: '8101', 'hong kong': '8101',
  hk: '8101', macau: '8201', macao: '8201', shanghai: '3101',
  beijing: '1101', tianjin: '1201', ningbo: '3302', hangzhou: '3301',
  suzhou: '3205', nanjing: '3201', xiamen: '3502', fuzhou: '3501',
  chengdu: '5101', xian: '6101', nanning: '4501', yiwu: '3307',
};

// Build city-code → districts index once at module load
const CITY_DISTRICTS: Map<string, ChinaDistrict[]> = new Map();
for (const city of ALL_CITIES) {
  CITY_DISTRICTS.set(city.code, city.districts);
}

function getDistrictNameEn(code: string): string | undefined {
  return DISTRICT_EN[code];
}

function getCityNameEn(cityCode: string): string | undefined {
  // Match on 4-digit prefix
  return CITY_EN[cityCode.slice(0, 4)];
}

export default function DistrictSearchDropdown({ value = '', onSelect, placeholder = 'Search in English or Chinese (e.g. Shenzhen, 宝安, 440306)', extraStyle }: DistrictSearchDropdownProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const results: ChinaDistrict[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    // 1. Check if query matches a city English alias → return all districts in that city
    const cityCode = CITY_EN_SEARCH[q];
    if (cityCode) {
      return CITY_DISTRICTS.get(cityCode) ?? [];
    }

    // 2. Partial English city name match (e.g. "shen" → Shenzhen)
    const cityCodePartial = Object.entries(CITY_EN_SEARCH).find(([k]) => k.startsWith(q))?.[1];
    if (cityCodePartial) {
      return (CITY_DISTRICTS.get(cityCodePartial) ?? []).slice(0, 60);
    }

    // 3. District-level search: Chinese name, English name, or 6-digit code
    return ALL_DISTRICTS.filter((d) => {
      if (d.name.toLowerCase().includes(q)) return true;
      if (d.code.startsWith(q)) return true;
      const en = DISTRICT_EN[d.code];
      if (en && en.toLowerCase().includes(q)) return true;
      return false;
    }).slice(0, 60);
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; districts: ChinaDistrict[] }>();
    for (const d of results) {
      const city = getCityForDistrict(d.code);
      const province = city ? getProvinceByCityCode(city.code) : undefined;
      const key = city?.code ?? '__unknown';
      if (!map.has(key)) {
        const cityEn = city ? getCityNameEn(city.code) : undefined;
        const provinceEn = province?.nameEn;
        const label = cityEn
          ? (provinceEn ? `${provinceEn} · ${cityEn}` : cityEn)
          : (province ? `${province.nameEn} · ${city!.name}` : (city?.name ?? ''));
        map.set(key, { label, districts: [] });
      }
      map.get(key)!.districts.push(d);
    }
    return map;
  }, [results]);

  function handleSelect(d: ChinaDistrict) {
    const city = getCityForDistrict(d.code);
    const districtEn = getDistrictNameEn(d.code);
    const cityEn = city ? getCityNameEn(city.code) : undefined;
    const displayName = districtEn ?? d.name;
    const displayCity = cityEn ?? city?.name ?? '';
    onSelect({
      district: displayName,
      districtCode: d.code,
      city: displayCity,
      zone: displayCity, // zone = city name, suitable for location grouping
    });
    setQuery(displayName);
    setOpen(false);
    setFocusedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setFocusedIndex((i) => Math.min(i + 1, results.length - 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex((i) => Math.max(i - 1, 0)); return; }
    if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < results.length) {
      e.preventDefault();
      handleSelect(results[focusedIndex]);
    }
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Instrument Sans', sans-serif",
    fontSize: 11,
    padding: '4px 8px',
    border: `1px solid ${open ? '#152CFF' : '#e5e7eb'}`,
    borderRadius: 4,
    outline: 'none',
    width: '100%',
    boxShadow: open ? '0 0 0 2px rgba(21,44,255,0.08)' : 'none',
    ...extraStyle,
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setFocusedIndex(-1); }}
        onFocus={() => { if (query.trim().length >= 2) setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={inputStyle}
      />
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 2,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 200,
          maxHeight: 240, overflowY: 'auto',
        }}>
          {Array.from(grouped.entries()).map(([cityCode, { label, districts }]) => (
            <div key={cityCode}>
              <div style={{ padding: '6px 8px 2px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#fafafa', borderTop: '1px solid #f3f4f6' }}>
                {label}
              </div>
              {districts.map((d) => {
                const idx = results.indexOf(d);
                const enName = getDistrictNameEn(d.code);
                return (
                  <div
                    key={d.code}
                    onClick={() => handleSelect(d)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    style={{
                      padding: '6px 8px', fontSize: 11, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: idx === focusedIndex ? '#f9fafb' : 'transparent',
                    }}
                  >
                    <span style={{ color: '#111827', fontWeight: 500, flex: 1 }}>
                      {enName ?? d.name}
                    </span>
                    {enName && (
                      <span style={{ color: '#9ca3af', fontSize: 10 }}>{d.name}</span>
                    )}
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#d1d5db', flexShrink: 0 }}>{d.code}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {open && query.trim().length >= 2 && results.length === 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 2, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, padding: '10px 8px', fontSize: 11, color: '#9ca3af', zIndex: 200 }}>
          No districts found — try Chinese characters or a 6-digit code
        </div>
      )}
    </div>
  );
}
