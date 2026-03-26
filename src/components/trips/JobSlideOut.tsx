import { useRef } from 'react';
import { ArrowRight, MapPin, Upload, FileText, Image, X, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Job, Trip, ProofDocument } from '../../data/mockData';
import { formatCurrency } from '../../data/mockData';
import ServiceTag from './ServiceTag';

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

const PROOF_LABELS = {
  awaiting: { label: 'Awaiting proof', color: '#9ca3af', bg: '#f3f4f6', border: '#e5e7eb', icon: '○' },
  uploaded: { label: 'Proof uploaded', color: '#152CFF', bg: 'rgba(21,44,255,0.04)', border: 'rgba(21,44,255,0.15)', icon: '📄' },
  validated: { label: 'Validated', color: '#059669', bg: '#f0fdf4', border: '#a7f3d0', icon: '✓' },
  disputed: { label: 'Disputed', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '✕' },
};

interface Props {
  job: Job; trip: Trip; jobIndex: number;
  onUploadProof: (file: File) => void;
  onRemoveProof: (docId: string) => void;
  onValidate?: () => void;
  onDispute?: (reason: string) => void;
  onUpdateFeeQty?: (feeId: string, quantity: number) => void;
  onUpdateJobQty?: (qtys: { jobBags?: number; jobWeight?: number; jobVolume?: number }) => void;
}

function docIcon(doc: ProofDocument) {
  return doc.type.startsWith('image/') ? <Image size={12} style={{ color: '#152CFF' }} /> : <FileText size={12} style={{ color: '#152CFF' }} />;
}

