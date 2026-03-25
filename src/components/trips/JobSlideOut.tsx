import { useRef, useState } from 'react';
import { ArrowRight, MapPin, Upload, FileText, Image, X, Clock, ExternalLink, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Job, Trip, JobStatus, ProofDocument, FeeLineItem, Currency, RateUnit } from '../../data/mockData';
import { vendors, formatCurrency, FEE_CATALOG, calcFeeAmount } from '../../data/mockData';
import ServiceTag from './ServiceTag';
import StatusBadge from './StatusBadge';

const allStatuses: JobStatus[] = ['Pending', 'In Progress', 'Completed', 'Rejected', 'Cancelled'];
const primaryStatuses: { label: string; value: JobStatus }[] = [
  { label: 'Pending', value: 'Pending' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
];
const secondaryStatuses: { label: string; value: JobStatus }[] = [
  { label: 'Reject', value: 'Rejected' },
  { label: 'Cancel', value: 'Cancelled' },
];

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
  onAddFee?: (fee: FeeLineItem) => void;
  onRemoveFee?: (feeId: string) => void;
  onUpdateFeeQty?: (feeId: string, quantity: number) => void;
  onUpdateJobQty?: (qtys: { jobBags?: number; jobWeight?: number; jobVolume?: number }) => void;
}

function docIcon(doc: ProofDocument) {
  return doc.type.startsWith('image/') ? <Image size={12} style={{ color: '#152CFF' }} /> : <FileText size={12} style={{ color: '#152CFF' }} />;
}

