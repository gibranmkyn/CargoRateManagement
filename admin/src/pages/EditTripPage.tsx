import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft, Package, Lock } from 'lucide-react';
import { customers, vendors, serviceTypes, TRUCK_TYPES, seedBagPackages, getL1ByCode } from '@shared/mockData';
import type { Job, ServiceType, TruckType } from '@shared/mockData';
import { useTrips, generateJobId } from '@shared/TripContext';
import { useLocations } from '../context/LocationContext';
import { useToast } from '@shared/Toast';
import LocationDropdown from '../components/shared/LocationDropdown';
import SelectBagsModal from '../components/trips/SelectBagsModal';
import { getStatusChipStyle } from '@shared/statusStyles';

interface JobDraft {
  key: string;
  jobId?: string;        // undefined = new job
  isLocked: boolean;     // Completed/Verified/Cancelled = true
  existingJob?: Job;     // full job for locked display
  serviceCode: string;
  vendorCode: string;
  truckType: TruckType | '';
  locationId: string;
  l2CostIds: string[];
}

const LOCKED_STATUSES = new Set(['Completed', 'Cancelled']);

function isJobLocked(job: Job): boolean {
  return LOCKED_STATUSES.has(job.status) || job.verificationStatus === 'Verified' || job.verificationStatus === 'Rejected';
}

