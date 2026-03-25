import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { customers, vendors, serviceTypes, SERVICE_CONFIG, formatCurrency, getL2ByCostId } from '../data/mockData';
import type { Job, Trip, ServiceType, Currency, FeeLineItem } from '../data/mockData';
import { useTrips, generateTripId, generateJobId } from '../context/TripContext';
import { useRates } from '../context/RateContext';
import { useToast } from '../components/Toast';
import LocationDropdown from '../components/shared/LocationDropdown';
import VendorComparisonPopover from '../components/shared/VendorComparisonPopover';

interface JobDraft {
  key: string;
  serviceCode: string;
  vendorCode: string;
  originLocationId: string;
  originDate: string;
  destinationLocationId: string;
  destinationDate: string;
  locationId: string; // for location-type services
}

const svcColors: Record<string, string> = {
  FM: '#152CFF', CR: '#2563eb', EC: '#7c3aed', CS: '#b45309', OH: '#6b7280',
};

export default function CreateTripPage() {
  const navigate = useNavigate();
  const { addTrip } = useTrips();
  const { lookupRate, lookupAllL2Rates, getLocationById } = useRates();
  const toast = useToast();

  const [customerCode, setCustomerCode] = useState('');
  const [mawb, setMawb] = useState('');
  const [bags, setBags] = useState('');
  const [weight, setWeight] = useState('');
  const [remarks, setRemarks] = useState('');
  const [jobs, setJobs] = useState<JobDraft[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [compareKey, setCompareKey] = useState<string | null>(null);

  function addJobForService(svc: ServiceType) {
    setJobs((prev) => [...prev, {
      key: crypto.randomUUID(),
      serviceCode: svc.code,
      vendorCode: '',
      originLocationId: '',
      originDate: '',
      destinationLocationId: '',
      destinationDate: '',
      locationId: '',
    }]);
  }

  function updateJob(key: string, updates: Partial<JobDraft>) {
    setJobs((prev) => prev.map((j) => (j.key === key ? { ...j, ...updates } : j)));
  }

  function removeJob(key: string) {
    setJobs((prev) => prev.filter((j) => j.key !== key));
  }

  // Rate lookup for a job draft
  function getJobRate(job: JobDraft) {
    if (!job.vendorCode || !job.serviceCode) return null;
    const cfg = SERVICE_CONFIG[job.serviceCode];
    if (!cfg) return null;
    if (cfg.rateType === 'route') {
      if (!job.originLocationId || !job.destinationLocationId) return null;
      return lookupRate(job.vendorCode, job.serviceCode, undefined, job.originLocationId, job.destinationLocationId);
    } else {
      if (!job.locationId) return null;
      return lookupRate(job.vendorCode, job.serviceCode, job.locationId);
    }
  }

  // Cost calculation
  function calcCost(job: JobDraft): { currency: Currency; amount: number } | null {
    const rate = getJobRate(job);
    if (!rate) return null;
    let amount = rate.amount;
    if (rate.unit === 'per-kg') amount *= Number(weight) || 0;
    else if (rate.unit === 'per-bag') amount *= Number(bags) || 0;
    return { currency: rate.currency, amount };
  }

  // Order totals grouped by currency
  function orderTotals(): Map<Currency, { total: number; jobCount: number }> {
    const totals = new Map<Currency, { total: number; jobCount: number }>();
    for (const job of jobs) {
      const cost = calcCost(job);
      if (cost) {
        const existing = totals.get(cost.currency) ?? { total: 0, jobCount: 0 };
        existing.total += cost.amount;
        existing.jobCount += 1;
        totals.set(cost.currency, existing);
      }
    }
    return totals;
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (!customerCode) errs.push('Customer is required');
    if (jobs.length === 0) errs.push('Add at least one job (click a service above)');
    jobs.forEach((job, i) => {
      const label = `J${String(i + 1).padStart(2, '0')}`;
      if (!job.vendorCode) errs.push(`${label}: select a vendor`);
      const cfg = SERVICE_CONFIG[job.serviceCode];
      if (cfg?.rateType === 'route') {
        if (!job.originLocationId) errs.push(`${label}: select origin`);
        if (!job.destinationLocationId) errs.push(`${label}: select destination`);
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

    const tripJobs: Job[] = jobs.map((draft, i) => {
      const vendor = vendors.find((v) => v.code === draft.vendorCode)!;
      const svc = serviceTypes.find((s) => s.code === draft.serviceCode)!;
      const cfg = SERVICE_CONFIG[draft.serviceCode];
      const isRoute = cfg?.rateType === 'route';

      // Resolve location names
      let originName = '';
      let destName = '';
      if (isRoute) {
        originName = getLocationById(draft.originLocationId)?.name ?? draft.originLocationId;
        destName = getLocationById(draft.destinationLocationId)?.name ?? draft.destinationLocationId;
      } else {
        const locName = getLocationById(draft.locationId)?.name ?? draft.locationId;
        originName = locName;
        destName = locName;
      }

      const rate = getJobRate(draft);
      const cost = calcCost(draft);
      const orderBags = Number(bags) || 0;
      const orderWeight = Number(weight) || 0;

      // Generate fee line items from ALL matching L2 rates (HMW-34)
      const allRates = isRoute
        ? lookupAllL2Rates(draft.vendorCode, draft.serviceCode, undefined, draft.originLocationId, draft.destinationLocationId)
        : lookupAllL2Rates(draft.vendorCode, draft.serviceCode, draft.locationId);

      const fees: FeeLineItem[] = allRates.map((r, fi) => {
        const l2 = getL2ByCostId(r.costId);
        let qty = 1;
        if (r.unit === 'per-bag') qty = orderBags;
        else if (r.unit === 'per-kg') qty = orderWeight;
        return {
          id: `F-${Date.now()}-${i}-${fi}`,
          name: l2?.name ?? r.costId,
          rateId: r.id,
          currency: r.currency,
          rate: r.amount,
          unit: r.unit,
          quantity: qty,
          amount: r.amount * qty,
        };
      });
      const feeTotal = fees.reduce((sum, f) => sum + f.amount, 0);

      return {
        id: generateJobId(tripId, jobs.slice(0, i).map((_, idx) => ({ id: `${tripId}-J${String(idx + 1).padStart(2, '0')}` }))),
        vendor: { code: vendor.code, name: vendor.name },
        origin: { location: originName, date: draft.originDate || '' },
        destination: { location: destName, date: draft.destinationDate || '' },
        service: svc,
        status: 'Pending' as const, proofStatus: 'awaiting' as const,
        duration: null,
        execution: null,
        activityLog: [{ id: `log-${Date.now()}-${i}`, timestamp: now.toISOString().replace('T', ' ').slice(0, 16), action: 'Job created', user: 'Ops Admin', details: `Assigned to ${vendor.name}` }],
        proofDocuments: [],
        rateId: rate?.id,
        agreedRate: rate ? { currency: rate.currency, amount: rate.amount, unit: rate.unit } : undefined,
        agreedCost: cost ? { currency: cost.currency, amount: feeTotal || cost.amount } : undefined,
        fees,
        jobBags: orderBags,
        jobWeight: orderWeight,
      };
    });

    const trip: Trip = {
      id: tripId,
      customer: { name: customer.name, code: customer.code },
      mawb,
      bags: Number(bags) || 0,
      weight: Number(weight) || 0,
      remarks,
      createdAt,
      jobs: tripJobs,
    };

    addTrip(trip);
    toast.success(`Order created — ${tripId}`);
    navigate('/trips');
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 6 };

  // Count jobs per service
  const svcCounts: Record<string, number> = {};
  jobs.forEach((j) => { svcCounts[j.serviceCode] = (svcCounts[j.serviceCode] || 0) + 1; });

  const totals = orderTotals();
  const jobsMissingRate = jobs.filter((j) => j.vendorCode && !getJobRate(j)).length;

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <button onClick={() => navigate('/trips')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={16} />
        </button>
        <h1 style={{ fontSize: 16, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px', margin: 0 }}>Create Delivery Order</h1>
      </div>
      <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 20, marginLeft: 44 }}>Define what needs to happen and assign vendors.</p>

      <form onSubmit={handleSubmit}>
        {errors.length > 0 && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>Please fix:</div>
            {errors.map((e, i) => <div key={i} style={{ fontSize: 11, color: '#dc2626', padding: '1px 0' }}>{e}</div>)}
          </div>
        )}

        {/* Step 1: Order Details */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 22, height: 22, borderRadius: 5, background: '#152CFF', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Order Details</span>
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
            <div style={{ flex: 1 }}><label style={labelStyle}>Remarks</label><input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes" style={{ width: '100%' }} /></div>
          </div>
        </div>

        {/* Step 2: Add Services + Assign Vendors */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 22, height: 22, borderRadius: 5, background: '#152CFF', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Add Services</span>
          </div>
          <p style={{ fontSize: 10, color: '#9ca3af', marginBottom: 12, marginLeft: 30 }}>Click a service to add a job. Each click = 1 job with that service.</p>

          {/* Quick-add service bar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {serviceTypes.map((svc) => {
              const count = svcCounts[svc.code] || 0;
              return (
                <button
                  key={svc.code}
                  type="button"
                  onClick={() => addJobForService(svc)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 14, color: svcColors[svc.code] || '#152CFF' }}>+</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: svcColors[svc.code] || '#9ca3af' }}>{svc.code}</span>
                  {svc.label}
                  {count > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: svcColors[svc.code] || '#152CFF', color: '#fff', marginLeft: 2 }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Job rows */}
          {jobs.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', border: '1px dashed #e5e7eb', borderRadius: 6, background: '#f9fafb' }}>
              <p style={{ fontSize: 11, color: '#9ca3af' }}>Click a service above to add jobs</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {jobs.map((job, i) => {
                const svc = serviceTypes.find((s) => s.code === job.serviceCode);
                const color = svcColors[job.serviceCode] || '#152CFF';
                const cfg = SERVICE_CONFIG[job.serviceCode];
                const isRoute = cfg?.rateType === 'route';
                const rate = getJobRate(job);
                const cost = calcCost(job);
                const hasVendorAndLocation = job.vendorCode && (isRoute ? job.originLocationId && job.destinationLocationId : job.locationId);

                return (
                  <div key={job.key} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: 12 }}>
                    {/* Job header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color }}>J{String(i + 1).padStart(2, '0')}</span>
                        <span style={{ padding: '1px 6px', borderRadius: 99, fontSize: 9, fontWeight: 700, background: `${color}12`, border: `1px solid ${color}25`, color }}>
                          {svc?.code} {svc?.label}
                        </span>
                      </div>
                      <button type="button" onClick={() => removeJob(job.key)} style={{ padding: 2, color: '#d1d5db', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={12} />
                      </button>
                    </div>

                    {/* Vendor + Location/Route */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                      <select value={job.vendorCode} onChange={(e) => updateJob(job.key, { vendorCode: e.target.value })} style={{ width: 140, fontSize: 11 }}>
                        <option value="">Vendor...</option>
                        {vendors.map((v) => <option key={v.code} value={v.code}>{v.name}</option>)}
                      </select>
                      {/* Compare button */}
                      {hasVendorAndLocation && (
                        <div style={{ position: 'relative' }}>
                          <button type="button" onClick={() => setCompareKey(compareKey === job.key ? null : job.key)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #e5e7eb', background: compareKey === job.key ? 'rgba(21,44,255,0.06)' : '#fff', color: compareKey === job.key ? '#152CFF' : '#9ca3af', fontSize: 9, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                            Compare
                          </button>
                          {compareKey === job.key && (
                            <VendorComparisonPopover
                              serviceCode={job.serviceCode}
                              locationId={isRoute ? undefined : job.locationId}
                              originLocationId={isRoute ? job.originLocationId : undefined}
                              destinationLocationId={isRoute ? job.destinationLocationId : undefined}
                              currentVendorCode={job.vendorCode}
                              onSelect={(vc) => updateJob(job.key, { vendorCode: vc })}
                              onClose={() => setCompareKey(null)}
                            />
                          )}
                        </div>
                      )}
                      {isRoute ? (
                        <>
                          <div style={{ flex: 1 }}>
                            <LocationDropdown value={job.originLocationId} onChange={(id) => updateJob(job.key, { originLocationId: id })} placeholder="Origin..." excludeId={job.destinationLocationId} />
                          </div>
                          <ArrowRight size={12} style={{ color: '#d1d5db', flexShrink: 0, alignSelf: 'center', marginTop: 4 }} />
                          <div style={{ flex: 1 }}>
                            <LocationDropdown value={job.destinationLocationId} onChange={(id) => updateJob(job.key, { destinationLocationId: id })} placeholder="Destination..." excludeId={job.originLocationId} />
                          </div>
                        </>
                      ) : (
                        <div style={{ flex: 1 }}>
                          <LocationDropdown value={job.locationId} onChange={(id) => updateJob(job.key, { locationId: id })} placeholder="Location..." />
                        </div>
                      )}
                    </div>

                    {/* Dates */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <input type="datetime-local" value={job.originDate} onChange={(e) => updateJob(job.key, { originDate: e.target.value })} style={{ fontSize: 10, color: '#9ca3af' }} />
                      {isRoute && <input type="datetime-local" value={job.destinationDate} onChange={(e) => updateJob(job.key, { destinationDate: e.target.value })} style={{ fontSize: 10, color: '#9ca3af' }} />}
                    </div>

                    {/* Rate badge — shows L2 fee count + total */}
                    {hasVendorAndLocation && (
                      <div style={{ marginTop: 4 }}>
                        {(() => {
                          const allRates = isRoute
                            ? lookupAllL2Rates(job.vendorCode, job.serviceCode, undefined, job.originLocationId, job.destinationLocationId)
                            : lookupAllL2Rates(job.vendorCode, job.serviceCode, job.locationId);
                          if (allRates.length > 0) {
                            const total = allRates.reduce((sum, r) => {
                              let qty = 1;
                              if (r.unit === 'per-bag') qty = Number(bags) || 0;
                              else if (r.unit === 'per-kg') qty = Number(weight) || 0;
                              return sum + r.amount * qty;
                            }, 0);
                            const curr = allRates[0].currency;
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 600, color: '#152CFF', fontFamily: "'JetBrains Mono', monospace" }}>
                                  {allRates.length} L2 fee{allRates.length > 1 ? 's' : ''}
                                </span>
                                <span style={{ fontSize: 10, color: '#6b7280' }}>
                                  = <strong style={{ color: '#111827', fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(curr, total)}</strong>
                                </span>
                              </div>
                            );
                          }
                          return <span style={{ fontSize: 10, fontWeight: 600, color: '#b45309', padding: '1px 6px', background: '#fefce8', borderRadius: 4, border: '1px solid #fde68a' }}>No rate on file</span>;
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Order totals */}
          {jobs.length > 0 && totals.size > 0 && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>Order Total</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {Array.from(totals.entries()).map(([curr, { total }]) => (
                  <span key={curr} style={{ fontSize: 12, fontWeight: 700, color: '#111827', fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatCurrency(curr, total)}
                  </span>
                ))}
                {jobsMissingRate > 0 && (
                  <span style={{ fontSize: 10, color: '#b45309' }}>*{jobsMissingRate} job{jobsMissingRate > 1 ? 's' : ''} missing rate</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
          <button type="button" onClick={() => navigate('/trips')} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff', color: '#374151', border: '1px solid #e5e7eb', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button type="submit" style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#152CFF', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Create Order</button>
        </div>
      </form>
    </div>
  );
}
