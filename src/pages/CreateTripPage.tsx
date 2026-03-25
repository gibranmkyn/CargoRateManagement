import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { customers, vendors, serviceTypes } from '../data/mockData';
import type { Job, Trip, ServiceType } from '../data/mockData';
import { useTrips, generateTripId, generateJobId } from '../context/TripContext';
import { useToast } from '../components/Toast';

interface JobDraft {
  key: string;
  serviceCode: string;
  vendorCode: string;
  originLocation: string;
  originDate: string;
  destinationLocation: string;
  destinationDate: string;
}

const svcColors: Record<string, string> = {
  FM: '#0D9488', CR: '#2563eb', EC: '#7c3aed', CS: '#b45309', OH: '#6b7280',
};

export default function CreateTripPage() {
  const navigate = useNavigate();
  const { addTrip } = useTrips();
  const toast = useToast();

  const [customerCode, setCustomerCode] = useState('');
  const [mawb, setMawb] = useState('');
  const [bags, setBags] = useState('');
  const [weight, setWeight] = useState('');
  const [remarks, setRemarks] = useState('');
  const [jobs, setJobs] = useState<JobDraft[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  function addJobForService(svc: ServiceType) {
    setJobs((prev) => [...prev, {
      key: crypto.randomUUID(),
      serviceCode: svc.code,
      vendorCode: '',
      originLocation: '',
      originDate: '',
      destinationLocation: '',
      destinationDate: '',
    }]);
  }

  function updateJob(key: string, updates: Partial<JobDraft>) {
    setJobs((prev) => prev.map((j) => (j.key === key ? { ...j, ...updates } : j)));
  }

  function removeJob(key: string) {
    setJobs((prev) => prev.filter((j) => j.key !== key));
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (!customerCode) errs.push('Customer is required');
    if (jobs.length === 0) errs.push('Add at least one job (click a service above)');
    jobs.forEach((job, i) => {
      const label = `J${String(i + 1).padStart(2, '0')}`;
      if (!job.vendorCode) errs.push(`${label}: select a vendor`);
      if (!job.originLocation) errs.push(`${label}: enter origin`);
      if (!job.destinationLocation) errs.push(`${label}: enter destination`);
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
      return {
        id: generateJobId(tripId, jobs.slice(0, i)),
        vendor: { code: vendor.code, name: vendor.name },
        origin: { location: draft.originLocation, date: draft.originDate || '' },
        destination: { location: draft.destinationLocation, date: draft.destinationDate || '' },
        service: svc,
        status: 'Pending' as const,
        duration: null,
        execution: null,
        activityLog: [{ id: `log-${Date.now()}-${i}`, timestamp: now.toISOString().replace('T', ' ').slice(0, 16), action: 'Job created', user: 'Ops Admin', details: `Assigned to ${vendor.name}` }],
        proofDocuments: [],
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
            <span style={{ width: 22, height: 22, borderRadius: 5, background: '#0D9488', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
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
            <span style={{ width: 22, height: 22, borderRadius: 5, background: '#0D9488', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
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
                  <span style={{ fontSize: 14, color: svcColors[svc.code] || '#0D9488' }}>+</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: svcColors[svc.code] || '#9ca3af' }}>{svc.code}</span>
                  {svc.label}
                  {count > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: svcColors[svc.code] || '#0D9488', color: '#fff', marginLeft: 2 }}>{count}</span>
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
                const color = svcColors[job.serviceCode] || '#0D9488';
                return (
                  <div key={job.key} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: 12 }}>
                    {/* Job header: number + service badge + remove */}
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
                    {/* Vendor + Route */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <select value={job.vendorCode} onChange={(e) => updateJob(job.key, { vendorCode: e.target.value })} style={{ width: 140, fontSize: 11 }}>
                        <option value="">Vendor...</option>
                        {vendors.map((v) => <option key={v.code} value={v.code}>{v.name}</option>)}
                      </select>
                      <input type="text" value={job.originLocation} onChange={(e) => updateJob(job.key, { originLocation: e.target.value })} placeholder="Origin" style={{ flex: 1, fontSize: 11 }} />
                      <ArrowRight size={12} style={{ color: '#d1d5db', flexShrink: 0, alignSelf: 'center' }} />
                      <input type="text" value={job.destinationLocation} onChange={(e) => updateJob(job.key, { destinationLocation: e.target.value })} placeholder="Destination" style={{ flex: 1, fontSize: 11 }} />
                    </div>
                    {/* Dates */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="datetime-local" value={job.originDate} onChange={(e) => updateJob(job.key, { originDate: e.target.value })} style={{ fontSize: 10, color: '#9ca3af' }} />
                      <input type="datetime-local" value={job.destinationDate} onChange={(e) => updateJob(job.key, { destinationDate: e.target.value })} style={{ fontSize: 10, color: '#9ca3af' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
          <button type="button" onClick={() => navigate('/trips')} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff', color: '#374151', border: '1px solid #e5e7eb', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button type="submit" style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#0D9488', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Create Order</button>
        </div>
      </form>
    </div>
  );
}
