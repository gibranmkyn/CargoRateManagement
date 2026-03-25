/**
 * China Administrative Divisions — Pearl River Delta (珠三角) + Hong Kong
 *
 * Source: modood/Administrative-divisions-of-China (GB/T 2260)
 * Scope: Cities and districts relevant to Teleport logistics operations
 *
 * Hierarchy: Province → City → District/Town
 *
 * Special cases:
 * - Dongguan (东莞) and Zhongshan (中山) are district-free cities —
 *   they go directly to towns (镇) and streets (街道)
 * - Hong Kong uses a separate administrative system
 */

export interface ChinaDistrict {
  code: string;       // GB/T 2260 code (6-9 digits)
  name: string;       // Chinese name
  nameEn: string;     // English name
  cityCode: string;   // Parent city code
}

export interface ChinaCity {
  code: string;       // 4-digit city code
  name: string;       // Chinese name
  nameEn: string;     // English name
  provinceCode: string;
  districts: ChinaDistrict[];
}

export interface ChinaProvince {
  code: string;
  name: string;
  nameEn: string;
  cities: ChinaCity[];
}

// ─── Guangdong Province (广东省) — Pearl River Delta ───

export const CHINA_REGIONS: ChinaProvince[] = [
  {
    code: '44', name: '广东省', nameEn: 'Guangdong',
    cities: [
      // ── Shenzhen (深圳市) ──
      {
        code: '4403', name: '深圳市', nameEn: 'Shenzhen', provinceCode: '44',
        districts: [
          { code: '440303', name: '罗湖区', nameEn: 'Luohu', cityCode: '4403' },
          { code: '440304', name: '福田区', nameEn: 'Futian', cityCode: '4403' },
          { code: '440305', name: '南山区', nameEn: 'Nanshan', cityCode: '4403' },
          { code: '440306', name: '宝安区', nameEn: 'Baoan', cityCode: '4403' },
          { code: '440307', name: '龙岗区', nameEn: 'Longgang', cityCode: '4403' },
          { code: '440308', name: '盐田区', nameEn: 'Yantian', cityCode: '4403' },
          { code: '440309', name: '龙华区', nameEn: 'Longhua', cityCode: '4403' },
          { code: '440310', name: '坪山区', nameEn: 'Pingshan', cityCode: '4403' },
          { code: '440311', name: '光明区', nameEn: 'Guangming', cityCode: '4403' },
        ],
      },
      // ── Guangzhou (广州市) ──
      {
        code: '4401', name: '广州市', nameEn: 'Guangzhou', provinceCode: '44',
        districts: [
          { code: '440103', name: '荔湾区', nameEn: 'Liwan', cityCode: '4401' },
          { code: '440104', name: '越秀区', nameEn: 'Yuexiu', cityCode: '4401' },
          { code: '440105', name: '海珠区', nameEn: 'Haizhu', cityCode: '4401' },
          { code: '440106', name: '天河区', nameEn: 'Tianhe', cityCode: '4401' },
          { code: '440111', name: '白云区', nameEn: 'Baiyun', cityCode: '4401' },
          { code: '440112', name: '黄埔区', nameEn: 'Huangpu', cityCode: '4401' },
          { code: '440113', name: '番禺区', nameEn: 'Panyu', cityCode: '4401' },
          { code: '440114', name: '花都区', nameEn: 'Huadu', cityCode: '4401' },
          { code: '440115', name: '南沙区', nameEn: 'Nansha', cityCode: '4401' },
          { code: '440117', name: '从化区', nameEn: 'Conghua', cityCode: '4401' },
          { code: '440118', name: '增城区', nameEn: 'Zengcheng', cityCode: '4401' },
        ],
      },
      // ── Dongguan (东莞市) — district-free, uses towns directly ──
      {
        code: '4419', name: '东莞市', nameEn: 'Dongguan', provinceCode: '44',
        districts: [
          { code: '441900003', name: '东城街道', nameEn: 'Dongcheng', cityCode: '4419' },
          { code: '441900004', name: '南城街道', nameEn: 'Nancheng', cityCode: '4419' },
          { code: '441900005', name: '万江街道', nameEn: 'Wanjiang', cityCode: '4419' },
          { code: '441900006', name: '莞城街道', nameEn: 'Guancheng', cityCode: '4419' },
          { code: '441900101', name: '石碣镇', nameEn: 'Shijie', cityCode: '4419' },
          { code: '441900102', name: '石龙镇', nameEn: 'Shilong', cityCode: '4419' },
          { code: '441900103', name: '茶山镇', nameEn: 'Chashan', cityCode: '4419' },
          { code: '441900104', name: '石排镇', nameEn: 'Shipai', cityCode: '4419' },
          { code: '441900105', name: '企石镇', nameEn: 'Qishi', cityCode: '4419' },
          { code: '441900106', name: '横沥镇', nameEn: 'Hengli', cityCode: '4419' },
          { code: '441900107', name: '桥头镇', nameEn: 'Qiaotou', cityCode: '4419' },
          { code: '441900108', name: '谢岗镇', nameEn: 'Xiegang', cityCode: '4419' },
          { code: '441900109', name: '东坑镇', nameEn: 'Dongkeng', cityCode: '4419' },
          { code: '441900110', name: '常平镇', nameEn: 'Changping', cityCode: '4419' },
          { code: '441900111', name: '寮步镇', nameEn: 'Liaobu', cityCode: '4419' },
          { code: '441900112', name: '樟木头镇', nameEn: 'Zhangmutou', cityCode: '4419' },
          { code: '441900113', name: '大朗镇', nameEn: 'Dalang', cityCode: '4419' },
          { code: '441900114', name: '黄江镇', nameEn: 'Huangjiang', cityCode: '4419' },
          { code: '441900115', name: '清溪镇', nameEn: 'Qingxi', cityCode: '4419' },
          { code: '441900116', name: '塘厦镇', nameEn: 'Tangxia', cityCode: '4419' },
          { code: '441900117', name: '凤岗镇', nameEn: 'Fenggang', cityCode: '4419' },
          { code: '441900118', name: '大岭山镇', nameEn: 'Dalingshan', cityCode: '4419' },
          { code: '441900119', name: '长安镇', nameEn: 'Changan', cityCode: '4419' },
          { code: '441900121', name: '虎门镇', nameEn: 'Humen', cityCode: '4419' },
          { code: '441900122', name: '厚街镇', nameEn: 'Houjie', cityCode: '4419' },
          { code: '441900123', name: '沙田镇', nameEn: 'Shatian', cityCode: '4419' },
          { code: '441900124', name: '道滘镇', nameEn: 'Daojiao', cityCode: '4419' },
          { code: '441900125', name: '洪梅镇', nameEn: 'Hongmei', cityCode: '4419' },
          { code: '441900126', name: '麻涌镇', nameEn: 'Machong', cityCode: '4419' },
          { code: '441900127', name: '望牛墩镇', nameEn: 'Wangniudun', cityCode: '4419' },
          { code: '441900128', name: '中堂镇', nameEn: 'Zhongtang', cityCode: '4419' },
          { code: '441900129', name: '高埗镇', nameEn: 'Gaobu', cityCode: '4419' },
          { code: '441900401', name: '松山湖', nameEn: 'Songshan Lake', cityCode: '4419' },
        ],
      },
      // ── Foshan (佛山市) ──
      {
        code: '4406', name: '佛山市', nameEn: 'Foshan', provinceCode: '44',
        districts: [
          { code: '440604', name: '禅城区', nameEn: 'Chancheng', cityCode: '4406' },
          { code: '440605', name: '南海区', nameEn: 'Nanhai', cityCode: '4406' },
          { code: '440606', name: '顺德区', nameEn: 'Shunde', cityCode: '4406' },
          { code: '440607', name: '三水区', nameEn: 'Sanshui', cityCode: '4406' },
          { code: '440608', name: '高明区', nameEn: 'Gaoming', cityCode: '4406' },
        ],
      },
      // ── Zhongshan (中山市) — district-free ──
      {
        code: '4420', name: '中山市', nameEn: 'Zhongshan', provinceCode: '44',
        districts: [
          { code: '442000001', name: '石岐街道', nameEn: 'Shiqi', cityCode: '4420' },
          { code: '442000002', name: '东区街道', nameEn: 'Dongqu', cityCode: '4420' },
          { code: '442000101', name: '黄圃镇', nameEn: 'Huangpu', cityCode: '4420' },
          { code: '442000105', name: '古镇镇', nameEn: 'Guzhen', cityCode: '4420' },
          { code: '442000107', name: '坦洲镇', nameEn: 'Tanzhou', cityCode: '4420' },
          { code: '442000118', name: '小榄镇', nameEn: 'Xiaolan', cityCode: '4420' },
        ],
      },
      // ── Zhuhai (珠海市) ──
      {
        code: '4404', name: '珠海市', nameEn: 'Zhuhai', provinceCode: '44',
        districts: [
          { code: '440402', name: '香洲区', nameEn: 'Xiangzhou', cityCode: '4404' },
          { code: '440403', name: '斗门区', nameEn: 'Doumen', cityCode: '4404' },
          { code: '440404', name: '金湾区', nameEn: 'Jinwan', cityCode: '4404' },
        ],
      },
      // ── Huizhou (惠州市) ──
      {
        code: '4413', name: '惠州市', nameEn: 'Huizhou', provinceCode: '44',
        districts: [
          { code: '441302', name: '惠城区', nameEn: 'Huicheng', cityCode: '4413' },
          { code: '441303', name: '惠阳区', nameEn: 'Huiyang', cityCode: '4413' },
          { code: '441322', name: '博罗县', nameEn: 'Boluo', cityCode: '4413' },
          { code: '441323', name: '惠东县', nameEn: 'Huidong', cityCode: '4413' },
        ],
      },
      // ── Jiangmen (江门市) ──
      {
        code: '4407', name: '江门市', nameEn: 'Jiangmen', provinceCode: '44',
        districts: [
          { code: '440703', name: '蓬江区', nameEn: 'Pengjiang', cityCode: '4407' },
          { code: '440704', name: '江海区', nameEn: 'Jianghai', cityCode: '4407' },
          { code: '440705', name: '新会区', nameEn: 'Xinhui', cityCode: '4407' },
        ],
      },
      // ── Zhaoqing (肇庆市) ──
      {
        code: '4412', name: '肇庆市', nameEn: 'Zhaoqing', provinceCode: '44',
        districts: [
          { code: '441202', name: '端州区', nameEn: 'Duanzhou', cityCode: '4412' },
          { code: '441203', name: '鼎湖区', nameEn: 'Dinghu', cityCode: '4412' },
          { code: '441204', name: '高要区', nameEn: 'Gaoyao', cityCode: '4412' },
        ],
      },
      // ── Qingyuan (清远市) ──
      {
        code: '4418', name: '清远市', nameEn: 'Qingyuan', provinceCode: '44',
        districts: [
          { code: '441802', name: '清城区', nameEn: 'Qingcheng', cityCode: '4418' },
          { code: '441803', name: '清新区', nameEn: 'Qingxin', cityCode: '4418' },
        ],
      },
    ],
  },
  // ── Hong Kong SAR ──
  {
    code: '81', name: '香港特别行政区', nameEn: 'Hong Kong SAR',
    cities: [
      {
        code: '8101', name: '香港', nameEn: 'Hong Kong', provinceCode: '81',
        districts: [
          { code: '810101', name: '中西区', nameEn: 'Central & Western', cityCode: '8101' },
          { code: '810102', name: '湾仔区', nameEn: 'Wan Chai', cityCode: '8101' },
          { code: '810103', name: '东区', nameEn: 'Eastern', cityCode: '8101' },
          { code: '810104', name: '南区', nameEn: 'Southern', cityCode: '8101' },
          { code: '810105', name: '油尖旺区', nameEn: 'Yau Tsim Mong', cityCode: '8101' },
          { code: '810106', name: '深水埗区', nameEn: 'Sham Shui Po', cityCode: '8101' },
          { code: '810107', name: '九龙城区', nameEn: 'Kowloon City', cityCode: '8101' },
          { code: '810108', name: '黄大仙区', nameEn: 'Wong Tai Sin', cityCode: '8101' },
          { code: '810109', name: '观塘区', nameEn: 'Kwun Tong', cityCode: '8101' },
          { code: '810110', name: '荃湾区', nameEn: 'Tsuen Wan', cityCode: '8101' },
          { code: '810111', name: '屯门区', nameEn: 'Tuen Mun', cityCode: '8101' },
          { code: '810112', name: '元朗区', nameEn: 'Yuen Long', cityCode: '8101' },
          { code: '810113', name: '北区', nameEn: 'North', cityCode: '8101' },
          { code: '810114', name: '大埔区', nameEn: 'Tai Po', cityCode: '8101' },
          { code: '810115', name: '西贡区', nameEn: 'Sai Kung', cityCode: '8101' },
          { code: '810116', name: '沙田区', nameEn: 'Sha Tin', cityCode: '8101' },
          { code: '810117', name: '葵青区', nameEn: 'Kwai Tsing', cityCode: '8101' },
          { code: '810118', name: '离岛区', nameEn: 'Islands', cityCode: '8101' },
        ],
      },
    ],
  },
];

