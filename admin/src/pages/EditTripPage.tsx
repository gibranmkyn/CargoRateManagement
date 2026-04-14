import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft, Package, Lock } from 'lucide-react';
import { customers, vendors, serviceTypes, formatCurrency, TRUCK_TYPES, seedBagPackages, seedFtlRates, seedVendorFees } from '@shared/mockData';
import type { Job, ServiceType, Currency, FeeLineItem, TruckType } from '@shared/mockData';
import { useTrips, generateJobId } from '@shared/TripContext';
import { useLocations } from '../context/LocationContext';
import { useToast } from '@shared/Toast';
import LocationDropdown from '../components/shared/LocationDropdown';
import SelectBagsModal from '../components/trips/SelectBagsModal';
import { ALL_CITIES, ALL_DISTRICTS } from '../data/chinaRegions';

interface JobDraft {
  key: string;
  jobId?: string;        // undefined = new job
  isLocked: boolean;     // Completed/Verified/Cancelled = true
  existingJob?: Job;     // full job for locked display
  serviceCode: string;
  vendorCode: string;
  originDistrictCode: string;
  destDistrictCode: string;
  truckType: TruckType | '';
  locationId: string;
}

const LOCKED_STATUSES = new Set(['Completed', 'Verified', 'Cancelled']);

function districtCodeFromLabel(label: string): string {
  for (const city of ALL_CITIES) {
    for (const d of city.districts) {
      if (`${d.name}, ${city.name}` === label || d.name === label) return d.code;
    }
  }
  return '';
}

function truckTypeFromFees(job: Job): TruckType | '' {
  const fee = job.fees.find((f) => f.name.startsWith('FTL '));
  return fee ? (fee.name.slice(4) as TruckType) : '';
}

function getStatusColors(status: string): { bg: string; border: string; color: string } {
  switch (status) {
    case 'Pending': return { bg: '#f9fafb', border: '#e5e7eb', color: '#9ca3af' };
    case 'In Progress': return { bg: 'rgba(21,44,255,0.04)', border: 'rgba(21,44,255,0.15)', color: '#152CFF' };
    case 'Completed': return { bg: '#fefce8', border: '#fde68a', color: '#a16207' };
    case 'Verified': return { bg: '#f0fdf4', border: '#a7f3d0', color: '#059669' };
    case 'Cancelled': return { bg: '#fef2f2', border: '#fecaca', color: '#dc2626' };
    default: return { bg: '#f9fafb', border: '#e5e7eb', color: '#9ca3af' };
  }
}

const SVC_COLOR = '#152CFF';