export default function JobSlideOut({ job, trip, jobIndex, onStatusChange, onUploadProof, onRemoveProof, onReassign, onAddFee, onRemoveFee, onUpdateFeeQty, onUpdateJobQty }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const log = job.activityLog ?? [];
  const proofs = job.proofDocuments ?? [];
  const fees = job.fees ?? [];
  const isRejected = job.status === 'Rejected';
  const isCompleted = job.status === 'Completed';
  const [showAddFee, setShowAddFee] = useState(false);
  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeRate, setNewFeeRate] = useState('');
  const [newFeeUnit, setNewFeeUnit] = useState<RateUnit>('flat');
  const [newFeeQty, setNewFeeQty] = useState('1');
  const [newFeeCurrency, setNewFeeCurrency] = useState<Currency>('MYR');

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onUploadProof(f);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleAddFee() {
    if (!newFeeName || !newFeeRate || !onAddFee) return;
    const rate = parseFloat(newFeeRate);
    const qty = parseFloat(newFeeQty) || 1;
    if (isNaN(rate) || rate <= 0) return;
    onAddFee({
      id: `F-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: newFeeName,
      currency: newFeeCurrency,
      rate,
      unit: newFeeUnit,
      quantity: qty,
      amount: calcFeeAmount(rate, newFeeUnit, qty),
    });
    setNewFeeName(''); setNewFeeRate(''); setNewFeeQty('1'); setShowAddFee(false);
  }

  // Calculate fee totals
  const feeTotals = new Map<Currency, number>();
  fees.forEach((f) => feeTotals.set(f.currency, (feeTotals.get(f.currency) ?? 0) + f.amount));

  const inputStyle: React.CSSProperties = { fontSize: 10, padding: '3px 6px', border: '1px solid #e5e7eb', borderRadius: 3, outline: 'none', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 };

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
          <MapPin size={11} style={{ color: '#152CFF', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>{job.origin.location}</span>
          <ArrowRight size={10} style={{ color: '#d1d5db' }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>{job.destination.location}</span>
        </div>
        {job.origin.date && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9ca3af', marginBottom: 8, marginLeft: 17 }}>{fmtDateTime(job.origin.date)}</div>
        )}
        <ServiceTag service={job.service} />
      </div>

      {/* Status — compact progress bar */}
      <div>
        <div style={sectionTitle}>{isRejected ? 'Reassign or Change Status' : 'Status'}</div>
        <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
          {primaryStatuses.map((s) => {
            const isActive = s.value === job.status;
            const isCompletedBtn = s.value === 'Completed';
            const activeColor = isCompletedBtn ? '#059669' : '#152CFF';
            const activeBg = isCompletedBtn ? '#f0fdf4' : 'rgba(21,44,255,0.06)';
            const activeBorder = isCompletedBtn ? '#a7f3d0' : '#152CFF';
            return (
              <button
                key={s.value}
                onClick={() => onStatusChange(s.value)}
                style={{
                  flex: 1, padding: '5px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                  border: isActive ? `1.5px solid ${activeBorder}` : '1px solid #e5e7eb',
                  background: isActive ? activeBg : '#f3f4f6',
                  color: isActive ? activeColor : '#9ca3af',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {secondaryStatuses.map((s) => {
            const isActive = s.value === job.status;
            const isReject = s.value === 'Rejected';
            return (
              <button
                key={s.value}
                onClick={() => onStatusChange(s.value)}
                style={{
                  padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600,
                  border: isActive ? `1px solid ${isReject ? '#fecaca' : '#e5e7eb'}` : '1px solid #e5e7eb',
                  background: isActive ? (isReject ? '#fef2f2' : '#f3f4f6') : 'transparent',
                  color: isActive ? (isReject ? '#dc2626' : '#6b7280') : '#9ca3af',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {s.label}
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
        </div>
      )}

      {/* Editable Quantities */}
      <div>
        <div style={sectionTitle}>
          Quantities
          {!isCompleted && <span style={{ fontSize: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#b45309', marginLeft: 4 }}>(editable until completed)</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '8px 10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6 }}>
          <div>
            <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 2 }}>Bags</div>
            {isCompleted
              ? <div style={{ ...inputStyle, border: 'none', padding: 0, background: 'none' }}>{job.jobBags ?? trip.bags}</div>
              : <input type="number" value={job.jobBags ?? trip.bags} onChange={(e) => onUpdateJobQty?.({ jobBags: Number(e.target.value) || 0 })} style={{ ...inputStyle, width: 50 }} />
            }
          </div>
          <div>
            <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 2 }}>Weight (kg)</div>
            {isCompleted
              ? <div style={{ ...inputStyle, border: 'none', padding: 0, background: 'none' }}>{job.jobWeight ?? trip.weight}</div>
              : <input type="number" value={job.jobWeight ?? trip.weight} onChange={(e) => onUpdateJobQty?.({ jobWeight: Number(e.target.value) || 0 })} style={{ ...inputStyle, width: 70 }} />
            }
          </div>
          <div>
            <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 2 }}>Volume (CBM)</div>
            {isCompleted
              ? <div style={{ ...inputStyle, border: 'none', padding: 0, background: 'none' }}>{job.jobVolume ?? 0}</div>
              : <input type="number" step="0.1" value={job.jobVolume ?? 0} onChange={(e) => onUpdateJobQty?.({ jobVolume: Number(e.target.value) || 0 })} style={{ ...inputStyle, width: 60 }} />
            }
          </div>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={sectionTitle as React.CSSProperties}>Fee Breakdown ({fees.length})</span>
        </div>
        {fees.length > 0 ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb' }}>Fee</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb' }}>Rate</th>
                  <th style={{ textAlign: 'center', padding: '4px 8px', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', width: 50 }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', width: 80 }}>Amount</th>
                  {!isCompleted && <th style={{ width: 20, background: '#f9fafb' }}></th>}
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => (
                  <tr key={fee.id}>
                    <td style={{ padding: '5px 8px', fontSize: 10, color: '#374151', borderBottom: '1px solid #f3f4f6' }}>
                      <div>{fee.name}</div>
                      {fee.rateId && <div style={{ fontSize: 8, color: '#9ca3af' }}>Rate card</div>}
                    </td>
                    <td style={{ padding: '5px 8px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>
                      {formatCurrency(fee.currency, fee.rate)} <span style={{ fontSize: 8 }}>/{fee.unit === 'flat' ? 'trip' : fee.unit.replace('per-', '')}</span>
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                      {isCompleted
                        ? <span style={{ ...inputStyle, border: 'none', padding: 0, background: 'none' }}>{fee.quantity}</span>
                        : <input type="number" value={fee.quantity} onChange={(e) => onUpdateFeeQty?.(fee.id, Number(e.target.value) || 0)} style={{ ...inputStyle, width: 40, textAlign: 'center' }} />
                      }
                    </td>
                    <td style={{ padding: '5px 8px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#111827', textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>
                      {formatCurrency(fee.currency, fee.amount)}
                    </td>
                    {!isCompleted && (
                      <td style={{ padding: '5px 4px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                        <button onClick={() => onRemoveFee?.(fee.id)} style={{ border: 'none', background: 'none', color: '#d1d5db', cursor: 'pointer', padding: 0 }}><X size={10} /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Total */}
            <div style={{ padding: '6px 8px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>Job Total</span>
              <div>
                {Array.from(feeTotals.entries()).map(([curr, total]) => (
                  <div key={curr} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#152CFF', textAlign: 'right' }}>
                    {formatCurrency(curr, total)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 12, textAlign: 'center', fontSize: 10, color: '#d1d5db', fontStyle: 'italic', border: '1px dashed #e5e7eb', borderRadius: 6, marginBottom: 8 }}>
            No fee line items
          </div>
        )}

        {/* + Add fee */}
        {!isCompleted && !showAddFee && (
          <button onClick={() => setShowAddFee(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 4, border: '1px dashed #e5e7eb', background: 'none', color: '#9ca3af', fontSize: 10, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
            <Plus size={10} /> Add fee line item
          </button>
        )}
        {!isCompleted && showAddFee && (
          <div style={{ padding: 10, background: '#f0fdfa', border: '1px solid rgba(21,44,255,0.15)', borderRadius: 6 }}>
            <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#152CFF', marginBottom: 6 }}>New fee</div>
            <div style={{ marginBottom: 4 }}>
              <select value={newFeeName} onChange={(e) => setNewFeeName(e.target.value)} style={{ width: '100%', fontSize: 10, padding: '4px 6px', border: '1px solid #e5e7eb', borderRadius: 4 }}>
                <option value="">Select fee type...</option>
                {FEE_CATALOG.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <select value={newFeeCurrency} onChange={(e) => setNewFeeCurrency(e.target.value as Currency)} style={{ width: 50, fontSize: 10, padding: '4px 4px', border: '1px solid #e5e7eb', borderRadius: 4 }}>
                <option>MYR</option><option>CNY</option><option>USD</option>
              </select>
              <input type="number" placeholder="Rate" value={newFeeRate} onChange={(e) => setNewFeeRate(e.target.value)} style={{ width: 60, ...inputStyle }} />
              <select value={newFeeUnit} onChange={(e) => setNewFeeUnit(e.target.value as RateUnit)} style={{ width: 65, fontSize: 10, padding: '4px 4px', border: '1px solid #e5e7eb', borderRadius: 4 }}>
                <option value="flat">/trip</option><option value="per-km">/km</option><option value="per-bag">/bag</option><option value="per-kg">/kg</option>
              </select>
              <input type="number" placeholder="Qty" value={newFeeQty} onChange={(e) => setNewFeeQty(e.target.value)} style={{ width: 40, ...inputStyle, textAlign: 'center' }} />
              <button onClick={handleAddFee} style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: '#152CFF', color: '#fff', fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>Add</button>
              <button onClick={() => setShowAddFee(false)} style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#fff', color: '#9ca3af', fontSize: 9, cursor: 'pointer' }}><X size={10} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Proof of Service */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={sectionTitle as React.CSSProperties}>Proof of Service</span>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
            fontSize: 10, fontWeight: 600, color: '#152CFF', background: 'rgba(21,44,255,0.07)',
            borderRadius: 4, cursor: 'pointer', border: '1px solid rgba(21,44,255,0.12)',
          }}>
            <Upload size={10} /> Upload
            <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleUpload} />
          </label>
        </div>
        {proofs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {proofs.map((doc) => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(21,44,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{docIcon(doc)}</div>
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
