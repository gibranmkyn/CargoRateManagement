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
  // DO-001: TikTok Shenzhen → SZX Airport (completed)
  {
    id: 'DO-20260308-001',
    customer: { name: 'TikTok', code: 'CUST-001' },
    mawb: '160-84329871',
    bags: 24,
    weight: 1240,
    remarks: 'Fragile cargo',
    createdAt: '08 Mar 2026, 09:00',
    jobs: [
      { id: 'DO-20260308-001-J01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'TikTok WH, Shenzhen', date: '2026-03-08 10:00' }, destination: { location: 'Shenzhen Bay Checkpoint', date: '2026-03-08 14:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Completed', duration: '04:00', execution: '2026-03-08 10:05', activityLog: [log('l1','2026-03-08 09:00','Job created','Ops Admin','Assigned to HaleSun'), log('l2','2026-03-08 10:05','Status → In Progress'), log('l3','2026-03-08 14:00','Status → Completed')], proofDocuments: [doc('d1','POD-tiktok-szbay.jpg','image/jpeg','2026-03-08 13:55')] },
      { id: 'DO-20260308-001-J02', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Shenzhen Bay Checkpoint', date: '2026-03-08 15:00' }, destination: { location: 'SZX Airport Cargo Terminal', date: '2026-03-08 18:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Completed', duration: '03:00', execution: '2026-03-08 15:10', activityLog: [log('l4','2026-03-08 09:00','Job created'), log('l5','2026-03-08 18:00','Status → Completed')], proofDocuments: [doc('d2','customs-clearance-001.pdf','application/pdf','2026-03-08 17:50')] },
      { id: 'DO-20260308-001-J03', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'SZX Airport Cargo Terminal', date: '2026-03-08 19:00' }, destination: { location: 'SZX Airport Cargo Terminal', date: '2026-03-08 21:00' }, service: { code: 'CS', label: 'Cargo Submission' }, status: 'Completed', duration: '02:00', execution: '2026-03-08 19:05', activityLog: [log('l6','2026-03-08 09:00','Job created'), log('l7','2026-03-08 21:00','Status → Completed')], proofDocuments: [doc('d3','xray-submission-receipt.pdf','application/pdf','2026-03-08 20:55')] },
    ],
  },
  // DO-002: Shopee Yantian → KUL (in progress)
  {
    id: 'DO-20260309-002',
    customer: { name: 'Shopee', code: 'CUST-002' },
    mawb: '160-33121632',
    bags: 16,
    weight: 890,
    remarks: '',
    createdAt: '09 Mar 2026, 08:30',
    jobs: [
      { id: 'DO-20260309-002-J01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'Yantian Port', date: '2026-03-09 10:00' }, destination: { location: 'Dongguan Cross-dock', date: '2026-03-09 14:00' }, service: { code: 'CR', label: 'Cargo Retrieval' }, status: 'Completed', duration: '04:00', execution: '2026-03-09 10:10', activityLog: [log('l1','2026-03-09 08:30','Job created'), log('l2','2026-03-09 14:00','Status → Completed')], proofDocuments: [doc('d1','retrieval-yantian.jpg','image/jpeg','2026-03-09 13:50')] },
      { id: 'DO-20260309-002-J02', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'Dongguan Cross-dock', date: '2026-03-09 15:00' }, destination: { location: 'Shenzhen Airport', date: '2026-03-09 19:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'In Progress', duration: null, execution: '2026-03-09 15:05', activityLog: [log('l3','2026-03-09 08:30','Job created'), log('l4','2026-03-09 15:05','Status → In Progress')], proofDocuments: [] },
      { id: 'DO-20260309-002-J03', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'Shenzhen Airport', date: '2026-03-09 20:00' }, destination: { location: 'Shenzhen Airport', date: '2026-03-09 23:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l5','2026-03-09 08:30','Job created')], proofDocuments: [] },
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
      { id: 'DO-20260310-003-J01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'Qianhai Free Trade Zone', date: '2026-03-10 08:00' }, destination: { location: 'Huanggang Port', date: '2026-03-10 12:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Rejected', duration: null, execution: '2026-03-10 08:10', rejectionReason: 'Vehicle breakdown', activityLog: [log('l1','2026-03-10 07:00','Job created'), log('l2','2026-03-10 09:30','Status → Rejected','Ops Admin','Vehicle breakdown')], proofDocuments: [] },
      { id: 'DO-20260310-003-J02', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Huanggang Port', date: '2026-03-10 13:00' }, destination: { location: 'Huanggang Port', date: '2026-03-10 16:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l3','2026-03-10 07:00','Job created')], proofDocuments: [] },
    ],
  },
  // DO-004: Shein Guangzhou → Airport
  {
    id: 'DO-20260310-004',
    customer: { name: 'Shein', code: 'CUST-003' },
    mawb: '160-11456287',
    bags: 10,
    weight: 520,
    remarks: 'Temperature sensitive',
    createdAt: '10 Mar 2026, 10:00',
    jobs: [
      { id: 'DO-20260310-004-J01', vendor: { code: 'V-004', name: 'ThaiKee' }, origin: { location: 'Guangzhou Baiyun Airport', date: '2026-03-10 14:00' }, destination: { location: 'Guangzhou Baiyun Airport', date: '2026-03-10 17:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Completed', duration: '03:00', execution: '2026-03-10 14:05', activityLog: [log('l1','2026-03-10 10:00','Job created'), log('l2','2026-03-10 17:00','Status → Completed')], proofDocuments: [doc('d1','gz-trucking-receipt.pdf','application/pdf','2026-03-10 16:50')] },
      { id: 'DO-20260310-004-J02', vendor: { code: 'V-004', name: 'ThaiKee' }, origin: { location: 'Guangzhou Baiyun Airport', date: '2026-03-10 18:00' }, destination: { location: 'Guangzhou Region Airport', date: '2026-03-10 21:00' }, service: { code: 'OH', label: 'Origin Handling' }, status: 'In Progress', duration: null, execution: '2026-03-10 18:10', activityLog: [log('l3','2026-03-10 10:00','Job created'), log('l4','2026-03-10 18:10','Status → In Progress')], proofDocuments: [] },
    ],
  },
  // DO-005: Temu SZX → Lantau
  {
    id: 'DO-20260311-005',
    customer: { name: 'Temu', code: 'CUST-005' },
    mawb: '160-77654321',
    bags: 48,
    weight: 2450,
    remarks: 'Export commitment',
    createdAt: '11 Mar 2026, 06:00',
    jobs: [
      { id: 'DO-20260311-005-J01', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'Shenzhen Bao An Airport', date: '2026-03-11 08:00' }, destination: { location: 'Shenzhen Bao An Airport', date: '2026-03-11 10:00' }, service: { code: 'CR', label: 'Cargo Retrieval' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l1','2026-03-11 06:00','Job created')], proofDocuments: [] },
      { id: 'DO-20260311-005-J02', vendor: { code: 'V-005', name: 'The Lorry' }, origin: { location: 'Shenzhen Bao An Airport', date: '2026-03-11 11:00' }, destination: { location: 'Shekou Port', date: '2026-03-11 15:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l2','2026-03-11 06:00','Job created')], proofDocuments: [] },
      { id: 'DO-20260311-005-J03', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Shekou Port', date: '2026-03-11 16:00' }, destination: { location: 'Lantau Terminals', date: '2026-03-11 20:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l3','2026-03-11 06:00','Job created')], proofDocuments: [] },
      { id: 'DO-20260311-005-J04', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Lantau Terminals', date: '2026-03-11 21:00' }, destination: { location: 'Lantau Terminals', date: '2026-03-11 23:00' }, service: { code: 'CS', label: 'Cargo Submission' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l4','2026-03-11 06:00','Job created')], proofDocuments: [] },
    ],
  },
  // DO-006: AliExpress Yiwu → Ningbo
  {
    id: 'DO-20260311-006',
    customer: { name: 'AliExpress', code: 'CUST-004' },
    mawb: '160-22334455',
    bags: 60,
    weight: 3200,
    remarks: '',
    createdAt: '11 Mar 2026, 09:00',
    jobs: [
      { id: 'DO-20260311-006-J01', vendor: { code: 'V-005', name: 'The Lorry' }, origin: { location: 'Yiwu Warehouse', date: '2026-03-11 10:00' }, destination: { location: 'Ningbo Port', date: '2026-03-11 16:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'In Progress', duration: null, execution: '2026-03-11 10:15', activityLog: [log('l1','2026-03-11 09:00','Job created'), log('l2','2026-03-11 10:15','Status → In Progress')], proofDocuments: [] },
      { id: 'DO-20260311-006-J02', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'Ningbo Port', date: '2026-03-11 17:00' }, destination: { location: 'Ningbo Port', date: '2026-03-11 20:00' }, service: { code: 'OH', label: 'Origin Handling' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l3','2026-03-11 09:00','Job created')], proofDocuments: [] },
    ],
  },
  // DO-007: Shopee Guangzhou → HK
  {
    id: 'DO-20260312-007',
    customer: { name: 'Shopee', code: 'CUST-002' },
    mawb: '160-99887766',
    bags: 12,
    weight: 680,
    remarks: 'Oversized items',
    createdAt: '12 Mar 2026, 07:30',
    jobs: [
      { id: 'DO-20260312-007-J01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'Guangzhou Warehouse', date: '2026-03-12 09:00' }, destination: { location: 'Huangpu Port', date: '2026-03-12 13:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Completed', duration: '04:00', execution: '2026-03-12 09:10', activityLog: [log('l1','2026-03-12 07:30','Job created'), log('l2','2026-03-12 13:00','Status → Completed')], proofDocuments: [doc('d1','gz-huangpu-pod.jpg','image/jpeg','2026-03-12 12:55')] },
      { id: 'DO-20260312-007-J02', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'Huangpu Port', date: '2026-03-12 14:00' }, destination: { location: 'Hong Kong Airport', date: '2026-03-12 18:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Completed', duration: '04:00', execution: '2026-03-12 14:05', activityLog: [log('l3','2026-03-12 07:30','Job created'), log('l4','2026-03-12 18:00','Status → Completed')], proofDocuments: [doc('d2','hk-customs-clearance.pdf','application/pdf','2026-03-12 17:50')] },
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
      { id: 'DO-20260312-008-J01', vendor: { code: 'V-001', name: 'HaleSun' }, origin: { location: 'TikTok WH, Shenzhen', date: '2026-03-12 14:00' }, destination: { location: 'SZX Cargo Terminal', date: '2026-03-12 18:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l1','2026-03-12 11:00','Job created')], proofDocuments: [] },
      { id: 'DO-20260312-008-J02', vendor: { code: 'V-003', name: 'Gonda' }, origin: { location: 'SZX Cargo Terminal', date: '2026-03-12 19:00' }, destination: { location: 'SZX Cargo Terminal', date: '2026-03-12 22:00' }, service: { code: 'CS', label: 'Cargo Submission' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l2','2026-03-12 11:00','Job created')], proofDocuments: [] },
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
      { id: 'DO-20260313-009-J01', vendor: { code: 'V-004', name: 'ThaiKee' }, origin: { location: 'Dongguan Factory', date: '2026-03-13 08:00' }, destination: { location: 'Shenzhen Bay Hub', date: '2026-03-13 12:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'Rejected', duration: null, execution: '2026-03-13 08:10', rejectionReason: 'Capacity full', activityLog: [log('l1','2026-03-13 06:30','Job created'), log('l2','2026-03-13 10:00','Status → Rejected','Ops Admin','Capacity full')], proofDocuments: [] },
      { id: 'DO-20260313-009-J02', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'Shenzhen Bay Hub', date: '2026-03-13 13:00' }, destination: { location: 'SZX Airport', date: '2026-03-13 16:00' }, service: { code: 'EC', label: 'Export Custom Clearance' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l3','2026-03-13 06:30','Job created')], proofDocuments: [] },
      { id: 'DO-20260313-009-J03', vendor: { code: 'V-002', name: 'SevenSeas' }, origin: { location: 'SZX Airport', date: '2026-03-13 17:00' }, destination: { location: 'SZX Airport', date: '2026-03-13 19:00' }, service: { code: 'CS', label: 'Cargo Submission' }, status: 'Pending', duration: null, execution: null, activityLog: [log('l4','2026-03-13 06:30','Job created')], proofDocuments: [] },
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
      { id: 'DO-20260313-010-J01', vendor: { code: 'V-005', name: 'The Lorry' }, origin: { location: 'Shenzhen Nanshan WH', date: '2026-03-13 10:00' }, destination: { location: 'Shekou Port', date: '2026-03-13 13:00' }, service: { code: 'FM', label: 'Trucking' }, status: 'In Progress', duration: null, execution: '2026-03-13 10:05', activityLog: [log('l1','2026-03-13 09:00','Job created'), log('l2','2026-03-13 10:05','Status → In Progress')], proofDocuments: [] },
    ],
  },
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