export default function EditTripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { trips, updateTrip, addJob, updateJob, deleteJob } = useTrips();
  const { getLocationById, getLocationByName } = useLocations();
  const toast = useToast();

  const trip = trips.find((t) => t.id === tripId);

  // Pre-fill trip fields from existing trip
  const originLoc = useMemo(() => trip ? getLocationByName(trip.origin) : undefined, [trip, getLocationByName]);
  const destLoc = useMemo(() => trip ? getLocationByName(trip.destination) : undefined, [trip, getLocationByName]);

  const [customerCode, setCustomerCode] = useState(trip?.customer.code ?? '');
  const [mawb, setMawb] = useState(trip?.mawb ?? '');
  const [originLocationId, setOriginLocationId] = useState(originLoc?.id ?? '');
  const [destinationLocationId, setDestinationLocationId] = useState(destLoc?.id ?? '');
  const [bags, setBags] = useState(String(trip?.bags ?? ''));
  const [weight, setWeight] = useState(String(trip?.weight ?? ''));
  const [remarks, setRemarks] = useState(trip?.remarks ?? '');
  const [pickupDate, setPickupDate] = useState(trip?.pickupDate ?? '');
  const [deliveryDate, setDeliveryDate] = useState(trip?.deliveryDate ?? '');
  const [selectedBagIds, setSelectedBagIds] = useState<string[]>(trip?.bagPackageIds ?? []);
  const [showBagModal, setShowBagModal] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [defaultVendor, setDefaultVendor] = useState('');

  // Build initial job drafts from existing trip jobs
  const initialJobs = useMemo((): JobDraft[] => {
    if (!trip) return [];
    return trip.jobs.map((job) => {
      const isLocked = LOCKED_STATUSES.has(job.status);
      const isFM = job.service.code === 'FM';
      return {
        key: job.id,
        jobId: job.id,
        isLocked,
        existingJob: job,
        serviceCode: job.service.code,
        vendorCode: job.vendor.code,
        originDistrictCode: isFM ? districtCodeFromLabel(job.origin.location) : '',
        destDistrictCode: isFM ? districtCodeFromLabel(job.destination.location) : '',
        truckType: isFM ? truckTypeFromFees(job) : '',
        locationId: !isFM ? (getLocationByName(job.origin.location)?.id ?? '') : '',
      };
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [jobs, setJobs] = useState<JobDraft[]>(initialJobs);

  const selectedBags = useMemo(() =>
    seedBagPackages.filter((b) => selectedBagIds.includes(b.id)),
    [selectedBagIds]
  );

  function handleBagsConfirm(bagIds: string[]) {
    setSelectedBagIds(bagIds);
    if (bagIds.length > 0) {
      const bags_ = seedBagPackages.filter((b) => bagIds.includes(b.id));
      setBags(String(bags_.length));
      setWeight(String(Number(bags_.reduce((sum, b) => sum + b.weightKg, 0).toFixed(1))));
      const mawbs = [...new Set(bags_.map((b) => b.mawb))];
      if (mawbs.length === 1 && !mawb) setMawb(mawbs[0]);
    }
  }

  const SERVICE_LOCATION_DEFAULT: Record<string, 'origin' | 'destination'> = {
    CR: 'origin', OH: 'origin', EC: 'destination', CS: 'destination',
  };

  function getJobDefaults(svcCode: string): Partial<JobDraft> {
    if (svcCode === 'FM') {
      const originL = originLocationId ? getLocationById(originLocationId) : null;
      const destL = destinationLocationId ? getLocationById(destinationLocationId) : null;
      return {
        originDistrictCode: originL?.districtCode ?? '',
        destDistrictCode: destL?.districtCode ?? '',
      };
    }
    const side = SERVICE_LOCATION_DEFAULT[svcCode];
    if (side === 'origin') return { locationId: originLocationId };
    if (side === 'destination') return { locationId: destinationLocationId };
    return {};
  }

  function addJobForService(svc: ServiceType) {
    const defaults = getJobDefaults(svc.code);
    setJobs((prev) => [...prev, {
      key: crypto.randomUUID(),
      isLocked: false,
      serviceCode: svc.code,
      vendorCode: defaultVendor,
      originDistrictCode: '',
      destDistrictCode: '',
      truckType: '',
      locationId: '',
      ...defaults,
    }]);
  }

  function updateDraft(key: string, updates: Partial<JobDraft>) {
    setJobs((prev) => prev.map((j) => (j.key === key ? { ...j, ...updates } : j)));
  }

  function removeDraft(key: string) {
    setJobs((prev) => prev.filter((j) => j.key !== key));
  }

  function getFtlRate(job: JobDraft) {
    if (job.serviceCode !== 'FM' || !job.vendorCode || !job.originDistrictCode || !job.destDistrictCode || !job.truckType) return null;
    const match = seedFtlRates.find((r) =>
      r.vendorCode === job.vendorCode && r.isActive &&
      r.originCode === job.originDistrictCode && r.destCode === job.destDistrictCode
    );
    if (!match) return null;
    const amount = match.rates[job.truckType as TruckType];
    if (!amount) return null;
    return { rate: match, amount, currency: match.currency };
  }

  function getVendorJobFees(job: JobDraft) {
    if (job.serviceCode === 'FM' || !job.vendorCode || !job.locationId) return [];
    return seedVendorFees.filter((f) =>
      f.vendorCode === job.vendorCode && f.serviceCode === job.serviceCode &&
      f.locationId === job.locationId && f.isActive
    );
  }

  function calcJobCost(job: JobDraft): { currency: Currency; amount: number } | null {
    const isFM = job.serviceCode === 'FM';
    if (isFM) {
      const ftl = getFtlRate(job);
      return ftl ? { currency: ftl.currency, amount: ftl.amount } : null;
    }
    const fees = getVendorJobFees(job);
    if (fees.length === 0) return null;
    const orderBags = Number(bags) || 0;
    const orderWeight = Number(weight) || 0;
    let total = 0;
    const curr = fees[0].currency;
    for (const f of fees) {
      let qty = 1;
      if (f.unit === 'per-kg') qty = orderWeight;
      else if (f.unit === 'per-bag') qty = orderBags;
      const amt = f.rate * qty;
      total += f.minCharge ? Math.max(amt, f.minCharge) : amt;
    }
    return { currency: curr, amount: total };
  }

  function orderTotals(): Map<Currency, number> {
    const totals = new Map<Currency, number>();
    for (const job of jobs) {
      if (job.isLocked) continue;
      const cost = calcJobCost(job);
      if (cost) totals.set(cost.currency, (totals.get(cost.currency) ?? 0) + cost.amount);
    }
    return totals;
  }

  function districtLabel(code: string): string {
    const d = ALL_DISTRICTS.find((x) => x.code === code);
    if (!d) return code;
    const c = ALL_CITIES.find((x) => x.districts.some((dd) => dd.code === code));
    return `${d.name}${c ? ', ' + c.name : ''}`;
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (!customerCode) errs.push('Customer is required');
    if (!originLocationId) errs.push('Pickup location is required');
    if (!destinationLocationId) errs.push('Delivery location is required');
    const editableJobs = jobs.filter((j) => !j.isLocked);
    if (jobs.length === 0) errs.push('Trip must have at least one job');
    editableJobs.forEach((job, i) => {
      const label = `J${String(i + 1).padStart(2, '0')}`;
      if (!job.vendorCode) errs.push(`${label}: select a vendor`);
      if (job.serviceCode === 'FM') {
        if (!job.originDistrictCode) errs.push(`${label}: select origin district`);
        if (!job.destDistrictCode) errs.push(`${label}: select destination district`);
        if (!job.truckType) errs.push(`${label}: select truck type`);
      } else {
        if (!job.locationId) errs.push(`${label}: select location`);
      }
    });
    return errs;
  }

  function buildJobFees(draft: JobDraft): FeeLineItem[] {
    const isFM = draft.serviceCode === 'FM';
    const orderBags = Number(bags) || 0;
    const orderWeight = Number(weight) || 0;
    const fees: FeeLineItem[] = [];
    if (isFM) {
      const ftl = getFtlRate(draft);
      if (ftl) {
        fees.push({
          id: `F-${Date.now()}-0`,
          name: `FTL ${draft.truckType}`,
          feeId: ftl.rate.id,
          currency: ftl.currency,
          rate: ftl.amount,
          unit: 'flat',
          quantity: 1,
          amount: ftl.amount,
          active: true,
        });
      }
    } else {
      const vFees = getVendorJobFees(draft);
      vFees.forEach((f, fi) => {
        let qty = 1;
        if (f.unit === 'per-kg') qty = orderWeight;
        else if (f.unit === 'per-bag') qty = orderBags;
        const amt = f.rate * qty;
        fees.push({
          id: `F-${Date.now()}-${fi}`,
          name: f.name,
          feeId: f.id,
          currency: f.currency,
          rate: f.rate,
          unit: f.unit,
          quantity: qty,
          amount: f.minCharge ? Math.max(amt, f.minCharge) : amt,
          minCharge: f.minCharge,
          active: true,
        });
      });
    }
    return fees;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trip) return;
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }

    const originL = getLocationById(originLocationId);
    const destL = getLocationById(destinationLocationId);
    const customer = customers.find((c) => c.code === customerCode)!;
    const now = new Date();
    const orderBags = Number(bags) || 0;
    const orderWeight = Number(weight) || 0;

    // 1. Update trip fields
    updateTrip(trip.id, {
      customer: { name: customer.name, code: customer.code },
      mawb,
      origin: originL?.name ?? trip.origin,
      destination: destL?.name ?? trip.destination,
      bags: orderBags,
      weight: orderWeight,
      remarks,
      pickupDate: pickupDate || undefined,
      deliveryDate: deliveryDate || undefined,
      bagPackageIds: selectedBagIds.length > 0 ? selectedBagIds : undefined,
    });

    // 2. Delete removed editable jobs
    const keptJobIds = new Set(jobs.filter((j) => j.jobId).map((j) => j.jobId!));
    for (const j of trip.jobs) {
      if (!keptJobIds.has(j.id) && !LOCKED_STATUSES.has(j.status)) {
        deleteJob(trip.id, j.id);
      }
    }

    // 3. Update existing editable jobs + add new jobs
    const allCurrentJobs = [...trip.jobs]; // for generating IDs for new jobs
    for (const draft of jobs) {
      if (draft.isLocked) continue;
      const isFM = draft.serviceCode === 'FM';
      const vendor = vendors.find((v) => v.code === draft.vendorCode)!;
      const svc = serviceTypes.find((s) => s.code === draft.serviceCode)!;

      let originName = '';
      let destName = '';
      if (isFM) {
        originName = districtLabel(draft.originDistrictCode);
        destName = districtLabel(draft.destDistrictCode);
      } else {
        const loc = getLocationById(draft.locationId);
        originName = loc?.name ?? draft.locationId;
        destName = originName;
      }

      const fees = buildJobFees(draft);
      const feeTotal = fees.filter((f) => f.active).reduce((sum, f) => sum + f.amount, 0);
      const primaryCurrency = fees[0]?.currency ?? 'MYR';

      if (draft.jobId) {
        // Update existing job — keep status/logs/proofs, update assignment + fees
        updateJob(trip.id, draft.jobId, {
          vendor: { code: vendor.code, name: vendor.name },
          origin: { ...trip.jobs.find((j) => j.id === draft.jobId)!.origin, location: originName },
          destination: { ...trip.jobs.find((j) => j.id === draft.jobId)!.destination, location: destName },
          service: svc,
          fees,
          agreedCost: feeTotal > 0 ? { currency: primaryCurrency, amount: feeTotal } : undefined,
          jobBags: orderBags,
          jobWeight: orderWeight,
        });
      } else {
        // Add new job
        const newJobId = generateJobId(trip.id, allCurrentJobs);
        allCurrentJobs.push({ id: newJobId });
        const newJob: Job = {
          id: newJobId,
          vendor: { code: vendor.code, name: vendor.name },
          origin: { location: originName, date: '' },
          destination: { location: destName, date: '' },
          service: svc,
          status: 'Pending',
          duration: null,
          execution: null,
          activityLog: [{ id: `log-${Date.now()}`, timestamp: now.toISOString().replace('T', ' ').slice(0, 16), action: 'Job created', user: 'Ops Admin', details: `Assigned to ${vendor.name}` }],
          proofDocuments: [],
          fees,
          agreedCost: feeTotal > 0 ? { currency: primaryCurrency, amount: feeTotal } : undefined,
          jobBags: orderBags,
          jobWeight: orderWeight,
        };
        addJob(trip.id, newJob);
      }
    }

    toast.success(`Trip updated — ${trip.id}`);
    navigate('/trips');
  }

  if (!trip) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#9ca3af' }}>Trip not found.</p>
        <button onClick={() => navigate('/trips')} style={{ marginTop: 12, padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff', color: '#374151', border: '1px solid #e5e7eb', cursor: 'pointer', fontFamily: 'inherit' }}>Back to Trips</button>
      </div>
    );
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 6 };
  const editableJobs = jobs.filter((j) => !j.isLocked);
  const svcCounts: Record<string, number> = {};
  editableJobs.forEach((j) => { svcCounts[j.serviceCode] = (svcCounts[j.serviceCode] || 0) + 1; });
  const totals = orderTotals();
  const jobsMissingRate = editableJobs.filter((j) => !calcJobCost(j)).length;

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <button onClick={() => navigate('/trips')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px', margin: 0 }}>Edit Trip</h1>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#9ca3af' }}>{trip.id}</span>
        </div>
      </div>
      <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 20, marginLeft: 44 }}>Update trip details and job assignments. Status changes are made in the trip detail panel.</p>

      <form onSubmit={handleSubmit}>
        {errors.length > 0 && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>Please fix:</div>
            {errors.map((err, i) => <div key={i} style={{ fontSize: 11, color: '#dc2626', padding: '1px 0' }}>{err}</div>)}
          </div>
        )}

        {/* Step 1: Trip Details */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 22, height: 22, borderRadius: 5, background: '#152CFF', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Trip Details</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Customer *</label>
              <select value={customerCode} onChange={(e) => setCustomerCode(e.target.value)} style={{ width: '100%' }}>
                <option value="">Select customer...</option>
                {customers.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>MAWB Number</label>
              <input type="text" value={mawb} onChange={(e) => setMawb(e.target.value)} placeholder="e.g. 160-84329871" style={{ width: '100%', fontFamily: 'var(--font-mono)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Pickup Location *</label>
              <LocationDropdown value={originLocationId} onChange={setOriginLocationId} placeholder="Origin facility..." excludeId={destinationLocationId} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}><ArrowRight size={14} style={{ color: '#d1d5db' }} /></div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Delivery Location *</label>
              <LocationDropdown value={destinationLocationId} onChange={setDestinationLocationId} placeholder="Destination facility..." excludeId={originLocationId} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 80 }}><label style={labelStyle}>Bags</label><input type="number" value={bags} onChange={(e) => setBags(e.target.value)} placeholder="0" style={{ width: '100%' }} /></div>
            <div style={{ width: 100 }}><label style={labelStyle}>Weight (kg)</label><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" style={{ width: '100%' }} /></div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 1 }}>
              <button type="button" onClick={() => setShowBagModal(true)} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                border: selectedBagIds.length > 0 ? '1px solid #152CFF' : '1px solid #e5e7eb',
                background: selectedBagIds.length > 0 ? 'rgba(21,44,255,0.04)' : '#fff',
                color: selectedBagIds.length > 0 ? '#152CFF' : '#374151',
              }}>
                <Package size={12} />
                {selectedBagIds.length > 0 ? `${selectedBagIds.length} bag${selectedBagIds.length !== 1 ? 's' : ''} linked` : '+ Add Bags'}
              </button>
            </div>
            <div style={{ width: 140 }}><label style={labelStyle}>Pickup Date</label><input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} style={{ width: '100%', fontFamily: 'var(--font-mono)' }} /></div>
            <div style={{ width: 140 }}><label style={labelStyle}>Delivery Date</label><input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} style={{ width: '100%', fontFamily: 'var(--font-mono)' }} /></div>
            <div style={{ flex: 1 }}><label style={labelStyle}>Remarks</label><input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes" style={{ width: '100%' }} /></div>
          </div>
          {selectedBags.length > 0 && (
            <div style={{ padding: '8px 10px', background: 'rgba(21,44,255,0.02)', border: '1px solid rgba(21,44,255,0.08)', borderRadius: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#152CFF' }}>
                  {selectedBags.length} bag{selectedBags.length !== 1 ? 's' : ''} linked · {selectedBags.reduce((s, b) => s + b.weightKg, 0).toFixed(1)} kg
                </span>
                <button type="button" onClick={() => { setSelectedBagIds([]); setBags(''); setWeight(''); }} style={{ fontSize: 9, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {selectedBags.map((bag) => (
                  <span key={bag.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 3, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", background: '#fff', border: '1px solid #e5e7eb', color: '#374151' }}>
                    {bag.bagNumber.slice(0, 12)}… <span style={{ color: '#9ca3af' }}>{bag.weightKg}kg</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Jobs */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 22, height: 22, borderRadius: 5, background: '#152CFF', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Jobs</span>
          </div>

          {/* Default vendor + service add bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, marginLeft: 30, padding: '8px 12px', background: defaultVendor ? 'rgba(21,44,255,0.03)' : '#f9fafb', border: `1px solid ${defaultVendor ? 'rgba(21,44,255,0.1)' : '#e5e7eb'}`, borderRadius: 6 }}>
            <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, whiteSpace: 'nowrap' }}>Assign to</span>
            <select value={defaultVendor} onChange={(e) => setDefaultVendor(e.target.value)} style={{ fontSize: 11, padding: '5px 8px', border: `1px solid ${defaultVendor ? '#152CFF' : '#e5e7eb'}`, borderRadius: 4, fontFamily: 'inherit', fontWeight: defaultVendor ? 600 : 400, color: defaultVendor ? '#152CFF' : '#6b7280', background: defaultVendor ? 'rgba(21,44,255,0.04)' : '#fff', minWidth: 140 }}>
              <option value="">Select vendor...</option>
              {vendors.map((v) => <option key={v.code} value={v.code}>{v.name}</option>)}
            </select>
            <span style={{ fontSize: 9, color: '#9ca3af' }}>New jobs will be assigned to this vendor</span>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 14, marginLeft: 30 }}>
            {serviceTypes.map((svc) => {
              const count = svcCounts[svc.code] || 0;
              return (
                <button key={svc.code} type="button" onClick={() => addJobForService(svc)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 14, color: SVC_COLOR }}>+</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: SVC_COLOR }}>{svc.code}</span>
                  {svc.label}
                  {count > 0 && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: SVC_COLOR, color: '#fff', marginLeft: 2 }}>{count}</span>}
                </button>
              );
            })}
          </div>

          {jobs.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', border: '1px dashed #e5e7eb', borderRadius: 6, background: '#f9fafb', marginLeft: 30 }}>
              <p style={{ fontSize: 11, color: '#9ca3af' }}>No jobs. Select a vendor then click a service to add one.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {jobs.map((job, i) => {
                const svc = serviceTypes.find((s) => s.code === job.serviceCode);

                // Locked job (Completed/Verified/Cancelled)
                if (job.isLocked && job.existingJob) {
                  const sc = getStatusColors(job.existingJob.status);
                  return (
                    <div key={job.key} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, opacity: 0.75 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af' }}>J{String(i + 1).padStart(2, '0')}</span>
                          <span style={{ padding: '1px 6px', borderRadius: 99, fontSize: 9, fontWeight: 700, background: `${SVC_COLOR}12`, border: `1px solid ${SVC_COLOR}25`, color: SVC_COLOR }}>{svc?.code} {svc?.label}</span>
                          <span style={{ fontSize: 10, color: '#6b7280' }}>{job.existingJob.vendor.name}</span>
                          <span style={{ fontSize: 10, color: '#9ca3af' }}>·</span>
                          <span style={{ fontSize: 10, color: '#9ca3af' }}>{job.existingJob.origin.location}{job.existingJob.origin.location !== job.existingJob.destination.location ? ` → ${job.existingJob.destination.location}` : ''}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.color, display: 'inline-block' }} />
                            {job.existingJob.status}
                          </span>
                          <Lock size={11} style={{ color: '#d1d5db' }} />
                        </div>
                      </div>
                    </div>
                  );
                }

                // Editable job
                const color = SVC_COLOR;
                const isFM = job.serviceCode === 'FM';
                const hasVendor = !!job.vendorCode;
                return (
                  <div key={job.key} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color }}>J{String(i + 1).padStart(2, '0')}</span>
                        <span style={{ padding: '1px 6px', borderRadius: 99, fontSize: 9, fontWeight: 700, background: `${color}12`, border: `1px solid ${color}25`, color }}>{svc?.code} {svc?.label}</span>
                        {job.jobId && <span style={{ fontSize: 9, color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>{job.jobId}</span>}
                      </div>
                      <button type="button" onClick={() => removeDraft(job.key)} style={{ padding: 2, color: '#d1d5db', background: 'none', border: 'none', cursor: 'pointer' }}><X size={12} /></button>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                      <select value={job.vendorCode} onChange={(e) => updateDraft(job.key, { vendorCode: e.target.value })} style={{ width: 140, fontSize: 11 }}>
                        <option value="">Vendor...</option>
                        {vendors.map((v) => <option key={v.code} value={v.code}>{v.name}</option>)}
                      </select>

                      {isFM ? (
                        <>
                          <div style={{ flex: 1 }}>
                            <select value={job.originDistrictCode} onChange={(e) => updateDraft(job.key, { originDistrictCode: e.target.value })} style={{ width: '100%', fontSize: 11 }}>
                              <option value="">Origin district...</option>
                              {ALL_CITIES.map((city) => (
                                <optgroup key={city.code} label={city.name}>
                                  {city.districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                          <ArrowRight size={12} style={{ color: '#d1d5db', flexShrink: 0, alignSelf: 'center', marginTop: 4 }} />
                          <div style={{ flex: 1 }}>
                            <select value={job.destDistrictCode} onChange={(e) => updateDraft(job.key, { destDistrictCode: e.target.value })} style={{ width: '100%', fontSize: 11 }}>
                              <option value="">Destination district...</option>
                              {ALL_CITIES.map((city) => (
                                <optgroup key={city.code} label={city.name}>
                                  {city.districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                        </>
                      ) : (
                        <div style={{ flex: 1 }}>
                          <LocationDropdown value={job.locationId} onChange={(id) => updateDraft(job.key, { locationId: id })} placeholder="Location..." />
                        </div>
                      )}
                    </div>

                    {isFM && hasVendor && (
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 4 }}>Truck Type</div>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          {TRUCK_TYPES.map((t) => {
                            const isSelected = job.truckType === t.type;
                            const hasRate = job.originDistrictCode && job.destDistrictCode && seedFtlRates.some((r) =>
                              r.vendorCode === job.vendorCode && r.isActive &&
                              r.originCode === job.originDistrictCode && r.destCode === job.destDistrictCode &&
                              r.rates[t.type] !== undefined
                            );
                            return (
                              <button key={t.type} type="button" onClick={() => updateDraft(job.key, { truckType: t.type })} style={{
                                padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                border: isSelected ? '1.5px solid #152CFF' : '1px solid #e5e7eb',
                                background: isSelected ? 'rgba(21,44,255,0.06)' : '#fff',
                                color: isSelected ? '#152CFF' : hasRate ? '#374151' : '#d1d5db',
                                opacity: hasRate || !job.originDistrictCode ? 1 : 0.5,
                              }}>
                                {t.type}
                                <span style={{ fontSize: 7, color: '#9ca3af', marginLeft: 2 }}>&lt;{(t.maxKg / 1000).toFixed(t.maxKg >= 10000 ? 0 : 1)}t</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {hasVendor && (isFM ? (job.originDistrictCode && job.destDistrictCode && job.truckType) : job.locationId) && (
                      <div style={{ marginTop: 4 }}>
                        {(() => {
                          if (isFM) {
                            const ftl = getFtlRate(job);
                            if (ftl) return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 600, color: '#152CFF' }}>FTL {job.truckType}</span>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#111827' }}>{formatCurrency(ftl.currency, ftl.amount)}</span>
                              </div>
                            );
                            return <span style={{ fontSize: 10, fontWeight: 600, color: '#b45309', padding: '1px 6px', background: '#fefce8', borderRadius: 4, border: '1px solid #fde68a' }}>No FTL pricing for this route + truck type</span>;
                          } else {
                            const vFees = getVendorJobFees(job);
                            if (vFees.length > 0) {
                              const totalCost = calcJobCost(job);
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 10, fontWeight: 600, color: '#152CFF' }}>{vFees.length} fees from vendor schedule</span>
                                  {totalCost && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#111827' }}>{formatCurrency(totalCost.currency, totalCost.amount)}</span>}
                                </div>
                              );
                            }
                            return <span style={{ fontSize: 10, fontWeight: 600, color: '#b45309', padding: '1px 6px', background: '#fefce8', borderRadius: 4, border: '1px solid #fde68a' }}>No fees configured for this vendor/service/location</span>;
                          }
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Trip total (editable jobs only) */}
          {editableJobs.length > 0 && totals.size > 0 && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>Editable Jobs Total</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {Array.from(totals.entries()).map(([curr, total]) => (
                  <span key={curr} style={{ fontSize: 12, fontWeight: 700, color: '#111827', fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(curr, total)}</span>
                ))}
                {jobsMissingRate > 0 && <span style={{ fontSize: 10, color: '#b45309' }}>*{jobsMissingRate} job{jobsMissingRate > 1 ? 's' : ''} missing pricing</span>}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
          <button type="button" onClick={() => navigate('/trips')} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff', color: '#374151', border: '1px solid #e5e7eb', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button type="submit" style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Save Changes</button>
        </div>
      </form>

      <SelectBagsModal
        isOpen={showBagModal}
        onClose={() => setShowBagModal(false)}
        onConfirm={handleBagsConfirm}
        initialSelected={selectedBagIds}
        mawbHint={mawb}
      />
    </div>
  );
}