export default function JobSlideOut({ job, trip, jobIndex, onUploadProof, onRemoveProof, onValidate, onDispute, onUpdateFeeQty, onUpdateJobQty }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const log = job.activityLog ?? [];
  const proofs = job.proofDocuments ?? [];
  const fees = job.fees ?? [];
  const isValidated = job.proofStatus === 'validated';
  const isDisputed = job.proofStatus === 'disputed';
  const hasProofs = proofs.length > 0;
  const ps = PROOF_LABELS[job.proofStatus] ?? PROOF_LABELS.awaiting;

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onUploadProof(f);
    if (fileRef.current) fileRef.current.value = '';
  }

  // Calculate fee totals
  const feeTotals = new Map<string, number>();
  fees.forEach((f) => feeTotals.set(f.currency, (feeTotals.get(f.currency) ?? 0) + f.amount));

  const inputStyle: React.CSSProperties = { fontSize: 10, padding: '3px 6px', border: '1px solid #e5e7eb', borderRadius: 3, outline: 'none', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: ps.bg, border: `1px solid ${ps.border}`, color: ps.color }}>
            {ps.icon} {ps.label}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#9ca3af' }}>
            J{String(jobIndex + 1).padStart(2, '0')}/{trip.jobs.length}
          </span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginTop: 6 }}>{job.vendor.name} · {job.service.label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
          <span>{trip.customer.name}</span>
          <span style={{ color: '#d1d5db' }}>&middot;</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{trip.mawb}</span>
        </div>
      </div>

      {/* Dispute reason */}
      {isDisputed && job.disputeReason && (
        <div style={{ padding: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#dc2626', marginBottom: 3 }}>Dispute Reason</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#dc2626' }}>{job.disputeReason}</div>
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

      {/* === PROOF OF SERVICE — THE PRIMARY ACTION === */}
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
                {!isValidated && (
                  <button onClick={() => onRemoveProof(doc.id)} style={{ padding: 2, color: '#d1d5db', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 16, textAlign: 'center', fontSize: 10, color: '#d1d5db', fontStyle: 'italic', border: '1px dashed #e5e7eb', borderRadius: 6, marginBottom: 8 }}>
            No proof uploaded yet — upload to advance this job
          </div>
        )}

        {/* Upload button */}
        {!isValidated && (
          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 10px',
            fontSize: 11, fontWeight: 600, color: '#152CFF', background: 'rgba(21,44,255,0.04)',
            borderRadius: 6, cursor: 'pointer', border: '1px solid rgba(21,44,255,0.12)',
            marginBottom: 8,
          }}>
            <Upload size={12} /> Upload proof document
            <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleUpload} />
          </label>
        )}

        {/* === VALIDATE / DISPUTE — only when proof is uploaded === */}
        {hasProofs && !isValidated && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onValidate?.()} style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: 'none', background: '#059669', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              ✓ Validate Proof
            </button>
            <button onClick={() => onDispute?.('Proof insufficient')} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              Dispute
            </button>
          </div>
        )}

        {isValidated && (
          <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#059669', textAlign: 'center' }}>
            ✓ Proof validated — ready for payment
          </div>
        )}
      </div>

      {/* Quantities (editable until validated) */}
      <div>
        <div style={sectionTitle}>
          Quantities
          {!isValidated && <span style={{ fontSize: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#b45309', marginLeft: 4 }}>(editable until validated)</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '8px 10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6 }}>
          <div>
            <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 2 }}>Bags</div>
            {isValidated
              ? <div style={{ ...inputStyle, border: 'none', padding: 0, background: 'none' }}>{job.jobBags ?? trip.bags}</div>
              : <input type="number" value={job.jobBags ?? trip.bags} onChange={(e) => onUpdateJobQty?.({ jobBags: Number(e.target.value) || 0 })} style={{ ...inputStyle, width: 50 }} />
            }
          </div>
          <div>
            <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 2 }}>Weight (kg)</div>
            {isValidated
              ? <div style={{ ...inputStyle, border: 'none', padding: 0, background: 'none' }}>{job.jobWeight ?? trip.weight}</div>
              : <input type="number" value={job.jobWeight ?? trip.weight} onChange={(e) => onUpdateJobQty?.({ jobWeight: Number(e.target.value) || 0 })} style={{ ...inputStyle, width: 70 }} />
            }
          </div>
          <div>
            <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 2 }}>Volume (CBM)</div>
            {isValidated
              ? <div style={{ ...inputStyle, border: 'none', padding: 0, background: 'none' }}>{job.jobVolume ?? 0}</div>
              : <input type="number" step="0.1" value={job.jobVolume ?? 0} onChange={(e) => onUpdateJobQty?.({ jobVolume: Number(e.target.value) || 0 })} style={{ ...inputStyle, width: 60 }} />
            }
          </div>
        </div>
      </div>

      {/* Fee Breakdown — ALL FROM RATE CARDS, NO ADD BUTTON */}
      <div>
        <div style={sectionTitle}>Fees — from rate card</div>
        {fees.length > 0 ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb' }}>Fee</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb' }}>Rate</th>
                  <th style={{ textAlign: 'center', padding: '4px 8px', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', width: 50 }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', width: 80 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => (
                  <tr key={fee.id}>
                    <td style={{ padding: '5px 8px', fontSize: 10, color: '#374151', borderBottom: '1px solid #f3f4f6' }}>
                      <div>{fee.name}</div>
                      {fee.feeId && <div style={{ fontSize: 8, color: '#9ca3af' }}>Rate card</div>}
                    </td>
                    <td style={{ padding: '5px 8px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>
                      {formatCurrency(fee.currency, fee.rate)} <span style={{ fontSize: 8 }}>/{fee.unit === 'flat' ? 'trip' : fee.unit.replace('per-', '')}</span>
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                      {isValidated
                        ? <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{fee.quantity}</span>
                        : <input type="number" value={fee.quantity} onChange={(e) => onUpdateFeeQty?.(fee.id, Number(e.target.value) || 0)} style={{ ...inputStyle, width: 40, textAlign: 'center' }} />
                      }
                    </td>
                    <td style={{ padding: '5px 8px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#111827', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>
                      {formatCurrency(fee.currency, fee.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '6px 8px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>Job Total</span>
              <div>
                {Array.from(feeTotals.entries()).map(([curr, total]) => (
                  <div key={curr} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#152CFF', textAlign: 'right' }}>
                    {formatCurrency(curr as any, total)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 12, textAlign: 'center', fontSize: 10, color: '#d1d5db', fontStyle: 'italic', border: '1px dashed #e5e7eb', borderRadius: 6, marginBottom: 8 }}>
            No fees — rates not configured for this vendor/service
          </div>
        )}

        {/* No "+ Add fee" — link to Rates page instead */}
        <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', padding: '6px', border: '1px dashed #e5e7eb', borderRadius: 4 }}>
          Fees are configured in <Link to="/rates" style={{ color: '#152CFF', textDecoration: 'none', fontWeight: 600 }}>Rates →</Link>
        </div>
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
