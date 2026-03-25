export type JobStatus = 'Completed' | 'In Progress' | 'Pending' | 'Rejected' | 'Cancelled';

export interface ServiceType {
  code: string;
  label: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details?: string;
}

export interface ProofDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  url: string;
}

export interface Job {
  id: string;
  vendor: { code: string; name: string };
  origin: { location: string; date: string };
  destination: { location: string; date: string };
  service: ServiceType;
  status: JobStatus;
  duration: string | null;
  execution: string | null;
  rejectionReason?: string;
  activityLog: ActivityLogEntry[];
  proofDocuments: ProofDocument[];
  // Phase 2: Rate & billing
  rateId?: string;
  agreedRate?: { currency: Currency; amount: number; unit: RateUnit };
  agreedCost?: { currency: Currency; amount: number };
  invoiceAmount?: { currency: Currency; amount: number };
  // Phase 2.5: Multi-fee model + per-job quantities
  fees: FeeLineItem[];
  jobBags?: number;      // defaults from order, editable per job
  jobWeight?: number;    // defaults from order, editable per job
  jobVolume?: number;    // CBM, editable per job
}

export interface FeeLineItem {
  id: string;
  name: string;           // "Base rate", "Fuel surcharge", etc.
  rateId?: string;        // linked to VendorRate if auto-populated
  currency: Currency;
  rate: number;           // locked from rate card — not editable
  unit: RateUnit;
  quantity: number;       // editable per fee until job is Completed
  amount: number;         // = rate × quantity (calculated, stored for billing)
}

export const FEE_CATALOG = [
  'Fuel surcharge',
  'Toll fees',
  'Waiting time',
  'Special handling',
  'Overtime',
  'Insurance',
] as const;

export function calcFeeAmount(rate: number, unit: RateUnit, quantity: number): number {
  return rate * quantity;
}

export function calcJobTotal(fees: FeeLineItem[]): Map<Currency, number> {
  const totals = new Map<Currency, number>();
  for (const fee of fees) {
    totals.set(fee.currency, (totals.get(fee.currency) ?? 0) + fee.amount);
  }
  return totals;
}

export interface Trip {
  id: string;
  customer: { name: string; code: string };
  mawb: string;
  bags: number;
  weight: number;
  remarks: string;
  createdAt: string;
  priority?: boolean;
  jobs: Job[];
}

export interface TripTemplate {
  id: string;
  name: string;
  customerCode?: string;
  jobs: {
    vendor: { code: string; name: string };
    origin: { location: string };
    destination: { location: string };
    service: ServiceType;
  }[];
  createdAt: string;
}

// --- Phase 2: Rate Management & Billing ---

export type LocationType = 'warehouse' | 'airport' | 'port' | 'checkpoint' | 'hub';
export type Currency = 'MYR' | 'CNY' | 'USD';
export type RateUnit = 'flat' | 'per-kg' | 'per-bag' | 'per-cbm' | 'per-km';
export type RateType = 'route' | 'location';

export interface Location {
  id: string;
  name: string;
  code: string;
  zone: string;
  type: LocationType;
}

export interface VendorRate {
  id: string;
  vendorCode: string;
  serviceCode: string;
  rateType: RateType;
  originLocationId?: string;
  destinationLocationId?: string;
  locationId?: string;
  currency: Currency;
  amount: number;
  unit: RateUnit;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
}

export const SERVICE_CONFIG: Record<string, { rateType: RateType; label: string }> = {
  FM: { rateType: 'route', label: 'FM Trucking' },
  EC: { rateType: 'location', label: 'Export Customs' },
  CS: { rateType: 'location', label: 'Cargo Submission' },
  CR: { rateType: 'location', label: 'Cargo Reception' },
  OH: { rateType: 'location', label: 'Origin Handling' },
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  MYR: 'RM', CNY: 'CNY', USD: 'USD',
};

