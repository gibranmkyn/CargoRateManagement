// JobSlideOut.new.tsx — flattened slide-out (HMW-SLOP Phase 3)
//
// Replaces components/trips/JobSlideOut.tsx.
//
// Key deltas from the previous version:
//  • No tinted Status Action Bar container
//  • No standalone Verification Row — Reject/Verify live in the top action row
//  • Details are key/value pairs; the single "needs attention" line is amber text, no box
//  • Proof docs: flat list, lucide icon at #6b7280 (no blue tinted square)
//  • Activity log: plain 2-column rows; timeline rails reserved for log.length > 10
//  • Only ONE colored container is rendered at a time (the active form, if any)

import { useRef, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, X, AlertTriangle, ExternalLink } from 'lucide-react';
import type { Job, Trip, ProofDocument } from '@shared/mockData';
import { vendors, getL1ByCode } from '@shared/mockData';
import { useTrips } from '@shared/TripContext';
import { fmtDateTime, fmtTime, fmtDateShort } from '@shared/statusStyles';
import { getStateStyle } from '@shared/statusStyles';
import StateCell from './StateCell';
import ServiceTag from './ServiceTag';

interface Props {
  job: Job; trip: Trip; jobIndex: number;
  onUploadProof: (file: File) => void;
  onRemoveProof: (docId: string) => void;
  onStartJob?: () => void;
  onCancelJob?: (reason: string) => void;
  onCancelAndReplace?: (reason: string, newVendorCode: string) => void;
  onCreateFollowup?: (vendorCode: string) => void;
  onSetCompletionRemark?: (remark: string) => void;
}

