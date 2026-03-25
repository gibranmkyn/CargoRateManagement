import { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useTrips } from '../context/TripContext';
import { useToast } from '../components/Toast';
import { formatCurrency } from '../data/mockData';
import type { Trip, Job, Currency } from '../data/mockData';

type Tab = 'ready' | 'validation' | 'approved';
type VarianceState = 'match' | 'over' | 'under' | 'no-rate' | 'currency-mismatch';
type Filter = 'all' | 'flagged' | 'no-rate';

const VARIANCE_STYLES: Record<VarianceState, { text: string; bg: string; border: string; label: string }> = {
  match: { text: '#059669', bg: '#f0fdf4', border: '#a7f3d0', label: 'Match' },
  over: { text: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Over' },
  under: { text: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Under' },
  'no-rate': { text: '#b45309', bg: '#fefce8', border: '#fde68a', label: 'No rate' },
  'currency-mismatch': { text: '#b45309', bg: '#fefce8', border: '#fde68a', label: 'Currency mismatch' },
};

function getVariance(job: Job): { state: VarianceState; diff?: number } {
  if (!job.agreedCost) return { state: 'no-rate' };
  if (!job.invoiceAmount) return { state: 'no-rate' };
  if (job.agreedCost.currency !== job.invoiceAmount.currency) return { state: 'currency-mismatch' };
  const diff = job.invoiceAmount.amount - job.agreedCost.amount;
  if (Math.abs(diff) < 0.01) return { state: 'match', diff: 0 };
  return diff > 0 ? { state: 'over', diff } : { state: 'under', diff };
}

function getOrderSeverity(trip: Trip): number {
  const vars = trip.jobs.map(getVariance);
  if (vars.some((v) => v.state === 'over')) return 0;
  if (vars.some((v) => v.state === 'no-rate')) return 1;
  if (vars.some((v) => v.state === 'under')) return 2;
  return 3; // all match
}

const th: React.CSSProperties = { textAlign: 'left', padding: '6px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' };
const td: React.CSSProperties = { padding: '6px 10px', fontSize: 11, color: '#374151', borderBottom: '1px solid #f3f4f6' };

export default function BillingPage() {
  const { trips, setJobInvoice, bulkApplyAgreedRates } = useTrips();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('validation');
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // All orders with at least one job that has an agreed rate, invoice, or completed status
  const billingOrders = trips.filter((t) => t.jobs.some((j) => j.agreedCost || j.agreedRate || j.invoiceAmount || j.status === 'Completed'));

  // Sort by severity
  const sorted = [...billingOrders].sort((a, b) => getOrderSeverity(a) - getOrderSeverity(b));

  // Filter
  const filtered = sorted.filter((t) => {
    if (filter === 'flagged') return t.jobs.some((j) => { const v = getVariance(j); return v.state === 'over' || v.state === 'under'; });
    if (filter === 'no-rate') return t.jobs.some((j) => getVariance(j).state === 'no-rate');
    return true;
  });

  // Stats
  const allJobs = billingOrders.flatMap((t) => t.jobs);
  const overCount = allJobs.filter((j) => getVariance(j).state === 'over').length;
  const noRateCount = allJobs.filter((j) => getVariance(j).state === 'no-rate').length;
  const underCount = allJobs.filter((j) => getVariance(j).state === 'under').length;
  const matchCount = allJobs.filter((j) => getVariance(j).state === 'match').length;
  const flaggedOrders = billingOrders.filter((t) => t.jobs.some((j) => { const v = getVariance(j); return v.state === 'over' || v.state === 'under'; })).length;
  const noRateOrders = billingOrders.filter((t) => t.jobs.some((j) => getVariance(j).state === 'no-rate')).length;

  function handleInvoiceChange(tripId: string, jobId: string, currency: Currency, value: string) {
    const amount = parseFloat(value);
    if (!isNaN(amount) && amount >= 0) {
      setJobInvoice(tripId, jobId, { currency, amount });
    }
  }

  function handleBulkApply(tripId: string) {
    bulkApplyAgreedRates(tripId);
    const trip = trips.find((t) => t.id === tripId);
    const applied = trip?.jobs.filter((j) => j.agreedCost && !j.invoiceAmount).length ?? 0;
    toast.success(`Applied agreed rates for ${applied} job${applied !== 1 ? 's' : ''}`);
  }

  function renderOrderRow(trip: Trip) {
    const isExpanded = expandedId === trip.id;
    const severity = getOrderSeverity(trip);
    const borderColor = severity === 0 ? '#fecaca' : severity === 1 ? '#fde68a' : severity === 2 ? '#bfdbfe' : '#a7f3d0';
    const jobsWithInvoice = trip.jobs.filter((j) => j.invoiceAmount).length;
    const canBulkApply = trip.jobs.some((j) => j.agreedCost && !j.invoiceAmount);

    return (
      <div key={trip.id} style={{ marginBottom: 8 }}>
        {/* Order header row */}
        <div
          onClick={() => setExpandedId(isExpanded ? null : trip.id)}
          style={{
            padding: '8px 12px', background: '#fff', border: `1px solid ${borderColor}`, borderRadius: isExpanded ? '6px 6px 0 0' : 6,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.1s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
        >
          {isExpanded ? <ChevronDown size={12} style={{ color: '#9ca3af' }} /> : <ChevronRight size={12} style={{ color: '#9ca3af' }} />}
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{trip.customer.name}</span>
            <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 8, fontFamily: "'JetBrains Mono', monospace" }}>{trip.mawb || trip.id}</span>
          </div>
          <span style={{ fontSize: 10, color: '#6b7280' }}>{trip.jobs.length} jobs &middot; {jobsWithInvoice}/{trip.jobs.length} invoiced</span>
          {/* Variance summary badges */}
          <div style={{ display: 'flex', gap: 4 }}>
            {['over', 'under', 'no-rate', 'match'].map((state) => {
              const count = trip.jobs.filter((j) => getVariance(j).state === state).length;
              if (count === 0) return null;
              const s = VARIANCE_STYLES[state as VarianceState];
              return <span key={state} style={{ padding: '1px 5px', borderRadius: 4, fontSize: 9, fontWeight: 600, color: s.text, background: s.bg, border: `1px solid ${s.border}` }}>{count} {s.label.toLowerCase()}</span>;
            })}
          </div>
        </div>

        {/* Expanded billing sub-table */}
        {isExpanded && (
          <div style={{ border: `1px solid ${borderColor}`, borderTop: 'none', borderRadius: '0 0 6px 6px', background: '#fff', padding: '8px 12px 12px' }}>
            {/* Bulk apply button */}
            {canBulkApply && (
              <div style={{ marginBottom: 8 }}>
                <button onClick={() => handleBulkApply(trip.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 4, border: '1px solid #0D9488', background: 'rgba(13,148,136,0.04)', color: '#0D9488', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                  <CheckCircle2 size={12} /> Apply agreed rates as invoiced
                </button>
              </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 50 }}>Job</th>
                  <th style={th}>Vendor</th>
                  <th style={th}>Service</th>
                  <th style={th}>Route</th>
                  <th style={{ ...th, width: 100 }}>Agreed</th>
                  <th style={{ ...th, width: 120 }}>Invoice</th>
                  <th style={{ ...th, width: 100 }}>Variance</th>
                </tr>
              </thead>
              <tbody>
                {trip.jobs.map((job, i) => {
                  const variance = getVariance(job);
                  const vs = VARIANCE_STYLES[variance.state];
                  const agreedCurr = job.agreedCost?.currency ?? 'MYR';

                  return (
                    <tr key={job.id}>
                      <td style={{ ...td, fontWeight: 600, color: '#0D9488' }}>J{String(i + 1).padStart(2, '0')}</td>
                      <td style={{ ...td, fontWeight: 600, color: '#111827' }}>{job.vendor.name}</td>
                      <td style={td}>{job.service.label}</td>
                      <td style={{ ...td, fontSize: 10 }}>{job.origin.location === job.destination.location ? job.origin.location : `${job.origin.location} → ${job.destination.location}`}</td>
                      <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                        {job.agreedCost ? formatCurrency(job.agreedCost.currency, job.agreedCost.amount) : <span style={{ color: '#b45309', fontSize: 9 }}>No rate</span>}
                      </td>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{agreedCurr === 'MYR' ? 'RM' : agreedCurr}</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={job.invoiceAmount?.amount ?? ''}
                            onChange={(e) => handleInvoiceChange(trip.id, job.id, agreedCurr as Currency, e.target.value)}
                            placeholder="—"
                            style={{
                              width: 80, fontSize: 11, padding: '3px 6px',
                              border: `1px solid ${variance.state === 'over' ? '#fecaca' : '#e5e7eb'}`,
                              borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                              outline: 'none',
                            }}
                          />
                        </div>
                      </td>
                      <td style={td}>
                        {job.invoiceAmount ? (
                          <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600, color: vs.text, background: vs.bg, border: `1px solid ${vs.border}` }}>
                            {vs.label}
                            {variance.diff !== undefined && variance.diff !== 0 && (
                              <span style={{ marginLeft: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                                {variance.diff > 0 ? '+' : ''}{formatCurrency(job.agreedCost?.currency ?? 'MYR', variance.diff)}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span style={{ fontSize: 9, color: '#9ca3af' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Stats bar */}
      <div style={{ padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 11, color: '#6b7280', display: 'flex', gap: 16 }}>
        <span><strong style={{ color: '#111827' }}>{billingOrders.length}</strong> orders</span>
        <span><strong style={{ color: '#111827' }}>{allJobs.length}</strong> job lines</span>
        {overCount > 0 && <span style={{ color: '#dc2626' }}>{overCount} over</span>}
        {noRateCount > 0 && <span style={{ color: '#b45309' }}>{noRateCount} no rate</span>}
        {underCount > 0 && <span style={{ color: '#2563eb' }}>{underCount} under</span>}
        <span style={{ color: '#059669' }}>{matchCount} match</span>
      </div>

      {/* Header */}
      <div style={{ padding: '16px 16px 0' }}>
        <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', color: '#111827', margin: 0 }}>Billing</h1>
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Validate invoices against agreed rates</p>
      </div>

      {/* Tabs */}
      <div style={{ padding: '12px 16px 0', display: 'flex', gap: 2 }}>
        {([['ready', 'Ready'], ['validation', 'Validation'], ['approved', 'Approved']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: tab === key ? 'rgba(13,148,136,0.06)' : 'transparent', color: tab === key ? '#0D9488' : '#9ca3af', fontWeight: tab === key ? 600 : 400, fontSize: 12, cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {tab === 'validation' && (
          <>
            {/* Filter chips */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {([['all', `All (${billingOrders.length})`], ['flagged', `Flagged (${flaggedOrders})`], ['no-rate', `No rate (${noRateOrders})`]] as const).map(([key, label]) => (
                <button key={key} onClick={() => setFilter(key)} style={{
                  padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  border: filter === key ? '1px solid #0D9488' : '1px solid #e5e7eb',
                  background: filter === key ? 'rgba(13,148,136,0.06)' : '#fff',
                  color: filter === key ? '#0D9488' : '#6b7280',
                }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Order rows */}
            {filtered.map(renderOrderRow)}

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No orders to validate</div>
                <div style={{ fontSize: 11 }}>Create orders with rates to see them here</div>
              </div>
            )}
          </>
        )}

        {tab === 'ready' && (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Ready for Billing</div>
            <div style={{ fontSize: 11 }}>Orders with all jobs completed and proofs uploaded</div>
          </div>
        )}

        {tab === 'approved' && (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Approved</div>
            <div style={{ fontSize: 11 }}>Validated orders will appear here</div>
          </div>
        )}
      </div>
    </div>
  );
}