// ─── Flat lookup helpers ───

export const ALL_CITIES: ChinaCity[] = CHINA_REGIONS.flatMap((p) => p.cities);
export const ALL_DISTRICTS: ChinaDistrict[] = ALL_CITIES.flatMap((c) => c.districts);

export function getCityByCode(code: string): ChinaCity | undefined {
  return ALL_CITIES.find((c) => c.code === code);
}

export function getDistrictByCode(code: string): ChinaDistrict | undefined {
  return ALL_DISTRICTS.find((d) => d.code === code);
}

export function getCityForDistrict(districtCode: string): ChinaCity | undefined {
  return ALL_CITIES.find((c) => c.districts.some((d) => d.code === districtCode));
}

/** Format a district for display: "Baoan, Shenzhen" or "洪梅镇, 东莞" */
export function formatDistrict(districtCode: string, lang: 'en' | 'zh' = 'en'): string {
  const d = getDistrictByCode(districtCode);
  const c = d ? getCityForDistrict(districtCode) : undefined;
  if (!d || !c) return districtCode;
  return lang === 'en' ? `${d.nameEn}, ${c.nameEn}` : `${d.name}, ${c.name}`;
}

// ─── Stats ───
export const REGION_STATS = {
  provinces: CHINA_REGIONS.length,
  cities: ALL_CITIES.length,
  districts: ALL_DISTRICTS.length,
};
