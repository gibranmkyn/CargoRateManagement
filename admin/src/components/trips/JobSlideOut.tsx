import { useRef, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, X, AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Job, Trip, ProofDocument } from '@shared/mockData';
import { vendors, getL2ByCostId, getL1ByCode } from '@shared/mockData';
import { useTrips } from '@shared/TripContext';
import { fmtDateTime, fmtTime, fmtDateShort, formatRelativeTime } from '@shared/statusStyles';
import StatusCell from './StatusCell';
import VerificationCell from './VerificationCell';
import ServiceTag from './ServiceTag';

// -- Style constants --
const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)' };
const label: React.CSSProperties = { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' };
const btnGhost: React.CSSProperties = { padding: '5px 11px', border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff', color: '#374151', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' };
const btnPrimary: React.CSSProperties = { padding: '5px 12px', border: 'none', borderRadius: 4, background: '#152CFF', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
const btnVerify: React.CSSProperties = { ...btnPrimary, background: '#059669' };
const btnDanger: React.CSSProperties = { ...btnGhost, color: '#dc2626', borderColor: '#fecaca' };

// Which secondary form, if any, is open (only one colored container rendered at a time)
type OpenForm = null | 'cancel' | 'remark' | 'followup' | 'reject' | 'l2';

interface Props {
  job: Job;
  trip: Trip;
  jobIndex: number;
  onUploadProof: (file: File) => void;
  onRemoveProof: (docId: string) => void;
  /** @deprecated Verify is now handled internally via verifyJob; prop kept for caller backward-compat */
  onVerify?: () => void;
  onStartJob?: () => void;
  onCancelJob?: (reason: string) => void;
  onCancelAndReplace?: (reason: string, newVendorCode: string) => void;
  onCreateFollowup?: (vendorCode: string) => void;
  onSetCompletionRemark?: (remark: string) => void;
  onOpenJob?: (tripId: string, jobId: string) => void;
  /** Fee qty update — passed by JobsPage, forwarded to context internally */
  onUpdateFeeQty?: (feeId: string, qty: number) => void;
  /** Fee toggle — passed by JobsPage, forwarded to context internally */
  onToggleFee?: (feeId: string) => void;
}

export default function JobSlideOut({
  job,
  trip,
  jobIndex,
  onUploadProof,
  onRemoveProof,
  onVerify: _onVerifyLegacy,
  onStartJob,
  onCancelJob,
  onCancelAndReplace,
  onCreateFollowup,
  onSetCompletionRemark,
  onOpenJob,
  onUpdateFeeQty: _onUpdateFeeQty,
  onToggleFee: _onToggleFee,
}: Props) {
  void _onVerifyLegacy; // Verify moved to internal action row; prop kept for caller backward-compat
  void _onUpdateFeeQty; // Fees are not rendered in slide-out (they live in JobDetailPage)
  void _onToggleFee;

  const { verifyJob, rejectJob, unverifyJob, updateJob } = useTrips();
  const fileRef = useRef<HTMLInputElement>(null);

  const log = job.activityLog ?? [];
  const proofs = job.proofDocuments ?? [];
  const isVerified = job.verificationStatus === 'Verified';
  const isCancelled = job.status === 'Cancelled';

  // Single openForm state — only one colored container at a time
  const [openForm, setOpenForm] = useState<OpenForm>(null);
  const toggleForm = (form: OpenForm) => setOpenForm((prev) => (prev === form ? null : form));

  // Form field state
  const [cancelReason, setCancelReason] = useState('');
  const [createReplacement, setCreateReplacement] = useState(true);
  const [replacementVendor, setReplacementVendor] = useState('');
  const [remarkText, setRemarkText] = useState(job.completionRemark ?? '');
  const [followupVendor, setFollowupVendor] = useState(job.vendor.code);
  const [rejectReason, setRejectReason] = useState('');

  // L2 subservices
  const l1 = getL1ByCode(job.service.code);
  const l2Options = l1?.l2Services ?? [];

  // Linked jobs
  const replacedByJob = job.replacedByJobId ? trip.jobs.find((j) => j.id === job.replacedByJobId) : null;
  const replacesJob = job.replacesJobId ? trip.jobs.find((j) => j.id === job.replacesJobId) : null;

  const attentionLine = deriveAttentionLine(job);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) onUploadProof(files[i]);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, color: '#111827', fontSize: 13 }}>

      {/* ── Header block: identity + action row, single bottom border, no tint ── */}
      <header style={{ padding: '16px 20px 14px', borderBottom: '1px solid #e5e7eb' }}>
        {/* Identity line */}
        <div style={{ marginBottom: 2 }}>
          <div style={{ ...mono, fontSize: 10, color: '#9ca3af', marginBottom: 3 }}>
            JOB · {job.id} · {jobIndex + 1}/{trip.jobs.length}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: isCancelled ? '#9ca3af' : '#111827', textDecoration: isCancelled ? 'line-through' : 'none', letterSpacing: '-0.2px' }}>
            {l1?.label ?? job.service.label} · {job.origin.location}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
            {trip.customer.name} · {trip.id} · {job.vendor.name}
          </div>
        </div>

        {/* Action row — Status + Verification cells left, primary buttons right */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
            <div>
              <div style={{ ...label, marginBottom: 4 }}>Status</div>
              <StatusCell job={job} fontSize={12} showReason />
            </div>
            <div>
              <div style={{ ...label, marginBottom: 4 }}>Verification</div>
              <VerificationCell job={job} fontSize={12} showReason />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
            {/* Pending → Start Job */}
            {job.status === 'Pending' && onStartJob && (
              <button style={btnPrimary} onClick={onStartJob}>Start job</button>
            )}

            {/* In Progress → Upload proof */}
            {job.status === 'In Progress' && (
              <button style={btnPrimary} onClick={() => fileRef.current?.click()}>
                <Upload size={11} style={{ marginRight: 4, verticalAlign: -1 }} />
                Upload proof
              </button>
            )}

            {/* Completed + verification Pending → Reject / Verify */}
            {job.status === 'Completed' && job.verificationStatus === 'Pending' && (
              <>
                <button style={btnGhost} onClick={() => toggleForm('reject')}>Reject</button>
                <button style={btnVerify} onClick={() => verifyJob(trip.id, job.id)}>Verify</button>
              </>
            )}

            {/* Verified → Unverify (immediate, no form) */}
            {job.verificationStatus === 'Verified' && (
              <button style={btnGhost} onClick={() => unverifyJob(trip.id, job.id)}>Unverify</button>
            )}

            {/* Rejected → Unreject + Re-verify + Re-upload */}
            {job.verificationStatus === 'Rejected' && (
              <>
                <button style={btnGhost} onClick={() => unverifyJob(trip.id, job.id)}>Unreject</button>
                <button style={btnVerify} onClick={() => verifyJob(trip.id, job.id)}>Re-verify</button>
                <button style={btnPrimary} onClick={() => fileRef.current?.click()}>Re-upload</button>
              </>
            )}

            {/* Cancelled → nothing */}
            {isCancelled && (
              <span style={{ fontSize: 11, color: '#9ca3af' }}>Terminal — no actions</span>
            )}
          </div>
        </div>
      </header>

      {/* ── Details — plain key/value dl grid ── */}
      <section style={{ padding: '16px 20px 0' }}>
        <div style={{ ...label, marginBottom: 8 }}>Details</div>
        <dl style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 6, margin: 0, fontSize: 12 }}>
          <dt style={{ color: '#6b7280', alignSelf: 'center' }}>Service</dt>
          <dd style={{ margin: 0 }}>
            <ServiceTag service={job.service} />
            {' '}
            <span style={{ color: '#9ca3af' }}>{job.service.label}</span>
          </dd>

          <dt style={{ color: '#6b7280' }}>Route</dt>
          <dd style={{ margin: 0 }}>
            {job.origin.location}
            {job.destination?.location && job.destination.location !== job.origin.location && (
              <> <span style={{ color: '#9ca3af' }}>→</span> {job.destination.location}</>
            )}
          </dd>

          <dt style={{ color: '#6b7280' }}>Scheduled</dt>
          <dd style={{ margin: 0, ...mono, fontSize: 11 }}>{fmtDateTime(job.origin.date)}</dd>

          {job.execution && (
            <>
              <dt style={{ color: '#6b7280' }}>Completed</dt>
              <dd style={{ margin: 0, ...mono, fontSize: 11 }}>{fmtDateTime(job.execution)}</dd>
            </>
          )}

          {job.completionRemark && (
            <>
              <dt style={{ color: '#6b7280' }}>Remark</dt>
              <dd style={{ margin: 0 }}>{job.completionRemark}</dd>
            </>
          )}
        </dl>

        {/* Single amber attention line — no tinted container */}
        {attentionLine && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11 }}>
            <AlertTriangle size={12} color="#a16207" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <span style={{ color: '#a16207', fontWeight: 600 }}>{attentionLine.title}</span>
              {attentionLine.detail && <span style={{ color: '#374151' }}> {attentionLine.detail}</span>}
            </div>
          </div>
        )}
      </section>

      {/* ── Linked jobs — flattened text rows (no blue tint) ── */}
      {(replacedByJob || replacesJob) && (
        <section style={{ padding: '14px 20px 0' }}>
          {replacedByJob && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: replacesJob ? 6 : 0 }}>
              <span style={{ color: '#6b7280', minWidth: 80 }}>
                {isCancelled ? 'Replaced by' : 'Follow-up'}
              </span>
              <span style={{ color: '#9ca3af' }}>→</span>
              <span
                onClick={() => onOpenJob?.(trip.id, replacedByJob.id)}
                style={{ color: '#152CFF', fontWeight: 600, cursor: 'pointer', ...mono, fontSize: 11 }}
              >
                {replacedByJob.id}
              </span>
              <span style={{ color: '#374151' }}>{replacedByJob.vendor.name} · {replacedByJob.service.label}</span>
            </div>
          )}
          {replacesJob && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ color: '#6b7280', minWidth: 80 }}>
                {replacesJob.status === 'Cancelled' ? 'Replaces' : 'Follows'}
              </span>
              <span style={{ color: '#9ca3af' }}>→</span>
              <span
                onClick={() => onOpenJob?.(trip.id, replacesJob.id)}
                style={{ color: '#152CFF', fontWeight: 600, cursor: 'pointer', ...mono, fontSize: 11 }}
              >
                {replacesJob.id}
              </span>
              <span style={{ color: '#374151' }}>{replacesJob.vendor.name} · {replacesJob.service.label}</span>
            </div>
          )}
        </section>
      )}

      {/* ── Subservices / L2 editor ── */}
      {!isCancelled && (
        <section style={{ padding: '14px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={label}>Subservices</div>
            {l2Options.length > 0 && !isVerified && (
              <button
                onClick={() => toggleForm('l2')}
                style={{ ...btnGhost, fontSize: 9, padding: '2px 8px', color: '#152CFF', borderColor: 'rgba(21,44,255,0.2)' }}
              >
                {openForm === 'l2' ? 'Done' : 'Edit L2'}
              </button>
            )}
          </div>

          {openForm === 'l2' && l2Options.length > 0 && !isVerified ? (
            <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff', padding: '4px 0' }}>
              {l2Options.map((l2) => {
                const selected = (job.l2CostIds ?? []).includes(l2.costId);
                return (
                  <label key={l2.costId} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 11, color: selected ? '#374151' : '#9ca3af', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        const current = job.l2CostIds ?? [];
                        const next = selected
                          ? current.filter((id) => id !== l2.costId)
                          : [...current, l2.costId];
                        updateJob(trip.id, job.id, { l2CostIds: next });
                      }}
                      style={{ accentColor: '#152CFF', width: 12, height: 12, margin: 0, flexShrink: 0, cursor: 'pointer' }}
                    />
                    {l2.name}
                    <span style={{ ...mono, fontSize: 9, color: '#9ca3af', marginLeft: 'auto' }}>{l2.costId}</span>
                  </label>
                );
              })}
            </div>
          ) : (job.l2CostIds ?? []).length === 0 ? (
            <div style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>No subservices selected</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(job.l2CostIds ?? []).map((costId) => {
                const l2 = getL2ByCostId(costId);
                if (!l2) return null;
                return (
                  <div key={costId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4 }}>
                    <span style={{ ...mono, fontSize: 9, color: '#9ca3af', minWidth: 36 }}>{costId}</span>
                    <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>{l2.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Proof of service — flat list, no tinted squares ── */}
      <section style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={label}>Proof of service · {proofs.length} file{proofs.length === 1 ? '' : 's'}</div>
          {!isVerified && !isCancelled && (
            <button style={{ ...btnGhost, fontSize: 10, padding: '3px 8px' }} onClick={() => fileRef.current?.click()}>
              + Add
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*,.pdf" multiple hidden onChange={handleUpload} />

        {proofs.length === 0 ? (
          <div style={{ fontSize: 11, color: '#9ca3af', padding: '6px 0' }}>No proof uploaded yet.</div>
        ) : (
          proofs.map((doc, i) => (
            <ProofRow
              key={doc.id}
              doc={doc}
              last={i === proofs.length - 1}
              canRemove={!isVerified && !isCancelled}
              onRemove={() => onRemoveProof(doc.id)}
            />
          ))
        )}
      </section>

      {/* ── Secondary action row — buttons that toggle forms ── */}
      <section style={{ padding: '14px 20px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {/* Add remark — only when Completed and no remark yet */}
        {job.status === 'Completed' && !job.completionRemark && onSetCompletionRemark && (
          <button style={btnGhost} onClick={() => toggleForm('remark')}>+ Add remark</button>
        )}

        {/* Follow-up — only when Completed and no follow-up already created */}
        {job.status === 'Completed' && onCreateFollowup && !job.replacedByJobId && (
          <button style={btnGhost} onClick={() => toggleForm('followup')}>+ Follow-up job</button>
        )}

        {/* Cancel — available on any non-cancelled job */}
        {!isCancelled && onCancelJob && (
          <button style={btnDanger} onClick={() => toggleForm('cancel')}>Cancel job</button>
        )}
      </section>

      {/* ── Active form container — only ONE at a time ── */}

      {openForm === 'reject' && (
        <FormContainer tone="danger" title="Reject verification" onClose={() => setOpenForm(null)}>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Why is this rejected? (visible to vendor)"
            style={{ width: '100%', minHeight: 60, padding: 8, border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 12, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
            <button style={btnGhost} onClick={() => { setOpenForm(null); setRejectReason(''); }}>Dismiss</button>
            <button
              style={{ ...btnDanger, background: rejectReason.trim() ? '#dc2626' : '#e5e7eb', color: rejectReason.trim() ? '#fff' : '#9ca3af', borderColor: rejectReason.trim() ? '#dc2626' : '#e5e7eb', cursor: rejectReason.trim() ? 'pointer' : 'not-allowed' }}
              disabled={!rejectReason.trim()}
              onClick={() => {
                const reason = rejectReason.trim();
                if (!reason) return;
                rejectJob(trip.id, job.id, reason);
                setOpenForm(null);
                setRejectReason('');
              }}
            >
              Confirm reject
            </button>
          </div>
        </FormContainer>
      )}

      {openForm === 'cancel' && (
        <FormContainer tone="danger" title="Cancel job" onClose={() => setOpenForm(null)}>
          <div style={{ fontSize: 10, color: '#92400e', marginBottom: 8 }}>
            This action is permanent. The vendor will see the cancellation reason.
          </div>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason for cancellation (required)"
            style={{ width: '100%', minHeight: 60, padding: 8, border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 12, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
          />
          {/* Create replacement checkbox + vendor picker */}
          <div style={{ marginTop: 10, padding: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={createReplacement} onChange={(e) => setCreateReplacement(e.target.checked)} style={{ accentColor: '#152CFF' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>Create replacement job</span>
            </label>
            {createReplacement && (
              <div style={{ marginTop: 8, marginLeft: 20 }}>
                <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 4 }}>New vendor:</div>
                <select
                  value={replacementVendor}
                  onChange={(e) => setReplacementVendor(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #152CFF', borderRadius: 4, fontSize: 12, background: 'rgba(21,44,255,0.03)', color: replacementVendor ? '#152CFF' : '#9ca3af', fontWeight: 600, fontFamily: 'inherit' }}
                >
                  <option value="">Select vendor…</option>
                  {vendors.map((v) => <option key={v.code} value={v.code}>{v.name}</option>)}
                </select>
                <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 4 }}>
                  Inherits: {job.service.code} {job.service.label} · {job.origin.location}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 10 }}>
            <button style={btnGhost} onClick={() => { setOpenForm(null); setCancelReason(''); }}>Dismiss</button>
            {createReplacement ? (
              <button
                disabled={!cancelReason.trim() || !replacementVendor}
                style={{ ...btnDanger, background: cancelReason.trim() && replacementVendor ? '#dc2626' : '#e5e7eb', color: cancelReason.trim() && replacementVendor ? '#fff' : '#9ca3af', borderColor: cancelReason.trim() && replacementVendor ? '#dc2626' : '#e5e7eb', cursor: cancelReason.trim() && replacementVendor ? 'pointer' : 'not-allowed' }}
                onClick={() => {
                  if (!cancelReason.trim() || !replacementVendor) return;
                  onCancelAndReplace?.(cancelReason, replacementVendor);
                  setOpenForm(null);
                  setCancelReason('');
                }}
              >
                Cancel &amp; replace
              </button>
            ) : (
              <button
                disabled={!cancelReason.trim()}
                style={{ ...btnDanger, background: cancelReason.trim() ? '#dc2626' : '#e5e7eb', color: cancelReason.trim() ? '#fff' : '#9ca3af', borderColor: cancelReason.trim() ? '#dc2626' : '#e5e7eb', cursor: cancelReason.trim() ? 'pointer' : 'not-allowed' }}
                onClick={() => {
                  if (!cancelReason.trim()) return;
                  onCancelJob?.(cancelReason);
                  setOpenForm(null);
                  setCancelReason('');
                }}
              >
                Cancel only
              </button>
            )}
          </div>
        </FormContainer>
      )}

      {openForm === 'remark' && (
        <FormContainer tone="attention" title="Completion remark" onClose={() => setOpenForm(null)}>
          <textarea
            value={remarkText}
            onChange={(e) => setRemarkText(e.target.value)}
            placeholder="e.g. Pickup not ready — 1 of 3 pallets retrieved"
            style={{ width: '100%', minHeight: 60, padding: 8, border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 12, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
            <button style={btnGhost} onClick={() => setOpenForm(null)}>Dismiss</button>
            <button
              style={{ ...btnPrimary, cursor: remarkText.trim() ? 'pointer' : 'not-allowed', background: remarkText.trim() ? '#152CFF' : '#e5e7eb', color: remarkText.trim() ? '#fff' : '#9ca3af' }}
              disabled={!remarkText.trim()}
              onClick={() => {
                if (!remarkText.trim()) return;
                onSetCompletionRemark?.(remarkText);
                setOpenForm(null);
              }}
            >
              Save remark
            </button>
          </div>
        </FormContainer>
      )}

      {openForm === 'followup' && (
        <FormContainer tone="neutral" title="Follow-up job" onClose={() => setOpenForm(null)}>
          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 8 }}>
            Same service ({job.service.code} {job.service.label}) and location. New billing event.
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: '#9ca3af', whiteSpace: 'nowrap' }}>Vendor:</span>
            <select
              value={followupVendor}
              onChange={(e) => setFollowupVendor(e.target.value)}
              style={{ flex: 1, padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 12, background: '#fff', fontFamily: 'inherit' }}
            >
              {vendors.map((v) => <option key={v.code} value={v.code}>{v.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
            <button style={btnGhost} onClick={() => setOpenForm(null)}>Dismiss</button>
            <button style={btnPrimary} onClick={() => { onCreateFollowup?.(followupVendor); setOpenForm(null); }}>
              Create follow-up
            </button>
          </div>
        </FormContainer>
      )}

      {/* ── Activity log: plain 2-col rows; timeline only for log.length > 10 ── */}
      <section style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={label}>Activity log</div>
          <span style={{ ...mono, fontSize: 9, background: '#f3f4f6', color: '#9ca3af', padding: '1px 5px', borderRadius: 99 }}>{log.length}</span>
        </div>

        {log.length === 0 && (
          <div style={{ fontSize: 11, color: '#9ca3af' }}>No activity yet.</div>
        )}

        {/* Plain 2-column rows for ≤10 entries */}
        {log.length > 0 && log.length <= 10 && (
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
                  {entry.user && <span style={{ color: '#9ca3af' }}> · {entry.user}</span>}
                  {entry.details && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{entry.details}</div>}
                </div>
                <div style={{ ...mono, fontSize: 10, color: '#9ca3af', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {fmtDateShort(entry.timestamp)} · {fmtTime(entry.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timeline rail for dense logs (>10 entries) */}
        {log.length > 10 && (
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
      </section>

      {/* ── Verification context line — shown on Completed jobs when status changed ── */}
      {!isCancelled && job.verificationStatus === 'Verified' && job.verificationChangedAt && (
        <section style={{ padding: '10px 20px 0' }}>
          <div style={{ fontSize: 10, color: '#9ca3af' }}>
            Verified {formatRelativeTime(job.verificationChangedAt)} · Ops Admin
          </div>
        </section>
      )}

      {/* ── Open full detail link ── */}
      <div style={{ padding: '14px 20px 0', borderTop: '1px solid #e5e7eb', marginTop: 16 }}>
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

// -- Helper components --

function ProofRow({ doc, last, canRemove, onRemove }: { doc: ProofDocument; last: boolean; canRemove: boolean; onRemove: () => void }) {
  const Icon = doc.type.startsWith('image/') ? ImageIcon : FileText;
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
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9ca3af' }}>
          {fmtDateShort(doc.uploadedAt)} · {doc.uploadedBy}
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
      {canRemove && (
        <button onClick={onRemove} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2 }} aria-label="Remove proof">
          <X size={12} color="#9ca3af" />
        </button>
      )}
    </div>
  );
}

function FormContainer({
  tone, title, onClose, children,
}: { tone: 'danger' | 'attention' | 'neutral'; title: string; onClose: () => void; children: React.ReactNode }) {
  const tones = {
    danger:    { bg: '#fef2f2', border: '#fecaca', fg: '#dc2626' },
    attention: { bg: '#fefce8', border: '#fde68a', fg: '#a16207' },
    neutral:   { bg: '#f9fafb', border: '#e5e7eb', fg: '#374151' },
  }[tone];
  return (
    <div style={{ margin: '12px 20px 0', padding: 12, background: tones.bg, border: `1px solid ${tones.border}`, borderRadius: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: tones.fg }}>{title}</div>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2 }} aria-label="Close form">
          <X size={12} color={tones.fg} />
        </button>
      </div>
      {children}
    </div>
  );
}

/** Derive a single amber attention line when proof is required but missing. Extend with more rules as needed. */
function deriveAttentionLine(job: Job): { title: string; detail?: string } | null {
  if (job.status !== 'Completed' || job.verificationStatus !== 'Pending') return null;
  const proofs = job.proofDocuments ?? [];
  if (proofs.length === 0) {
    return { title: 'No proof uploaded.', detail: 'Verify will be blocked until at least one file is attached.' };
  }
  return null;
}
