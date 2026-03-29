import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { customers, vendors, serviceTypes, formatCurrency, TRUCK_TYPES } from '../data/mockData';
import type { Job, Trip, ServiceType, Currency, FeeLineItem, TruckType } from '../data/mockData';
import { useTrips, generateTripId, generateJobId } from '../context/TripContext';
import { useRates } from '../context/RateContext';
import { useToast } from '../components/Toast';
import LocationDropdown from '../components/shared/LocationDropdown';
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
  // Dates
  originDate: string;
  destinationDate: string;
}

const svcColors: Record<string, string> = {
  FM: '#152CFF', CR: '#2563eb', EC: '#7c3aed', CS: '#b45309', OH: '#6b7280',
};

export default function CreateTripPage() {
  const navigate = useNavigate();
  const { addTrip } = useTrips();
  const { ftlRates, vendorFees, getLocationById } = useRates();
  const toast = useToast();

  const [customerCode, setCustomerCode] = useState('');
  const [mawb, setMawb] = useState('');
  const [tripOrigin, setTripOrigin] = useState('');
  const [tripDestination, setTripDestination] = useState('');
  const [bags, setBags] = useState('');
  const [weight, setWeight] = useState('');
  const [remarks, setRemarks] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [jobs, setJobs] = useState<JobDraft[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  function addJobForService(svc: ServiceType) {
    setJobs((prev) => [...prev, {
      key: crypto.randomUUID(),
      serviceCode: svc.code,
      vendorCode: '',
      originDistrictCode: '',
      destDistrictCode: '',
      truckType: '',
      locationId: '',
      originDate: '',
      destinationDate: '',
    }]);
  }

  function updateJob(key: string, updates: Partial<JobDraft>) {
    setJobs((prev) => prev.map((j) => (j.key === key ? { ...j, ...updates } : j)));
  }

  function removeJob(key: string) {
    setJobs((prev) => prev.filter((j) => j.key !== key));
  }

  // FM: FTL rate lookup
  function getFtlRate(job: JobDraft) {
    if (job.serviceCode !== 'FM' || !job.vendorCode || !job.originDistrictCode || !job.destDistrictCode || !job.truckType) return null;
    const match = ftlRates.find((r) =>
      r.vendorCode === job.vendorCode && r.isActive &&
      r.originCode === job.originDistrictCode && r.destCode === job.destDistrictCode
    );
    if (!match) return null;
    const amount = match.rates[job.truckType as TruckType];
    if (!amount) return null;
    return { rate: match, amount, currency: match.currency };
  }

  // Services: vendor fee lookup
  function getVendorJobFees(job: JobDraft) {
    if (job.serviceCode === 'FM' || !job.vendorCode || !job.locationId) return [];
    return vendorFees.filter((f) =>
      f.vendorCode === job.vendorCode && f.serviceCode === job.serviceCode &&
      f.locationId === job.locationId && f.isActive
    );
  }

  // Calculate job cost
  function calcJobCost(job: JobDraft): { currency: Currency; amount: number } | null {
    const isFM = job.serviceCode === 'FM';
    if (isFM) {
      const ftl = getFtlRate(job);
      return ftl ? { currency: ftl.currency, amount: ftl.amount } : null;
    } else {
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
  }

  // Order totals
  function orderTotals(): Map<Currency, number> {
    const totals = new Map<Currency, number>();
    for (const job of jobs) {
      const cost = calcJobCost(job);
      if (cost) totals.set(cost.currency, (totals.get(cost.currency) ?? 0) + cost.amount);
    }
    return totals;
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
    const orderBags = Number(bags) || 0;
    const orderWeight = Number(weight) || 0;

    const tripJobs: Job[] = jobs.map((draft, i) => {
      const vendor = vendors.find((v) => v.code === draft.vendorCode)!;
      const svc = serviceTypes.find((s) => s.code === draft.serviceCode)!;
      const isFM = draft.serviceCode === 'FM';

      let originName = '';
      let destName = '';
      const fees: FeeLineItem[] = [];

      if (isFM) {
        originName = districtLabel(draft.originDistrictCode);
        destName = districtLabel(draft.destDistrictCode);
        // FTL: single fee from truck type rate
        const ftl = getFtlRate(draft);
        if (ftl) {
          fees.push({
            id: `F-${Date.now()}-${i}-0`,
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
        const loc = getLocationById(draft.locationId);
        originName = loc?.name ?? draft.locationId;
        destName = originName;
        // Services: all vendor fees auto-populate
        const vFees = getVendorJobFees(draft);
        vFees.forEach((f, fi) => {
          let qty = 1;
          if (f.unit === 'per-kg') qty = orderWeight;
          else if (f.unit === 'per-bag') qty = orderBags;
          const amt = f.rate * qty;
          fees.push({
            id: `F-${Date.now()}-${i}-${fi}`,
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

      const feeTotal = fees.filter((f) => f.active).reduce((sum, f) => sum + f.amount, 0);
      const primaryCurrency = fees[0]?.currency ?? 'MYR';

      return {
        id: generateJobId(tripId, jobs.slice(0, i).map((_, idx) => ({ id: `${tripId}-J${String(idx + 1).padStart(2, '0')}` }))),
        vendor: { code: vendor.code, name: vendor.name },
        origin: { location: originName, date: draft.originDate || '' },
        destination: { location: destName, date: draft.destinationDate || '' },
        service: svc,
        status: 'Pending' as const,
        duration: null,
        execution: null,
        activityLog: [{ id: `log-${Date.now()}-${i}`, timestamp: now.toISOString().replace('T', ' ').slice(0, 16), action: 'Job created', user: 'Ops Admin', details: `Assigned to ${vendor.name}` }],
        proofDocuments: [],
        fees,
        agreedCost: feeTotal > 0 ? { currency: primaryCurrency, amount: feeTotal } : undefined,
        jobBags: orderBags,
        jobWeight: orderWeight,
      };
    });

    const trip: Trip = {
      id: tripId,
      customer: { name: customer.name, code: customer.code },
      mawb,
      origin: tripOrigin,
      destination: tripDestination,
      bags: Number(bags) || 0,
      weight: Number(weight) || 0,
      remarks,
      createdAt,
      deliveryDate: deliveryDate || undefined,
      jobs: tripJobs,
    };

    addTrip(trip);
    toast.success(`Shipment created — ${tripId}`);
    navigate('/trips');
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 6 };
  const svcCounts: Record<string, number> = {};
  jobs.forEach((j) => { svcCounts[j.serviceCode] = (svcCounts[j.serviceCode] || 0) + 1; });
  const totals = orderTotals();
  const jobsMissingRate = jobs.filter((j) => !calcJobCost(j)).length;

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <button onClick={() => navigate('/trips')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={16} />
        </button>
        <h1 style={{ fontSize: 16, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px', margin: 0 }}>Create Shipment</h1>
      </div>
      <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 20, marginLeft: 44 }}>Define what needs to happen and assign vendors to this shipment.</p>

      <form onSubmit={handleSubmit}>
        {errors.length > 0 && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>Please fix:</div>
            {errors.map((e, i) => <div key={i} style={{ fontSize: 11, color: '#dc2626', padding: '1px 0' }}>{e}</div>)}
          </div>
        )}

        {/* Step 1: Shipment Details */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 22, height: 22, borderRadius: 5, background: '#152CFF', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Shipment Details</span>
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
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 100 }}><label style={labelStyle}>Bags</label><input type="number" value={bags} onChange={(e) => setBags(e.target.value)} placeholder="0" style={{ width: '100%' }} /></div>
            <div style={{ width: 100 }}><label style={labelStyle}>Weight (kg)</label><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" style={{ width: '100%' }} /></div>
            <div style={{ width: 140 }}><label style={labelStyle}>Delivery Date</label><input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} style={{ width: '100%', fontFamily: 'var(--font-mono)' }} /></div>
            <div style={{ flex: 1 }}><label style={labelStyle}>Remarks</label><input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes" style={{ width: '100%' }} /></div>
          </div>
        </div>

        {/* Step 2: Add Services */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 22, height: 22, borderRadius: 5, background: '#152CFF', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Add Services</span>
          </div>
          <p style={{ fontSize: 10, color: '#9ca3af', marginBottom: 12, marginLeft: 30 }}>Click a service to add a job.</p>

          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {serviceTypes.map((svc) => {
              const count = svcCounts[svc.code] || 0;
              return (
                <button key={svc.code} type="button" onClick={() => addJobForService(svc)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 14, color: svcColors[svc.code] || '#152CFF' }}>+</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: svcColors[svc.code] || '#9ca3af' }}>{svc.code}</span>
                  {svc.label}
                  {count > 0 && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: svcColors[svc.code] || '#152CFF', color: '#fff', marginLeft: 2 }}>{count}</span>}
                </button>
              );
            })}
          </div>

          {jobs.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', border: '1px dashed #e5e7eb', borderRadius: 6, background: '#f9fafb' }}>
              <p style={{ fontSize: 11, color: '#9ca3af' }}>Click a service above to add jobs</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {jobs.map((job, i) => {
                const svc = serviceTypes.find((s) => s.code === job.serviceCode);
                const color = svcColors[job.serviceCode] || '#152CFF';
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
                            // Check if rate exists for this truck type on this route
                            const hasRate = job.originDistrictCode && job.destDistrictCode && ftlRates.some((r) =>
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

                    {/* Dates */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <input type="datetime-local" value={job.originDate} onChange={(e) => updateJob(job.key, { originDate: e.target.value })} style={{ fontSize: 10, color: '#9ca3af' }} />
                      {isFM && <input type="datetime-local" value={job.destinationDate} onChange={(e) => updateJob(job.key, { destinationDate: e.target.value })} style={{ fontSize: 10, color: '#9ca3af' }} />}
                    </div>

                    {/* Rate/fee display */}
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
                            return <span style={{ fontSize: 10, fontWeight: 600, color: '#b45309', padding: '1px 6px', background: '#fefce8', borderRadius: 4, border: '1px solid #fde68a' }}>No FTL rate for this route + truck type</span>;
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

          {/* Shipment totals */}
          {jobs.length > 0 && totals.size > 0 && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>Shipment Total</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {Array.from(totals.entries()).map(([curr, total]) => (
                  <span key={curr} style={{ fontSize: 12, fontWeight: 700, color: '#111827', fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(curr, total)}</span>
                ))}
                {jobsMissingRate > 0 && <span style={{ fontSize: 10, color: '#b45309' }}>*{jobsMissingRate} job{jobsMissingRate > 1 ? 's' : ''} missing rate</span>}
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
          <button type="button" onClick={() => navigate('/trips')} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff', color: '#374151', border: '1px solid #e5e7eb', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button type="submit" style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#152CFF', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Create Shipment</button>
        </div>
      </form>
    </div>
  );
}