const mono: React.CSSProperties = { fontFamily: 'JetBrains Mono, ui-monospace, monospace' };
const label: React.CSSProperties = { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' };
const btnGhost: React.CSSProperties = { padding: '5px 11px', border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff', color: '#374151', fontSize: 11, fontWeight: 500, cursor: 'pointer' };
const btnPrimary: React.CSSProperties = { padding: '5px 12px', border: 'none', borderRadius: 4, background: '#152CFF', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' };
const btnVerify: React.CSSProperties = { ...btnPrimary, background: '#059669' };
const btnDanger: React.CSSProperties = { ...btnGhost, color: '#dc2626', borderColor: '#fecaca' };

// Which secondary form, if any, is open (enforces: only one container at a time)
type OpenForm = null | 'cancel' | 'remark' | 'followup' | 'reject';

export default function JobSlideOut({
  job, trip, jobIndex,
  onUploadProof, onRemoveProof,
  onStartJob, onCancelJob, onCancelAndReplace, onCreateFollowup, onSetCompletionRemark,
}: Props) {
  const { verifyJob, rejectJob } = useTrips();
  const fileRef = useRef<HTMLInputElement>(null);
  const log = job.activityLog ?? [];
  const proofs = job.proofDocuments ?? [];
  const state = getStateStyle(job);
  const isTerminal = state.tone === 'success' || job.status === 'Cancelled';

  const [open, setOpen] = useState<OpenForm>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [createReplacement, setCreateReplacement] = useState(true);
  const [replacementVendor, setReplacementVendor] = useState('');
  const [followupVendor, setFollowupVendor] = useState(job.vendor.code);
  const [remarkText, setRemarkText] = useState(job.completionRemark ?? '');
  const [rejectReason, setRejectReason] = useState('');

  const l1 = getL1ByCode(job.service.code);
  const attentionLine = deriveAttentionLine(job);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) onUploadProof(files[i]);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div style={{ padding: '0 0 24px', color: '#111827', fontSize: 13 }}>
      {/* ── Header block: identity + action row (single border below, no tint) ── */}
      <header style={{ padding: '16px 20px 12px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...mono, fontSize: 10, color: '#9ca3af', marginBottom: 3 }}>
              JOB · {job.id} · {jobIndex + 1}/{trip.jobs.length}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.2px' }}>
              {l1?.label ?? job.service.label} · {job.origin.location}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
              {trip.customer.name} · Trip {trip.id} · {job.vendor.name}
            </div>
          </div>
          <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }} aria-label="Close">
            <X size={14} color="#6b7280" />
          </button>
        </div>

        {/* Single action row — state on left, primary/secondary buttons on right */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <StateCell job={job} fontSize={12} withSubline />
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {/* State-dependent primary action */}
            {job.status === 'Pending' && onStartJob && (
              <button style={btnPrimary} onClick={onStartJob}>Start job</button>
            )}
            {job.status === 'In Progress' && (
              <button style={btnPrimary} onClick={() => fileRef.current?.click()}>
                <Upload size={11} style={{ marginRight: 4, verticalAlign: -1 }} />
                Upload proof
              </button>
            )}
            {job.status === 'Completed' && job.verificationStatus === 'Pending' && (
              <>
                <button style={btnGhost} onClick={() => setOpen(open === 'reject' ? null : 'reject')}>Reject</button>
                <button style={btnVerify} onClick={() => verifyJob(trip.id, job.id)}>Verify</button>
              </>
            )}
            {job.verificationStatus === 'Rejected' && (
              <button style={btnPrimary} onClick={() => fileRef.current?.click()}>Re-upload proof</button>
            )}
            {isTerminal && (
              <span style={{ fontSize: 11, color: '#9ca3af' }}>Terminal — no actions</span>
            )}
          </div>
        </div>
      </header>

      {/* ── Details ── */}
      <section style={{ padding: '14px 20px 0' }}>
        <div style={{ ...label, marginBottom: 8 }}>Details</div>
        <dl style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 6, margin: 0, fontSize: 12 }}>
          <dt style={{ color: '#6b7280' }}>Service</dt>
          <dd style={{ margin: 0 }}>
            <ServiceTag code={job.service.code} /> <span style={{ color: '#9ca3af' }}>{job.service.label}</span>
          </dd>
          <dt style={{ color: '#6b7280' }}>Route</dt>
          <dd style={{ margin: 0 }}>
            {job.origin.location}
            {job.destination?.location && <> <span style={{ color: '#9ca3af' }}>→</span> {job.destination.location}</>}
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

        {/* Single amber text line — the one thing that needs attention */}
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

      {/* ── Proof docs — flat list, no tinted squares ── */}
      <section style={{ padding: '18px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={label}>Proof · {proofs.length} file{proofs.length === 1 ? '' : 's'}</div>
          <button style={{ ...btnGhost, fontSize: 10, padding: '3px 8px' }} onClick={() => fileRef.current?.click()}>
            + Add
          </button>
        </div>
        <input ref={fileRef} type="file" multiple hidden onChange={handleUpload} />
        {proofs.length === 0 ? (
          <div style={{ fontSize: 11, color: '#9ca3af', padding: '6px 0' }}>No proof uploaded yet.</div>
        ) : (
          proofs.map((doc, i) => (
            <ProofRow key={doc.id} doc={doc} last={i === proofs.length - 1} onRemove={() => onRemoveProof(doc.id)} />
          ))
        )}
      </section>

      {/* ── Secondary actions (only ONE expands at a time) ── */}
      <section style={{ padding: '16px 20px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {job.status === 'Completed' && !job.completionRemark && (
          <button style={btnGhost} onClick={() => setOpen(open === 'remark' ? null : 'remark')}>
            + Add remark
          </button>
        )}
        {!isTerminal && (
          <button style={btnGhost} onClick={() => setOpen(open === 'followup' ? null : 'followup')}>
            + Follow-up job
          </button>
        )}
        {job.status !== 'Cancelled' && (
          <button style={btnDanger} onClick={() => setOpen(open === 'cancel' ? null : 'cancel')}>
            Cancel job
          </button>
        )}
      </section>

      {/* The SINGLE colored container, only if a form is open */}
      {open === 'reject' && (
        <FormContainer tone="danger" title="Reject verification" onClose={() => setOpen(null)}>
          <textarea
            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Why is this rejected? (visible to vendor)"
            style={{ width: '100%', minHeight: 60, padding: 8, border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 12, fontFamily: 'inherit', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
            <button style={btnGhost} onClick={() => setOpen(null)}>Dismiss</button>
            <button
              style={{ ...btnDanger, background: '#dc2626', color: '#fff', borderColor: '#dc2626' }}
              disabled={!rejectReason.trim()}
              onClick={() => { rejectJob(trip.id, job.id, rejectReason); setOpen(null); }}
            >
              Reject
            </button>
          </div>
        </FormContainer>
      )}

      {open === 'cancel' && (
        <FormContainer tone="danger" title="Cancel job" onClose={() => setOpen(null)}>
          <textarea
            value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason for cancellation (required)"
            style={{ width: '100%', minHeight: 60, padding: 8, border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 12, fontFamily: 'inherit', resize: 'vertical' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: '#374151' }}>
            <input type="checkbox" checked={createReplacement} onChange={(e) => setCreateReplacement(e.target.checked)} />
            Create replacement job
          </label>
          {createReplacement && (
            <select
              value={replacementVendor}
              onChange={(e) => setReplacementVendor(e.target.value)}
              style={{ marginTop: 8, padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 12, width: '100%', background: '#fff' }}
            >
              <option value="">Select replacement vendor…</option>
              {vendors.map((v) => <option key={v.code} value={v.code}>{v.name}</option>)}
            </select>
          )}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 10 }}>
            <button style={btnGhost} onClick={() => setOpen(null)}>Dismiss</button>
            <button
              style={{ ...btnDanger, background: '#dc2626', color: '#fff', borderColor: '#dc2626' }}
              disabled={!cancelReason.trim() || (createReplacement && !replacementVendor)}
              onClick={() => {
                if (createReplacement && replacementVendor && onCancelAndReplace) onCancelAndReplace(cancelReason, replacementVendor);
                else if (onCancelJob) onCancelJob(cancelReason);
                setOpen(null);
              }}
            >
              {createReplacement ? 'Cancel & replace' : 'Cancel job'}
            </button>
          </div>
        </FormContainer>
      )}

      {open === 'remark' && (
        <FormContainer tone="attention" title="Completion remark" onClose={() => setOpen(null)}>
          <textarea
            value={remarkText} onChange={(e) => setRemarkText(e.target.value)}
            placeholder="e.g. Pickup not ready — 1 of 3 pallets retrieved"
            style={{ width: '100%', minHeight: 60, padding: 8, border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 12, fontFamily: 'inherit', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
            <button style={btnGhost} onClick={() => setOpen(null)}>Dismiss</button>
            <button
              style={btnPrimary}
              onClick={() => { onSetCompletionRemark?.(remarkText); setOpen(null); }}
            >
              Save remark
            </button>
          </div>
        </FormContainer>
      )}

      {open === 'followup' && (
        <FormContainer tone="neutral" title="Follow-up job" onClose={() => setOpen(null)}>
          <select
            value={followupVendor}
            onChange={(e) => setFollowupVendor(e.target.value)}
            style={{ padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 12, width: '100%', background: '#fff' }}
          >
            {vendors.map((v) => <option key={v.code} value={v.code}>{v.name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
            <button style={btnGhost} onClick={() => setOpen(null)}>Dismiss</button>
            <button style={btnPrimary} onClick={() => { onCreateFollowup?.(followupVendor); setOpen(null); }}>Create</button>
          </div>
        </FormContainer>
      )}

      {/* ── Activity log: plain list, timeline reserved for >10 entries ── */}
      <section style={{ padding: '18px 20px 0' }}>
        <div style={{ ...label, marginBottom: 8 }}>Activity</div>
        {log.length === 0 && <div style={{ fontSize: 11, color: '#9ca3af' }}>No activity yet.</div>}
        {log.length > 0 && log.length <= 10 && (
          <div>
            {log.slice().reverse().map((e, i, arr) => (
              <div
                key={e.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', gap: 10,
                  padding: '6px 0', fontSize: 12,
                  borderBottom: i === arr.length - 1 ? 'none' : '1px solid #f3f4f6',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span>{e.action}</span>
                  {e.user && <span style={{ color: '#9ca3af' }}> · {e.user}</span>}
                  {e.details && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{e.details}</div>}
                </div>
                <div style={{ ...mono, fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>
                  {fmtDateShort(e.timestamp)} · {fmtTime(e.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
        {log.length > 10 && (
          /* Keep the existing timeline component for dense logs — import your current version here. */
          <TimelineLog log={log} />
        )}
      </section>
    </div>
  );
}

// -- Helpers --

function ProofRow({ doc, last, onRemove }: { doc: ProofDocument; last: boolean; onRemove: () => void }) {
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
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
        <div style={{ ...mono, fontSize: 10, color: '#9ca3af' }}>
          {fmtDateShort(doc.uploadedAt)} · {doc.uploadedBy}
        </div>
      </div>
      <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#152CFF', textDecoration: 'none', fontWeight: 500 }}>
        <ExternalLink size={10} style={{ marginRight: 3, verticalAlign: -1 }} />
        Open
      </a>
      <button onClick={onRemove} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2 }} aria-label="Remove">
        <X size={12} color="#9ca3af" />
      </button>
    </div>
  );
}

function FormContainer({
  tone, title, onClose, children,
}: { tone: 'danger' | 'attention' | 'neutral'; title: string; onClose: () => void; children: React.ReactNode }) {
  const tones = {
    danger: { bg: '#fef2f2', border: '#fecaca', fg: '#dc2626' },
    attention: { bg: '#fefce8', border: '#fde68a', fg: '#a16207' },
    neutral: { bg: '#f9fafb', border: '#e5e7eb', fg: '#374151' },
  }[tone];
  return (
    <div style={{ margin: '12px 20px 0', padding: 12, background: tones.bg, border: `1px solid ${tones.border}`, borderRadius: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: tones.fg }}>{title}</div>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2 }} aria-label="Close">
          <X size={12} color={tones.fg} />
        </button>
      </div>
      {children}
    </div>
  );
}

/** Decide whether to surface a single amber "attention" line above proof docs. */
function deriveAttentionLine(job: Job): { title: string; detail?: string } | null {
  if (job.status !== 'Completed' || job.verificationStatus !== 'Pending') return null;
  const proofs = job.proofDocuments ?? [];
  if (proofs.length === 0) return { title: 'No proof uploaded.', detail: 'Verify button will block until at least one file is attached.' };
  // Extend with more rules (missing seal photo, late execution, etc.) as signals land
  return null;
}

/** Placeholder — keep using your existing dense-log component for long logs. */
function TimelineLog({ log }: { log: Job['activityLog'] }) {
  return (
    <div style={{ fontSize: 11, color: '#6b7280' }}>
      {/* TODO: drop your existing <ActivityTimeline log={log}/> import here */}
      <em>({log.length} entries — use existing timeline component)</em>
    </div>
  );
}