function truckTypeFromFees(job: Job): TruckType | '' {
  const fee = job.fees.find((f) => f.name.startsWith('FTL '));
  return fee ? (fee.name.slice(4) as TruckType) : '';
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
      const isLocked = isJobLocked(job);
      const isFM = job.service.code === 'FM';
      return {
        key: job.id,
        jobId: job.id,
        isLocked,
        existingJob: job,
        serviceCode: job.service.code,
        vendorCode: job.vendor.code,
        truckType: isFM ? truckTypeFromFees(job) : '',
        locationId: !isFM ? (getLocationByName(job.origin.location)?.id ?? '') : '',
        l2CostIds: job.l2CostIds ?? [],
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
      // FM: origin/destination come from trip-level facility pickers.
      return {};
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
      truckType: '',
      locationId: '',
      l2CostIds: [],
      ...defaults,
    }]);
  }

  function updateDraft(key: string, updates: Partial<JobDraft>) {
    setJobs((prev) => prev.map((j) => (j.key === key ? { ...j, ...updates } : j)));
  }

  function removeDraft(key: string) {
    setJobs((prev) => prev.filter((j) => j.key !== key));
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
        if (!job.truckType) errs.push(`${label}: select truck type`);
      } else {
        if (!job.locationId) errs.push(`${label}: select location`);
      }
      if (job.l2CostIds.length === 0) errs.push(`${label}: select at least 1 subservice`);
    });
    return errs;
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

    // 1. Update trip fields
    updateTrip(trip.id, {
      customer: { name: customer.name, code: customer.code },
      mawb,
      origin: originL?.name ?? trip.origin,
      destination: destL?.name ?? trip.destination,
      bags: Number(bags) || 0,
      weight: Number(weight) || 0,
      remarks,
      pickupDate: pickupDate || undefined,
      deliveryDate: deliveryDate || undefined,
      bagPackageIds: selectedBagIds.length > 0 ? selectedBagIds : undefined,
    });

    // 2. Delete removed editable jobs
    const keptJobIds = new Set(jobs.filter((j) => j.jobId).map((j) => j.jobId!));
    for (const j of trip.jobs) {
      if (!keptJobIds.has(j.id) && !isJobLocked(j)) {
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
        originName = originL?.name ?? trip.origin;
        destName = destL?.name ?? trip.destination;
      } else {
        const loc = getLocationById(draft.locationId);
        originName = loc?.name ?? draft.locationId;
        destName = originName;
      }

      if (draft.jobId) {
        // Update existing job — keep status/logs/proofs, update assignment
        updateJob(trip.id, draft.jobId, {
          vendor: { code: vendor.code, name: vendor.name },
          origin: { ...trip.jobs.find((j) => j.id === draft.jobId)!.origin, location: originName },
          destination: { ...trip.jobs.find((j) => j.id === draft.jobId)!.destination, location: destName },
          service: svc,
          l2CostIds: draft.l2CostIds,
        });
      } else {
        // Add new job
        const newJobId = generateJobId(trip.id, allCurrentJobs);
        allCurrentJobs.push({ id: newJobId } as Job);
        const newJob: Job = {
          id: newJobId,
          vendor: { code: vendor.code, name: vendor.name },
          origin: { location: originName, date: '' },
          destination: { location: destName, date: '' },
          service: svc,
          status: 'Pending',
          verificationStatus: 'Pending' as const,
          statusChangedAt: now.toISOString(),
          duration: null,
          execution: null,
          activityLog: [{ id: `log-${Date.now()}`, timestamp: now.toISOString().replace('T', ' ').slice(0, 16), action: 'Job created', user: 'Ops Admin', details: `Assigned to ${vendor.name}` }],
          proofDocuments: [],
          fees: [],
          l2CostIds: draft.l2CostIds,
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
                  const sc = getStatusChipStyle(job.existingJob.status);
                  const lockedL1 = getL1ByCode(job.serviceCode);
                  return (
                    <div key={job.key} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, opacity: 0.75 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: lockedL1 && lockedL1.l2Services.length > 0 ? 8 : 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af' }}>J{String(i + 1).padStart(2, '0')}</span>
                          <span style={{ padding: '1px 6px', borderRadius: 99, fontSize: 9, fontWeight: 700, background: `${SVC_COLOR}12`, border: `1px solid ${SVC_COLOR}25`, color: SVC_COLOR }}>{svc?.code} {svc?.label}</span>
                          <span style={{ fontSize: 10, color: '#6b7280' }}>{job.existingJob.vendor.name}</span>
                          <span style={{ fontSize: 10, color: '#9ca3af' }}>·</span>
                          <span style={{ fontSize: 10, color: '#9ca3af' }}>{job.existingJob.origin.location}{job.existingJob.origin.location !== job.existingJob.destination.location ? ` → ${job.existingJob.destination.location}` : ''}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.text, display: 'inline-block' }} />
                            {job.existingJob.status}
                          </span>
                          <Lock size={11} style={{ color: '#d1d5db' }} />
                        </div>
                      </div>
                      {lockedL1 && lockedL1.l2Services.length > 0 && (
                        <div>
                          <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 4, fontWeight: 600 }}>Subservices</div>
                          <div style={{ maxHeight: 80, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff', padding: '4px 0' }}>
                            {lockedL1.l2Services.map((l2) => {
                              const checked = job.l2CostIds.includes(l2.costId);
                              return (
                                <label key={l2.costId} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', fontSize: 10, color: checked ? '#374151' : '#d1d5db', cursor: 'not-allowed' }}>
                                  <input type="checkbox" checked={checked} disabled style={{ accentColor: '#152CFF', width: 12, height: 12, margin: 0, flexShrink: 0 }} />
                                  {l2.name}
                                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#9ca3af', marginLeft: 'auto' }}>{l2.costId}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
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

                      {!isFM && (
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
                            return (
                              <button key={t.type} type="button" onClick={() => updateDraft(job.key, { truckType: t.type })} style={{
                                padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                border: isSelected ? '1.5px solid #152CFF' : '1px solid #e5e7eb',
                                background: isSelected ? 'rgba(21,44,255,0.06)' : '#fff',
                                color: isSelected ? '#152CFF' : '#374151',
                              }}>
                                {t.type}
                                <span style={{ fontSize: 7, color: '#9ca3af', marginLeft: 2 }}>&lt;{(t.maxKg / 1000).toFixed(t.maxKg >= 10000 ? 0 : 1)}t</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* L2 Subservices checklist */}
                    {(() => {
                      const l1 = getL1ByCode(job.serviceCode);
                      if (!l1 || l1.l2Services.length === 0) return null;
                      return (
                        <div>
                          <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 4, fontWeight: 600 }}>Subservices</div>
                          <div style={{ maxHeight: 80, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff', padding: '4px 0' }}>
                            {l1.l2Services.map((l2) => {
                              const checked = job.l2CostIds.includes(l2.costId);
                              return (
                                <label key={l2.costId} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', fontSize: 10, color: checked ? '#374151' : '#9ca3af', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      const next = checked
                                        ? job.l2CostIds.filter((id) => id !== l2.costId)
                                        : [...job.l2CostIds, l2.costId];
                                      updateDraft(job.key, { l2CostIds: next });
                                    }}
                                    style={{ accentColor: '#152CFF', width: 12, height: 12, margin: 0, cursor: 'pointer', flexShrink: 0 }}
                                  />
                                  {l2.name}
                                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#9ca3af', marginLeft: 'auto' }}>{l2.costId}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                );
              })}
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
