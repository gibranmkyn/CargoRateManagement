export type JobStatus = 'Pending' | 'In Progress' | 'Completed' | 'Verified' | 'Cancelled';
/** @deprecated Use JobStatus instead — unified status lifecycle (TODO-020) */
export type ProofStatus = 'awaiting' | 'uploaded' | 'validated';

// --- FTL Trucking Rate Model ---

export type TruckType = '1.5T' | '3T' | '5T' | '8T' | '10T' | '12T' | '40HQ' | '45HQ';

export const TRUCK_TYPES: { type: TruckType; maxKg: number; maxCbm: number }[] = [
  { type: '1.5T', maxKg: 1500, maxCbm: 15 },
  { type: '3T', maxKg: 2500, maxCbm: 18 },
  { type: '5T', maxKg: 4500, maxCbm: 30 },
  { type: '8T', maxKg: 7500, maxCbm: 43 },
  { type: '10T', maxKg: 10000, maxCbm: 50 },
  { type: '12T', maxKg: 12000, maxCbm: 60 },
  { type: '40HQ', maxKg: 20000, maxCbm: 96 },
  { type: '45HQ', maxKg: 20000, maxCbm: 120 },
];

export interface FtlRate {
  id: string;
  vendorCode: string;
  originCity: string;        // Chinese city name
  originDistrict: string;    // Chinese district name
  originCode: string;        // GB/T 2260 code
  destCity: string;
  destDistrict: string;
  destCode: string;
  currency: Currency;
  rates: Partial<Record<TruckType, number>>;  // truck type → rate per trip
  effectiveFrom: string;
  isActive: boolean;
}

export interface FtlRateLog {
  id: string;
  timestamp: string;
  action: string;      // "CSV uploaded", "Rate created", etc.
  user: string;
  details?: string;    // "92 routes, 87 updated, 5 new" or "福田 5T: 430→450"
  filename?: string;   // CSV filename if upload
}

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
  cancelReason?: string;
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
  name: string;           // vendor's own fee name (e.g., "前置仓操作费")
  feeId?: string;         // linked to VendorFee if auto-populated
  currency: Currency;
  rate: number;           // locked from vendor fee schedule — not editable
  unit: RateUnit;
  quantity: number;       // editable per fee until verified
  amount: number;         // = rate × quantity (calculated)
  minCharge?: number;     // minimum charge from vendor schedule
  active: boolean;        // true = included, false = removed by ops (subtractive model)
}

// --- Legacy VendorRate stub (removed in TODO-017, kept for RateContext compat) ---
/** @deprecated Use VendorFee instead */
export interface VendorRate { id: string; [key: string]: unknown; }

// --- Vendor Fee Schedule ---
// Each vendor has their own fee names per service+location. Not forced into L2 codes.

export interface VendorFee {
  id: string;
  vendorCode: string;
  serviceCode: string;       // L1 service: EC, CS, CR, OH
  locationId: string;        // facility where this fee applies
  name: string;              // vendor's own fee name (e.g., "前置仓操作费", "装板服务")
  nameEn?: string;           // English name (optional)
  currency: Currency;
  rate: number;
  unit: RateUnit;
  minCharge?: number;        // minimum charge per shipment
  isActive: boolean;
  costId?: string;           // optional L2 tag for reporting (e.g., "OH001")
}

export interface VendorFeeLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details?: string;
  filename?: string;
}

export function calcFeeAmount(rate: number, _unit: RateUnit, quantity: number): number {
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
  origin: string;         // single origin for the DO (e.g. "TikTok WH, Shenzhen")
  destination: string;    // single destination for the DO (e.g. "SZX Airport")
  bags: number;
  weight: number;
  remarks: string;
  createdAt: string;
  pickupDate?: string;    // target pickup date (e.g. "2026-03-08")
  deliveryDate?: string;  // target delivery date (e.g. "2026-03-08")
  priority?: boolean;
  jobs: Job[];
}

// --- Bag Package Model (external system data) ---

export interface BagPackage {
  id: string;
  mawb: string;
  bagNumber: string;
  latestLocation: string;
  pickupDate: string;
  origin: string;
  destination: string;
  weightKg: number;
  assignedTripId?: string;
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
  districtCode?: string;  // GB/T 2260 code for auto-resolution to district
}

