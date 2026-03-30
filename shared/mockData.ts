import type {
  JobStatus,
  ServiceType,
  ActivityLogEntry,
  ProofDocument,
  Job,
  FeeLineItem,
  VendorRate,
  VendorFee,
  VendorFeeLog,
  Trip,
  TripTemplate,
  BagPackage,
  Location,
  FtlRate,
  FtlRateLog,
  Currency,
  RateUnit,
  Driver,
  Vehicle,
  TruckType,
} from './types';

// Re-export types so consumers can import from mockData as before
export type {
  JobStatus,
  ServiceType,
  ActivityLogEntry,
  ProofDocument,
  Job,
  FeeLineItem,
  VendorRate,
  VendorFee,
  VendorFeeLog,
  Trip,
  TripTemplate,
  Location,
  FtlRate,
  FtlRateLog,
  Currency,
  RateUnit,
  Driver,
  Vehicle,
  TruckType,
};

// Re-export everything from types so admin can keep importing from mockData
export {
  TRUCK_TYPES,
  SERVICE_CONFIG,
  SERVICE_HIERARCHY,
  ALL_L2_SERVICES,
  getL2ByCostId,
  getL1ByCode,
  CURRENCY_SYMBOLS,
  formatCurrency,
  calcFeeAmount,
  calcJobTotal,
} from './types';

export type {
  ProofStatus,
  TruckType,
  LocationType,
  RateType,
  L2SubService,
  L1Service,
} from './types';

/** @deprecated Removed — no legacy rates */
export const seedRates: VendorRate[] = [];

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

// --- Fleet Seed Data (vendor-scoped drivers & vehicles) ---

export const seedDrivers: Driver[] = [
  // HaleSun drivers
  { id: 'DRV-001', vendorCode: 'V-001', name: 'Zhang Wei', phone: '138-1234-5678', wechatId: 'zhangwei_driver', defaultVehicleId: 'VEH-001', isActive: true },
  { id: 'DRV-002', vendorCode: 'V-001', name: 'Li Ming', phone: '139-8765-4321', wechatId: 'liming88', defaultVehicleId: 'VEH-002', isActive: true },
  { id: 'DRV-003', vendorCode: 'V-001', name: 'Wang Jun', phone: '137-5555-1234', wechatId: 'wangjun_sz', defaultVehicleId: 'VEH-004', isActive: false },
  // The Lorry drivers
  { id: 'DRV-004', vendorCode: 'V-005', name: 'Chen Da', phone: '136-9999-8888', wechatId: 'chenda_lorry', defaultVehicleId: 'VEH-005', isActive: true },
  { id: 'DRV-005', vendorCode: 'V-005', name: 'Liu Qiang', phone: '135-6666-7777', wechatId: 'liuqiang_tlr', defaultVehicleId: 'VEH-006', isActive: true },
];

