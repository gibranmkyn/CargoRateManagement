import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, FileText, Image, Clock, Truck, User, Phone, AlertTriangle, ExternalLink } from 'lucide-react';
import { useTrips } from '../../../shared/TripContext';
import { useToast } from '../../../shared/Toast';
import { seedDrivers, seedVehicles } from '../../../shared/mockData';
import type { ProofDocument } from '../../../shared/types';
import { useVendorAuth } from '../context/VendorAuthContext';
import { getStateStyle, fmtDateTime, fmtTime, fmtDateShort } from '../../../shared/statusStyles';

// --- Helpers ---

function fmtDateMono(dt: string) {
  if (!dt) return '\u2014';
  const d = new Date(dt.replace(' ', 'T'));
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
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

const btnPrimary: React.CSSProperties = {
  padding: '5px 14px', border: 'none', borderRadius: 4,
  background: '#152CFF', color: '#fff', fontSize: 11, fontWeight: 600,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
  fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif",
};

const btnGhost: React.CSSProperties = {
  padding: '5px 11px', border: '1px solid #e5e7eb', borderRadius: 4,
  background: '#fff', color: '#374151', fontSize: 11, fontWeight: 500,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
  fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif",
};

// --- Inline StateCell (vendor-side, mirrors admin StateCell logic) ---

function StateCell({ job, withSubline = false, fontSize = 11 }: {
  job: { status: string; verificationStatus: string; cancelReason?: string; rejectionReason?: string };
  withSubline?: boolean;
  fontSize?: number;
}) {
  const s = getStateStyle(job as Parameters<typeof getStateStyle>[0]);
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize, color: s.color, fontWeight: s.fontWeight, lineHeight: 1.2 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0, display: 'inline-block' }} />
        {s.label}
      </span>
      {withSubline && s.subline ? (
        <span style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.3, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.subline}>
          {s.subline}
        </span>
      ) : null}
    </div>
  );
}

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
          &larr; My Jobs
        </button>
        <div style={{ marginTop: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Job not found</div>
      </div>
    );
  }

  const isFM = job.service.code === 'FM';
  const isOH = job.service.code === 'OH';
  const proofs = job.proofDocuments ?? [];
  const log = job.activityLog ?? [];
  const canUpload = job.status === 'Pending' || job.status === 'In Progress' || job.status === 'Completed';
  const canAssign = job.status === 'Pending' || job.status === 'In Progress';
  const isVerified = job.verificationStatus === 'Verified';

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

  // --- Sub-renders ---

  const renderCargo = () => (
    <div style={sectionWrap}>
      <div style={sectionTitle}>Cargo</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div>
          <div style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 2 }}>Bags</div>
          <div style={{ ...mono, fontSize: 11, fontWeight: 600, color: '#111827' }}>{trip.bags.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 2 }}>Weight</div>
          <div style={{ ...mono, fontSize: 11, fontWeight: 600, color: '#111827' }}>{trip.weight.toLocaleString()} kg</div>
        </div>
      </div>
    </div>
  );

  const renderProofs = () => (
    <div style={sectionWrap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={sectionTitle}>Proof of Service &middot; {proofs.length} file{proofs.length === 1 ? '' : 's'}</div>
        {canUpload && !isVerified && (
          <button style={{ ...btnGhost, fontSize: 10, padding: '3px 8px' }} onClick={() => fileRef.current?.click()}>
            + Add
          </button>
        )}
      </div>
      {proofs.length === 0 ? (
        <div style={{ fontSize: 11, color: '#9ca3af', padding: '4px 0' }}>No proof uploaded yet.</div>
      ) : (
        proofs.map((doc, i) => (
          <ProofRow key={doc.id} doc={doc} last={i === proofs.length - 1} />
        ))
      )}
    </div>
  );

  const renderActivityLog = () => (
    <div style={sectionWrap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={sectionTitle}>Activity Log</div>
        <span style={{ ...mono, fontSize: 9, background: '#f3f4f6', color: '#9ca3af', padding: '1px 5px', borderRadius: 99 }}>{log.length}</span>
      </div>
      {log.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center' }}>
          <Clock size={14} style={{ color: '#d1d5db', margin: '0 auto 4px' }} />
          <div style={{ fontSize: 10, color: '#d1d5db' }}>No activity yet</div>
        </div>
      ) : log.length <= 10 ? (
        <div>
          {log.slice().reverse().map((entry, i, arr) => (
            <div
              key={entry.id}
              style={{
                display: 'flex', justifyContent: 'space-between', gap: 10,
                padding: '6px 0', fontSize: 12,
                borderBottom: i === arr.length - 1 ? 'none' : '1px solid #f3f4f6',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontWeight: 500, color: '#111827' }}>{entry.action}</span>
                {entry.user && <span style={{ color: '#9ca3af' }}> &middot; {entry.user}</span>}
                {entry.details && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{entry.details}</div>}
              </div>
              <div style={{ ...mono, fontSize: 10, color: '#9ca3af', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {fmtDateShort(entry.timestamp)} &middot; {fmtTime(entry.timestamp)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Timeline rail for dense logs (>10 entries) */
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 4, top: 6, bottom: 6, width: 1, background: '#e5e7eb' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {log.slice().reverse().map((entry, i) => (
              <div key={entry.id} style={{ display: 'flex', gap: 8, position: 'relative' }}>
                <div style={{ width: 9, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 4, zIndex: 1 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid', background: i === 0 ? '#152CFF' : '#fff', borderColor: i === 0 ? '#152CFF' : '#d1d5db' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>{entry.action}</div>
                  {entry.details && <div style={{ fontSize: 10, color: '#9ca3af' }}>{entry.details}</div>}
                  <div style={{ fontSize: 9, color: '#d1d5db', marginTop: 1 }}>
                    {entry.user} &middot; <span style={mono}>{fmtDateShort(entry.timestamp)} {fmtTime(entry.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
          <User size={13} style={{ color: '#6b7280', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{job.driverAssignment.name}</span>
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
              padding: '5px 12px', borderRadius: 4, fontSize: 11, fontWeight: 600, border: 'none',
              cursor: selectedDriverId && selectedVehicleId ? 'pointer' : 'not-allowed',
              background: selectedDriverId && selectedVehicleId ? '#152CFF' : '#e5e7eb',
              color: selectedDriverId && selectedVehicleId ? '#fff' : '#9ca3af',
              fontFamily: 'inherit',
            }}
          >
            Assign
          </button>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>No driver assigned</div>
      )}
    </div>
  );

  const renderRoute = () => (
    <div style={sectionWrap}>
      <div style={sectionTitle}>Route</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 3 }}>Pickup</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>{job.origin.location}</div>
          {(job.origin.date || trip.pickupDate) && (
            <div style={{ ...mono, fontSize: 9, color: '#374151', marginTop: 2 }}>
              {job.origin.date ? fmtDateMono(job.origin.date) : trip.pickupDate}
            </div>
          )}
        </div>
        <span style={{ fontSize: 16, color: '#d1d5db', flexShrink: 0 }}>&rarr;</span>
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
      <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{job.origin.location}</div>
      <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>
        {job.service.label} &middot; {job.origin.date ? fmtDateMono(job.origin.date) : trip.pickupDate || '\u2014'}
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
              &larr; My Jobs
            </button>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span style={{ ...mono, fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#9ca3af' }}>{job.id}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{job.service.label}</span>
            <span style={{ ...mono, fontSize: 10, color: '#6b7280' }}>{job.service.code}</span>
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

      {/* ===== ACTION ROW — state left, primary action right, no tint ===== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 4, marginBottom: 4 }}>
        <StateCell job={job} fontSize={12} withSubline />

        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          {job.status === 'Pending' && (
            <button style={btnPrimary} onClick={handleStartJob}>Start Job &rarr;</button>
          )}
          {job.status === 'In Progress' && (
            <button style={btnPrimary} onClick={() => fileRef.current?.click()}>
              <Upload size={11} /> Upload Proof
            </button>
          )}
          {job.status === 'Completed' && job.verificationStatus === 'Pending' && (
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Awaiting admin verification</span>
          )}
          {job.verificationStatus === 'Verified' && (
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Verified &middot; locked</span>
          )}
          {job.verificationStatus === 'Rejected' && (
            <button style={btnPrimary} onClick={() => fileRef.current?.click()}>
              <Upload size={11} /> Re-upload Proof
            </button>
          )}
          {job.status === 'Cancelled' && (
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Cancelled</span>
          )}
        </div>
      </div>

      {/* Rejection reason — inline amber/red text, no tinted box */}
      {job.verificationStatus === 'Rejected' && job.rejectionReason && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '6px 14px 2px', fontSize: 11 }}>
          <AlertTriangle size={12} color="#dc2626" style={{ marginTop: 1, flexShrink: 0 }} />
          <div>
            <span style={{ color: '#dc2626', fontWeight: 600 }}>Rejected: </span>
            <span style={{ color: '#374151' }}>{job.rejectionReason}</span>
            {job.verificationChangedAt && (
              <span style={{ ...mono, fontSize: 10, color: '#9ca3af', marginLeft: 6 }}>&middot; {fmtDateTime(job.verificationChangedAt)}</span>
            )}
          </div>
        </div>
      )}

      {/* Completion remark — inline amber text, no tinted box */}
      {job.status === 'Completed' && job.completionRemark && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '6px 14px 2px', fontSize: 11 }}>
          <AlertTriangle size={12} color="#a16207" style={{ marginTop: 1, flexShrink: 0 }} />
          <span style={{ color: '#a16207', fontWeight: 600 }}>Remark:</span>
          <span style={{ color: '#374151' }}>{job.completionRemark}</span>
        </div>
      )}

      {/* Cancel reason — inline, no tinted box */}
      {job.status === 'Cancelled' && job.cancelReason && (
        <div style={{ padding: '6px 14px 2px', fontSize: 11, color: '#6b7280' }}>
          Cancellation reason: <span style={{ color: '#374151' }}>{job.cancelReason}</span>
        </div>
      )}

      {/* ===== SERVICE-ADAPTIVE LAYOUT ===== */}
      {isFM ? (
        <>
          {renderDriverVehicle()}
          {renderRoute()}
          {renderCargo()}
          {renderProofs()}
          {renderActivityLog()}
        </>
      ) : (
        <>
          {renderLocation()}
          {renderHubOpsProgress()}
          {renderCargo()}
          {renderProofs()}
          {renderActivityLog()}
        </>
      )}
    </div>
  );
}

// --- Proof row component ---

function ProofRow({ doc, last }: { doc: ProofDocument; last: boolean }) {
  const Icon = doc.type.startsWith('image/') ? Image : FileText;
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 0',
        borderBottom: last ? 'none' : '1px solid #f3f4f6',
      }}
    >
      <Icon size={13} color="#6b7280" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, fontSize: 12 }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111827' }}>{doc.name}</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#9ca3af' }}>
          {fmtDateShort(doc.uploadedAt)} &middot; {doc.uploadedBy}
        </div>
      </div>
      <a
        href={doc.url}
        target="_blank"
        rel="noreferrer"
        style={{ fontSize: 11, color: '#152CFF', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 3 }}
      >
        <ExternalLink size={10} style={{ verticalAlign: -1 }} />
        Open
      </a>
    </div>
  );
}
