import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Image, Clock, MapPin, Camera, Truck, User, Phone } from 'lucide-react';
import { useTrips } from '../../../shared/TripContext';
import { useToast } from '../../../shared/Toast';
import { formatCurrency, seedDrivers, seedVehicles } from '../../../shared/mockData';
import type { ProofDocument } from '../../../shared/types';
import { useVendorAuth } from '../context/VendorAuthContext';

// --- Helpers ---

function fmtDateTime(dt: string) {
  if (!dt) return '\u2014';
  const d = new Date(dt.replace(' ', 'T'));
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' \u00b7 ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtTime(dt: string) {
  return new Date(dt.replace(' ', 'T')).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtDateShort(dt: string) {
  return new Date(dt.replace(' ', 'T')).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function fmtDateMono(dt: string) {
  if (!dt) return '\u2014';
  const d = new Date(dt.replace(' ', 'T'));
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function docIcon(doc: ProofDocument) {
  return doc.type.startsWith('image/') ? <Image size={12} style={{ color: '#152CFF' }} /> : <FileText size={12} style={{ color: '#152CFF' }} />;
}

// --- Styles ---

const sectionTitle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 8,
};

const sectionWrap: React.CSSProperties = {
  padding: '14px 16px',
  borderTop: '1px solid #f3f4f6',
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

// --- Component ---

export default function JobDetailPage() {
  const { tripId, jobId } = useParams<{ tripId: string; jobId: string }>();
  const navigate = useNavigate();
  const { trips, startJob, addActivityLog, addProofDocument, updateJob } = useTrips();
  const toast = useToast();
  const { vendorCode, vendorName } = useVendorAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const trip = trips.find((t) => t.id === tripId);
  const job = trip?.jobs.find((j) => j.id === jobId);

  if (!trip || !job) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: 20 }}>
        <button onClick={() => navigate('/jobs')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#152CFF', padding: 0, fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif" }}>
          <ArrowLeft size={12} /> My Jobs
        </button>
        <div style={{ marginTop: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Job not found</div>
      </div>
    );
  }

  const isFM = job.service.code === 'FM';
  const isOH = job.service.code === 'OH';
  const fees = job.fees ?? [];
  const proofs = job.proofDocuments ?? [];
  const log = job.activityLog ?? [];
  const activeFees = fees.filter((f) => f.active !== false);
  const feeTotals = new Map<string, number>();
  activeFees.forEach((f) => feeTotals.set(f.currency, (feeTotals.get(f.currency) ?? 0) + f.amount));
  const canUpload = job.status === 'Pending' || job.status === 'In Progress';
  const canAssign = job.status === 'Pending' || job.status === 'In Progress';

  // Fleet data for dispatch assignment
  const vendorDrivers = seedDrivers.filter((d) => d.vendorCode === vendorCode && d.isActive);
  const vendorVehicles = seedVehicles.filter((v) => v.vendorCode === vendorCode && v.isActive);

  // --- Actions ---

  function handleStartJob() {
    if (!tripId || !jobId) return;
    startJob(tripId, jobId);
    addActivityLog(tripId, jobId, { id: `log-${Date.now()}`, timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19), action: 'Job started', user: vendorName });
    toast.success('Job started');
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !tripId || !jobId) return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const names: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const doc: ProofDocument = {
        id: `proof-${Date.now()}-${i}`,
        name: file.name,
        type: file.type,
        uploadedAt: now,
        uploadedBy: vendorName,
        url: URL.createObjectURL(file),
      };
      addProofDocument(tripId, jobId, doc);
      names.push(file.name);
    }

    addActivityLog(tripId, jobId, {
      id: `log-${Date.now()}`,
      timestamp: now,
      action: files.length === 1 ? 'Proof uploaded' : `Uploaded ${files.length} files`,
      user: vendorName,
      details: names.join(', '),
    });

    toast.success(files.length === 1 ? 'Proof uploaded' : `${files.length} files uploaded`);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleAssignDispatch() {
    if (!tripId || !jobId || !selectedDriverId || !selectedVehicleId) return;
    const driver = seedDrivers.find((d) => d.id === selectedDriverId);
    const vehicle = seedVehicles.find((v) => v.id === selectedVehicleId);
    if (!driver || !vehicle) return;

    updateJob(tripId, jobId, {
      driverAssignment: { driverId: driver.id, name: driver.name, phone: driver.phone },
      vehicleAssignment: { vehicleId: vehicle.id, plateNumber: vehicle.plateNumber, truckType: vehicle.truckType },
    });
    addActivityLog(tripId, jobId, {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      action: `Assigned ${driver.name} + ${vehicle.plateNumber}`,
      user: vendorName,
    });
    toast.success(`Assigned ${driver.name} + ${vehicle.plateNumber}`);
  }

  // --- Status Action Bar config ---
  const statusBarConfig: Record<string, { bg: string; border: string; chipBg: string; chipBorder: string; chipColor: string; dotColor: string }> = {
    Pending: { bg: '#f9fafb', border: '#e5e7eb', chipBg: '#f3f4f6', chipBorder: '#e5e7eb', chipColor: '#9ca3af', dotColor: '#9ca3af' },
    'In Progress': { bg: 'rgba(21,44,255,0.04)', border: 'rgba(21,44,255,0.15)', chipBg: 'rgba(21,44,255,0.06)', chipBorder: 'rgba(21,44,255,0.15)', chipColor: '#152CFF', dotColor: '#152CFF' },
    Completed: { bg: '#fefce8', border: '#fde68a', chipBg: '#fefce8', chipBorder: '#fde68a', chipColor: '#a16207', dotColor: '#a16207' },
    Verified: { bg: '#f0fdf4', border: '#a7f3d0', chipBg: '#f0fdf4', chipBorder: '#a7f3d0', chipColor: '#059669', dotColor: '#059669' },
    Cancelled: { bg: '#fef2f2', border: '#fecaca', chipBg: '#fef2f2', chipBorder: '#fecaca', chipColor: '#dc2626', dotColor: '#dc2626' },
  };
  const sc = statusBarConfig[job.status] ?? statusBarConfig.Pending;
  const completedEntry = log.find((e) => e.action === 'Proof uploaded' || e.action.toLowerCase().includes('completed') || e.action.startsWith('Uploaded'));
  const verifiedEntry = log.find((e) => e.action.toLowerCase().includes('verified') || e.action.toLowerCase().includes('verify'));

  // ===== Shared sub-components =====

  const renderStatusActionBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 6, marginBottom: 0, background: sc.bg, border: `1px solid ${sc.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: sc.chipBg, border: `1px solid ${sc.chipBorder}`, color: sc.chipColor }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dotColor, display: 'inline-block' }} />
          {job.status}
        </span>
        <span style={{ fontSize: 11, color: '#374151' }}>
          {job.status === 'Pending' && 'Start this job when you begin work'}
          {job.status === 'In Progress' && 'Upload proof of service to mark complete'}
          {job.status === 'Completed' && 'Waiting for Teleport verification'}
          {job.status === 'Verified' && 'Verified by Teleport \u2014 ready for billing'}
          {job.status === 'Cancelled' && `Cancelled by Teleport${job.cancelReason ? ` \u2014 ${job.cancelReason}` : ''}`}
        </span>
      </div>
      <div>
        {job.status === 'Pending' && <button onClick={handleStartJob} style={{ padding: '6px 16px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#152CFF', color: '#fff', fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif" }}>Start Job &rarr;</button>}
        {job.status === 'In Progress' && <button onClick={() => fileRef.current?.click()} style={{ padding: '6px 16px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#152CFF', color: '#fff', fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif" }}><Upload size={11} /> Upload Proof</button>}
        {job.status === 'Completed' && completedEntry && <span style={{ ...mono, fontSize: 10, color: '#a16207' }}>{fmtDateTime(completedEntry.timestamp)}</span>}
        {job.status === 'Verified' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, ...mono, fontSize: 10, color: '#059669' }}>&#10003; Verified{verifiedEntry ? ` \u00b7 ${fmtDateTime(verifiedEntry.timestamp)}` : ''}</span>}
      </div>
    </div>
  );

  const renderCancelReason = () => {
    if (job.status !== 'Cancelled' || !job.cancelReason) return null;
    const cancelEntry = log.find((e) => e.action.toLowerCase().includes('cancel'));
    return (
      <div style={{ padding: '8px 10px', background: '#fff', border: '1px solid #fecaca', borderRadius: 6, marginTop: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#dc2626', marginBottom: 4 }}>Cancellation Reason</div>
        <div style={{ fontSize: 11, color: '#374151' }}>{job.cancelReason}</div>
        {cancelEntry && (
          <div style={{ ...mono, fontSize: 9, color: '#9ca3af', marginTop: 4 }}>{fmtDateTime(cancelEntry.timestamp)}</div>
        )}
      </div>
    );
  };

  const renderCompletionRemark = () => {
    if (!((job.status === 'Completed' || job.status === 'Verified') && job.completionRemark)) return null;
    return (
      <div style={{ padding: '8px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, marginTop: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a16207', marginBottom: 4 }}>Completion Remark</div>
        <div style={{ fontSize: 11, color: '#374151' }}>{job.completionRemark}</div>
      </div>
    );
  };

  const renderCargo = () => (
    <div style={sectionWrap}>
      <div style={sectionTitle}>Cargo</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div>
          <div style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 2 }}>Bags</div>
          <div style={{ ...mono, fontSize: 11, fontWeight: 600, color: '#111827' }}>{(job.jobBags ?? trip.bags).toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 2 }}>Weight</div>
          <div style={{ ...mono, fontSize: 11, fontWeight: 600, color: '#111827' }}>{(job.jobWeight ?? trip.weight).toLocaleString()} kg</div>
        </div>
        {(job.jobVolume ?? 0) > 0 && (
          <div>
            <div style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 2 }}>Volume</div>
            <div style={{ ...mono, fontSize: 11, fontWeight: 600, color: '#111827' }}>{(job.jobVolume ?? 0).toLocaleString()} CBM</div>
          </div>
        )}
      </div>
    </div>
  );

  const renderFeeBreakdown = () => (
    <div style={sectionWrap}>
      <div style={sectionTitle}>Fee Breakdown</div>
      {fees.length > 0 ? (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb' }}>Fee</th>
                <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', width: 60 }}>Unit</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', width: 70 }}>Rate</th>
                <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', width: 50 }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '6px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', width: 90 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => {
                const isActive = fee.active !== false;
                return (
                  <tr key={fee.id} style={{ opacity: isActive ? 1 : 0.4 }}>
                    <td style={{ padding: '6px 10px', fontSize: 11, fontWeight: 500, color: '#111827', borderBottom: '1px solid #f3f4f6', textDecoration: isActive ? 'none' : 'line-through' }}>{fee.name}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', ...mono, fontSize: 10, color: '#374151', textDecoration: isActive ? 'none' : 'line-through' }}>{fee.unit === 'flat' ? 'trip' : fee.unit.replace('per-', '')}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #f3f4f6', ...mono, fontSize: 10, color: '#374151', textDecoration: isActive ? 'none' : 'line-through' }}>{formatCurrency(fee.currency, fee.rate)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid #f3f4f6', ...mono, fontSize: 10, color: '#374151', textDecoration: isActive ? 'none' : 'line-through' }}>{isActive ? fee.quantity : '\u2014'}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '1px solid #f3f4f6', ...mono, fontSize: 10, fontWeight: 600, color: isActive ? '#111827' : '#d1d5db' }}>{isActive ? formatCurrency(fee.currency, fee.amount) : '\u2014'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '8px 10px', borderTop: '2px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#374151' }}>Total (active fees)</span>
            <div>{Array.from(feeTotals.entries()).map(([curr, total]) => (<div key={curr} style={{ ...mono, fontSize: 11, fontWeight: 700, color: '#111827', textAlign: 'right' }}>{formatCurrency(curr as any, total)}</div>))}</div>
          </div>
        </div>
      ) : (
        <div style={{ padding: 16, textAlign: 'center', fontSize: 10, color: '#d1d5db', fontStyle: 'italic', border: '1px dashed #e5e7eb', borderRadius: 6 }}>No fees configured for this job</div>
      )}
      {fees.some((f) => f.active === false) && (
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 6 }}>Struck-through fees have been removed by Teleport and will not appear on the settlement.</div>
      )}
    </div>
  );

  const renderProofs = () => (
    <div style={sectionWrap}>
      <div style={sectionTitle}>Proof of Service</div>
      {proofs.length > 0 ? (
        <div style={{ marginBottom: canUpload ? 10 : 0 }}>
          {proofs.map((doc) => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
              {docIcon(doc)}
              <span style={{ fontSize: 11, fontWeight: 500, color: '#111827', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
              <span style={{ ...mono, fontSize: 9, color: '#9ca3af', flexShrink: 0 }}>{fmtDateTime(doc.uploadedAt)}</span>
            </div>
          ))}
        </div>
      ) : (
        !canUpload && <div style={{ padding: 16, textAlign: 'center', fontSize: 10, color: '#d1d5db', fontStyle: 'italic', border: '1px dashed #e5e7eb', borderRadius: 6 }}>No proof documents</div>
      )}

      {canUpload && (
        <div onClick={() => fileRef.current?.click()} style={{ padding: '12px 16px', textAlign: 'center', border: '1.5px dashed rgba(21,44,255,0.25)', borderRadius: 6, cursor: 'pointer', background: 'rgba(21,44,255,0.02)', transition: 'border-color 150ms, background 150ms' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(21,44,255,0.5)'; e.currentTarget.style.background = 'rgba(21,44,255,0.04)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(21,44,255,0.25)'; e.currentTarget.style.background = 'rgba(21,44,255,0.02)'; }}
        >
          <Upload size={16} style={{ color: '#152CFF', margin: '0 auto 6px', display: 'block' }} />
          <div style={{ fontSize: 12, fontWeight: 600, color: '#152CFF', marginBottom: 2 }}>Drop files here or browse</div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 6 }}>Select multiple files at once</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(21,44,255,0.06)', color: '#152CFF', border: '1px solid rgba(21,44,255,0.12)' }}>
            <Camera size={10} /> Take Photo
          </span>
        </div>
      )}
    </div>
  );

  const renderActivityLog = () => (
    <div style={sectionWrap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...sectionTitle }}>
        <span>Activity Log</span>
        <span style={{ ...mono, fontSize: 9, background: '#f3f4f6', color: '#9ca3af', padding: '1px 5px', borderRadius: 99 }}>{log.length}</span>
      </div>
      {log.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {log.slice().reverse().map((entry) => (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ ...mono, fontSize: 9, color: '#9ca3af', minWidth: 90, flexShrink: 0, paddingTop: 1 }}>{fmtDateShort(entry.timestamp)} {fmtTime(entry.timestamp)}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, color: '#111827' }}>{entry.action}</span>
                {entry.user && <span style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginLeft: 4 }}>&mdash; {entry.user}</span>}
                {entry.details && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{entry.details}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: 16, textAlign: 'center' }}>
          <Clock size={14} style={{ color: '#d1d5db', margin: '0 auto 4px' }} />
          <div style={{ fontSize: 10, color: '#d1d5db' }}>No activity yet</div>
        </div>
      )}
    </div>
  );

  // ===== FM-only sections =====

  const renderDriverVehicle = () => (
    <div style={sectionWrap}>
      <div style={sectionTitle}>
        <Truck size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
        Driver &amp; Vehicle
      </div>
      {job.driverAssignment ? (
        /* Assigned state */
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#f9fafb' }}>
          <User size={14} style={{ color: '#152CFF', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#152CFF' }}>{job.driverAssignment.name}</span>
          {job.vehicleAssignment && (
            <span style={{ ...mono, fontSize: 11, fontWeight: 600, color: '#374151' }}>{job.vehicleAssignment.plateNumber}</span>
          )}
          <span style={{ ...mono, fontSize: 10, color: '#9ca3af' }}>
            <Phone size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
            {job.driverAssignment.phone}
          </span>
          {canAssign && (
            <button
              onClick={() => { updateJob(tripId!, jobId!, { driverAssignment: undefined, vehicleAssignment: undefined }); setSelectedDriverId(''); setSelectedVehicleId(''); }}
              style={{ marginLeft: 'auto', fontSize: 9, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
            >
              Reassign
            </button>
          )}
        </div>
      ) : canAssign ? (
        /* No driver — dropdowns */
        <div style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 6, background: '#f9fafb' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={selectedDriverId}
              onChange={(e) => {
                setSelectedDriverId(e.target.value);
                const d = seedDrivers.find((x) => x.id === e.target.value);
                if (d?.defaultVehicleId && !selectedVehicleId) setSelectedVehicleId(d.defaultVehicleId);
              }}
              style={{ flex: 1, fontSize: 11, padding: '5px 8px', border: '1px solid #e5e7eb', borderRadius: 4, fontFamily: 'inherit', background: '#fff' }}
            >
              <option value="">Select driver...</option>
              {vendorDrivers.map((d) => <option key={d.id} value={d.id}>{d.name} &middot; {d.phone}</option>)}
            </select>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              style={{ flex: 1, fontSize: 11, padding: '5px 8px', border: '1px solid #e5e7eb', borderRadius: 4, fontFamily: 'inherit', background: '#fff' }}
            >
              <option value="">Select vehicle...</option>
              {vendorVehicles.map((v) => <option key={v.id} value={v.id}>{v.plateNumber} &middot; {v.truckType}</option>)}
            </select>
            <button
              onClick={handleAssignDispatch}
              disabled={!selectedDriverId || !selectedVehicleId}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: 'none',
                cursor: selectedDriverId && selectedVehicleId ? 'pointer' : 'not-allowed',
                background: selectedDriverId && selectedVehicleId ? '#152CFF' : '#e5e7eb',
                color: selectedDriverId && selectedVehicleId ? '#fff' : '#9ca3af',
                fontFamily: 'inherit',
              }}
            >
              Assign
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '8px 10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>No driver assigned</div>
      )}
    </div>
  );

  const renderRoute = () => (
    <div style={sectionWrap}>
      <div style={sectionTitle}>Route</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Pickup */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 3 }}>Pickup</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>{job.origin.location}</div>
          {(job.origin.date || trip.pickupDate) && (
            <div style={{ ...mono, fontSize: 9, color: '#374151', marginTop: 2 }}>
              {job.origin.date ? fmtDateMono(job.origin.date) : trip.pickupDate}
            </div>
          )}
        </div>
        {/* Arrow */}
        <span style={{ fontSize: 16, color: '#d1d5db', flexShrink: 0 }}>&rarr;</span>
        {/* Delivery */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 3 }}>Delivery</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>{job.destination.location}</div>
          {(job.destination.date || trip.deliveryDate) && (
            <div style={{ ...mono, fontSize: 9, color: '#374151', marginTop: 2 }}>
              {job.destination.date ? fmtDateMono(job.destination.date) : trip.deliveryDate}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ===== Non-FM sections =====

  const renderLocation = () => (
    <div style={sectionWrap}>
      <div style={sectionTitle}>Location</div>
      <div style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#f9fafb' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{job.origin.location}</div>
        {/* Zone/area placeholder — show origin location context if available */}
        <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>
          {job.service.label} &middot; {job.origin.date ? fmtDateMono(job.origin.date) : trip.pickupDate || '\u2014'}
        </div>
      </div>
    </div>
  );

  const renderHubOpsProgress = () => {
    if (!isOH) return null;
    return (
      <div style={sectionWrap}>
        <div style={sectionTitle}>Hub Ops Progress</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div>
            <div style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 2 }}>Inbound</div>
            <div style={{ ...mono, fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>0/24</div>
          </div>
          <div>
            <div style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 2 }}>Processed</div>
            <div style={{ ...mono, fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>0/24</div>
          </div>
          <div>
            <div style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 2 }}>Outbound</div>
            <div style={{ ...mono, fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>0/24</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 20 }}>

      {/* ===== HEADER BAR ===== */}
      <div style={{ paddingBottom: 12, borderBottom: '1px solid #e5e7eb', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => navigate('/jobs')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#152CFF', padding: 0, fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif" }}>
              <ArrowLeft size={12} /> My Jobs
            </button>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span style={{ ...mono, fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#9ca3af' }}>{job.id}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{job.service.label}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 5px', borderRadius: 99, fontSize: 9, fontWeight: 600, background: 'rgba(21,44,255,0.06)', border: '1px solid rgba(21,44,255,0.1)' }}>
              <span style={{ color: '#152CFF', ...mono }}>{job.service.code}</span>
              <span style={{ color: '#374151' }}>{job.service.label}</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
            <span style={{ ...mono, fontSize: 10, color: '#9ca3af' }}>{trip.id}</span>
            <span style={{ color: '#d1d5db' }}>&middot;</span>
            <span style={{ fontWeight: 600, color: '#111827' }}>{trip.customer.name}</span>
            <span style={{ color: '#d1d5db' }}>&middot;</span>
            <span style={{ ...mono, fontSize: 10, color: '#9ca3af' }}>{trip.mawb}</span>
          </div>
        </div>
      </div>

      {/* Hidden file input — multi-file */}
      <input ref={fileRef} type="file" accept="image/*,.pdf" multiple style={{ display: 'none' }} onChange={handleUpload} />

      {/* ===== STATUS ACTION BAR ===== */}
      {renderStatusActionBar()}
      {renderCancelReason()}
      {renderCompletionRemark()}

      {/* ===== SERVICE-ADAPTIVE LAYOUT ===== */}
      {isFM ? (
        <>
          {/* FM: Driver & Vehicle → Route → Cargo → Fee Breakdown → Proofs → Activity Log */}
          {renderDriverVehicle()}
          {renderRoute()}
          {renderCargo()}
          {renderFeeBreakdown()}
          {renderProofs()}
          {renderActivityLog()}
        </>
      ) : (
        <>
          {/* Non-FM: Location → [Hub Ops for OH] → Cargo → Fee Breakdown → Proofs → Activity Log */}
          {renderLocation()}
          {renderHubOpsProgress()}
          {renderCargo()}
          {renderFeeBreakdown()}
          {renderProofs()}
          {renderActivityLog()}
        </>
      )}
    </div>
  );
}