export const seedVehicles: Vehicle[] = [
  // HaleSun vehicles
  { id: 'VEH-001', vendorCode: 'V-001', plateNumber: '粤B·12345', truckType: '5T', maxKg: 4500, maxCbm: 30, isActive: true },
  { id: 'VEH-002', vendorCode: 'V-001', plateNumber: '粤B·67890', truckType: '3T', maxKg: 2500, maxCbm: 18, isActive: true },
  { id: 'VEH-003', vendorCode: 'V-001', plateNumber: '粤B·11111', truckType: '8T', maxKg: 7500, maxCbm: 43, isActive: true },
  { id: 'VEH-004', vendorCode: 'V-001', plateNumber: '粤B·22222', truckType: '10T', maxKg: 10000, maxCbm: 50, isActive: false },
  // The Lorry vehicles
  { id: 'VEH-005', vendorCode: 'V-005', plateNumber: '粤A·88888', truckType: '5T', maxKg: 4500, maxCbm: 30, isActive: true },
  { id: 'VEH-006', vendorCode: 'V-005', plateNumber: '粤A·99999', truckType: '12T', maxKg: 12000, maxCbm: 60, isActive: true },
  { id: 'VEH-007', vendorCode: 'V-005', plateNumber: '粤A·77777', truckType: '40HQ', maxKg: 20000, maxCbm: 96, isActive: true },
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
    id: 'T00001',
    customer: { name: 'TikTok', code: 'CUST-001' },
    mawb: '160-84329871',
    origin: 'TikTok WH, Shenzhen',
    destination: 'SZX Airport',
    bags: 24,
    weight: 1240,
    remarks: 'Fragile cargo',
    createdAt: '08 Mar 2026, 09:00', deliveryDate: '2026-03-08',
    jobs: [
      { id: 'T00001-01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'TikTok WH, Shenzhen', date: '2026-03-08 10:00' }, destination: { location: 'SZX Airport', date: '2026-03-08 14:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Verified', duration: '04:00', execution: '2026-03-08 10:05', activityLog: [log('l1','2026-03-08 09:00','Job created','Ops Admin','Assigned to HaleSun'), log('l2','2026-03-08 10:05','Status → In Progress'), log('l3','2026-03-08 14:00','Status → Completed')], proofDocuments: [doc('d1','POD-tiktok-szbay.jpg','image/jpeg','2026-03-08 13:55')], rateId: 'RT-001', agreedRate: { currency: 'MYR', amount: 450, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 525 }, invoiceAmount: { currency: 'MYR', amount: 525 }, fees: [{ id: 'F-001-01', name: 'FTL运费 1.5T', feeId: 'FTL-001', currency: 'MYR', rate: 310, unit: 'flat', quantity: 1, amount: 310, active: true }], jobBags: 24, jobWeight: 1240 },
      { id: 'T00001-02', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'SZX Airport', date: '2026-03-08 15:00' }, destination: { location: 'SZX Airport', date: '2026-03-08 18:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Verified', duration: '03:00', execution: '2026-03-08 15:10', activityLog: [log('l4','2026-03-08 09:00','Job created'), log('l5','2026-03-08 18:00','Status → Completed')], proofDocuments: [doc('d2','customs-clearance-001.pdf','application/pdf','2026-03-08 17:50')], rateId: 'VF-030', agreedCost: { currency: 'MYR', amount: 190 }, invoiceAmount: { currency: 'MYR', amount: 190 }, fees: [{ id: 'F-002-01', name: '报关费', feeId: 'VF-030', currency: 'MYR', rate: 120, unit: 'flat', quantity: 1, amount: 120, active: true }, { id: 'F-002-02', name: '查验费', feeId: 'VF-031', currency: 'MYR', rate: 45, unit: 'flat', quantity: 1, amount: 45, active: true }, { id: 'F-002-03', name: '报关服务费', feeId: 'VF-032', currency: 'MYR', rate: 25, unit: 'flat', quantity: 1, amount: 25, active: true }], jobBags: 24, jobWeight: 1240 },
      { id: 'T00001-03', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'SZX Airport', date: '2026-03-08 19:00' }, destination: { location: 'SZX Airport', date: '2026-03-08 21:00' }, service: { code: 'CS', label: 'Cargo Submission' }, status: 'Verified', duration: '02:00', execution: '2026-03-08 19:05', activityLog: [log('l6','2026-03-08 09:00','Job created'), log('l7','2026-03-08 21:00','Status → Completed')], proofDocuments: [doc('d3','xray-submission-receipt.pdf','application/pdf','2026-03-08 20:55')], rateId: 'VF-040', agreedCost: { currency: 'MYR', amount: 487 }, invoiceAmount: { currency: 'MYR', amount: 500 }, fees: [{ id: 'F-003-01', name: '地面操作费', feeId: 'VF-040', currency: 'MYR', rate: 80, unit: 'flat', quantity: 1, amount: 80, active: true }, { id: 'F-003-02', name: '安检费', feeId: 'VF-041', currency: 'MYR', rate: 0.30, unit: 'per-kg', quantity: 1240, amount: 372, minCharge: 100, active: true }, { id: 'F-003-03', name: '货站操作费', feeId: 'VF-042', currency: 'MYR', rate: 0.25, unit: 'per-kg', quantity: 140, amount: 35, minCharge: 80, active: false }], jobBags: 24, jobWeight: 1240 },
    ],
  },
  // DO-002: Shopee Yantian → KUL (in progress, mixed currencies)
  {
    id: 'T00002',
    customer: { name: 'Shopee', code: 'CUST-002' },
    mawb: '160-33121632',
    origin: 'Yantian Port',
    destination: 'Shenzhen Airport',
    bags: 16,
    weight: 890,
    remarks: '',
    createdAt: '09 Mar 2026, 08:30', deliveryDate: '2026-03-09',
    jobs: [
      { id: 'T00002-01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'Yantian Port', date: '2026-03-09 10:00' }, destination: { location: 'Yantian Port', date: '2026-03-09 14:00' }, service: { code: 'CR', label: 'Cargo Retrieval' }, status: 'Verified', duration: '04:00', execution: '2026-03-09 10:10', activityLog: [log('l1','2026-03-09 08:30','Job created'), log('l2','2026-03-09 14:00','Status → Completed')], proofDocuments: [doc('d1','retrieval-yantian.jpg','image/jpeg','2026-03-09 13:50')], rateId: 'RT-005', agreedRate: { currency: 'CNY', amount: 25, unit: 'per-bag' }, agreedCost: { currency: 'CNY', amount: 400 }, invoiceAmount: { currency: 'CNY', amount: 400 }, fees: [{ id: 'F-004-01', name: 'Base rate', feeId: 'RT-005', currency: 'CNY', rate: 25, unit: 'per-bag', quantity: 16, amount: 400, active: true }], jobBags: 16, jobWeight: 890 },
      { id: 'T00002-02', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'Yantian Port', date: '2026-03-09 15:00' }, destination: { location: 'Shenzhen Airport', date: '2026-03-09 19:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'In Progress', duration: null, execution: '2026-03-09 15:05', activityLog: [log('l3','2026-03-09 08:30','Job created'), log('l4','2026-03-09 15:05','Status → In Progress')], proofDocuments: [], rateId: 'RT-002', agreedRate: { currency: 'MYR', amount: 520, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 520 }, fees: [{ id: 'F-005-01', name: 'Base rate', feeId: 'RT-002', currency: 'MYR', rate: 520, unit: 'flat', quantity: 1, amount: 520, active: true }], jobBags: 16, jobWeight: 890 },
      { id: 'T00002-03', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'Shenzhen Airport', date: '2026-03-09 20:00' }, destination: { location: 'Shenzhen Airport', date: '2026-03-09 23:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l5','2026-03-09 08:30','Job created')], proofDocuments: [], rateId: 'RT-012', agreedRate: { currency: 'CNY', amount: 580, unit: 'flat' }, agreedCost: { currency: 'CNY', amount: 580 }, fees: [{ id: 'F-006-01', name: 'Base rate', feeId: 'RT-012', currency: 'CNY', rate: 580, unit: 'flat', quantity: 1, amount: 580, active: true }], jobBags: 16, jobWeight: 890 },
    ],
  },
  // DO-003: TikTok Qianhai → Huanggang (rejected)
  {
    id: 'T00003',
    customer: { name: 'TikTok', code: 'CUST-001' },
    mawb: '160-98765421',
    origin: 'Qianhai Free Trade Zone',
    destination: 'Huanggang Port',
    bags: 36,
    weight: 1500,
    remarks: 'Priority shipment',
    createdAt: '10 Mar 2026, 07:00', deliveryDate: '2026-03-10',
    priority: true,
    jobs: [
      { id: 'T00003-01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'Qianhai Free Trade Zone', date: '2026-03-10 08:00' }, destination: { location: 'Huanggang Port', date: '2026-03-10 12:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Cancelled', duration: null, execution: '2026-03-10 08:10', cancelReason: 'Vehicle breakdown', activityLog: [log('l1','2026-03-10 07:00','Job created'), log('l2','2026-03-10 09:30','Status → Rejected','Ops Admin','Vehicle breakdown')], proofDocuments: [], fees: [], jobBags: 36, jobWeight: 1500 },
      { id: 'T00003-02', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Huanggang Port', date: '2026-03-10 13:00' }, destination: { location: 'Huanggang Port', date: '2026-03-10 16:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l3','2026-03-10 07:00','Job created')], proofDocuments: [], fees: [], jobBags: 36, jobWeight: 1500 },
    ],
  },
  // DO-004: Shein Guangzhou → Airport (1 completed with under-invoice, 1 in progress)
  {
    id: 'T00004',
    customer: { name: 'Shein', code: 'CUST-003' },
    mawb: '160-11456287',
    origin: 'Guangzhou Warehouse',
    destination: 'Guangzhou Baiyun Airport',
    bags: 10,
    weight: 520,
    remarks: 'Temperature sensitive',
    createdAt: '10 Mar 2026, 10:00', deliveryDate: '2026-03-11',
    jobs: [
      { id: 'T00004-01', vendor: { code: 'V-004', name: 'ThaiKee' }, origin: { location: 'Guangzhou Warehouse', date: '2026-03-10 14:00' }, destination: { location: 'Guangzhou Baiyun Airport', date: '2026-03-10 17:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Verified', duration: '03:00', execution: '2026-03-10 14:05', activityLog: [log('l1','2026-03-10 10:00','Job created'), log('l2','2026-03-10 17:00','Status → Completed')], proofDocuments: [doc('d1','gz-trucking-receipt.pdf','application/pdf','2026-03-10 16:50')], rateId: 'RT-016', agreedRate: { currency: 'MYR', amount: 280, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 280 }, invoiceAmount: { currency: 'MYR', amount: 250 }, fees: [{ id: 'F-009-01', name: 'Base rate', feeId: 'RT-016', currency: 'MYR', rate: 280, unit: 'flat', quantity: 1, amount: 280, active: true }], jobBags: 10, jobWeight: 520 },
      { id: 'T00004-02', vendor: { code: 'V-004', name: 'ThaiKee' }, origin: { location: 'Guangzhou Baiyun Airport', date: '2026-03-10 18:00' }, destination: { location: 'Guangzhou Baiyun Airport', date: '2026-03-10 21:00' }, service: { code: 'OH', label: 'Origin Handling' }, status: 'In Progress', duration: null, execution: '2026-03-10 18:10', activityLog: [log('l3','2026-03-10 10:00','Job created'), log('l4','2026-03-10 18:10','Status → In Progress')], proofDocuments: [], rateId: 'RT-017', agreedRate: { currency: 'MYR', amount: 0.65, unit: 'per-kg' }, agreedCost: { currency: 'MYR', amount: 338 }, fees: [{ id: 'F-010-01', name: 'Base rate', feeId: 'RT-017', currency: 'MYR', rate: 0.65, unit: 'per-kg', quantity: 520, amount: 338, active: true }], jobBags: 10, jobWeight: 520 },
    ],
  },
  // DO-005: Temu SZX → Lantau (all pending, rates assigned, mixed currencies)
  {
    id: 'T00005',
    customer: { name: 'Temu', code: 'CUST-005' },
    mawb: '160-77654321',
    origin: 'Shenzhen Bao An Airport',
    destination: 'Lantau Terminals',
    bags: 48,
    weight: 2450,
    remarks: 'Export commitment',
    createdAt: '11 Mar 2026, 06:00', deliveryDate: '2026-03-12',
    jobs: [
      { id: 'T00005-01', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'Shenzhen Bao An Airport', date: '2026-03-11 08:00' }, destination: { location: 'Shenzhen Bao An Airport', date: '2026-03-11 10:00' }, service: { code: 'CR', label: 'Cargo Retrieval' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l1','2026-03-11 06:00','Job created')], proofDocuments: [], rateId: 'RT-015', agreedRate: { currency: 'CNY', amount: 30, unit: 'per-bag' }, agreedCost: { currency: 'CNY', amount: 1440 }, fees: [{ id: 'F-011-01', name: 'Base rate', feeId: 'RT-015', currency: 'CNY', rate: 30, unit: 'per-bag', quantity: 48, amount: 1440, active: true }], jobBags: 48, jobWeight: 2450 },
      { id: 'T00005-02', vendor: { code: 'V-005', name: 'The Lorry' }, origin: { location: 'Shenzhen Bao An Airport', date: '2026-03-11 11:00' }, destination: { location: 'Lantau Terminals', date: '2026-03-11 15:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l2','2026-03-11 06:00','Job created')], proofDocuments: [], rateId: 'RT-018', agreedRate: { currency: 'CNY', amount: 2800, unit: 'flat' }, agreedCost: { currency: 'CNY', amount: 2800 }, fees: [{ id: 'F-012-01', name: 'Base rate', feeId: 'RT-018', currency: 'CNY', rate: 2800, unit: 'flat', quantity: 1, amount: 2800, active: true }], jobBags: 48, jobWeight: 2450 },
      { id: 'T00005-03', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Lantau Terminals', date: '2026-03-11 16:00' }, destination: { location: 'Lantau Terminals', date: '2026-03-11 20:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l3','2026-03-11 06:00','Job created')], proofDocuments: [], rateId: 'RT-009', agreedRate: { currency: 'CNY', amount: 680, unit: 'flat' }, agreedCost: { currency: 'CNY', amount: 680 }, fees: [{ id: 'F-013-01', name: 'Base rate', feeId: 'RT-009', currency: 'CNY', rate: 680, unit: 'flat', quantity: 1, amount: 680, active: true }], jobBags: 48, jobWeight: 2450 },
      { id: 'T00005-04', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Lantau Terminals', date: '2026-03-11 21:00' }, destination: { location: 'Lantau Terminals', date: '2026-03-11 23:00' }, service: { code: 'CS', label: 'Cargo Submission' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l4','2026-03-11 06:00','Job created')], proofDocuments: [], rateId: 'RT-011', agreedRate: { currency: 'MYR', amount: 95, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 95 }, fees: [{ id: 'F-014-01', name: 'Base rate', feeId: 'RT-011', currency: 'MYR', rate: 95, unit: 'flat', quantity: 1, amount: 95, active: true }], jobBags: 48, jobWeight: 2450 },
    ],
  },
  // DO-006: AliExpress Yiwu → Ningbo (in progress, rates assigned)
  {
    id: 'T00006',
    customer: { name: 'AliExpress', code: 'CUST-004' },
    mawb: '160-22334455',
    origin: 'Yiwu Warehouse',
    destination: 'Ningbo Port',
    bags: 60,
    weight: 3200,
    remarks: '',
    createdAt: '11 Mar 2026, 09:00', deliveryDate: '2026-03-12',
    jobs: [
      { id: 'T00006-01', vendor: { code: 'V-005', name: 'The Lorry' }, origin: { location: 'Yiwu Warehouse', date: '2026-03-11 10:00' }, destination: { location: 'Ningbo Port', date: '2026-03-11 16:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'In Progress', duration: null, execution: '2026-03-11 10:15', activityLog: [log('l1','2026-03-11 09:00','Job created'), log('l2','2026-03-11 10:15','Status → In Progress')], proofDocuments: [], rateId: 'RT-019', agreedRate: { currency: 'CNY', amount: 3200, unit: 'flat' }, agreedCost: { currency: 'CNY', amount: 3200 }, fees: [{ id: 'F-015-01', name: 'Base rate', feeId: 'RT-019', currency: 'CNY', rate: 3200, unit: 'flat', quantity: 1, amount: 3200, active: true }], jobBags: 60, jobWeight: 3200 },
      { id: 'T00006-02', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'Ningbo Port', date: '2026-03-11 17:00' }, destination: { location: 'Ningbo Port', date: '2026-03-11 20:00' }, service: { code: 'OH', label: 'Origin Handling' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l3','2026-03-11 09:00','Job created')], proofDocuments: [], rateId: 'RT-014', agreedRate: { currency: 'MYR', amount: 0.85, unit: 'per-kg' }, agreedCost: { currency: 'MYR', amount: 2720 }, fees: [{ id: 'F-016-01', name: 'Base rate', feeId: 'RT-014', currency: 'MYR', rate: 0.85, unit: 'per-kg', quantity: 3200, amount: 2720, active: true }], jobBags: 60, jobWeight: 3200 },
    ],
  },
  // DO-007: Shopee Guangzhou → HK (completed, all match)
  {
    id: 'T00007',
    customer: { name: 'Shopee', code: 'CUST-002' },
    mawb: '160-99887766',
    origin: 'Guangzhou Warehouse',
    destination: 'Hong Kong Airport',
    bags: 12,
    weight: 680,
    remarks: 'Oversized items',
    createdAt: '12 Mar 2026, 07:30', deliveryDate: '2026-03-12',
    jobs: [
      { id: 'T00007-01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'Guangzhou Warehouse', date: '2026-03-12 09:00' }, destination: { location: 'Hong Kong Airport', date: '2026-03-12 13:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Verified', duration: '04:00', execution: '2026-03-12 09:10', activityLog: [log('l1','2026-03-12 07:30','Job created'), log('l2','2026-03-12 13:00','Status → Completed')], proofDocuments: [doc('d1','gz-huangpu-pod.jpg','image/jpeg','2026-03-12 12:55')], rateId: 'RT-003', agreedRate: { currency: 'MYR', amount: 380, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 380 }, invoiceAmount: { currency: 'MYR', amount: 380 }, fees: [{ id: 'F-017-01', name: 'Base rate', feeId: 'RT-003', currency: 'MYR', rate: 380, unit: 'flat', quantity: 1, amount: 380, active: true }], jobBags: 12, jobWeight: 680 },
      { id: 'T00007-02', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Hong Kong Airport', date: '2026-03-12 14:00' }, destination: { location: 'Hong Kong Airport', date: '2026-03-12 18:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Verified', duration: '04:00', execution: '2026-03-12 14:05', activityLog: [log('l3','2026-03-12 07:30','Job created'), log('l4','2026-03-12 18:00','Status → Completed')], proofDocuments: [doc('d2','hk-customs-clearance.pdf','application/pdf','2026-03-12 17:50')], rateId: 'RT-008', agreedRate: { currency: 'MYR', amount: 150, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 150 }, invoiceAmount: { currency: 'MYR', amount: 150 }, fees: [{ id: 'F-018-01', name: 'Base rate', feeId: 'RT-008', currency: 'MYR', rate: 150, unit: 'flat', quantity: 1, amount: 150, active: true }], jobBags: 12, jobWeight: 680 },
    ],
  },
  // DO-008: TikTok Shenzhen → SZX (all pending)
  {
    id: 'T00008',
    customer: { name: 'TikTok', code: 'CUST-001' },
    mawb: '160-11223344',
    origin: 'TikTok WH, Shenzhen',
    destination: 'SZX Cargo Terminal',
    bags: 32,
    weight: 1800,
    remarks: '',
    createdAt: '12 Mar 2026, 11:00', deliveryDate: '2026-03-13',
    jobs: [
      { id: 'T00008-01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'TikTok WH, Shenzhen', date: '2026-03-12 14:00' }, destination: { location: 'SZX Cargo Terminal', date: '2026-03-12 18:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l1','2026-03-12 11:00','Job created')], proofDocuments: [], rateId: 'RT-004', agreedRate: { currency: 'MYR', amount: 470, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 470 }, fees: [{ id: 'F-019-01', name: 'Base rate', feeId: 'RT-004', currency: 'MYR', rate: 470, unit: 'flat', quantity: 1, amount: 470, active: true }], jobBags: 32, jobWeight: 1800 },
      { id: 'T00008-02', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'SZX Cargo Terminal', date: '2026-03-12 19:00' }, destination: { location: 'SZX Cargo Terminal', date: '2026-03-12 22:00' }, service: { code: 'CS', label: 'Cargo Submission' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l2','2026-03-12 11:00','Job created')], proofDocuments: [], fees: [{ id: 'F-020-01', name: '地面操作费', feeId: 'VF-040', currency: 'MYR', rate: 80, unit: 'flat', quantity: 1, amount: 80, active: true }, { id: 'F-020-02', name: '安检费', feeId: 'VF-041', currency: 'MYR', rate: 0.30, unit: 'per-kg', quantity: 1800, amount: 540, minCharge: 100, active: true }, { id: 'F-020-03', name: '货站操作费', feeId: 'VF-042', currency: 'MYR', rate: 0.25, unit: 'per-kg', quantity: 1800, amount: 450, minCharge: 80, active: true }], jobBags: 32, jobWeight: 1800 },
    ],
  },
  // DO-009: Shein Dongguan → SZX (rejected + reassigned)
  {
    id: 'T00009',
    customer: { name: 'Shein', code: 'CUST-003' },
    mawb: '160-55667788',
    origin: 'Dongguan Factory',
    destination: 'SZX Airport',
    bags: 20,
    weight: 1100,
    remarks: 'Fragile electronics',
    createdAt: '13 Mar 2026, 06:30', deliveryDate: '2026-03-14',
    priority: true,
    jobs: [
      { id: 'T00009-01', vendor: { code: 'V-004', name: 'ThaiKee' }, origin: { location: 'Dongguan Factory', date: '2026-03-13 08:00' }, destination: { location: 'SZX Airport', date: '2026-03-13 12:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Cancelled', duration: null, execution: '2026-03-13 08:10', cancelReason: 'Capacity full', activityLog: [log('l1','2026-03-13 06:30','Job created'), log('l2','2026-03-13 10:00','Status → Rejected','Ops Admin','Capacity full')], proofDocuments: [], fees: [], jobBags: 20, jobWeight: 1100 },
      { id: 'T00009-02', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'SZX Airport', date: '2026-03-13 13:00' }, destination: { location: 'SZX Airport', date: '2026-03-13 16:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l3','2026-03-13 06:30','Job created')], proofDocuments: [], fees: [], jobBags: 20, jobWeight: 1100 },
      { id: 'T00009-03', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'SZX Airport', date: '2026-03-13 17:00' }, destination: { location: 'SZX Airport', date: '2026-03-13 19:00' }, service: { code: 'CS', label: 'Cargo Submission' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l4','2026-03-13 06:30','Job created')], proofDocuments: [], fees: [], jobBags: 20, jobWeight: 1100 },
    ],
  },
  // DO-010: Temu Shenzhen → Shekou (simple 1-job)
  {
    id: 'T00010',
    customer: { name: 'Temu', code: 'CUST-005' },
    mawb: '160-44556677',
    origin: 'Shenzhen Nanshan WH',
    destination: 'Shekou Port',
    bags: 8,
    weight: 420,
    remarks: '',
    createdAt: '13 Mar 2026, 09:00', deliveryDate: '2026-03-13',
    jobs: [
      { id: 'T00010-01', vendor: { code: 'V-005', name: 'The Lorry' }, origin: { location: 'Shenzhen Nanshan WH', date: '2026-03-13 10:00' }, destination: { location: 'Shekou Port', date: '2026-03-13 13:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'In Progress', duration: null, execution: '2026-03-13 10:05', activityLog: [log('l1','2026-03-13 09:00','Job created'), log('l2','2026-03-13 10:05','Status → In Progress')], proofDocuments: [], rateId: 'RT-020', agreedRate: { currency: 'MYR', amount: 320, unit: 'flat' }, agreedCost: { currency: 'MYR', amount: 320 }, fees: [{ id: 'F-024-01', name: 'Base rate', feeId: 'RT-020', currency: 'MYR', rate: 320, unit: 'flat', quantity: 1, amount: 320, active: true }], jobBags: 8, jobWeight: 420 },
    ],
  },

  // === EXPANDED SEED DATA — covers all vendors, all statuses, all customers ===

  // T00011: Temu — ThaiKee FM(Completed) + Gonda EC(Completed) + SevenSeas CS(Pending)
  {
    id: 'T00011',
    customer: { name: 'Temu', code: 'CUST-005' },
    mawb: '160-77881234',
    origin: 'Dongguan Factory',
    destination: 'SZX Airport',
    bags: 40,
    weight: 2200,
    remarks: 'Express shipment',
    createdAt: '14 Mar 2026, 08:00', pickupDate: '2026-03-14', deliveryDate: '2026-03-16',
    jobs: [
      { id: 'T00011-01', vendor: { code: 'V-004', name: 'ThaiKee' }, origin: { location: 'Dongguan Factory', date: '2026-03-14 09:00' }, destination: { location: 'SZX Airport', date: '2026-03-14 13:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Completed', duration: '04:00', execution: '2026-03-14 09:10', activityLog: [log('l50','2026-03-14 08:00','Job created','Ops Admin','Assigned to ThaiKee'), log('l51','2026-03-14 09:10','Status → In Progress'), log('l52','2026-03-14 13:00','Status → Completed')], proofDocuments: [doc('d20','POD-dongguan-szx.jpg','image/jpeg','2026-03-14 12:55')], agreedCost: { currency: 'CNY', amount: 1800 }, fees: [{ id: 'F-050-01', name: 'FTL运费 5T', currency: 'CNY', rate: 1800, unit: 'flat', quantity: 1, amount: 1800, active: true }], jobBags: 40, jobWeight: 2200 },
      { id: 'T00011-02', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'SZX Airport', date: '2026-03-14 14:00' }, destination: { location: 'SZX Airport', date: '2026-03-14 17:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Completed', duration: '03:00', execution: '2026-03-14 14:15', activityLog: [log('l53','2026-03-14 08:00','Job created'), log('l54','2026-03-14 14:15','Status → In Progress'), log('l55','2026-03-14 17:00','Status → Completed')], proofDocuments: [doc('d21','customs-temu-011.pdf','application/pdf','2026-03-14 16:50')], agreedCost: { currency: 'CNY', amount: 450 }, fees: [{ id: 'F-051-01', name: '报关费', currency: 'CNY', rate: 300, unit: 'flat', quantity: 1, amount: 300, active: true }, { id: 'F-051-02', name: '查验费', currency: 'CNY', rate: 150, unit: 'flat', quantity: 1, amount: 150, active: true }], jobBags: 40, jobWeight: 2200 },
      { id: 'T00011-03', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'SZX Airport', date: '2026-03-14 18:00' }, destination: { location: 'SZX Airport', date: '2026-03-14 20:00' }, service: { code: 'CS', label: 'Cargo Submission' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l56','2026-03-14 08:00','Job created')], proofDocuments: [], fees: [{ id: 'F-052-01', name: '地面操作费', currency: 'CNY', rate: 200, unit: 'flat', quantity: 1, amount: 200, active: true }, { id: 'F-052-02', name: '安检费', currency: 'CNY', rate: 0.25, unit: 'per-kg', quantity: 2200, amount: 550, active: true }], jobBags: 40, jobWeight: 2200 },
    ],
  },

  // T00012: AliExpress — The Lorry FM(Verified) + SevenSeas OH(Verified) — fully completed trip
  {
    id: 'T00012',
    customer: { name: 'AliExpress', code: 'CUST-004' },
    mawb: '160-99887766',
    origin: 'Guangzhou Warehouse',
    destination: 'Guangzhou Baiyun Airport',
    bags: 55,
    weight: 3100,
    remarks: '',
    createdAt: '14 Mar 2026, 07:30', pickupDate: '2026-03-14', deliveryDate: '2026-03-15',
    jobs: [
      { id: 'T00012-01', vendor: { code: 'V-005', name: 'The Lorry' }, origin: { location: 'Guangzhou Warehouse', date: '2026-03-14 08:00' }, destination: { location: 'Guangzhou Baiyun Airport', date: '2026-03-14 11:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Verified', duration: '03:00', execution: '2026-03-14 08:05', activityLog: [log('l60','2026-03-14 07:30','Job created','Ops Admin','Assigned to The Lorry'), log('l61','2026-03-14 08:05','Status → In Progress'), log('l62','2026-03-14 11:00','Status → Completed'), log('l63','2026-03-14 15:00','Status → Verified','Ops Admin','Proof reviewed')], proofDocuments: [doc('d25','POD-gz-airport.jpg','image/jpeg','2026-03-14 10:55')], agreedCost: { currency: 'CNY', amount: 2400 }, fees: [{ id: 'F-060-01', name: 'FTL运费 8T', currency: 'CNY', rate: 2400, unit: 'flat', quantity: 1, amount: 2400, active: true }], jobBags: 55, jobWeight: 3100 },
      { id: 'T00012-02', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'Guangzhou Baiyun Airport', date: '2026-03-14 12:00' }, destination: { location: 'Guangzhou Baiyun Airport', date: '2026-03-14 18:00' }, service: { code: 'OH', label: 'Origin Handling' }, status: 'Verified', duration: '06:00', execution: '2026-03-14 12:10', activityLog: [log('l64','2026-03-14 07:30','Job created'), log('l65','2026-03-14 12:10','Status → In Progress'), log('l66','2026-03-14 18:00','Status → Completed'), log('l67','2026-03-14 19:00','Status → Verified','Ops Admin','Proof reviewed')], proofDocuments: [doc('d26','oh-receipt-gz.pdf','application/pdf','2026-03-14 17:50')], agreedCost: { currency: 'CNY', amount: 680 }, fees: [{ id: 'F-061-01', name: '打板费', currency: 'CNY', rate: 8, unit: 'per-bag', quantity: 55, amount: 440, active: true }, { id: 'F-061-02', name: '操作费', currency: 'CNY', rate: 240, unit: 'flat', quantity: 1, amount: 240, active: true }], jobBags: 55, jobWeight: 3100 },
    ],
  },

  // T00013: TikTok — HaleSun FM(In Progress) + Gonda EC(Pending) + SevenSeas CS(Pending) + HaleSun OH(Pending)
  {
    id: 'T00013',
    customer: { name: 'TikTok', code: 'CUST-001' },
    mawb: '160-12312312',
    origin: 'TikTok WH, Shenzhen',
    destination: 'Hong Kong Airport',
    bags: 80,
    weight: 4500,
    remarks: 'High priority — TikTok Q1 promo',
    createdAt: '15 Mar 2026, 06:00', pickupDate: '2026-03-15', deliveryDate: '2026-03-17',
    priority: true,
    jobs: [
      { id: 'T00013-01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'TikTok WH, Shenzhen', date: '2026-03-15 07:00' }, destination: { location: 'SZX Airport', date: '2026-03-15 10:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'In Progress', duration: null, execution: '2026-03-15 07:05', activityLog: [log('l70','2026-03-15 06:00','Job created','Ops Admin','Assigned to HaleSun'), log('l71','2026-03-15 07:05','Status → In Progress')], proofDocuments: [], agreedCost: { currency: 'MYR', amount: 580 }, fees: [{ id: 'F-070-01', name: 'FTL运费 3T', currency: 'MYR', rate: 580, unit: 'flat', quantity: 1, amount: 580, active: true }], jobBags: 80, jobWeight: 4500 },
      { id: 'T00013-02', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Shenzhen Bay Checkpoint', date: '2026-03-15 11:00' }, destination: { location: 'Shenzhen Bay Checkpoint', date: '2026-03-15 14:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l72','2026-03-15 06:00','Job created')], proofDocuments: [], fees: [{ id: 'F-071-01', name: '报关费', currency: 'CNY', rate: 400, unit: 'flat', quantity: 1, amount: 400, active: true }], jobBags: 80, jobWeight: 4500 },
      { id: 'T00013-03', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'SZX Airport', date: '2026-03-15 15:00' }, destination: { location: 'SZX Airport', date: '2026-03-15 18:00' }, service: { code: 'CS', label: 'Cargo Submission' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l73','2026-03-15 06:00','Job created')], proofDocuments: [], fees: [{ id: 'F-072-01', name: '货站操作费', currency: 'CNY', rate: 300, unit: 'flat', quantity: 1, amount: 300, active: true }, { id: 'F-072-02', name: '安检费', currency: 'CNY', rate: 0.30, unit: 'per-kg', quantity: 4500, amount: 1350, active: true }], jobBags: 80, jobWeight: 4500 },
      { id: 'T00013-04', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'SZX Airport', date: '2026-03-15 19:00' }, destination: { location: 'SZX Airport', date: '2026-03-16 01:00' }, service: { code: 'OH', label: 'Origin Handling' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l74','2026-03-15 06:00','Job created')], proofDocuments: [], fees: [{ id: 'F-073-01', name: '打板费', currency: 'CNY', rate: 6, unit: 'per-bag', quantity: 80, amount: 480, active: true }, { id: 'F-073-02', name: '过磅费', currency: 'CNY', rate: 0.15, unit: 'per-kg', quantity: 4500, amount: 675, active: true }], jobBags: 80, jobWeight: 4500 },
    ],
  },

  // T00014: Shein — ThaiKee FM(Verified) + ThaiKee OH(Completed) — ThaiKee multi-service
  {
    id: 'T00014',
    customer: { name: 'Shein', code: 'CUST-003' },
    mawb: '160-56785678',
    origin: 'Dongguan Cross-dock',
    destination: 'Guangzhou Baiyun Airport',
    bags: 30,
    weight: 1800,
    remarks: '',
    createdAt: '15 Mar 2026, 09:00', pickupDate: '2026-03-15', deliveryDate: '2026-03-16',
    jobs: [
      { id: 'T00014-01', vendor: { code: 'V-004', name: 'ThaiKee' }, origin: { location: 'Dongguan Cross-dock', date: '2026-03-15 10:00' }, destination: { location: 'Guangzhou Baiyun Airport', date: '2026-03-15 14:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Verified', duration: '04:00', execution: '2026-03-15 10:05', activityLog: [log('l80','2026-03-15 09:00','Job created','Ops Admin','Assigned to ThaiKee'), log('l81','2026-03-15 10:05','Status → In Progress'), log('l82','2026-03-15 14:00','Status → Completed'), log('l83','2026-03-15 16:00','Status → Verified','Ops Admin','Proof reviewed')], proofDocuments: [doc('d30','POD-dg-gz.jpg','image/jpeg','2026-03-15 13:55')], agreedCost: { currency: 'CNY', amount: 1600 }, fees: [{ id: 'F-080-01', name: 'FTL运费 3T', currency: 'CNY', rate: 1600, unit: 'flat', quantity: 1, amount: 1600, active: true }], jobBags: 30, jobWeight: 1800 },
      { id: 'T00014-02', vendor: { code: 'V-004', name: 'ThaiKee' }, origin: { location: 'Guangzhou Baiyun Airport', date: '2026-03-15 15:00' }, destination: { location: 'Guangzhou Baiyun Airport', date: '2026-03-15 20:00' }, service: { code: 'OH', label: 'Origin Handling' }, status: 'Completed', duration: '05:00', execution: '2026-03-15 15:10', activityLog: [log('l84','2026-03-15 09:00','Job created'), log('l85','2026-03-15 15:10','Status → In Progress'), log('l86','2026-03-15 20:00','Status → Completed')], proofDocuments: [doc('d31','oh-receipt-shein.pdf','application/pdf','2026-03-15 19:50')], agreedCost: { currency: 'CNY', amount: 520 }, fees: [{ id: 'F-081-01', name: '打板费', currency: 'CNY', rate: 7, unit: 'per-bag', quantity: 30, amount: 210, active: true }, { id: 'F-081-02', name: '操作费', currency: 'CNY', rate: 310, unit: 'flat', quantity: 1, amount: 310, active: true }], jobBags: 30, jobWeight: 1800 },
    ],
  },

  // T00015: Temu — The Lorry FM(Completed) + HaleSun CR(In Progress) + Gonda EC(Pending)
  {
    id: 'T00015',
    customer: { name: 'Temu', code: 'CUST-005' },
    mawb: '160-33344455',
    origin: 'Yiwu Warehouse',
    destination: 'Ningbo Port',
    bags: 100,
    weight: 5500,
    remarks: 'Bulk order — sea freight',
    createdAt: '16 Mar 2026, 07:00', pickupDate: '2026-03-16', deliveryDate: '2026-03-18',
    jobs: [
      { id: 'T00015-01', vendor: { code: 'V-005', name: 'The Lorry' }, origin: { location: 'Yiwu Warehouse', date: '2026-03-16 08:00' }, destination: { location: 'Ningbo Port', date: '2026-03-16 14:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Completed', duration: '06:00', execution: '2026-03-16 08:10', activityLog: [log('l90','2026-03-16 07:00','Job created','Ops Admin','Assigned to The Lorry'), log('l91','2026-03-16 08:10','Status → In Progress'), log('l92','2026-03-16 14:00','Status → Completed')], proofDocuments: [doc('d35','POD-yiwu-ningbo.jpg','image/jpeg','2026-03-16 13:55')], agreedCost: { currency: 'CNY', amount: 3200 }, fees: [{ id: 'F-090-01', name: 'FTL运费 10T', currency: 'CNY', rate: 3200, unit: 'flat', quantity: 1, amount: 3200, active: true }], jobBags: 100, jobWeight: 5500 },
      { id: 'T00015-02', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'Ningbo Port', date: '2026-03-16 15:00' }, destination: { location: 'Ningbo Port', date: '2026-03-16 17:00' }, service: { code: 'CR', label: 'Cargo Retrieval' }, status: 'In Progress', duration: null, execution: '2026-03-16 15:10', activityLog: [log('l93','2026-03-16 07:00','Job created'), log('l94','2026-03-16 15:10','Status → In Progress')], proofDocuments: [], agreedCost: { currency: 'CNY', amount: 350 }, fees: [{ id: 'F-091-01', name: '提货费', currency: 'CNY', rate: 350, unit: 'flat', quantity: 1, amount: 350, active: true }], jobBags: 100, jobWeight: 5500 },
      { id: 'T00015-03', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Ningbo Port', date: '2026-03-16 18:00' }, destination: { location: 'Ningbo Port', date: '2026-03-16 21:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l95','2026-03-16 07:00','Job created')], proofDocuments: [], fees: [{ id: 'F-092-01', name: '报关费', currency: 'CNY', rate: 500, unit: 'flat', quantity: 1, amount: 500, active: true }], jobBags: 100, jobWeight: 5500 },
    ],
  },

  // T00016: Shopee — HaleSun FM(Cancelled, vehicle breakdown) + ThaiKee FM(In Progress, replacement)
  {
    id: 'T00016',
    customer: { name: 'Shopee', code: 'CUST-002' },
    mawb: '160-66677788',
    origin: 'Qianhai Free Trade Zone',
    destination: 'Shenzhen Bay Checkpoint',
    bags: 18,
    weight: 950,
    remarks: '',
    createdAt: '16 Mar 2026, 10:00', pickupDate: '2026-03-16', deliveryDate: '2026-03-16',
    jobs: [
      { id: 'T00016-01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'Qianhai Free Trade Zone', date: '2026-03-16 11:00' }, destination: { location: 'Shenzhen Bay Checkpoint', date: '2026-03-16 13:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Cancelled', duration: null, execution: null, cancelReason: 'Vehicle breakdown — reassigned to ThaiKee', activityLog: [log('l100','2026-03-16 10:00','Job created','Ops Admin','Assigned to HaleSun'), log('l101','2026-03-16 10:45','Status → Cancelled','Ops Admin','Vehicle breakdown')], proofDocuments: [], fees: [], replacedByJobId: 'T00016-02', jobBags: 18, jobWeight: 950 },
      { id: 'T00016-02', vendor: { code: 'V-004', name: 'ThaiKee' }, origin: { location: 'Qianhai Free Trade Zone', date: '2026-03-16 12:00' }, destination: { location: 'Shenzhen Bay Checkpoint', date: '2026-03-16 14:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'In Progress', duration: null, execution: '2026-03-16 12:05', replacesJobId: 'T00016-01', activityLog: [log('l102','2026-03-16 10:45','Job created','Ops Admin','Replacement for HaleSun (vehicle breakdown)'), log('l103','2026-03-16 12:05','Status → In Progress')], proofDocuments: [], agreedCost: { currency: 'MYR', amount: 380 }, fees: [{ id: 'F-100-01', name: 'FTL运费 1.5T', currency: 'MYR', rate: 380, unit: 'flat', quantity: 1, amount: 380, active: true }], jobBags: 18, jobWeight: 950 },
    ],
  },

  // T00017: TikTok — SevenSeas CR(Verified) + The Lorry FM(Verified) + Gonda CS(Completed)
  {
    id: 'T00017',
    customer: { name: 'TikTok', code: 'CUST-001' },
    mawb: '160-11122233',
    origin: 'Lantau Terminals',
    destination: 'Hong Kong Airport',
    bags: 65,
    weight: 3600,
    remarks: 'Return shipment from HK',
    createdAt: '16 Mar 2026, 06:00', pickupDate: '2026-03-16', deliveryDate: '2026-03-17',
    jobs: [
      { id: 'T00017-01', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'Lantau Terminals', date: '2026-03-16 07:00' }, destination: { location: 'Lantau Terminals', date: '2026-03-16 09:00' }, service: { code: 'CR', label: 'Cargo Retrieval' }, status: 'Verified', duration: '02:00', execution: '2026-03-16 07:10', activityLog: [log('l110','2026-03-16 06:00','Job created','Ops Admin','Assigned to SevenSeas'), log('l111','2026-03-16 07:10','Status → In Progress'), log('l112','2026-03-16 09:00','Status → Completed'), log('l113','2026-03-16 12:00','Status → Verified','Ops Admin','Proof reviewed')], proofDocuments: [doc('d40','cr-receipt-hk.pdf','application/pdf','2026-03-16 08:55')], agreedCost: { currency: 'MYR', amount: 420 }, fees: [{ id: 'F-110-01', name: '提货登记费', currency: 'MYR', rate: 180, unit: 'flat', quantity: 1, amount: 180, active: true }, { id: 'F-110-02', name: '提货费', currency: 'MYR', rate: 240, unit: 'flat', quantity: 1, amount: 240, active: true }], jobBags: 65, jobWeight: 3600 },
      { id: 'T00017-02', vendor: { code: 'V-005', name: 'The Lorry' }, origin: { location: 'Lantau Terminals', date: '2026-03-16 10:00' }, destination: { location: 'Hong Kong Airport', date: '2026-03-16 12:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Verified', duration: '02:00', execution: '2026-03-16 10:05', activityLog: [log('l114','2026-03-16 06:00','Job created'), log('l115','2026-03-16 10:05','Status → In Progress'), log('l116','2026-03-16 12:00','Status → Completed'), log('l117','2026-03-16 13:00','Status → Verified','Ops Admin','Proof reviewed')], proofDocuments: [doc('d41','POD-lantau-hkairport.jpg','image/jpeg','2026-03-16 11:55')], agreedCost: { currency: 'MYR', amount: 550 }, fees: [{ id: 'F-111-01', name: 'FTL运费 3T', currency: 'MYR', rate: 550, unit: 'flat', quantity: 1, amount: 550, active: true }], jobBags: 65, jobWeight: 3600 },
      { id: 'T00017-03', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Hong Kong Airport', date: '2026-03-16 13:00' }, destination: { location: 'Hong Kong Airport', date: '2026-03-16 16:00' }, service: { code: 'CS', label: 'Cargo Submission' }, status: 'Completed', duration: '03:00', execution: '2026-03-16 13:10', activityLog: [log('l118','2026-03-16 06:00','Job created'), log('l119','2026-03-16 13:10','Status → In Progress'), log('l120','2026-03-16 16:00','Status → Completed')], proofDocuments: [doc('d42','cs-receipt-hk.pdf','application/pdf','2026-03-16 15:50')], agreedCost: { currency: 'MYR', amount: 890 }, fees: [{ id: 'F-112-01', name: '地面操作费', currency: 'MYR', rate: 250, unit: 'flat', quantity: 1, amount: 250, active: true }, { id: 'F-112-02', name: '安检费', currency: 'MYR', rate: 0.20, unit: 'per-kg', quantity: 3600, amount: 720, minCharge: 200, active: true }], jobBags: 65, jobWeight: 3600 },
    ],
  },

  // T00018: AliExpress — ThaiKee FM(In Progress) + ThaiKee EC(Pending) — ThaiKee doing EC
  {
    id: 'T00018',
    customer: { name: 'AliExpress', code: 'CUST-004' },
    mawb: '160-44455566',
    origin: 'Dongguan Factory',
    destination: 'Huanggang Port',
    bags: 22,
    weight: 1300,
    remarks: '',
    createdAt: '17 Mar 2026, 08:00', pickupDate: '2026-03-17', deliveryDate: '2026-03-17',
    jobs: [
      { id: 'T00018-01', vendor: { code: 'V-004', name: 'ThaiKee' }, origin: { location: 'Dongguan Factory', date: '2026-03-17 09:00' }, destination: { location: 'Huanggang Port', date: '2026-03-17 12:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'In Progress', duration: null, execution: '2026-03-17 09:10', activityLog: [log('l130','2026-03-17 08:00','Job created','Ops Admin','Assigned to ThaiKee'), log('l131','2026-03-17 09:10','Status → In Progress')], proofDocuments: [], agreedCost: { currency: 'CNY', amount: 1200 }, fees: [{ id: 'F-130-01', name: 'FTL运费 3T', currency: 'CNY', rate: 1200, unit: 'flat', quantity: 1, amount: 1200, active: true }], jobBags: 22, jobWeight: 1300 },
      { id: 'T00018-02', vendor: { code: 'V-004', name: 'ThaiKee' }, origin: { location: 'Huanggang Port', date: '2026-03-17 13:00' }, destination: { location: 'Huanggang Port', date: '2026-03-17 16:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l132','2026-03-17 08:00','Job created')], proofDocuments: [], fees: [{ id: 'F-131-01', name: '报关费', currency: 'CNY', rate: 280, unit: 'flat', quantity: 1, amount: 280, active: true }], jobBags: 22, jobWeight: 1300 },
    ],
  },

  // T00019: Shein — all verified — The Lorry FM + Gonda EC + SevenSeas CS + SevenSeas OH
  {
    id: 'T00019',
    customer: { name: 'Shein', code: 'CUST-003' },
    mawb: '160-88899900',
    origin: 'Shenzhen Nanshan WH',
    destination: 'SZX Airport',
    bags: 45,
    weight: 2600,
    remarks: 'Shein winter collection',
    createdAt: '10 Mar 2026, 07:00', pickupDate: '2026-03-10', deliveryDate: '2026-03-11',
    jobs: [
      { id: 'T00019-01', vendor: { code: 'V-005', name: 'The Lorry' }, origin: { location: 'Shenzhen Nanshan WH', date: '2026-03-10 08:00' }, destination: { location: 'SZX Airport', date: '2026-03-10 11:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Verified', duration: '03:00', execution: '2026-03-10 08:05', activityLog: [log('l140','2026-03-10 07:00','Job created','Ops Admin','Assigned to The Lorry'), log('l141','2026-03-10 08:05','Status → In Progress'), log('l142','2026-03-10 11:00','Status → Completed'), log('l143','2026-03-10 14:00','Status → Verified','Ops Admin','Proof reviewed')], proofDocuments: [doc('d50','POD-nanshan-szx.jpg','image/jpeg','2026-03-10 10:55')], agreedCost: { currency: 'MYR', amount: 420 }, fees: [{ id: 'F-140-01', name: 'FTL运费 3T', currency: 'MYR', rate: 420, unit: 'flat', quantity: 1, amount: 420, active: true }], jobBags: 45, jobWeight: 2600 },
      { id: 'T00019-02', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'SZX Airport', date: '2026-03-10 12:00' }, destination: { location: 'SZX Airport', date: '2026-03-10 15:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Verified', duration: '03:00', execution: '2026-03-10 12:10', activityLog: [log('l144','2026-03-10 07:00','Job created'), log('l145','2026-03-10 12:10','Status → In Progress'), log('l146','2026-03-10 15:00','Status → Completed'), log('l147','2026-03-10 16:00','Status → Verified','Ops Admin','Proof reviewed')], proofDocuments: [doc('d51','customs-shein-019.pdf','application/pdf','2026-03-10 14:55')], agreedCost: { currency: 'CNY', amount: 380 }, fees: [{ id: 'F-141-01', name: '报关费', currency: 'CNY', rate: 250, unit: 'flat', quantity: 1, amount: 250, active: true }, { id: 'F-141-02', name: '查验费', currency: 'CNY', rate: 130, unit: 'flat', quantity: 1, amount: 130, active: true }], jobBags: 45, jobWeight: 2600 },
      { id: 'T00019-03', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'SZX Airport', date: '2026-03-10 16:00' }, destination: { location: 'SZX Airport', date: '2026-03-10 19:00' }, service: { code: 'CS', label: 'Cargo Submission' }, status: 'Verified', duration: '03:00', execution: '2026-03-10 16:05', activityLog: [log('l148','2026-03-10 07:00','Job created'), log('l149','2026-03-10 16:05','Status → In Progress'), log('l150','2026-03-10 19:00','Status → Completed'), log('l151','2026-03-10 20:00','Status → Verified','Ops Admin','Proof reviewed')], proofDocuments: [doc('d52','cs-receipt-shein.pdf','application/pdf','2026-03-10 18:55')], agreedCost: { currency: 'CNY', amount: 1100 }, fees: [{ id: 'F-142-01', name: '地面操作费', currency: 'CNY', rate: 200, unit: 'flat', quantity: 1, amount: 200, active: true }, { id: 'F-142-02', name: '安检费', currency: 'CNY', rate: 0.25, unit: 'per-kg', quantity: 2600, amount: 650, active: true }, { id: 'F-142-03', name: '货站操作费', currency: 'CNY', rate: 250, unit: 'flat', quantity: 1, amount: 250, active: true }], jobBags: 45, jobWeight: 2600 },
      { id: 'T00019-04', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'SZX Airport', date: '2026-03-10 20:00' }, destination: { location: 'SZX Airport', date: '2026-03-11 02:00' }, service: { code: 'OH', label: 'Origin Handling' }, status: 'Verified', duration: '06:00', execution: '2026-03-10 20:05', activityLog: [log('l152','2026-03-10 07:00','Job created'), log('l153','2026-03-10 20:05','Status → In Progress'), log('l154','2026-03-11 02:00','Status → Completed'), log('l155','2026-03-11 08:00','Status → Verified','Ops Admin','Proof reviewed')], proofDocuments: [doc('d53','oh-receipt-shein.pdf','application/pdf','2026-03-11 01:55')], agreedCost: { currency: 'CNY', amount: 750 }, fees: [{ id: 'F-143-01', name: '打板费', currency: 'CNY', rate: 7, unit: 'per-bag', quantity: 45, amount: 315, active: true }, { id: 'F-143-02', name: '操作费', currency: 'CNY', rate: 280, unit: 'flat', quantity: 1, amount: 280, active: true }, { id: 'F-143-03', name: '标签费', currency: 'CNY', rate: 155, unit: 'flat', quantity: 1, amount: 155, active: true }], jobBags: 45, jobWeight: 2600 },
    ],
  },

  // T00020: Temu — HaleSun FM(Pending) + HaleSun OH(Pending) — HaleSun doing OH
  {
    id: 'T00020',
    customer: { name: 'Temu', code: 'CUST-005' },
    mawb: '160-22233344',
    origin: 'Yantian Port',
    destination: 'SZX Cargo Terminal',
    bags: 35,
    weight: 1900,
    remarks: '',
    createdAt: '17 Mar 2026, 11:00', pickupDate: '2026-03-17', deliveryDate: '2026-03-18',
    jobs: [
      { id: 'T00020-01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'Yantian Port', date: '2026-03-17 12:00' }, destination: { location: 'SZX Cargo Terminal', date: '2026-03-17 16:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l160','2026-03-17 11:00','Job created','Ops Admin','Assigned to HaleSun')], proofDocuments: [], agreedCost: { currency: 'MYR', amount: 520 }, fees: [{ id: 'F-160-01', name: 'FTL运费 3T', currency: 'MYR', rate: 520, unit: 'flat', quantity: 1, amount: 520, active: true }], jobBags: 35, jobWeight: 1900 },
      { id: 'T00020-02', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'SZX Cargo Terminal', date: '2026-03-17 17:00' }, destination: { location: 'SZX Cargo Terminal', date: '2026-03-17 22:00' }, service: { code: 'OH', label: 'Origin Handling' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l161','2026-03-17 11:00','Job created')], proofDocuments: [], fees: [{ id: 'F-161-01', name: '打板费', currency: 'MYR', rate: 5, unit: 'per-bag', quantity: 35, amount: 175, active: true }, { id: 'F-161-02', name: '操作费', currency: 'MYR', rate: 200, unit: 'flat', quantity: 1, amount: 200, active: true }], jobBags: 35, jobWeight: 1900 },
    ],
  },
];

// --- Seed Locations (Phase 2) ---
// Names must exactly match location strings used in seedTrips above.
export const seedLocations: Location[] = [
  // Shenzhen zone — district codes from GB/T 2260
  { id: 'LOC-001', name: 'TikTok WH, Shenzhen', code: 'SZ-TTWH', zone: 'Shenzhen', type: 'warehouse', districtCode: '440306' },  // 宝安区
  { id: 'LOC-002', name: 'Shenzhen Bay Checkpoint', code: 'SZ-BAY', zone: 'Shenzhen', type: 'checkpoint', districtCode: '440305' },  // 南山区
  { id: 'LOC-003', name: 'SZX Airport Cargo Terminal', code: 'SZX-CT', zone: 'Shenzhen', type: 'airport', districtCode: '440306' },  // 宝安区
  { id: 'LOC-004', name: 'Qianhai Free Trade Zone', code: 'SZ-QH', zone: 'Shenzhen', type: 'hub', districtCode: '440305' },  // 南山区
  { id: 'LOC-005', name: 'Huanggang Port', code: 'SZ-HG', zone: 'Shenzhen', type: 'port', districtCode: '440304' },  // 福田区
  { id: 'LOC-006', name: 'Shenzhen Bao An Airport', code: 'SZX-BA', zone: 'Shenzhen', type: 'airport', districtCode: '440306' },  // 宝安区
  { id: 'LOC-007', name: 'Shekou Port', code: 'SZ-SK', zone: 'Shenzhen', type: 'port', districtCode: '440305' },  // 南山区
  { id: 'LOC-008', name: 'Shenzhen Nanshan WH', code: 'SZ-NS', zone: 'Shenzhen', type: 'warehouse', districtCode: '440305' },  // 南山区
  { id: 'LOC-009', name: 'Shenzhen Bay Hub', code: 'SZ-BH', zone: 'Shenzhen', type: 'hub', districtCode: '440305' },  // 南山区
  { id: 'LOC-010', name: 'SZX Cargo Terminal', code: 'SZX-CG', zone: 'Shenzhen', type: 'airport', districtCode: '440306' },  // 宝安区
  { id: 'LOC-011', name: 'Shenzhen Airport', code: 'SZX', zone: 'Shenzhen', type: 'airport', districtCode: '440306' },  // 宝安区
  { id: 'LOC-012', name: 'SZX Airport', code: 'SZX-AP', zone: 'Shenzhen', type: 'airport', districtCode: '440306' },  // 宝安区
  // Guangzhou zone
  { id: 'LOC-013', name: 'Guangzhou Baiyun Airport', code: 'CAN-BY', zone: 'Guangzhou', type: 'airport', districtCode: '440111' },  // 白云区
  { id: 'LOC-014', name: 'Guangzhou Warehouse', code: 'GZ-WH', zone: 'Guangzhou', type: 'warehouse', districtCode: '440112' },  // 黄埔区
  { id: 'LOC-015', name: 'Huangpu Port', code: 'GZ-HP', zone: 'Guangzhou', type: 'port', districtCode: '440112' },  // 黄埔区
  { id: 'LOC-016', name: 'Guangzhou Region Airport', code: 'CAN-RG', zone: 'Guangzhou', type: 'airport', districtCode: '440111' },  // 白云区
  // Hong Kong zone
  { id: 'LOC-017', name: 'Lantau Terminals', code: 'HK-LT', zone: 'Hong Kong', type: 'port', districtCode: '810118' },  // 离岛区
  { id: 'LOC-018', name: 'Hong Kong Airport', code: 'HKG', zone: 'Hong Kong', type: 'airport', districtCode: '810118' },  // 离岛区
  // Dongguan zone — district-free city, uses town codes
  { id: 'LOC-019', name: 'Dongguan Cross-dock', code: 'DG-CD', zone: 'Dongguan', type: 'hub', districtCode: '441900' },  // 东莞市
  { id: 'LOC-020', name: 'Dongguan Factory', code: 'DG-FC', zone: 'Dongguan', type: 'warehouse', districtCode: '441900' },  // 东莞市
  // Yantian zone
  { id: 'LOC-021', name: 'Yantian Port', code: 'YT-PT', zone: 'Yantian', type: 'port', districtCode: '440308' },  // 盐田区
  // Yiwu zone
  { id: 'LOC-022', name: 'Yiwu Warehouse', code: 'YW-WH', zone: 'Yiwu', type: 'warehouse', districtCode: '330782' },  // 义乌市
  // Ningbo zone
  { id: 'LOC-023', name: 'Ningbo Port', code: 'NB-PT', zone: 'Ningbo', type: 'port', districtCode: '330206' },  // 北仑区
];

// --- Bag Packages (external system data) ---

export const seedBagPackages: BagPackage[] = [
  { id: 'BAG-001', mawb: '160-84329871', bagNumber: 'LATD7YPXJN2GQPM0L9', latestLocation: 'SZTATOW', pickupDate: '2026-01-29', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 4.6, assignedTripId: 'DO-001' },
  { id: 'BAG-002', mawb: '160-84329871', bagNumber: 'LATD5HACGA4YZ35TXQ', latestLocation: 'SZTATOW', pickupDate: '2026-01-29', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 1.3, assignedTripId: 'DO-001' },
  { id: 'BAG-003', mawb: '160-84329871', bagNumber: 'BAU6TQF19WBB2ZQP6N', latestLocation: 'SZTATOW', pickupDate: '2026-01-30', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 3.9, assignedTripId: 'DO-001' },
  { id: 'BAG-004', mawb: '160-84329871', bagNumber: 'BAU4TDF4S4GSD6F16S2H', latestLocation: 'SZTATOW', pickupDate: '2026-01-30', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 1.6 },
  { id: 'BAG-005', mawb: '160-84329871', bagNumber: 'BAU6TQE8DTYH3A8KL3', latestLocation: 'SZTATOW', pickupDate: '2026-01-30', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 2.9 },
  { id: 'BAG-006', mawb: '160-33121632', bagNumber: 'BAU6TDFPMG1L2S5GQ70', latestLocation: 'SZTATOW', pickupDate: '2026-02-04', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 5.1 },
  { id: 'BAG-007', mawb: '160-33121632', bagNumber: 'LATD5HA7P2Y1KNQ4RM', latestLocation: 'SZTATOW', pickupDate: '2026-02-04', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 3.2 },
  { id: 'BAG-008', mawb: '160-33121632', bagNumber: 'BAU4TDF9STC0Z5X2VN8', latestLocation: 'SZTATOW', pickupDate: '2026-02-05', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 7.4 },
  { id: 'BAG-009', mawb: '160-33121632', bagNumber: 'BAU6TQF4DKWN63JMHP', latestLocation: 'SZTATOW', pickupDate: '2026-02-05', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 2.8 },
  { id: 'BAG-010', mawb: '160-98765421', bagNumber: 'BAU4TDP7V4HB0CZE1H6H', latestLocation: 'SZTATOW', pickupDate: '2026-03-18', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 5.0 },
  { id: 'BAG-011', mawb: '160-98765421', bagNumber: 'BAU6TDF5S3YC4KN8Q2', latestLocation: 'SZTATOW', pickupDate: '2026-03-18', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 6.1 },
  { id: 'BAG-012', mawb: '160-98765421', bagNumber: 'BAU4TDJQ6D0W7D6R3LMN', latestLocation: 'SZTATOW', pickupDate: '2026-03-18', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 4.6 },
  { id: 'BAG-013', mawb: '160-98765421', bagNumber: 'LATD5P3V4HR0BD5T4W', latestLocation: 'SZTATOW', pickupDate: '2026-03-19', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 3.8 },
  { id: 'BAG-014', mawb: '160-55667788', bagNumber: 'BAU6TQF9N4QA5Z2M8G3S', latestLocation: 'SZTATOW', pickupDate: '2026-03-25', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 4.3 },
  { id: 'BAG-015', mawb: '160-55667788', bagNumber: 'BAU4TDF3HXWP8KL1VR6T', latestLocation: 'SZTATOW', pickupDate: '2026-03-25', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 6.7 },
  { id: 'BAG-016', mawb: '160-55667788', bagNumber: 'LATD7YN2Q5FC9MD4BJ', latestLocation: 'SZTATOW', pickupDate: '2026-03-26', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 2.1 },
  { id: 'BAG-017', mawb: '160-55667788', bagNumber: 'BAU6TQE4PKR7T1S6GN2H', latestLocation: 'SZTATOW', pickupDate: '2026-03-26', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 8.9 },
  { id: 'BAG-018', mawb: '160-55667788', bagNumber: 'BAU4TDJM3NV8Y2W5XQ4C', latestLocation: 'SZTATOW', pickupDate: '2026-03-26', origin: 'SZTATOW', destination: 'Bao An District, Shenzhen', weightKg: 3.5 },
];

// --- Vendor Fee Schedules (from real vendor Excel rate cards) ---

export const seedVendorFees: VendorFee[] = [
  // HaleSun — Origin Handling at Shenzhen Pre-position WH (LOC-003 SZX Airport Cargo Terminal)
  { id: 'VF-001', vendorCode: 'V-001', serviceCode: 'OH', locationId: 'LOC-003', name: '前置仓操作费', nameEn: 'Pre-position WH handling', currency: 'MYR', rate: 0.30, unit: 'per-kg', minCharge: 50, isActive: true, costId: 'OH003' },
  { id: 'VF-002', vendorCode: 'V-001', serviceCode: 'OH', locationId: 'LOC-003', name: '提单费', nameEn: 'AWB fee', currency: 'MYR', rate: 50, unit: 'flat', minCharge: 50, isActive: true, costId: 'OH001' },
  { id: 'VF-003', vendorCode: 'V-001', serviceCode: 'OH', locationId: 'LOC-003', name: '仓储费', nameEn: 'Storage (3 days free)', currency: 'MYR', rate: 0.10, unit: 'per-kg', minCharge: 30, isActive: true },
  { id: 'VF-004', vendorCode: 'V-001', serviceCode: 'OH', locationId: 'LOC-003', name: '装卸费', nameEn: 'Loading/unloading', currency: 'MYR', rate: 0.20, unit: 'per-kg', minCharge: 50, isActive: true, costId: 'OH002' },
  { id: 'VF-005', vendorCode: 'V-001', serviceCode: 'OH', locationId: 'LOC-003', name: '安检费', nameEn: 'Security X-ray', currency: 'MYR', rate: 0.30, unit: 'per-kg', minCharge: 100, isActive: true },
  { id: 'VF-006', vendorCode: 'V-001', serviceCode: 'OH', locationId: 'LOC-003', name: '托盘费', nameEn: 'Pallet (standard wood)', currency: 'MYR', rate: 120, unit: 'flat', isActive: true, costId: 'OH005' },
  { id: 'VF-007', vendorCode: 'V-001', serviceCode: 'OH', locationId: 'LOC-003', name: '包装膜', nameEn: 'Wrapping (≤15kg/ctn)', currency: 'MYR', rate: 6, unit: 'per-bag', minCharge: 20, isActive: true },
  { id: 'VF-008', vendorCode: 'V-001', serviceCode: 'OH', locationId: 'LOC-003', name: '贴标费', nameEn: 'Labeling', currency: 'MYR', rate: 1.50, unit: 'per-bag', minCharge: 30, isActive: true },
  { id: 'VF-009', vendorCode: 'V-001', serviceCode: 'OH', locationId: 'LOC-003', name: '复磅费', nameEn: 'Re-weighing', currency: 'MYR', rate: 0.10, unit: 'per-kg', minCharge: 30, isActive: true },
  { id: 'VF-010', vendorCode: 'V-001', serviceCode: 'OH', locationId: 'LOC-003', name: '分货费', nameEn: 'Sorting', currency: 'MYR', rate: 1.50, unit: 'per-bag', minCharge: 30, isActive: true, costId: 'OH004' },

  // Gonda — Origin Handling at HKG Airport Warehouse (LOC-018 Hong Kong Airport)
  { id: 'VF-020', vendorCode: 'V-003', serviceCode: 'OH', locationId: 'LOC-018', name: '装板服务', nameEn: 'ULD build-up (all-in)', currency: 'MYR', rate: 1.95, unit: 'per-kg', minCharge: 200, isActive: true, costId: 'OH005' },
  { id: 'VF-021', vendorCode: 'V-003', serviceCode: 'OH', locationId: 'LOC-018', name: '提单打单费', nameEn: 'AWB processing', currency: 'MYR', rate: 150, unit: 'flat', isActive: true, costId: 'OH001' },
  { id: 'VF-022', vendorCode: 'V-003', serviceCode: 'OH', locationId: 'LOC-018', name: '登记费', nameEn: 'Registration', currency: 'MYR', rate: 350, unit: 'flat', isActive: true },
  { id: 'VF-023', vendorCode: 'V-003', serviceCode: 'OH', locationId: 'LOC-018', name: '停车费', nameEn: 'Parking', currency: 'MYR', rate: 150, unit: 'flat', isActive: true },
  { id: 'VF-024', vendorCode: 'V-003', serviceCode: 'OH', locationId: 'LOC-018', name: 'X-Ray', nameEn: 'X-Ray screening', currency: 'MYR', rate: 0.80, unit: 'per-kg', minCharge: 100, isActive: true },
  { id: 'VF-025', vendorCode: 'V-003', serviceCode: 'OH', locationId: 'LOC-018', name: '香港仓到货运站运输费', nameEn: 'WH to terminal transport', currency: 'MYR', rate: 0.60, unit: 'per-kg', minCharge: 500, isActive: true },

  // Gonda — Export Customs at Shenzhen Bay Checkpoint (LOC-002)
  { id: 'VF-030', vendorCode: 'V-003', serviceCode: 'EC', locationId: 'LOC-002', name: '报关费', nameEn: 'Customs declaration', currency: 'MYR', rate: 120, unit: 'flat', isActive: true, costId: 'EC001' },
  { id: 'VF-031', vendorCode: 'V-003', serviceCode: 'EC', locationId: 'LOC-002', name: '查验费', nameEn: 'Customs inspection', currency: 'MYR', rate: 45, unit: 'flat', isActive: true, costId: 'EC002' },
  { id: 'VF-032', vendorCode: 'V-003', serviceCode: 'EC', locationId: 'LOC-002', name: '报关服务费', nameEn: 'Customs service', currency: 'MYR', rate: 25, unit: 'flat', isActive: true, costId: 'EC003' },

  // Gonda — Cargo Submission at SZX Airport Cargo Terminal (LOC-003)
  { id: 'VF-040', vendorCode: 'V-003', serviceCode: 'CS', locationId: 'LOC-003', name: '地面操作费', nameEn: 'Ground handling', currency: 'MYR', rate: 80, unit: 'flat', isActive: true, costId: 'CS006' },
  { id: 'VF-041', vendorCode: 'V-003', serviceCode: 'CS', locationId: 'LOC-003', name: '安检费', nameEn: 'Security X-ray screening', currency: 'MYR', rate: 0.30, unit: 'per-kg', minCharge: 100, isActive: true, costId: 'CS004' },
  { id: 'VF-042', vendorCode: 'V-003', serviceCode: 'CS', locationId: 'LOC-003', name: '货站操作费', nameEn: 'Terminal handling', currency: 'MYR', rate: 0.25, unit: 'per-kg', minCharge: 80, isActive: true, costId: 'CS005' },

  // HaleSun — Export Customs at Huanggang Port (LOC-005)
  { id: 'VF-050', vendorCode: 'V-001', serviceCode: 'EC', locationId: 'LOC-005', name: '报关费', nameEn: 'Customs declaration', currency: 'MYR', rate: 100, unit: 'flat', isActive: true, costId: 'EC001' },
  { id: 'VF-051', vendorCode: 'V-001', serviceCode: 'EC', locationId: 'LOC-005', name: '查验费', nameEn: 'Customs inspection', currency: 'MYR', rate: 50, unit: 'flat', isActive: true, costId: 'EC002' },
  { id: 'VF-052', vendorCode: 'V-001', serviceCode: 'EC', locationId: 'LOC-005', name: '报关服务费', nameEn: 'Customs service', currency: 'MYR', rate: 30, unit: 'flat', isActive: true, costId: 'EC003' },

  // HaleSun — Cargo Submission at SZX Airport Cargo Terminal (LOC-003)
  { id: 'VF-055', vendorCode: 'V-001', serviceCode: 'CS', locationId: 'LOC-003', name: '地面操作费', nameEn: 'Ground handling', currency: 'MYR', rate: 75, unit: 'flat', isActive: true, costId: 'CS006' },
  { id: 'VF-056', vendorCode: 'V-001', serviceCode: 'CS', locationId: 'LOC-003', name: '安检费', nameEn: 'Security screening', currency: 'MYR', rate: 0.25, unit: 'per-kg', minCharge: 80, isActive: true, costId: 'CS004' },
  { id: 'VF-057', vendorCode: 'V-001', serviceCode: 'CS', locationId: 'LOC-003', name: '货站操作费', nameEn: 'Terminal handling', currency: 'MYR', rate: 0.20, unit: 'per-kg', minCharge: 60, isActive: true, costId: 'CS005' },
  { id: 'VF-058', vendorCode: 'V-001', serviceCode: 'CS', locationId: 'LOC-003', name: 'RA代理费', nameEn: 'RA agent', currency: 'MYR', rate: 50, unit: 'flat', isActive: true, costId: 'CS003' },

  // Gonda — Cargo Retrieval at Yantian Port (LOC-021)
  { id: 'VF-060', vendorCode: 'V-003', serviceCode: 'CR', locationId: 'LOC-021', name: '登记费', nameEn: 'Registration', currency: 'MYR', rate: 200, unit: 'flat', isActive: true, costId: 'CR001' },
  { id: 'VF-061', vendorCode: 'V-003', serviceCode: 'CR', locationId: 'LOC-021', name: '提货费', nameEn: 'Cargo pick-up', currency: 'MYR', rate: 8, unit: 'per-bag', minCharge: 100, isActive: true, costId: 'CR002' },
  { id: 'VF-062', vendorCode: 'V-003', serviceCode: 'CR', locationId: 'LOC-021', name: '装车费', nameEn: 'Loading to truck', currency: 'MYR', rate: 0.15, unit: 'per-kg', minCharge: 50, isActive: true },

  // HaleSun — Cargo Retrieval at Dongguan Cross-dock (LOC-019)
  { id: 'VF-065', vendorCode: 'V-001', serviceCode: 'CR', locationId: 'LOC-019', name: '提货登记费', nameEn: 'Pick-up registration', currency: 'MYR', rate: 150, unit: 'flat', isActive: true, costId: 'CR001' },
  { id: 'VF-066', vendorCode: 'V-001', serviceCode: 'CR', locationId: 'LOC-019', name: '提货费', nameEn: 'Cargo pick-up', currency: 'MYR', rate: 6, unit: 'per-bag', minCharge: 80, isActive: true, costId: 'CR002' },

  // Gonda — Export Customs at Huanggang Port (LOC-005)
  { id: 'VF-070', vendorCode: 'V-003', serviceCode: 'EC', locationId: 'LOC-005', name: '报关费', nameEn: 'Customs declaration', currency: 'MYR', rate: 130, unit: 'flat', isActive: true, costId: 'EC001' },
  { id: 'VF-071', vendorCode: 'V-003', serviceCode: 'EC', locationId: 'LOC-005', name: '查验费', nameEn: 'Customs inspection', currency: 'MYR', rate: 50, unit: 'flat', isActive: true, costId: 'EC002' },
  { id: 'VF-072', vendorCode: 'V-003', serviceCode: 'EC', locationId: 'LOC-005', name: '报关服务费', nameEn: 'Customs service', currency: 'MYR', rate: 30, unit: 'flat', isActive: true, costId: 'EC003' },
  { id: 'VF-073', vendorCode: 'V-003', serviceCode: 'EC', locationId: 'LOC-005', name: '换单费', nameEn: 'Document exchange', currency: 'MYR', rate: 80, unit: 'flat', isActive: true },
];

export const seedVendorFeeLogs: VendorFeeLog[] = [
  { id: 'VFL-001', timestamp: '2026-01-01 11:00', action: 'CSV uploaded', user: 'Ops Admin', details: 'HaleSun OH at SZX — 10 fees loaded', filename: 'HaleSun_OH_SZX.csv' },
  { id: 'VFL-002', timestamp: '2026-01-01 11:05', action: 'CSV uploaded', user: 'Ops Admin', details: 'Gonda OH at HKG — 6 fees loaded', filename: 'Gonda_OH_HKG.csv' },
  { id: 'VFL-003', timestamp: '2026-01-01 11:10', action: 'CSV uploaded', user: 'Ops Admin', details: 'Gonda EC at SZ Bay — 3 fees loaded', filename: 'Gonda_EC_SZBAY.csv' },
  { id: 'VFL-004', timestamp: '2026-01-01 11:15', action: 'CSV uploaded', user: 'Ops Admin', details: 'Gonda CS at SZX — 3 fees loaded', filename: 'Gonda_CS_SZX.csv' },
  { id: 'VFL-005', timestamp: '2026-01-01 11:20', action: 'CSV uploaded', user: 'Ops Admin', details: 'HaleSun EC at Huanggang — 3 fees loaded', filename: 'HaleSun_EC_HG.csv' },
  { id: 'VFL-006', timestamp: '2026-01-01 11:25', action: 'CSV uploaded', user: 'Ops Admin', details: 'HaleSun CS at SZX — 4 fees loaded', filename: 'HaleSun_CS_SZX.csv' },
  { id: 'VFL-007', timestamp: '2026-01-01 11:30', action: 'CSV uploaded', user: 'Ops Admin', details: 'Gonda CR at Yantian — 3 fees loaded', filename: 'Gonda_CR_YT.csv' },
  { id: 'VFL-008', timestamp: '2026-01-01 11:35', action: 'CSV uploaded', user: 'Ops Admin', details: 'HaleSun CR at Dongguan — 2 fees loaded', filename: 'HaleSun_CR_DG.csv' },
  { id: 'VFL-009', timestamp: '2026-01-01 11:40', action: 'CSV uploaded', user: 'Ops Admin', details: 'Gonda EC at Huanggang — 4 fees loaded', filename: 'Gonda_EC_HG.csv' },
];

// --- Seed FTL Rates (from real vendor Excel rate cards) ---
export const seedFtlRates: FtlRate[] = [
  // HaleSun → Shenzhen Hub (domestic, RMB)
  { id: 'FTL-001', vendorCode: 'V-001', originCity: '深圳', originDistrict: '桂园街道', originCode: '440303', destCity: '深圳', destDistrict: '宝安区', destCode: '440306', currency: 'MYR', rates: { '1.5T': 310, '3T': 360, '5T': 530, '8T': 630, '10T': 780, '40HQ': 1330, '45HQ': 1430 }, effectiveFrom: '2026-01-01', isActive: true },
  { id: 'FTL-002', vendorCode: 'V-001', originCity: '深圳', originDistrict: '福田街道', originCode: '440304', destCity: '深圳', destDistrict: '宝安区', destCode: '440306', currency: 'MYR', rates: { '1.5T': 260, '3T': 310, '5T': 430, '8T': 630, '10T': 680, '40HQ': 1280, '45HQ': 1380 }, effectiveFrom: '2026-01-01', isActive: true },
  { id: 'FTL-003', vendorCode: 'V-001', originCity: '深圳', originDistrict: '南山街道', originCode: '440305', destCity: '深圳', destDistrict: '宝安区', destCode: '440306', currency: 'MYR', rates: { '1.5T': 210, '3T': 310, '5T': 430, '8T': 530, '10T': 680, '40HQ': 1230, '45HQ': 1330 }, effectiveFrom: '2026-01-01', isActive: true },
  { id: 'FTL-004', vendorCode: 'V-001', originCity: '深圳', originDistrict: '福永街道', originCode: '440306', destCity: '深圳', destDistrict: '宝安区', destCode: '440306', currency: 'MYR', rates: { '1.5T': 160, '3T': 210, '5T': 280, '8T': 430, '10T': 530, '40HQ': 1080, '45HQ': 1230 }, effectiveFrom: '2026-01-01', isActive: true },
  { id: 'FTL-005', vendorCode: 'V-001', originCity: '深圳', originDistrict: '龙华街道', originCode: '440309', destCity: '深圳', destDistrict: '宝安区', destCode: '440306', currency: 'MYR', rates: { '1.5T': 260, '3T': 310, '5T': 480, '8T': 630, '10T': 730, '40HQ': 1280, '45HQ': 1380 }, effectiveFrom: '2026-01-01', isActive: true },
  { id: 'FTL-006', vendorCode: 'V-001', originCity: '深圳', originDistrict: '坪山街道', originCode: '440310', destCity: '深圳', destDistrict: '宝安区', destCode: '440306', currency: 'MYR', rates: { '1.5T': 360, '3T': 460, '5T': 580, '8T': 730, '10T': 830, '40HQ': 1330, '45HQ': 1530 }, effectiveFrom: '2026-01-01', isActive: true },
  // HaleSun — Dongguan origins
  { id: 'FTL-007', vendorCode: 'V-001', originCity: '东莞', originDistrict: '洪梅镇', originCode: '441900125', destCity: '深圳', destDistrict: '宝安区', destCode: '440306', currency: 'MYR', rates: { '1.5T': 410, '3T': 510, '5T': 650, '8T': 780, '10T': 880, '40HQ': 1580, '45HQ': 1680 }, effectiveFrom: '2026-01-01', isActive: true },
  { id: 'FTL-008', vendorCode: 'V-001', originCity: '东莞', originDistrict: '长安镇', originCode: '441900119', destCity: '深圳', destDistrict: '宝安区', destCode: '440306', currency: 'MYR', rates: { '1.5T': 310, '3T': 360, '5T': 550, '8T': 630, '10T': 730, '40HQ': 1430, '45HQ': 1530 }, effectiveFrom: '2026-01-01', isActive: true },
  { id: 'FTL-009', vendorCode: 'V-001', originCity: '东莞', originDistrict: '虎门镇', originCode: '441900121', destCity: '深圳', destDistrict: '宝安区', destCode: '440306', currency: 'MYR', rates: { '1.5T': 360, '3T': 410, '5T': 550, '8T': 680, '10T': 780, '40HQ': 1430, '45HQ': 1580 }, effectiveFrom: '2026-01-01', isActive: true },
  { id: 'FTL-010', vendorCode: 'V-001', originCity: '东莞', originDistrict: '塘厦镇', originCode: '441900116', destCity: '深圳', destDistrict: '宝安区', destCode: '440306', currency: 'MYR', rates: { '1.5T': 360, '3T': 410, '5T': 600, '8T': 680, '10T': 830, '40HQ': 1480, '45HQ': 1630 }, effectiveFrom: '2026-01-01', isActive: true },
  // Gonda → HKG Airport (cross-border, HKD)
  { id: 'FTL-011', vendorCode: 'V-003', originCity: '广州', originDistrict: '从化区', originCode: '440117', destCity: '香港', destDistrict: '离岛区', destCode: '810118', currency: 'MYR', rates: { '3T': 2400, '5T': 2600, '8T': 2800, '10T': 3000, '12T': 3200, '40HQ': 4350 }, effectiveFrom: '2026-01-01', isActive: true },
  { id: 'FTL-012', vendorCode: 'V-003', originCity: '广州', originDistrict: '花都区', originCode: '440114', destCity: '香港', destDistrict: '离岛区', destCode: '810118', currency: 'MYR', rates: { '3T': 2400, '5T': 2600, '8T': 2800, '10T': 3000, '12T': 3200, '40HQ': 4350 }, effectiveFrom: '2026-01-01', isActive: true },
  { id: 'FTL-013', vendorCode: 'V-003', originCity: '广州', originDistrict: '番禺区', originCode: '440113', destCity: '香港', destDistrict: '离岛区', destCode: '810118', currency: 'MYR', rates: { '3T': 2300, '5T': 2500, '8T': 2700, '10T': 2900, '12T': 3100, '40HQ': 4050 }, effectiveFrom: '2026-01-01', isActive: true },
  { id: 'FTL-014', vendorCode: 'V-003', originCity: '东莞', originDistrict: '长安镇', originCode: '441900119', destCity: '香港', destDistrict: '离岛区', destCode: '810118', currency: 'MYR', rates: { '3T': 1800, '5T': 2350, '8T': 2550, '10T': 2650, '12T': 2850, '40HQ': 4000 }, effectiveFrom: '2026-01-01', isActive: true },
  { id: 'FTL-015', vendorCode: 'V-003', originCity: '东莞', originDistrict: '凤岗镇', originCode: '441900117', destCity: '香港', destDistrict: '离岛区', destCode: '810118', currency: 'MYR', rates: { '3T': 1700, '5T': 2250, '8T': 2450, '10T': 2600, '12T': 2800, '40HQ': 3800 }, effectiveFrom: '2026-01-01', isActive: true },
];

export const seedFtlLogs: FtlRateLog[] = [
  { id: 'FL-001', timestamp: '2026-01-01 11:00', action: 'CSV uploaded', user: 'Ops Admin', details: '10 routes, 10 new (initial load)', filename: 'HaleSun_2026.csv' },
  { id: 'FL-002', timestamp: '2026-01-01 11:05', action: 'CSV uploaded', user: 'Ops Admin', details: '5 routes, 5 new (initial load)', filename: 'Gonda_HKG_2026.csv' },
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