export function formatCurrency(currency: Currency, amount: number): string {
  return `${CURRENCY_SYMBOLS[currency]} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const vendors = [
  { code: 'V-001', name: 'HaleSun' },
  { code: 'V-002', name: 'SevenSeas' },
  { code: 'V-003', name: 'Gonda' },
  { code: 'V-004', name: 'ThaiKee' },
  { code: 'V-005', name: 'The Lorry' },
];

export const customers = [
  { code: 'CUST-001', name: 'TikTok' },
  { code: 'CUST-002', name: 'Shopee' },
  { code: 'CUST-003', name: 'Shein' },
  { code: 'CUST-004', name: 'AliExpress' },
  { code: 'CUST-005', name: 'Temu' },
];

export const serviceTypes: ServiceType[] = [
  { code: 'CR', label: 'Cargo Retrieval' },
  { code: 'CS', label: 'Cargo Submission' },
  { code: 'EC', label: 'Export Custom Clearance' },
  { code: 'FM', label: 'Trucking' },
  { code: 'OH', label: 'Origin Handling' },
];

function log(id: string, ts: string, action: string, user = 'Ops Admin', details?: string): ActivityLogEntry {
  return { id, timestamp: ts, action, user, details };
}

function doc(id: string, name: string, type: string, ts: string): ProofDocument {
  return { id, name, type, uploadedAt: ts, uploadedBy: 'Ops Admin', url: '' };
}

// Each job has exactly 1 service. Same vendor can appear multiple times.
export const seedTrips: Trip[] = [
  // DO-001: TikTok Shenzhen → SZX Airport (completed, all invoiced — 2 match, 1 over)
  {
    id: 'DO-20260308-001',
    customer: { name: 'TikTok', code: 'CUST-001' },
    mawb: '160-84329871',
    bags: 24,
    weight: 1240,
    remarks: 'Fragile cargo',
    createdAt: '08 Mar 2026, 09:00',
    jobs: [
      { id: 'DO-20260308-001-J01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'TikTok WH, Shenzhen', date: '2026-03-08 10:00' }, destination: { location: 'Shenzhen Bay Checkpoint', date: '2026-03-08 14:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Completed', duration: '04:00', execution: '2026-03-08 10:05', activityLog: [log('l1','2026-03-08 09:00','Job created','Ops Admin','Assigned to HaleSun'), log('l2','2026-03-08 10:05','Status → In Progress'), log('l3','2026-03-08 14:00','Status → Completed')], proofDocuments: [doc('d1','POD-tiktok-szbay.jpg','image/jpeg','2026-03-08 13:55')], rateId: 'RT-001', agreedRate: { currency: 'MYR', amount: 450, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 525 }, invoiceAmount: { currency: 'MYR', amount: 525 }, fees: [{ id: 'F-001-01', name: 'Base rate', rateId: 'RT-001', currency: 'MYR', rate: 450, unit: 'flat', quantity: 1, amount: 450 }, { id: 'F-001-02', name: 'Fuel surcharge', currency: 'MYR', rate: 1.875, unit: 'per-km', quantity: 24, amount: 45 }, { id: 'F-001-03', name: 'Toll fees', currency: 'MYR', rate: 30, unit: 'flat', quantity: 1, amount: 30 }], jobBags: 24, jobWeight: 1240 },
      { id: 'DO-20260308-001-J02', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Shenzhen Bay Checkpoint', date: '2026-03-08 15:00' }, destination: { location: 'SZX Airport Cargo Terminal', date: '2026-03-08 18:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Completed', duration: '03:00', execution: '2026-03-08 15:10', activityLog: [log('l4','2026-03-08 09:00','Job created'), log('l5','2026-03-08 18:00','Status → Completed')], proofDocuments: [doc('d2','customs-clearance-001.pdf','application/pdf','2026-03-08 17:50')], rateId: 'RT-006', agreedRate: { currency: 'MYR', amount: 120, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 145 }, invoiceAmount: { currency: 'MYR', amount: 145 }, fees: [{ id: 'F-002-01', name: 'Base rate', rateId: 'RT-006', currency: 'MYR', rate: 120, unit: 'flat', quantity: 1, amount: 120 }, { id: 'F-002-02', name: 'Special handling', currency: 'MYR', rate: 25, unit: 'flat', quantity: 1, amount: 25 }], jobBags: 24, jobWeight: 1240 },
      { id: 'DO-20260308-001-J03', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'SZX Airport Cargo Terminal', date: '2026-03-08 19:00' }, destination: { location: 'SZX Airport Cargo Terminal', date: '2026-03-08 21:00' }, service: { code: 'CS', label: 'Cargo Submission' }, status: 'Completed', duration: '02:00', execution: '2026-03-08 19:05', activityLog: [log('l6','2026-03-08 09:00','Job created'), log('l7','2026-03-08 21:00','Status → Completed')], proofDocuments: [doc('d3','xray-submission-receipt.pdf','application/pdf','2026-03-08 20:55')], rateId: 'RT-010', agreedRate: { currency: 'MYR', amount: 80, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 80 }, invoiceAmount: { currency: 'MYR', amount: 95 }, fees: [{ id: 'F-003-01', name: 'Base rate', rateId: 'RT-010', currency: 'MYR', rate: 80, unit: 'flat', quantity: 1, amount: 80 }], jobBags: 24, jobWeight: 1240 },
    ],
  },
  // DO-002: Shopee Yantian → KUL (in progress, mixed currencies)
  {
    id: 'DO-20260309-002',
    customer: { name: 'Shopee', code: 'CUST-002' },
    mawb: '160-33121632',
    bags: 16,
    weight: 890,
    remarks: '',
    createdAt: '09 Mar 2026, 08:30',
    jobs: [
      { id: 'DO-20260309-002-J01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'Yantian Port', date: '2026-03-09 10:00' }, destination: { location: 'Dongguan Cross-dock', date: '2026-03-09 14:00' }, service: { code: 'CR', label: 'Cargo Retrieval' }, status: 'Completed', duration: '04:00', execution: '2026-03-09 10:10', activityLog: [log('l1','2026-03-09 08:30','Job created'), log('l2','2026-03-09 14:00','Status → Completed')], proofDocuments: [doc('d1','retrieval-yantian.jpg','image/jpeg','2026-03-09 13:50')], rateId: 'RT-005', agreedRate: { currency: 'CNY', amount: 25, unit: 'per-bag' }, agreedCost: { currency: 'CNY', amount: 400 }, invoiceAmount: { currency: 'CNY', amount: 400 }, fees: [{ id: 'F-004-01', name: 'Base rate', rateId: 'RT-005', currency: 'CNY', rate: 25, unit: 'per-bag', quantity: 16, amount: 400 }], jobBags: 16, jobWeight: 890 },
      { id: 'DO-20260309-002-J02', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'Dongguan Cross-dock', date: '2026-03-09 15:00' }, destination: { location: 'Shenzhen Airport', date: '2026-03-09 19:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'In Progress', duration: null, execution: '2026-03-09 15:05', activityLog: [log('l3','2026-03-09 08:30','Job created'), log('l4','2026-03-09 15:05','Status → In Progress')], proofDocuments: [], rateId: 'RT-002', agreedRate: { currency: 'MYR', amount: 520, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 520 }, fees: [{ id: 'F-005-01', name: 'Base rate', rateId: 'RT-002', currency: 'MYR', rate: 520, unit: 'flat', quantity: 1, amount: 520 }], jobBags: 16, jobWeight: 890 },
      { id: 'DO-20260309-002-J03', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'Shenzhen Airport', date: '2026-03-09 20:00' }, destination: { location: 'Shenzhen Airport', date: '2026-03-09 23:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l5','2026-03-09 08:30','Job created')], proofDocuments: [], rateId: 'RT-012', agreedRate: { currency: 'CNY', amount: 580, unit: 'flat' }, agreedCost: { currency: 'CNY', amount: 580 }, fees: [{ id: 'F-006-01', name: 'Base rate', rateId: 'RT-012', currency: 'CNY', rate: 580, unit: 'flat', quantity: 1, amount: 580 }], jobBags: 16, jobWeight: 890 },
    ],
  },
  // DO-003: TikTok Qianhai → Huanggang (rejected)
  {
    id: 'DO-20260310-003',
    customer: { name: 'TikTok', code: 'CUST-001' },
    mawb: '160-98765421',
    bags: 36,
    weight: 1500,
    remarks: 'Priority shipment',
    createdAt: '10 Mar 2026, 07:00',
    priority: true,
    jobs: [
      { id: 'DO-20260310-003-J01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'Qianhai Free Trade Zone', date: '2026-03-10 08:00' }, destination: { location: 'Huanggang Port', date: '2026-03-10 12:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Rejected', duration: null, execution: '2026-03-10 08:10', rejectionReason: 'Vehicle breakdown', activityLog: [log('l1','2026-03-10 07:00','Job created'), log('l2','2026-03-10 09:30','Status → Rejected','Ops Admin','Vehicle breakdown')], proofDocuments: [], fees: [], jobBags: 36, jobWeight: 1500 },
      { id: 'DO-20260310-003-J02', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Huanggang Port', date: '2026-03-10 13:00' }, destination: { location: 'Huanggang Port', date: '2026-03-10 16:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l3','2026-03-10 07:00','Job created')], proofDocuments: [], fees: [], jobBags: 36, jobWeight: 1500 },
    ],
  },
  // DO-004: Shein Guangzhou → Airport (1 completed with under-invoice, 1 in progress)
  {
    id: 'DO-20260310-004',
    customer: { name: 'Shein', code: 'CUST-003' },
    mawb: '160-11456287',
    bags: 10,
    weight: 520,
    remarks: 'Temperature sensitive',
    createdAt: '10 Mar 2026, 10:00',
    jobs: [
      { id: 'DO-20260310-004-J01', vendor: { code: 'V-004', name: 'ThaiKee' }, origin: { location: 'Guangzhou Baiyun Airport', date: '2026-03-10 14:00' }, destination: { location: 'Guangzhou Baiyun Airport', date: '2026-03-10 17:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Completed', duration: '03:00', execution: '2026-03-10 14:05', activityLog: [log('l1','2026-03-10 10:00','Job created'), log('l2','2026-03-10 17:00','Status → Completed')], proofDocuments: [doc('d1','gz-trucking-receipt.pdf','application/pdf','2026-03-10 16:50')], rateId: 'RT-016', agreedRate: { currency: 'MYR', amount: 280, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 280 }, invoiceAmount: { currency: 'MYR', amount: 250 }, fees: [{ id: 'F-009-01', name: 'Base rate', rateId: 'RT-016', currency: 'MYR', rate: 280, unit: 'flat', quantity: 1, amount: 280 }], jobBags: 10, jobWeight: 520 },
      { id: 'DO-20260310-004-J02', vendor: { code: 'V-004', name: 'ThaiKee' }, origin: { location: 'Guangzhou Baiyun Airport', date: '2026-03-10 18:00' }, destination: { location: 'Guangzhou Region Airport', date: '2026-03-10 21:00' }, service: { code: 'OH', label: 'Origin Handling' }, status: 'In Progress', duration: null, execution: '2026-03-10 18:10', activityLog: [log('l3','2026-03-10 10:00','Job created'), log('l4','2026-03-10 18:10','Status → In Progress')], proofDocuments: [], rateId: 'RT-017', agreedRate: { currency: 'MYR', amount: 0.65, unit: 'per-kg' }, agreedCost: { currency: 'MYR', amount: 338 }, fees: [{ id: 'F-010-01', name: 'Base rate', rateId: 'RT-017', currency: 'MYR', rate: 0.65, unit: 'per-kg', quantity: 520, amount: 338 }], jobBags: 10, jobWeight: 520 },
    ],
  },
  // DO-005: Temu SZX → Lantau (all pending, rates assigned, mixed currencies)
  {
    id: 'DO-20260311-005',
    customer: { name: 'Temu', code: 'CUST-005' },
    mawb: '160-77654321',
    bags: 48,
    weight: 2450,
    remarks: 'Export commitment',
    createdAt: '11 Mar 2026, 06:00',
    jobs: [
      { id: 'DO-20260311-005-J01', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'Shenzhen Bao An Airport', date: '2026-03-11 08:00' }, destination: { location: 'Shenzhen Bao An Airport', date: '2026-03-11 10:00' }, service: { code: 'CR', label: 'Cargo Retrieval' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l1','2026-03-11 06:00','Job created')], proofDocuments: [], rateId: 'RT-015', agreedRate: { currency: 'CNY', amount: 30, unit: 'per-bag' }, agreedCost: { currency: 'CNY', amount: 1440 }, fees: [{ id: 'F-011-01', name: 'Base rate', rateId: 'RT-015', currency: 'CNY', rate: 30, unit: 'per-bag', quantity: 48, amount: 1440 }], jobBags: 48, jobWeight: 2450 },
      { id: 'DO-20260311-005-J02', vendor: { code: 'V-005', name: 'The Lorry' }, origin: { location: 'Shenzhen Bao An Airport', date: '2026-03-11 11:00' }, destination: { location: 'Shekou Port', date: '2026-03-11 15:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l2','2026-03-11 06:00','Job created')], proofDocuments: [], rateId: 'RT-018', agreedRate: { currency: 'CNY', amount: 2800, unit: 'flat' }, agreedCost: { currency: 'CNY', amount: 2800 }, fees: [{ id: 'F-012-01', name: 'Base rate', rateId: 'RT-018', currency: 'CNY', rate: 2800, unit: 'flat', quantity: 1, amount: 2800 }], jobBags: 48, jobWeight: 2450 },
      { id: 'DO-20260311-005-J03', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Shekou Port', date: '2026-03-11 16:00' }, destination: { location: 'Lantau Terminals', date: '2026-03-11 20:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l3','2026-03-11 06:00','Job created')], proofDocuments: [], rateId: 'RT-009', agreedRate: { currency: 'CNY', amount: 680, unit: 'flat' }, agreedCost: { currency: 'CNY', amount: 680 }, fees: [{ id: 'F-013-01', name: 'Base rate', rateId: 'RT-009', currency: 'CNY', rate: 680, unit: 'flat', quantity: 1, amount: 680 }], jobBags: 48, jobWeight: 2450 },
      { id: 'DO-20260311-005-J04', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Lantau Terminals', date: '2026-03-11 21:00' }, destination: { location: 'Lantau Terminals', date: '2026-03-11 23:00' }, service: { code: 'CS', label: 'Cargo Submission' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l4','2026-03-11 06:00','Job created')], proofDocuments: [], rateId: 'RT-011', agreedRate: { currency: 'MYR', amount: 95, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 95 }, fees: [{ id: 'F-014-01', name: 'Base rate', rateId: 'RT-011', currency: 'MYR', rate: 95, unit: 'flat', quantity: 1, amount: 95 }], jobBags: 48, jobWeight: 2450 },
    ],
  },
  // DO-006: AliExpress Yiwu → Ningbo (in progress, rates assigned)
  {
    id: 'DO-20260311-006',
    customer: { name: 'AliExpress', code: 'CUST-004' },
    mawb: '160-22334455',
    bags: 60,
    weight: 3200,
    remarks: '',
    createdAt: '11 Mar 2026, 09:00',
    jobs: [
      { id: 'DO-20260311-006-J01', vendor: { code: 'V-005', name: 'The Lorry' }, origin: { location: 'Yiwu Warehouse', date: '2026-03-11 10:00' }, destination: { location: 'Ningbo Port', date: '2026-03-11 16:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'In Progress', duration: null, execution: '2026-03-11 10:15', activityLog: [log('l1','2026-03-11 09:00','Job created'), log('l2','2026-03-11 10:15','Status → In Progress')], proofDocuments: [], rateId: 'RT-019', agreedRate: { currency: 'CNY', amount: 3200, unit: 'flat' }, agreedCost: { currency: 'CNY', amount: 3200 }, fees: [{ id: 'F-015-01', name: 'Base rate', rateId: 'RT-019', currency: 'CNY', rate: 3200, unit: 'flat', quantity: 1, amount: 3200 }], jobBags: 60, jobWeight: 3200 },
      { id: 'DO-20260311-006-J02', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'Ningbo Port', date: '2026-03-11 17:00' }, destination: { location: 'Ningbo Port', date: '2026-03-11 20:00' }, service: { code: 'OH', label: 'Origin Handling' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l3','2026-03-11 09:00','Job created')], proofDocuments: [], rateId: 'RT-014', agreedRate: { currency: 'MYR', amount: 0.85, unit: 'per-kg' }, agreedCost: { currency: 'MYR', amount: 2720 }, fees: [{ id: 'F-016-01', name: 'Base rate', rateId: 'RT-014', currency: 'MYR', rate: 0.85, unit: 'per-kg', quantity: 3200, amount: 2720 }], jobBags: 60, jobWeight: 3200 },
    ],
  },
  // DO-007: Shopee Guangzhou → HK (completed, all match)
  {
    id: 'DO-20260312-007',
    customer: { name: 'Shopee', code: 'CUST-002' },
    mawb: '160-99887766',
    bags: 12,
    weight: 680,
    remarks: 'Oversized items',
    createdAt: '12 Mar 2026, 07:30',
    jobs: [
      { id: 'DO-20260312-007-J01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'Guangzhou Warehouse', date: '2026-03-12 09:00' }, destination: { location: 'Huangpu Port', date: '2026-03-12 13:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Completed', duration: '04:00', execution: '2026-03-12 09:10', activityLog: [log('l1','2026-03-12 07:30','Job created'), log('l2','2026-03-12 13:00','Status → Completed')], proofDocuments: [doc('d1','gz-huangpu-pod.jpg','image/jpeg','2026-03-12 12:55')], rateId: 'RT-003', agreedRate: { currency: 'MYR', amount: 380, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 380 }, invoiceAmount: { currency: 'MYR', amount: 380 }, fees: [{ id: 'F-017-01', name: 'Base rate', rateId: 'RT-003', currency: 'MYR', rate: 380, unit: 'flat', quantity: 1, amount: 380 }], jobBags: 12, jobWeight: 680 },
      { id: 'DO-20260312-007-J02', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Huangpu Port', date: '2026-03-12 14:00' }, destination: { location: 'Hong Kong Airport', date: '2026-03-12 18:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Completed', duration: '04:00', execution: '2026-03-12 14:05', activityLog: [log('l3','2026-03-12 07:30','Job created'), log('l4','2026-03-12 18:00','Status → Completed')], proofDocuments: [doc('d2','hk-customs-clearance.pdf','application/pdf','2026-03-12 17:50')], rateId: 'RT-008', agreedRate: { currency: 'MYR', amount: 150, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 150 }, invoiceAmount: { currency: 'MYR', amount: 150 }, fees: [{ id: 'F-018-01', name: 'Base rate', rateId: 'RT-008', currency: 'MYR', rate: 150, unit: 'flat', quantity: 1, amount: 150 }], jobBags: 12, jobWeight: 680 },
    ],
  },
  // DO-008: TikTok Shenzhen → SZX (all pending)
  {
    id: 'DO-20260312-008',
    customer: { name: 'TikTok', code: 'CUST-001' },
    mawb: '160-11223344',
    bags: 32,
    weight: 1800,
    remarks: '',
    createdAt: '12 Mar 2026, 11:00',
    jobs: [
      { id: 'DO-20260312-008-J01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'TikTok WH, Shenzhen', date: '2026-03-12 14:00' }, destination: { location: 'SZX Cargo Terminal', date: '2026-03-12 18:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l1','2026-03-12 11:00','Job created')], proofDocuments: [], rateId: 'RT-004', agreedRate: { currency: 'MYR', amount: 470, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 470 }, fees: [{ id: 'F-019-01', name: 'Base rate', rateId: 'RT-004', currency: 'MYR', rate: 470, unit: 'flat', quantity: 1, amount: 470 }], jobBags: 32, jobWeight: 1800 },
      { id: 'DO-20260312-008-J02', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'SZX Cargo Terminal', date: '2026-03-12 19:00' }, destination: { location: 'SZX Cargo Terminal', date: '2026-03-12 22:00' }, service: { code: 'CS', label: 'Cargo Submission' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l2','2026-03-12 11:00','Job created')], proofDocuments: [], fees: [], jobBags: 32, jobWeight: 1800 },
    ],
  },
  // DO-009: Shein Dongguan → SZX (rejected + reassigned)
  {
    id: 'DO-20260313-009',
    customer: { name: 'Shein', code: 'CUST-003' },
    mawb: '160-55667788',
    bags: 20,
    weight: 1100,
    remarks: 'Fragile electronics',
    createdAt: '13 Mar 2026, 06:30',
    priority: true,
    jobs: [
      { id: 'DO-20260313-009-J01', vendor: { code: 'V-004', name: 'ThaiKee' }, origin: { location: 'Dongguan Factory', date: '2026-03-13 08:00' }, destination: { location: 'Shenzhen Bay Hub', date: '2026-03-13 12:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Rejected', duration: null, execution: '2026-03-13 08:10', rejectionReason: 'Capacity full', activityLog: [log('l1','2026-03-13 06:30','Job created'), log('l2','2026-03-13 10:00','Status → Rejected','Ops Admin','Capacity full')], proofDocuments: [], fees: [], jobBags: 20, jobWeight: 1100 },
      { id: 'DO-20260313-009-J02', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'Shenzhen Bay Hub', date: '2026-03-13 13:00' }, destination: { location: 'SZX Airport', date: '2026-03-13 16:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l3','2026-03-13 06:30','Job created')], proofDocuments: [], fees: [], jobBags: 20, jobWeight: 1100 },
      { id: 'DO-20260313-009-J03', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'SZX Airport', date: '2026-03-13 17:00' }, destination: { location: 'SZX Airport', date: '2026-03-13 19:00' }, service: { code: 'CS', label: 'Cargo Submission' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l4','2026-03-13 06:30','Job created')], proofDocuments: [], fees: [], jobBags: 20, jobWeight: 1100 },
    ],
  },
  // DO-010: Temu Shenzhen → Shekou (simple 1-job)
  {
    id: 'DO-20260313-010',
    customer: { name: 'Temu', code: 'CUST-005' },
    mawb: '160-44556677',
    bags: 8,
    weight: 420,
    remarks: '',
    createdAt: '13 Mar 2026, 09:00',
    jobs: [
      { id: 'DO-20260313-010-J01', vendor: { code: 'V-005', name: 'The Lorry' }, origin: { location: 'Shenzhen Nanshan WH', date: '2026-03-13 10:00' }, destination: { location: 'Shekou Port', date: '2026-03-13 13:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'In Progress', duration: null, execution: '2026-03-13 10:05', activityLog: [log('l1','2026-03-13 09:00','Job created'), log('l2','2026-03-13 10:05','Status → In Progress')], proofDocuments: [], rateId: 'RT-020', agreedRate: { currency: 'MYR', amount: 320, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 320 }, fees: [{ id: 'F-024-01', name: 'Base rate', rateId: 'RT-020', currency: 'MYR', rate: 320, unit: 'flat', quantity: 1, amount: 320 }], jobBags: 8, jobWeight: 420 },
    ],
  },
];

// --- Seed Locations (Phase 2) ---
// Names must exactly match location strings used in seedTrips above.
export const seedLocations: Location[] = [
  // Shenzhen zone
  { id: 'LOC-001', name: 'TikTok WH, Shenzhen', code: 'SZ-TTWH', zone: 'Shenzhen', type: 'warehouse' },
  { id: 'LOC-002', name: 'Shenzhen Bay Checkpoint', code: 'SZ-BAY', zone: 'Shenzhen', type: 'checkpoint' },
  { id: 'LOC-003', name: 'SZX Airport Cargo Terminal', code: 'SZX-CT', zone: 'Shenzhen', type: 'airport' },
  { id: 'LOC-004', name: 'Qianhai Free Trade Zone', code: 'SZ-QH', zone: 'Shenzhen', type: 'hub' },
  { id: 'LOC-005', name: 'Huanggang Port', code: 'SZ-HG', zone: 'Shenzhen', type: 'port' },
  { id: 'LOC-006', name: 'Shenzhen Bao An Airport', code: 'SZX-BA', zone: 'Shenzhen', type: 'airport' },
  { id: 'LOC-007', name: 'Shekou Port', code: 'SZ-SK', zone: 'Shenzhen', type: 'port' },
  { id: 'LOC-008', name: 'Shenzhen Nanshan WH', code: 'SZ-NS', zone: 'Shenzhen', type: 'warehouse' },
  { id: 'LOC-009', name: 'Shenzhen Bay Hub', code: 'SZ-BH', zone: 'Shenzhen', type: 'hub' },
  { id: 'LOC-010', name: 'SZX Cargo Terminal', code: 'SZX-CG', zone: 'Shenzhen', type: 'airport' },
  { id: 'LOC-011', name: 'Shenzhen Airport', code: 'SZX', zone: 'Shenzhen', type: 'airport' },
  { id: 'LOC-012', name: 'SZX Airport', code: 'SZX-AP', zone: 'Shenzhen', type: 'airport' },
  // Guangzhou zone
  { id: 'LOC-013', name: 'Guangzhou Baiyun Airport', code: 'CAN-BY', zone: 'Guangzhou', type: 'airport' },
  { id: 'LOC-014', name: 'Guangzhou Warehouse', code: 'GZ-WH', zone: 'Guangzhou', type: 'warehouse' },
  { id: 'LOC-015', name: 'Huangpu Port', code: 'GZ-HP', zone: 'Guangzhou', type: 'port' },
  { id: 'LOC-016', name: 'Guangzhou Region Airport', code: 'CAN-RG', zone: 'Guangzhou', type: 'airport' },
  // Hong Kong zone
  { id: 'LOC-017', name: 'Lantau Terminals', code: 'HK-LT', zone: 'Hong Kong', type: 'port' },
  { id: 'LOC-018', name: 'Hong Kong Airport', code: 'HKG', zone: 'Hong Kong', type: 'airport' },
  // Dongguan zone
  { id: 'LOC-019', name: 'Dongguan Cross-dock', code: 'DG-CD', zone: 'Dongguan', type: 'hub' },
  { id: 'LOC-020', name: 'Dongguan Factory', code: 'DG-FC', zone: 'Dongguan', type: 'warehouse' },
  // Yantian zone
  { id: 'LOC-021', name: 'Yantian Port', code: 'YT-PT', zone: 'Yantian', type: 'port' },
  // Yiwu zone
  { id: 'LOC-022', name: 'Yiwu Warehouse', code: 'YW-WH', zone: 'Yiwu', type: 'warehouse' },
  // Ningbo zone
  { id: 'LOC-023', name: 'Ningbo Port', code: 'NB-PT', zone: 'Ningbo', type: 'port' },
];

// --- Seed Rates (Phase 2) ---
export const seedRates: VendorRate[] = [
  // HaleSun FM routes (MYR)
  { id: 'RT-001', vendorCode: 'V-001', serviceCode: 'FM', rateType: 'route', originLocationId: 'LOC-001', destinationLocationId: 'LOC-002', currency: 'MYR', amount: 450, unit: 'flat', effectiveFrom: '2026-01-01', isActive: true },
  { id: 'RT-002', vendorCode: 'V-001', serviceCode: 'FM', rateType: 'route', originLocationId: 'LOC-019', destinationLocationId: 'LOC-011', currency: 'MYR', amount: 520, unit: 'flat', effectiveFrom: '2026-01-01', isActive: true },
  { id: 'RT-003', vendorCode: 'V-001', serviceCode: 'FM', rateType: 'route', originLocationId: 'LOC-014', destinationLocationId: 'LOC-015', currency: 'MYR', amount: 380, unit: 'flat', effectiveFrom: '2026-01-01', isActive: true },
  { id: 'RT-004', vendorCode: 'V-001', serviceCode: 'FM', rateType: 'route', originLocationId: 'LOC-001', destinationLocationId: 'LOC-010', currency: 'MYR', amount: 470, unit: 'flat', effectiveFrom: '2026-03-01', isActive: true },
  // HaleSun CR (per-bag, CNY)
  { id: 'RT-005', vendorCode: 'V-001', serviceCode: 'CR', rateType: 'location', locationId: 'LOC-021', currency: 'CNY', amount: 25, unit: 'per-bag', effectiveFrom: '2026-01-01', isActive: true },
  // Gonda EC locations (MYR)
  { id: 'RT-006', vendorCode: 'V-003', serviceCode: 'EC', rateType: 'location', locationId: 'LOC-002', currency: 'MYR', amount: 120, unit: 'flat', effectiveFrom: '2026-01-01', isActive: true },
  { id: 'RT-007', vendorCode: 'V-003', serviceCode: 'EC', rateType: 'location', locationId: 'LOC-005', currency: 'MYR', amount: 130, unit: 'flat', effectiveFrom: '2026-01-01', isActive: true },
  { id: 'RT-008', vendorCode: 'V-003', serviceCode: 'EC', rateType: 'location', locationId: 'LOC-015', currency: 'MYR', amount: 150, unit: 'flat', effectiveFrom: '2026-01-01', isActive: true },
  { id: 'RT-009', vendorCode: 'V-003', serviceCode: 'EC', rateType: 'location', locationId: 'LOC-007', currency: 'CNY', amount: 680, unit: 'flat', effectiveFrom: '2026-01-01', isActive: true },
  // Gonda CS locations (MYR)
  { id: 'RT-010', vendorCode: 'V-003', serviceCode: 'CS', rateType: 'location', locationId: 'LOC-003', currency: 'MYR', amount: 80, unit: 'flat', effectiveFrom: '2026-01-01', isActive: true },
  { id: 'RT-011', vendorCode: 'V-003', serviceCode: 'CS', rateType: 'location', locationId: 'LOC-017', currency: 'MYR', amount: 95, unit: 'flat', effectiveFrom: '2026-01-01', isActive: true },
  // SevenSeas EC locations (CNY)
  { id: 'RT-012', vendorCode: 'V-002', serviceCode: 'EC', rateType: 'location', locationId: 'LOC-011', currency: 'CNY', amount: 580, unit: 'flat', effectiveFrom: '2026-01-01', isActive: true },
  { id: 'RT-013', vendorCode: 'V-002', serviceCode: 'EC', rateType: 'location', locationId: 'LOC-012', currency: 'CNY', amount: 600, unit: 'flat', effectiveFrom: '2026-01-01', isActive: true },
  // SevenSeas OH (per-kg, MYR)
  { id: 'RT-014', vendorCode: 'V-002', serviceCode: 'OH', rateType: 'location', locationId: 'LOC-023', currency: 'MYR', amount: 0.85, unit: 'per-kg', effectiveFrom: '2026-01-01', isActive: true },
  // SevenSeas CR (per-bag, CNY)
  { id: 'RT-015', vendorCode: 'V-002', serviceCode: 'CR', rateType: 'location', locationId: 'LOC-006', currency: 'CNY', amount: 30, unit: 'per-bag', effectiveFrom: '2026-01-01', isActive: true },
  // ThaiKee FM route (MYR)
  { id: 'RT-016', vendorCode: 'V-004', serviceCode: 'FM', rateType: 'route', originLocationId: 'LOC-013', destinationLocationId: 'LOC-013', currency: 'MYR', amount: 280, unit: 'flat', effectiveFrom: '2026-01-01', isActive: true },
  // ThaiKee OH (per-kg, MYR)
  { id: 'RT-017', vendorCode: 'V-004', serviceCode: 'OH', rateType: 'location', locationId: 'LOC-013', currency: 'MYR', amount: 0.65, unit: 'per-kg', effectiveFrom: '2026-01-01', isActive: true },
  // The Lorry FM routes (CNY)
  { id: 'RT-018', vendorCode: 'V-005', serviceCode: 'FM', rateType: 'route', originLocationId: 'LOC-006', destinationLocationId: 'LOC-007', currency: 'CNY', amount: 2800, unit: 'flat', effectiveFrom: '2026-01-01', isActive: true },
  { id: 'RT-019', vendorCode: 'V-005', serviceCode: 'FM', rateType: 'route', originLocationId: 'LOC-022', destinationLocationId: 'LOC-023', currency: 'CNY', amount: 3200, unit: 'flat', effectiveFrom: '2026-01-01', isActive: true },
  { id: 'RT-020', vendorCode: 'V-005', serviceCode: 'FM', rateType: 'route', originLocationId: 'LOC-008', destinationLocationId: 'LOC-007', currency: 'MYR', amount: 320, unit: 'flat', effectiveFrom: '2026-01-01', isActive: true },
  // Expired rate example: old HaleSun FM rate for TikTok WH -> SZ Bay (replaced by RT-001)
  { id: 'RT-021', vendorCode: 'V-001', serviceCode: 'FM', rateType: 'route', originLocationId: 'LOC-001', destinationLocationId: 'LOC-002', currency: 'MYR', amount: 420, unit: 'flat', effectiveFrom: '2025-06-01', effectiveTo: '2025-12-31', isActive: false },
];

export const seedTemplates: TripTemplate[] = [
  {
    id: 'TPL-001',
    name: 'Standard Shenzhen Export (TikTok)',
    customerCode: 'CUST-001',
    jobs: [
      { vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'TikTok WH, Shenzhen' }, destination: { location: 'Shenzhen Bay Checkpoint' }, service: { code: 'FM', label: 'Trucking' } },
      { vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Shenzhen Bay Checkpoint' }, destination: { location: 'SZX Airport Cargo Terminal' }, service: { code: 'EC', label: 'Export Custom Clearance' } },
      { vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'SZX Airport Cargo Terminal' }, destination: { location: 'SZX Airport Cargo Terminal' }, service: { code: 'CS', label: 'Cargo Submission' } },
    ],
    createdAt: '01 Mar 2026, 09:00',
  },
  {
    id: 'TPL-002',
    name: 'Guangzhou to HK',
    jobs: [
      { vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'Guangzhou Warehouse' }, destination: { location: 'Huangpu Port' }, service: { code: 'FM', label: 'Trucking' } },
      { vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Huangpu Port' }, destination: { location: 'Hong Kong Airport' }, service: { code: 'EC', label: 'Export Custom Clearance' } },
    ],
    createdAt: '05 Mar 2026, 11:30',
  },
];