export const SERVICE_CONFIG: Record<string, { rateType: RateType; label: string }> = {
  FM: { rateType: 'route', label: 'FM Trucking' },
  EC: { rateType: 'location', label: 'Export Customs' },
  CS: { rateType: 'location', label: 'Cargo Submission' },
  CR: { rateType: 'location', label: 'Cargo Reception' },
  OH: { rateType: 'location', label: 'Origin Handling' },
};

// --- L1/L2 Service Hierarchy (from CR Trip Management) ---

export interface L2SubService {
  costId: string;       // e.g., "FM001"
  name: string;         // e.g., "Warehouse Transfer Fee"
  unit: RateUnit;       // fixed per Cost ID (HMW-35)
  l1Code: string;       // parent L1 service code
}

export interface L1Service {
  code: string;
  label: string;
  color: string;        // badge color
  rateType: RateType;
  l2Services: L2SubService[];
}

export const SERVICE_HIERARCHY: L1Service[] = [
  {
    code: 'CR', label: 'Cargo Retrieval', color: '#152CFF', rateType: 'location',
    l2Services: [
      { costId: 'CR001', name: 'Registration Fee', unit: 'flat', l1Code: 'CR' },
      { costId: 'CR002', name: 'Cargo Retrieval Pick Up Fee', unit: 'per-bag', l1Code: 'CR' },
    ],
  },
  {
    code: 'CS', label: 'Cargo Submission', color: '#152CFF', rateType: 'location',
    l2Services: [
      { costId: 'CS001', name: 'Express Center Ground Handling Fee', unit: 'flat', l1Code: 'CS' },
      { costId: 'CS002', name: 'International Cargo Terminal Transit Fee', unit: 'flat', l1Code: 'CS' },
      { costId: 'CS003', name: 'RA Agent Fee', unit: 'flat', l1Code: 'CS' },
      { costId: 'CS004', name: 'Security X-Ray Screening Fee', unit: 'flat', l1Code: 'CS' },
      { costId: 'CS005', name: 'Terminal Handling Charges', unit: 'per-kg', l1Code: 'CS' },
      { costId: 'CS006', name: 'Ground Handling Fee', unit: 'flat', l1Code: 'CS' },
    ],
  },
  {
    code: 'EC', label: 'Export Custom Clearance', color: '#152CFF', rateType: 'location',
    l2Services: [
      { costId: 'EC001', name: 'Customs Declaration Fee', unit: 'flat', l1Code: 'EC' },
      { costId: 'EC002', name: 'Customs Inspection Fee', unit: 'flat', l1Code: 'EC' },
      { costId: 'EC003', name: 'Customs Service Fee', unit: 'flat', l1Code: 'EC' },
    ],
  },
  {
    code: 'FM', label: 'Trucking', color: '#152CFF', rateType: 'route',
    l2Services: [
      { costId: 'FM001', name: 'Warehouse Transfer Fee', unit: 'flat', l1Code: 'FM' },
      { costId: 'FM002', name: 'Pickup Fee', unit: 'flat', l1Code: 'FM' },
      { costId: 'FM003', name: 'Cross-Border Handling Fee', unit: 'flat', l1Code: 'FM' },
    ],
  },
  {
    code: 'OH', label: 'Origin Handling', color: '#152CFF', rateType: 'location',
    l2Services: [
      { costId: 'OH001', name: 'MAWB Fee', unit: 'flat', l1Code: 'OH' },
      { costId: 'OH002', name: 'Loading and Unloading Fee', unit: 'per-kg', l1Code: 'OH' },
      { costId: 'OH003', name: 'Handling Fee', unit: 'per-kg', l1Code: 'OH' },
      { costId: 'OH004', name: 'Sorting Fee', unit: 'per-bag', l1Code: 'OH' },
      { costId: 'OH005', name: 'Palletization / Build-Up Fee', unit: 'flat', l1Code: 'OH' },
    ],
  },
];

// Flat lookup helpers
export const ALL_L2_SERVICES: L2SubService[] = SERVICE_HIERARCHY.flatMap((l1) => l1.l2Services);
export function getL2ByCostId(costId: string): L2SubService | undefined {
  return ALL_L2_SERVICES.find((l2) => l2.costId === costId);
}
export function getL1ByCode(code: string): L1Service | undefined {
  return SERVICE_HIERARCHY.find((l1) => l1.code === code);
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  MYR: 'RM', CNY: 'CNY', USD: 'USD',
};

export function formatCurrency(currency: Currency, amount: number): string {
  return `${CURRENCY_SYMBOLS[currency]} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
