import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft, Package } from 'lucide-react';
import { customers, vendors, serviceTypes, TRUCK_TYPES, seedBagPackages, seedFtlRates, getL1ByCode } from '@shared/mockData';
import type { Job, Trip, ServiceType, TruckType } from '@shared/mockData';
import { useTrips, generateTripId, generateJobId } from '@shared/TripContext';
import { useLocations } from '../context/LocationContext';
import { useToast } from '@shared/Toast';
import LocationDropdown from '../components/shared/LocationDropdown';
import SelectBagsModal from '../components/trips/SelectBagsModal';
import { ALL_CITIES, ALL_DISTRICTS } from '../data/chinaRegions';

interface JobDraft {
  key: string;
  serviceCode: string;
  vendorCode: string;
  // FM Trucking: district-based
  originDistrictCode: string;
  destDistrictCode: string;
  truckType: TruckType | '';
  // Other services: facility-based
  locationId: string;
  // L2 subservices (HMW-58)
  l2CostIds: string[];
}

const SVC_COLOR = '#152CFF';

export default function CreateTripPage() {
  const navigate = useNavigate();
  const { addTrip } = useTrips();
  const { getLocationById } = useLocations();
  const toast = useToast();

  const [customerCode, setCustomerCode] = useState('');
  const [mawb, setMawb] = useState('');
  const [originLocationId, setOriginLocationId] = useState('');
  const [destinationLocationId, setDestinationLocationId] = useState('');
  const [bags, setBags] = useState('');
  const [weight, setWeight] = useState('');
  const [remarks, setRemarks] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [jobs, setJobs] = useState<JobDraft[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [defaultVendor, setDefaultVendor] = useState('');
  const [selectedBagIds, setSelectedBagIds] = useState<string[]>([]);
  const [showBagModal, setShowBagModal] = useState(false);

  const selectedBags = useMemo(() =>
    seedBagPackages.filter((b) => selectedBagIds.includes(b.id)),
    [selectedBagIds]
  );

  function handleBagsConfirm(bagIds: string[]) {
    setSelectedBagIds(bagIds);
    // Auto-fill bags count and weight from selected bags
    if (bagIds.length > 0) {
      const bags_ = seedBagPackages.filter((b) => bagIds.includes(b.id));
      setBags(String(bags_.length));
      setWeight(String(Number(bags_.reduce((sum, b) => sum + b.weightKg, 0).toFixed(1))));
      // Auto-fill MAWB if all bags share the same one
      const mawbs = [...new Set(bags_.map((b) => b.mawb))];
      if (mawbs.length === 1 && !mawb) setMawb(mawbs[0]);
    }
  }

  // Service → location defaulting: CR/OH use origin (pickup point), EC/CS use destination (delivery point)
  const SERVICE_LOCATION_DEFAULT: Record<string, 'origin' | 'destination'> = {
    CR: 'origin',
    OH: 'origin',
    EC: 'destination',
    CS: 'destination',
  };

  function getJobDefaults(svcCode: string): Partial<JobDraft> {
    if (svcCode === 'FM') {
      // FM: auto-default district codes from origin/destination facility's districtCode
      const originLoc = originLocationId ? getLocationById(originLocationId) : null;
      const destLoc = destinationLocationId ? getLocationById(destinationLocationId) : null;
      return {
        originDistrictCode: originLoc?.districtCode ?? '',
        destDistrictCode: destLoc?.districtCode ?? '',
      };
    }
    // Non-FM: default locationId based on service type
    const side = SERVICE_LOCATION_DEFAULT[svcCode];
    if (side === 'origin') return { locationId: originLocationId };
    if (side === 'destination') return { locationId: destinationLocationId };
    return {};
  }

  function addJobForService(svc: ServiceType) {
    const defaults = getJobDefaults(svc.code);
    setJobs((prev) => [...prev, {
      key: crypto.randomUUID(),
      serviceCode: svc.code,
      vendorCode: defaultVendor,
      originDistrictCode: '',
      destDistrictCode: '',
      truckType: '',
      locationId: '',
      l2CostIds: [],
      ...defaults,
    }]);
  }

  function addAllServices() {
    const newJobs: JobDraft[] = serviceTypes.map((svc) => ({
      key: crypto.randomUUID(),
      serviceCode: svc.code,
      vendorCode: defaultVendor,
      originDistrictCode: '',
      destDistrictCode: '',
      truckType: '' as TruckType | '',
      locationId: '',
      l2CostIds: [],
      ...getJobDefaults(svc.code),
    }));
    setJobs((prev) => [...prev, ...newJobs]);
  }

  function updateJob(key: string, updates: Partial<JobDraft>) {
    setJobs((prev) => prev.map((j) => (j.key === key ? { ...j, ...updates } : j)));
  }

  function removeJob(key: string) {
    setJobs((prev) => prev.filter((j) => j.key !== key));
  }

  // FM: check if rate exists for truck type (for visual feedback only — no fee auto-pop)
  function hasFtlRate(job: JobDraft, truckType: TruckType): boolean {
    if (!job.vendorCode || !job.originDistrictCode || !job.destDistrictCode) return false;
    return seedFtlRates.some((r) =>
      r.vendorCode === job.vendorCode && r.isActive &&
      r.originCode === job.originDistrictCode && r.destCode === job.destDistrictCode &&
      r.rates[truckType] !== undefined
    );
  }

  // District name helper
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
    if (jobs.length === 0) errs.push('Add at least one job');
    jobs.forEach((job, i) => {
      const label = `J${String(i + 1).padStart(2, '0')}`;
      if (!job.vendorCode) errs.push(`${label}: select a vendor`);
      if (job.serviceCode === 'FM') {
        if (!job.originDistrictCode) errs.push(`${label}: select origin district`);
        if (!job.destDistrictCode) errs.push(`${label}: select destination district`);
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
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }

    const tripId = generateTripId();
    const customer = customers.find((c) => c.code === customerCode)!;
    const now = new Date();
    const createdAt = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      + ', ' + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const tripJobs: Job[] = jobs.map((draft, i) => {
      const vendor = vendors.find((v) => v.code === draft.vendorCode)!;
      const svc = serviceTypes.find((s) => s.code === draft.serviceCode)!;
      const isFM = draft.serviceCode === 'FM';

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

      return {
        id: generateJobId(tripId, jobs.slice(0, i).map((_, idx) => ({ id: `${tripId}-J${String(idx + 1).padStart(2, '0')}` }))),
        vendor: { code: vendor.code, name: vendor.name },
        origin: { location: originName, date: '' },
        destination: { location: destName, date: '' },
        service: svc,
        status: 'Pending' as const,
        duration: null,
        execution: null,
        activityLog: [{ id: `log-${Date.now()}-${i}`, timestamp: now.toISOString().replace('T', ' ').slice(0, 16), action: 'Job created', user: 'Ops Admin', details: `Assigned to ${vendor.name}` }],
        proofDocuments: [],
        fees: [],
        l2CostIds: draft.l2CostIds,
      };
    });

    const originLoc = getLocationById(originLocationId);
    const destLoc = getLocationById(destinationLocationId);

    const trip: Trip = {
      id: tripId,
      customer: { name: customer.name, code: customer.code },
      mawb,
      origin: originLoc?.name ?? '',
      destination: destLoc?.name ?? '',
      bags: Number(bags) || 0,
      weight: Number(weight) || 0,
      remarks,
      createdAt,
      pickupDate: pickupDate || undefined,
      deliveryDate: deliveryDate || undefined,
      bagPackageIds: selectedBagIds.length > 0 ? selectedBagIds : undefined,
      jobs: tripJobs,
    };

    addTrip(trip);
    toast.success(`Trip created — ${tripId}`);
    navigate('/trips');
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 6 };
  const svcCounts: Record<string, number> = {};
  jobs.forEach((j) => { svcCounts[j.serviceCode] = (svcCounts[j.serviceCode] || 0) + 1; });

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <button onClick={() => navigate('/trips')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={16} />
        </button>
        <h1 style={{ fontSize: 16, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px', margin: 0 }}>Create Trip</h1>
      </div>
      <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 20, marginLeft: 44 }}>Define what needs to happen and assign vendors to this trip.</p>

      <form onSubmit={handleSubmit}>
        {errors.length > 0 && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>Please fix:</div>
            {errors.map((e, i) => <div key={i} style={{ fontSize: 11, color: '#dc2626', padding: '1px 0' }}>{e}</div>)}
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
          {/* Selected bags summary */}
          {selectedBags.length > 0 && (
            <div style={{ padding: '8px 10px', background: 'rgba(21,44,255,0.02)', border: '1px solid rgba(21,44,255,0.08)', borderRadius: 4, marginBottom: 0 }}>
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

        {/* Step 2: Add Services */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 22, height: 22, borderRadius: 5, background: '#152CFF', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Add Services</span>
          </div>
          {/* Default vendor selector */}
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
            <button type="button" onClick={addAllServices} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1.5px solid #152CFF', background: 'rgba(21,44,255,0.04)', color: '#152CFF', fontFamily: 'inherit' }}>
              + All
            </button>
          </div>

          {jobs.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', border: '1px dashed #e5e7eb', borderRadius: 6, background: '#f9fafb', marginLeft: 30 }}>
              <p style={{ fontSize: 11, color: '#9ca3af' }}>Select a vendor above, then click services or "+ All" to add jobs</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {jobs.map((job, i) => {
                const svc = serviceTypes.find((s) => s.code === job.serviceCode);
                const color = SVC_COLOR;
                const isFM = job.serviceCode === 'FM';
                const hasVendor = !!job.vendorCode;

                return (
                  <div key={job.key} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: 12 }}>
                    {/* Job header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color }}>J{String(i + 1).padStart(2, '0')}</span>
                        <span style={{ padding: '1px 6px', borderRadius: 99, fontSize: 9, fontWeight: 700, background: `${color}12`, border: `1px solid ${color}25`, color }}>{svc?.code} {svc?.label}</span>
                      </div>
                      <button type="button" onClick={() => removeJob(job.key)} style={{ padding: 2, color: '#d1d5db', background: 'none', border: 'none', cursor: 'pointer' }}><X size={12} /></button>
                    </div>

                    {/* Vendor */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                      <select value={job.vendorCode} onChange={(e) => updateJob(job.key, { vendorCode: e.target.value })} style={{ width: 140, fontSize: 11 }}>
                        <option value="">Vendor...</option>
                        {vendors.map((v) => <option key={v.code} value={v.code}>{v.name}</option>)}
                      </select>

                      {isFM ? (
                        <>
                          {/* FM: District pickers */}
                          <div style={{ flex: 1 }}>
                            <select value={job.originDistrictCode} onChange={(e) => updateJob(job.key, { originDistrictCode: e.target.value })} style={{ width: '100%', fontSize: 11 }}>
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
                            <select value={job.destDistrictCode} onChange={(e) => updateJob(job.key, { destDistrictCode: e.target.value })} style={{ width: '100%', fontSize: 11 }}>
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
                        /* Services: Facility picker */
                        <div style={{ flex: 1 }}>
                          <LocationDropdown value={job.locationId} onChange={(id) => updateJob(job.key, { locationId: id })} placeholder="Location..." />
                        </div>
                      )}
                    </div>

                    {/* FM: Truck type selector */}
                    {isFM && hasVendor && (
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 4 }}>Truck Type</div>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          {TRUCK_TYPES.map((t) => {
                            const isSelected = job.truckType === t.type;
                            // Check if pricing exists for this truck type on this route
                            const hasRate = job.originDistrictCode && job.destDistrictCode && seedFtlRates.some((r) =>
                              r.vendorCode === job.vendorCode && r.isActive &&
                              r.originCode === job.originDistrictCode && r.destCode === job.destDistrictCode &&
                              r.rates[t.type] !== undefined
                            );
                            return (
                              <button key={t.type} type="button" onClick={() => updateJob(job.key, { truckType: t.type })} style={{
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
                                      updateJob(job.key, { l2CostIds: next });
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

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
          <button type="button" onClick={() => navigate('/trips')} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff', color: '#374151', border: '1px solid #e5e7eb', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button type="submit" style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#152CFF', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Create Trip</button>
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
