import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRef } from 'react';
import { ArrowLeft, ArrowRight, Upload, FileText, Image, X, Clock, MapPin, User, Briefcase, ChevronRight } from 'lucide-react';
import { useTrips } from '@shared/TripContext';
import type { ProofDocument, JobStatus } from '@shared/mockData';
import { formatCurrency } from '@shared/mockData';
import ServiceTag from '../components/trips/ServiceTag';

function fmtDateTime(dt: string) {
  if (!dt) return '\u2014';
  const d = new Date(dt.replace(' ', 'T'));
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtTime(dt: string) {
  const d = new Date(dt.replace(' ', 'T'));
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtDateShort(dt: string) {
  const d = new Date(dt.replace(' ', 'T'));
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function JobDetailPage() {
  const { tripId, jobId } = useParams<{ tripId: string; jobId: string }>();
  const navigate = useNavigate();
  const { trips, addProofDocument, removeProofDocument, addActivityLog, verifyJob } = useTrips();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trip = trips.find((t) => t.id === tripId);
  const job = trip?.jobs.find((j) => j.id === jobId);
  const jobIndex = trip?.jobs.findIndex((j) => j.id === jobId) ?? -1;

  if (!trip || !job) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            background: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}
        >
          <Briefcase size={18} style={{ color: '#d1d5db' }} />
        </div>
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#111827',
            letterSpacing: '-0.2px',
            fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif",
          }}
        >
          Job not found
        </p>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, marginBottom: 12 }}>
          The job you are looking for does not exist.
        </p>
        <Link
          to="/trips"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 500,
            color: '#152CFF',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={12} />
          Back to trips
        </Link>
      </div>
    );
  }

  const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
    Pending: { label: 'Pending', color: '#9ca3af', bg: '#f3f4f6', border: '#e5e7eb', icon: '○' },
    'In Progress': { label: 'In Progress', color: '#152CFF', bg: 'rgba(21,44,255,0.04)', border: 'rgba(21,44,255,0.15)', icon: '◉' },
    Completed: { label: 'Completed', color: '#b45309', bg: 'rgba(180,83,9,0.04)', border: 'rgba(180,83,9,0.15)', icon: '📄' },
    Verified: { label: 'Verified', color: '#059669', bg: '#f0fdf4', border: '#a7f3d0', icon: '✓' },
    Cancelled: { label: 'Cancelled', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '✕' },
  };

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    addProofDocument(trip!.id, job!.id, {
      id: `doc-${Date.now()}`,
      name: file.name,
      type: file.type,
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      uploadedBy: 'Ops Admin',
      url,
    });
    addActivityLog(trip!.id, job!.id, {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      action: 'Document uploaded',
      user: 'Ops Admin',
      details: file.name,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function getDocIcon(doc: ProofDocument) {
    if (doc.type.startsWith('image/')) return <Image size={12} style={{ color: '#152CFF' }} />;
    return <FileText size={12} style={{ color: '#152CFF' }} />;
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#9ca3af',
    marginBottom: 12,
    marginTop: 0,
  };

  return (
    <div style={{ padding: '16px 16px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 11,
          color: '#9ca3af',
          marginBottom: 14,
        }}
      >
        <button
          onClick={() => navigate('/trips')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: '#9ca3af',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            marginLeft: -4,
            borderRadius: 4,
            fontSize: 11,
          }}
        >
          <ArrowLeft size={11} />
          Trips
        </button>
        <ChevronRight size={10} style={{ color: '#d1d5db' }} />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            padding: '1px 5px',
            borderRadius: 4,
            background: '#f3f4f6',
            border: '1px solid #f3f4f6',
          }}
        >
          {trip.id}
        </span>
        <ChevronRight size={10} style={{ color: '#d1d5db' }} />
        <span style={{ fontWeight: 600, color: '#111827' }}>
          Job J{String(jobIndex + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: '#111827',
                letterSpacing: '-0.3px',
                margin: 0,
                fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif",
              }}
            >
              {job.vendor.name}
            </h1>
            {(() => { const ps = STATUS_LABELS[job.status] ?? STATUS_LABELS.Pending; return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: ps.bg, border: `1px solid ${ps.border}`, color: ps.color }}>{ps.icon} {ps.label}</span>; })()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#9ca3af' }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                padding: '1px 5px',
                borderRadius: 4,
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                color: '#9ca3af',
              }}
            >
              {job.id}
            </span>
            <span style={{ color: '#d1d5db' }}>/</span>
            <span>{trip.customer.name}</span>
            <span style={{ color: '#d1d5db' }}>/</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>{trip.mawb}</span>
          </div>
        </div>
      </div>

      {/* 2:1 Grid layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 16,
        }}
      >
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
          {/* Route & Services card */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              padding: 16,
            }}
          >
            <h3 style={sectionTitle}>Route & Services</h3>

            {/* Origin -> Destination boxes */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              {/* Origin */}
              <div
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 6,
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.06em',
                    color: '#9ca3af',
                    marginBottom: 4,
                  }}
                >
                  Origin
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={11} style={{ color: '#152CFF' }} strokeWidth={2.5} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#111827',
                    }}
                  >
                    {job.origin.location}
                  </span>
                </div>
                {job.origin.date && (
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: '#9ca3af',
                      marginTop: 3,
                      marginLeft: 16,
                    }}
                  >
                    {fmtDateTime(job.origin.date)}
                  </div>
                )}
              </div>

              {/* Arrow circle */}
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ArrowRight size={12} style={{ color: '#9ca3af' }} />
              </div>

              {/* Destination */}
              <div
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 6,
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.06em',
                    color: '#9ca3af',
                    marginBottom: 4,
                  }}
                >
                  Destination
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={11} style={{ color: '#059669' }} strokeWidth={2.5} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#111827',
                    }}
                  >
                    {job.destination.location}
                  </span>
                </div>
                {job.destination.date && (
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: '#9ca3af',
                      marginTop: 3,
                      marginLeft: 16,
                    }}
                  >
                    {fmtDateTime(job.destination.date)}
                  </div>
                )}
              </div>
            </div>

            {/* Services + Duration row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTop: '1px solid #f3f4f6',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.06em',
                    color: '#9ca3af',
                    marginBottom: 6,
                  }}
                >
                  Services
                </div>
                <ServiceTag service={job.service} />
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.06em',
                    color: '#9ca3af',
                    marginBottom: 4,
                  }}
                >
                  Duration
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#111827',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {job.duration || '\u2014'}
                </span>
              </div>
            </div>
          </div>

          {/* Proof of Service card */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ ...sectionTitle, marginBottom: 0 }}>Proof of Service</h3>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#152CFF',
                  background: 'rgba(21,44,255,0.07)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  border: '1px solid rgba(21,44,255,0.12)',
                }}
              >
                <Upload size={10} />
                Upload Document
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {job.proofDocuments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                {job.proofDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: 'rgba(21,44,255,0.07)',
                        border: '1px solid rgba(21,44,255,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getDocIcon(doc)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {doc.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>
                        Uploaded by {doc.uploadedBy} &middot; {fmtDateTime(doc.uploadedAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => removeProofDocument(trip.id, job.id, doc.id)}
                      style={{
                        padding: 4,
                        borderRadius: 4,
                        color: '#d1d5db',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: 24,
                  border: '2px dashed #e5e7eb',
                  borderRadius: 6,
                  background: '#fafbfc',
                  textAlign: 'center' as const,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                  }}
                >
                  <Upload size={14} style={{ color: '#d1d5db' }} />
                </div>
                <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, margin: 0 }}>
                  No proof documents yet
                </p>
                <p style={{ fontSize: 10, color: '#d1d5db', marginTop: 2 }}>
                  Upload delivery receipts, photos, or customs docs
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
          {/* Proof Actions + Fee Breakdown */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 16 }}>
            {/* Verify / Dispute */}
            {job.status === 'Completed' && (
              <div style={{ marginBottom: 16 }}>
                <h3 style={sectionTitle}>Verify Job</h3>
                <button onClick={() => { verifyJob(trip.id, job.id); addActivityLog(trip.id, job.id, { id: `l${Date.now()}`, timestamp: new Date().toISOString().replace('T',' ').slice(0,16), action: 'Job verified', user: 'Ops Admin' }); }} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: 'none', background: '#059669', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✓ Verify</button>
              </div>
            )}
            {job.status === 'Verified' && (
              <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#059669', textAlign: 'center' as const, marginBottom: 16 }}>✓ Verified — ready for payment</div>
            )}

            {/* Fee Breakdown */}
            <h3 style={sectionTitle}>Fee Breakdown</h3>
            {(job.fees ?? []).length > 0 ? (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
                {(job.fees ?? []).map((fee) => (
                  <div key={fee.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderBottom: '1px solid #f3f4f6', fontSize: 10 }}>
                    <div>
                      <div style={{ color: '#374151' }}>{fee.name}</div>
                      <div style={{ color: '#9ca3af', fontSize: 9 }}>{formatCurrency(fee.currency, fee.rate)} /{fee.unit === 'flat' ? 'trip' : fee.unit.replace('per-', '')} × {fee.quantity}</div>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#111827' }}>{formatCurrency(fee.currency, fee.amount)}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#9ca3af' }}>Total</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#152CFF' }}>
                    {(() => { const totals = new Map<string, number>(); (job.fees ?? []).forEach(f => totals.set(f.currency, (totals.get(f.currency) ?? 0) + f.amount)); return Array.from(totals.entries()).map(([c, t]) => formatCurrency(c as any, t)).join(' + '); })()}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ padding: 12, textAlign: 'center' as const, fontSize: 10, color: '#d1d5db', fontStyle: 'italic', border: '1px dashed #e5e7eb', borderRadius: 6, marginBottom: 12 }}>No fees configured</div>
            )}

            {/* Trip metadata */}
            <div style={{ paddingTop: 12, borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <Briefcase size={11} style={{ color: '#d1d5db' }} />
                <span style={{ color: '#9ca3af' }}>Vendor</span>
                <span style={{ marginLeft: 'auto', fontWeight: 500, color: '#111827' }}>{job.vendor.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <User size={11} style={{ color: '#d1d5db' }} />
                <span style={{ color: '#9ca3af' }}>Customer</span>
                <span style={{ marginLeft: 'auto', fontWeight: 500, color: '#111827' }}>{trip.customer.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <Clock size={11} style={{ color: '#d1d5db' }} />
                <span style={{ color: '#9ca3af' }}>Created</span>
                <span style={{ marginLeft: 'auto', fontFamily: "var(--font-mono)", fontSize: 10, color: '#111827' }}>{trip.createdAt}</span>
              </div>
            </div>
          </div>

          {/* Activity Log card */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ ...sectionTitle, marginBottom: 0 }}>Activity Log</h3>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  background: '#f3f4f6',
                  color: '#9ca3af',
                  padding: '1px 5px',
                  borderRadius: 99,
                  border: '1px solid #f3f4f6',
                }}
              >
                {job.activityLog.length}
              </span>
            </div>

            {job.activityLog.length > 0 ? (
              <div style={{ position: 'relative' }}>
                {/* Timeline line */}
                <div
                  style={{
                    position: 'absolute',
                    left: 4,
                    top: 6,
                    bottom: 6,
                    width: 1,
                    background: '#e5e7eb',
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                  {job.activityLog.slice().reverse().map((entry, i) => (
                    <div key={entry.id} style={{ display: 'flex', gap: 10, position: 'relative' }}>
                      <div
                        style={{
                          width: 9,
                          flexShrink: 0,
                          display: 'flex',
                          justifyContent: 'center',
                          paddingTop: 4,
                          zIndex: 1,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            border: '2px solid',
                            background: i === 0 ? '#152CFF' : '#fff',
                            borderColor: i === 0 ? '#152CFF' : '#d1d5db',
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, paddingBottom: 2 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>
                          {entry.action}
                        </div>
                        {entry.details && (
                          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
                            {entry.details}
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            marginTop: 2,
                            fontSize: 9,
                            color: '#d1d5db',
                          }}
                        >
                          <span>{entry.user}</span>
                          <span>&middot;</span>
                          <span style={{ fontFamily: "var(--font-mono)" }}>
                            {fmtDateShort(entry.timestamp)} {fmtTime(entry.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px 0', textAlign: 'center' as const }}>
                <Clock size={12} style={{ color: '#d1d5db', margin: '0 auto 6px' }} />
                <p style={{ fontSize: 11, color: '#d1d5db', margin: 0 }}>No activity recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
