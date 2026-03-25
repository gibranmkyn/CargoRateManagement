import { useRef } from 'react';
import { ArrowRight, MapPin, Upload, FileText, Image, X, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Job, Trip, JobStatus, ProofDocument } from '../../data/mockData';
import { vendors } from '../../data/mockData';
import ServiceTag from './ServiceTag';
import StatusBadge from './StatusBadge';

const allStatuses: JobStatus[] = ['Pending', 'In Progress', 'Completed', 'Rejected', 'Cancelled'];

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

const sectionTitle: React.CSSProperties = { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 10 };

interface Props {
  job: Job; trip: Trip; jobIndex: number;
  onStatusChange: (status: JobStatus) => void;
  onUploadProof: (file: File) => void;
  onRemoveProof: (docId: string) => void;
  onReassign?: (vendorCode: string) => void;
}

function docIcon(doc: ProofDocument) {
  return doc.type.startsWith('image/') ? <Image size={12} style={{ color: '#0D9488' }} /> : <FileText size={12} style={{ color: '#0D9488' }} />;
}

export default function JobSlideOut({ job, trip, jobIndex, onStatusChange, onUploadProof, onRemoveProof, onReassign }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const log = job.activityLog ?? [];
  const proofs = job.proofDocuments ?? [];
  const isRejected = job.status === 'Rejected';

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onUploadProof(f);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <StatusBadge status={job.status} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#9ca3af' }}>
            J{String(jobIndex + 1).padStart(2, '0')}/{trip.jobs.length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
          <span>{trip.customer.name}</span>
          <span style={{ color: '#d1d5db' }}>&middot;</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{trip.mawb}</span>
        </div>
      </div>

      {/* Rejection reason */}
      {isRejected && job.rejectionReason && (
        <div style={{ padding: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#dc2626', marginBottom: 3 }}>Rejection Reason</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#dc2626' }}>{job.rejectionReason}</div>
        </div>
      )}

      {/* Route & Services */}
      <div>
        <div style={sectionTitle}>Route & Services</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <MapPin size={11} style={{ color: '#0D9488', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>{job.origin.location}</span>
          <ArrowRight size={10} style={{ color: '#d1d5db' }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>{job.destination.location}</span>
        </div>
        {job.origin.date && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9ca3af', marginBottom: 8, marginLeft: 17 }}>{fmtDateTime(job.origin.date)}</div>
        )}
        <ServiceTag service={job.service} />
      </div>

      {/* Status picker */}
      <div>
        <div style={sectionTitle}>{isRejected ? 'Reassign or Change Status' : 'Status'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {allStatuses.map((s) => {
            const isActive = s === job.status;
            return (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                style={{
                  width: '100%', textAlign: 'left', padding: '6px 10px', borderRadius: 4,
                  border: isActive ? '1.5px solid #0D9488' : '1.5px solid transparent',
                  background: isActive ? 'rgba(13,148,136,0.06)' : 'transparent',
                  fontWeight: isActive ? 600 : 400, fontSize: 11, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 150ms',
                  fontFamily: 'inherit',
                }}
              >
                <StatusBadge status={s} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Reassignment */}
      {isRejected && onReassign && (
        <div>
          <div style={{ ...sectionTitle, color: '#dc2626' }}>Reassign to New Vendor</div>
          <select
            style={{ width: '100%', borderColor: '#fecaca', background: '#fef2f2', marginBottom: 6 }}
            onChange={(e) => e.target.value && onReassign(e.target.value)}
            defaultValue=""
          >
            <option value="">Select vendor...</option>
            {vendors.filter((v) => v.code !== job.vendor.code).map((v) => (
              <option key={v.code} value={v.code}>{v.name}</option>
            ))}
          </select>
          <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>Sets status to Pending and logs reassignment</div>
        </div>
      )}

      {/* Proof of Service */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={sectionTitle as React.CSSProperties}>Proof of Service</span>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
            fontSize: 10, fontWeight: 600, color: '#0D9488', background: 'rgba(13,148,136,0.07)',
            borderRadius: 4, cursor: 'pointer', border: '1px solid rgba(13,148,136,0.12)',
          }}>
            <Upload size={10} /> Upload
            <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleUpload} />
          </label>
        </div>
        {proofs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {proofs.map((doc) => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(13,148,136,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{docIcon(doc)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                  <div style={{ fontSize: 9, color: '#9ca3af' }}>{fmtDateTime(doc.uploadedAt)}</div>
                </div>
                <button onClick={() => onRemoveProof(doc.id)} style={{ padding: 2, color: '#d1d5db', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 12, textAlign: 'center', fontSize: 10, color: '#d1d5db', fontStyle: 'italic', border: '1px dashed #e5e7eb', borderRadius: 6 }}>
            No documents uploaded yet
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={sectionTitle as React.CSSProperties}>Activity Log</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, background: '#f3f4f6', color: '#9ca3af', padding: '1px 5px', borderRadius: 99 }}>{log.length}</span>
        </div>
        {log.length > 0 ? (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 4, top: 6, bottom: 6, width: 1, background: '#e5e7eb' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {log.slice().reverse().map((entry, i) => (
                <div key={entry.id} style={{ display: 'flex', gap: 8, position: 'relative' }}>
                  <div style={{ width: 9, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 4, zIndex: 1 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid', background: i === 0 ? '#0D9488' : '#fff', borderColor: i === 0 ? '#0D9488' : '#d1d5db' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>{entry.action}</div>
                    {entry.details && <div style={{ fontSize: 10, color: '#9ca3af' }}>{entry.details}</div>}
                    <div style={{ fontSize: 9, color: '#d1d5db', marginTop: 1 }}>
                      {entry.user} &middot; <span style={{ fontFamily: 'var(--font-mono)' }}>{fmtDateShort(entry.timestamp)} {fmtTime(entry.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: 12, textAlign: 'center' }}>
            <Clock size={12} style={{ color: '#d1d5db', margin: '0 auto 4px' }} />
            <div style={{ fontSize: 10, color: '#d1d5db' }}>No activity</div>
          </div>
        )}
      </div>

      {/* Full detail link */}
      <div style={{ paddingTop: 10, borderTop: '1px solid #e5e7eb' }}>
        <Link
          to={`/trips/${trip.id}/jobs/${job.id}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, color: '#0D9488', textDecoration: 'none' }}
        >
          Open full detail <ExternalLink size={10} />
        </Link>
      </div>
    </div>
  );
}
