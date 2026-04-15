import { useRef, useState } from 'react';
import { ArrowRight, MapPin, Upload, FileText, Image, X, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Job, Trip, ProofDocument } from '@shared/mockData';
import { vendors, getL2ByCostId } from '@shared/mockData';
import ServiceTag from './ServiceTag';
import { STATUS_LABELS, fmtDateTime, fmtTime, fmtDateShort } from '@shared/statusStyles';

const sectionTitle: React.CSSProperties = { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 10 };

interface Props {
  job: Job; trip: Trip; jobIndex: number;
  onUploadProof: (file: File) => void;
  onRemoveProof: (docId: string) => void;
  onVerify?: () => void;
  onStartJob?: () => void;
  onCancelJob?: (reason: string) => void;
  onCancelAndReplace?: (reason: string, newVendorCode: string) => void;
  onCreateFollowup?: (vendorCode: string) => void;
  onSetCompletionRemark?: (remark: string) => void;
  onOpenJob?: (tripId: string, jobId: string) => void;
}

function docIcon(doc: ProofDocument) {
  return doc.type.startsWith('image/') ? <Image size={12} style={{ color: '#152CFF' }} /> : <FileText size={12} style={{ color: '#152CFF' }} />;
}

export default function JobSlideOut({ job, trip, jobIndex, onUploadProof, onRemoveProof, onVerify, onStartJob, onCancelJob, onCancelAndReplace, onCreateFollowup, onSetCompletionRemark, onOpenJob }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const log = job.activityLog ?? [];
  const proofs = job.proofDocuments ?? [];
  const isVerified = job.status === 'Verified';
  const isCancelled = job.status === 'Cancelled';
  const ps = STATUS_LABELS[job.status] ?? STATUS_LABELS.Pending;

  // Cancel form state
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [createReplacement, setCreateReplacement] = useState(true);
  const [replacementVendor, setReplacementVendor] = useState('');

  // Completion remark state
  const [showRemarkForm, setShowRemarkForm] = useState(false);
  const [remarkText, setRemarkText] = useState(job.completionRemark ?? '');

  // Follow-up state
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [followupVendor, setFollowupVendor] = useState(job.vendor.code);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      onUploadProof(files[i]);
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  const inputStyle: React.CSSProperties = { fontSize: 10, padding: '3px 6px', border: '1px solid #e5e7eb', borderRadius: 3, outline: 'none', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 };

  // Find linked jobs
  const replacedByJob = job.replacedByJobId ? trip.jobs.find((j) => j.id === job.replacedByJobId) : null;
  const replacesJob = job.replacesJobId ? trip.jobs.find((j) => j.id === job.replacesJobId) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#9ca3af' }}>
            J{String(jobIndex + 1).padStart(2, '0')}/{trip.jobs.length}
          </span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: isCancelled ? '#9ca3af' : '#111827', marginTop: 6, textDecoration: isCancelled ? 'line-through' : 'none' }}>{job.vendor.name} · {job.service.label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
          <span>{trip.customer.name}</span>
          <span style={{ color: '#d1d5db' }}>&middot;</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{trip.mawb}</span>
        </div>
      </div>

      {/* Status Action Bar — Cancelled state (immutable) */}
      {isCancelled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 6, background: '#fef2f2', border: '1px solid #fecaca' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} /> Cancelled
            </span>
          </div>
          {/* Cancel reason — read-only, prominent */}
          {job.cancelReason && (
            <div style={{ padding: '8px 10px', background: '#fff', border: '1px solid #fecaca', borderRadius: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#dc2626', marginBottom: 4 }}>Cancellation Reason</div>
              <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.5 }}>{job.cancelReason}</div>
            </div>
          )}
        </div>
      )}

      {/* Replacement link — "Replaced By" on cancelled/partial jobs */}
      {replacedByJob && (
        <div style={{ padding: '8px 10px', background: 'rgba(21,44,255,0.02)', border: '1px solid rgba(21,44,255,0.1)', borderRadius: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#152CFF', marginBottom: 4 }}>
            {isCancelled ? 'Replaced By' : 'Follow-up'}
          </div>
          <div onClick={() => onOpenJob?.(trip.id, replacedByJob.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 4, background: 'rgba(21,44,255,0.04)', border: '1px solid rgba(21,44,255,0.12)', fontSize: 10, fontWeight: 600, color: '#152CFF', cursor: 'pointer' }}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{replacedByJob.id}</span>
            <span>&middot;</span>
            <span>{replacedByJob.vendor.name} &middot; {replacedByJob.service.label}</span>
            <span style={{ marginLeft: 'auto' }}>&rarr;</span>
          </div>
        </div>
      )}

      {/* "Replaces" link on replacement/follow-up jobs */}
      {replacesJob && (
        <div style={{ padding: '6px 8px', background: 'rgba(21,44,255,0.02)', border: '1px solid rgba(21,44,255,0.08)', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>
            {replacesJob.status === 'Cancelled' ? 'Replaces' : 'Follows'}
          </span>
          <div onClick={() => onOpenJob?.(trip.id, replacesJob.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 4, background: 'rgba(21,44,255,0.04)', border: '1px solid rgba(21,44,255,0.12)', fontSize: 9, fontWeight: 600, color: '#152CFF', cursor: 'pointer' }}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{replacesJob.id}</span> &middot; {replacesJob.vendor.name} ({replacesJob.status === 'Cancelled' ? 'cancelled' : 'partial'}) &rarr;
          </div>
        </div>
      )}

      {/* Completion remark — amber box (on Completed jobs with remark) */}
      {job.status === 'Completed' && job.completionRemark && (
        <div style={{ padding: '8px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a16207', marginBottom: 4 }}>Completion Remark</div>
          <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.5 }}>{job.completionRemark}</div>
        </div>
      )}

      {/* Status Action Bar — non-Cancelled states */}
      {!isCancelled && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 6,
          ...(job.status === 'Pending' ? { background: '#f9fafb', border: '1px solid #e5e7eb' } :
            job.status === 'In Progress' ? { background: 'rgba(21,44,255,0.04)', border: '1px solid rgba(21,44,255,0.12)' } :
            job.status === 'Completed' ? { background: '#fefce8', border: '1px solid #fde68a' } :
            job.status === 'Verified' ? { background: '#f0fdf4', border: '1px solid #a7f3d0' } :
            { background: '#f9fafb', border: '1px solid #e5e7eb' }),
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700,
            ...(job.status === 'Pending' ? { background: '#f9fafb', border: '1px solid #e5e7eb', color: '#9ca3af' } :
              job.status === 'In Progress' ? { background: 'rgba(21,44,255,0.06)', border: '1px solid rgba(21,44,255,0.15)', color: '#152CFF' } :
              job.status === 'Completed' ? { background: '#fefce8', border: '1px solid #fde68a', color: '#a16207' } :
              job.status === 'Verified' ? { background: '#f0fdf4', border: '1px solid #a7f3d0', color: '#059669' } :
              { background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#9ca3af' }),
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%', display: 'inline-block',
              background: job.status === 'Pending' ? '#9ca3af' : job.status === 'In Progress' ? '#152CFF' : job.status === 'Completed' ? '#a16207' : job.status === 'Verified' ? '#059669' : '#9ca3af',
            }} />
            {job.status === 'Verified' ? '✓ Verified' : ps.label}
          </span>

          {job.status === 'Pending' && (
            <button onClick={() => onStartJob?.()} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#152CFF', color: '#fff' }}>
              Start Job →
            </button>
          )}
          {job.status === 'In Progress' && (
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#9ca3af' }}>Upload proof to complete →</span>
          )}
          {job.status === 'Completed' && (
            <button onClick={() => onVerify?.()} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#059669', color: '#fff' }}>
              ✓ Verify
            </button>
          )}
          {job.status === 'Verified' && (
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#059669' }}>Ready for billing</span>
          )}
        </div>
      )}

      {/* Route */}
      <div>
        <div style={sectionTitle}>Route</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <MapPin size={11} style={{ color: '#152CFF', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>{job.origin.location}</span>
          {job.origin.location !== job.destination.location && <>
            <ArrowRight size={10} style={{ color: '#d1d5db' }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>{job.destination.location}</span>
          </>}
        </div>
        {job.origin.date && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9ca3af', marginBottom: 4, marginLeft: 17 }}>{fmtDateTime(job.origin.date)}</div>
        )}
        <ServiceTag service={job.service} />
      </div>

      {/* Subservices (HMW-58) */}
      {!isCancelled && (
        <div>
          <div style={sectionTitle}>Subservices</div>
          {(job.l2CostIds ?? []).length === 0 ? (
            <div style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>No subservices selected</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(job.l2CostIds ?? []).map((costId) => {
                const l2 = getL2ByCostId(costId);
                if (!l2) return null;
                return (
                  <div key={costId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#9ca3af', minWidth: 36 }}>{costId}</span>
                    <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>{l2.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Proof of Service */}
      <div>
        <div style={sectionTitle}>Proof of Service</div>
        {proofs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
            {proofs.map((doc) => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(21,44,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{docIcon(doc)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                  <div style={{ fontSize: 9, color: '#9ca3af' }}>{fmtDateTime(doc.uploadedAt)}</div>
                </div>
                {!isVerified && !isCancelled && (
                  <button onClick={() => onRemoveProof(doc.id)} style={{ padding: 2, color: '#d1d5db', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 16, textAlign: 'center', fontSize: 10, color: '#d1d5db', fontStyle: 'italic', border: '1px dashed #e5e7eb', borderRadius: 6, marginBottom: 8 }}>
            No proof yet — upload when work is done
          </div>
        )}

        {!isVerified && !isCancelled && (
          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 10px',
            fontSize: 11, fontWeight: 600, color: '#152CFF', background: 'rgba(21,44,255,0.04)',
            borderRadius: 6, cursor: 'pointer', border: '1px solid rgba(21,44,255,0.12)', marginBottom: 8,
          }}>
            <Upload size={12} /> Upload proof document
            <input ref={fileRef} type="file" accept="image/*,.pdf" multiple style={{ display: 'none' }} onChange={handleUpload} />
          </label>
        )}
      </div>


      {/* Completion Remark — add/edit (Completed jobs only) */}
      {job.status === 'Completed' && !job.completionRemark && onSetCompletionRemark && (
        <div>
          {showRemarkForm ? (
            <div style={{ padding: '10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#a16207', marginBottom: 6 }}>ADD COMPLETION REMARK</div>
              <textarea value={remarkText} onChange={(e) => setRemarkText(e.target.value)} placeholder="e.g., Pickup not ready — driver waited 45 min, returned empty" style={{ width: '100%', border: '1px solid #fde68a', borderRadius: 4, fontFamily: 'inherit', fontSize: 11, padding: '6px 8px', resize: 'vertical', minHeight: 48 }} />
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button onClick={() => { onSetCompletionRemark(remarkText); setShowRemarkForm(false); }} disabled={!remarkText.trim()} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: 'none', cursor: remarkText.trim() ? 'pointer' : 'not-allowed', background: remarkText.trim() ? '#a16207' : '#e5e7eb', color: remarkText.trim() ? '#fff' : '#9ca3af', fontFamily: 'inherit' }}>Save Remark</button>
                <button onClick={() => setShowRemarkForm(false)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'none', color: '#9ca3af', border: '1px solid #e5e7eb', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowRemarkForm(true)} style={{ width: '100%', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff', color: '#a16207', border: '1px solid #fde68a', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add Completion Remark</button>
          )}
        </div>
      )}

      {/* Create Follow-up Job — on Completed jobs */}
      {job.status === 'Completed' && onCreateFollowup && !job.replacedByJobId && (
        <div>
          {showFollowupForm ? (
            <div style={{ padding: '10px', background: 'rgba(21,44,255,0.02)', border: '1px solid rgba(21,44,255,0.1)', borderRadius: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#152CFF', marginBottom: 6 }}>CREATE FOLLOW-UP JOB</div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 8 }}>Same service ({job.service.code} {job.service.label}) and location. New billing event.</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: '#9ca3af', whiteSpace: 'nowrap' }}>Vendor:</span>
                <select value={followupVendor} onChange={(e) => setFollowupVendor(e.target.value)} style={{ flex: 1, fontSize: 11, padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 4, fontFamily: 'inherit' }}>
                  {vendors.map((v) => <option key={v.code} value={v.code}>{v.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button onClick={() => { onCreateFollowup(followupVendor); setShowFollowupForm(false); }} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', background: '#152CFF', color: '#fff', fontFamily: 'inherit' }}>Create Follow-up</button>
                <button onClick={() => setShowFollowupForm(false)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'none', color: '#9ca3af', border: '1px solid #e5e7eb', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowFollowupForm(true)} style={{ width: '100%', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff', color: '#152CFF', border: '1px solid rgba(21,44,255,0.2)', cursor: 'pointer', fontFamily: 'inherit' }}>+ Create Follow-up Job</button>
          )}
        </div>
      )}

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
                    <div style={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid', background: i === 0 ? '#152CFF' : '#fff', borderColor: i === 0 ? '#152CFF' : '#d1d5db' }} />
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

      {/* Cancel Job — inline form (Pending / In Progress only) */}
      {(job.status === 'Pending' || job.status === 'In Progress') && onCancelJob && (
        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
          {showCancelForm ? (
            <div style={{ padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>CANCEL JOB</div>
              <div style={{ fontSize: 10, color: '#92400e', marginBottom: 8 }}>This action is permanent. The vendor will see the cancellation reason.</div>
              <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason for cancellation (required)..." style={{ width: '100%', border: '1px solid #fecaca', borderRadius: 4, fontFamily: 'inherit', fontSize: 11, padding: '6px 8px', resize: 'vertical', minHeight: 48 }} />

              {/* Create replacement checkbox + vendor picker */}
              <div style={{ marginTop: 10, padding: '8px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={createReplacement} onChange={(e) => setCreateReplacement(e.target.checked)} style={{ accentColor: '#152CFF' }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#374151' }}>Create replacement job</span>
                </label>
                {createReplacement && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, marginLeft: 22 }}>
                    <span style={{ fontSize: 9, color: '#9ca3af', whiteSpace: 'nowrap' }}>New vendor:</span>
                    <select value={replacementVendor} onChange={(e) => setReplacementVendor(e.target.value)} style={{ flex: 1, fontSize: 11, padding: '4px 8px', border: '1px solid #152CFF', borderRadius: 4, color: '#152CFF', fontWeight: 600, fontFamily: 'inherit', background: 'rgba(21,44,255,0.03)' }}>
                      <option value="">Select vendor...</option>
                      {vendors.map((v) => <option key={v.code} value={v.code}>{v.name}</option>)}
                    </select>
                  </div>
                )}
                {createReplacement && (
                  <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 4, marginLeft: 22 }}>New job will inherit: {job.service.code} {job.service.label} · {job.origin.location}</div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {createReplacement ? (
                  <button onClick={() => { if (cancelReason.trim() && replacementVendor) { onCancelAndReplace?.(cancelReason, replacementVendor); setShowCancelForm(false); setCancelReason(''); } }} disabled={!cancelReason.trim() || !replacementVendor} style={{ flex: 1, padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: 'none', cursor: cancelReason.trim() && replacementVendor ? 'pointer' : 'not-allowed', background: cancelReason.trim() && replacementVendor ? '#dc2626' : '#e5e7eb', color: cancelReason.trim() && replacementVendor ? '#fff' : '#9ca3af', fontFamily: 'inherit' }}>Cancel & Replace</button>
                ) : (
                  <button onClick={() => { if (cancelReason.trim()) { onCancelJob(cancelReason); setShowCancelForm(false); setCancelReason(''); } }} disabled={!cancelReason.trim()} style={{ flex: 1, padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: 'none', cursor: cancelReason.trim() ? 'pointer' : 'not-allowed', background: cancelReason.trim() ? '#dc2626' : '#e5e7eb', color: cancelReason.trim() ? '#fff' : '#9ca3af', fontFamily: 'inherit' }}>Cancel Only</button>
                )}
                <button onClick={() => { setShowCancelForm(false); setCancelReason(''); }} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'none', color: '#9ca3af', border: '1px solid #e5e7eb', cursor: 'pointer', fontFamily: 'inherit' }}>Back</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowCancelForm(true)} style={{ width: '100%', padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel Job</button>
          )}
        </div>
      )}

      {/* Full detail link */}
      <div style={{ paddingTop: 10, borderTop: '1px solid #e5e7eb' }}>
        <Link
          to={`/trips/${trip.id}/jobs/${job.id}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, color: '#152CFF', textDecoration: 'none' }}
        >
          Open full detail <ExternalLink size={10} />
        </Link>
      </div>
    </div>
  );
}
