import React, { useState, useCallback } from 'react';
import { Search, Download, Plus, Ship, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customers, vendors, formatCurrency } from '../data/mockData';
import type { Trip, JobStatus } from '../data/mockData';
import { useTrips } from '../context/TripContext';
import { useToast } from '../components/Toast';
import SlideOutPanel from '../components/SlideOutPanel';
import JobSlideOut from '../components/trips/JobSlideOut';
import ServiceTag from '../components/trips/ServiceTag';

// -- Helpers --

function buildRoute(trip: Trip): string {
  const locs: string[] = [];
  trip.jobs.forEach((j, i) => { if (i === 0) locs.push(j.origin.location); locs.push(j.destination.location); });
  return locs.filter((l, i) => i === 0 || l !== locs[i - 1]).join(' \u2192 ');
}

function getChipColor(status: JobStatus): { border: string; bg: string; text: string; dot: string } {
  switch (status) {
    case 'Completed': return { border: '#a7f3d0', bg: '#f0fdf4', text: '#059669', dot: '#059669' };
    case 'Rejected': return { border: '#fecaca', bg: '#fef2f2', text: '#dc2626', dot: '#dc2626' };
    default: return { border: '#e5e7eb', bg: '#fff', text: '#6b7280', dot: '#9ca3af' };
  }
}

// -- Component --

export default function TripsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { trips, updateJobStatus, addProofDocument, removeProofDocument, addActivityLog, updateJob, addFee, removeFee, updateFeeQty, updateJobQty } = useTrips();
  const [mawbSearch, setMawbSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [panelIds, setPanelIds] = useState<{ tripId: string; jobId: string } | null>(null);

  // Derive panel data from context (always fresh)
  const panelTrip = panelIds ? trips.find((t) => t.id === panelIds.tripId) : null;
  const panelJob = panelTrip ? panelTrip.jobs.find((j) => j.id === panelIds.jobId) : null;
  const panelJobIdx = panelTrip && panelJob ? panelTrip.jobs.indexOf(panelJob) : -1;

  const filtered = trips.filter((t) => {
    if (mawbSearch && !t.mawb.toLowerCase().includes(mawbSearch.toLowerCase())) return false;
    if (customerFilter && t.customer.code !== customerFilter) return false;
    if (vendorFilter && !t.jobs.some((j) => j.vendor.code === vendorFilter)) return false;
    return true;
  });

  filtered.sort((a, b) => {
    const aDate = a.jobs[0]?.origin.date || '';
    const bDate = b.jobs[0]?.origin.date || '';
    return aDate.localeCompare(bDate);
  });

  // -- Handlers --

  const onStatus = useCallback((tripId: string, jobId: string, s: JobStatus) => {
    updateJobStatus(tripId, jobId, s);
    addActivityLog(tripId, jobId, { id: `l${Date.now()}`, timestamp: new Date().toISOString().replace('T',' ').slice(0,16), action: `Status \u2192 ${s}`, user: 'Ops Admin' });
    toast.success(`Status \u2192 ${s}`);
  }, [updateJobStatus, addActivityLog, toast]);

  const onUpload = useCallback((tripId: string, jobId: string, file: File) => {
    addProofDocument(tripId, jobId, { id: `d${Date.now()}`, name: file.name, type: file.type, uploadedAt: new Date().toISOString().replace('T',' ').slice(0,16), uploadedBy: 'Ops Admin', url: URL.createObjectURL(file) });
    addActivityLog(tripId, jobId, { id: `l${Date.now()}`, timestamp: new Date().toISOString().replace('T',' ').slice(0,16), action: 'Proof uploaded', user: 'Ops Admin', details: file.name });
    toast.success(`Uploaded ${file.name}`);
  }, [addProofDocument, addActivityLog, toast]);

  const onRemoveProof = useCallback((tripId: string, jobId: string, docId: string) => {
    removeProofDocument(tripId, jobId, docId);
  }, [removeProofDocument]);

  const onReassign = useCallback((tripId: string, jobId: string, vendorCode: string) => {
    const v = vendors.find((x) => x.code === vendorCode);
    if (!v) return;
    updateJob(tripId, jobId, { vendor: { code: v.code, name: v.name }, status: 'Pending', rejectionReason: undefined });
    addActivityLog(tripId, jobId, { id: `l${Date.now()}`, timestamp: new Date().toISOString().replace('T',' ').slice(0,16), action: `Reassigned \u2192 ${v.name}`, user: 'Ops Admin' });
    toast.success(`Reassigned to ${v.name}`);
    setPanelIds(null);
  }, [updateJob, addActivityLog, toast]);

  // -- Stats --
  const allJobs = trips.flatMap((t) => t.jobs);
  const stats = {
    orders: trips.length,
    inProgress: allJobs.filter((j) => j.status === 'In Progress').length,
    completed: allJobs.filter((j) => j.status === 'Completed').length,
    rejected: allJobs.filter((j) => j.status === 'Rejected').length,
  };

  // -- Table header style --
  const th: React.CSSProperties = { textAlign: 'left', padding: '6px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* -- Stats bar -- */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 12, gap: 0 }}>
        <span style={{ color: '#111827', fontWeight: 600 }}>{stats.orders} orders</span>
        <span style={{ width: 1, height: 14, background: '#e5e7eb', margin: '0 12px' }} />
        <span style={{ color: '#111827', fontWeight: 600 }}>{stats.inProgress} in progress</span>
        <span style={{ width: 1, height: 14, background: '#e5e7eb', margin: '0 12px' }} />
        <span style={{ color: '#059669', fontWeight: 600 }}>{stats.completed} completed</span>
        <span style={{ width: 1, height: 14, background: '#e5e7eb', margin: '0 12px' }} />
        <span style={{ color: '#dc2626', fontWeight: 600 }}>{stats.rejected} rejected</span>
      </div>

      {/* -- Page header -- */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '16px 16px 0 16px' }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', color: '#111827', margin: 0 }}>Delivery Orders</h1>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0 0' }}>Monitor and manage delivery orders across vendors</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff', color: '#374151', border: '1px solid #e5e7eb', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Download size={12} /> Export
          </button>
          <button
            onClick={() => navigate('/create-trip')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#0D9488', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Plus size={12} /> New Order
          </button>
        </div>
      </div>

      {/* -- Filter bar -- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px', borderBottom: '1px solid #e5e7eb' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9ca3af' }}>
          MAWB
          <div style={{ position: 'relative' }}>
            <Search size={11} style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', color: '#d1d5db' }} />
            <input type="text" placeholder="Search..." value={mawbSearch} onChange={(e) => setMawbSearch(e.target.value)} style={{ paddingLeft: 22, fontFamily: 'var(--font-mono)', fontSize: 11, borderRadius: 4, padding: '4px 8px 4px 22px', border: '1px solid #e5e7eb', outline: 'none', width: 160 }} />
          </div>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9ca3af' }}>
          Customer
          <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} style={{ fontSize: 11, borderRadius: 4, padding: '4px 8px', border: '1px solid #e5e7eb' }}>
            <option value="">All</option>
            {customers.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9ca3af' }}>
          Vendor
          <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} style={{ fontSize: 11, borderRadius: 4, padding: '4px 8px', border: '1px solid #e5e7eb' }}>
            <option value="">All</option>
            {vendors.map((v) => <option key={v.code} value={v.code}>{v.name}</option>)}
          </select>
        </label>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9ca3af' }}>
          {filtered.length} orders
        </span>
      </div>

      {/* -- Trip Table -- */}
      <div style={{ padding: '0 16px 24px 16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 24, padding: '6px 8px' }} />
              <th style={th}>Customer</th>
              <th style={th}>MAWB</th>
              <th style={th}>Pickup Date</th>
              <th style={th}>Route</th>
              <th style={th}>Cargo</th>
              <th style={th}>Jobs</th>
              <th style={{ ...th, width: 40 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.flatMap((trip) => {
              const isExpanded = expandedId === trip.id;
              const hasRejected = trip.jobs.some((j) => j.status === 'Rejected');
              const route = buildRoute(trip);

              const rows = [
                <tr
                  key={trip.id}
                  onClick={() => setExpandedId(isExpanded ? null : trip.id)}
                  style={{ cursor: 'pointer', background: hasRejected ? '#fefafa' : isExpanded ? '#f9fafb' : undefined, transition: 'background 0.1s' }}
                  onMouseEnter={(e) => { if (!isExpanded && !hasRejected) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={(e) => { if (!isExpanded && !hasRejected) e.currentTarget.style.background = ''; }}
                >
                  <td style={{ padding: '8px 4px 8px 12px', verticalAlign: 'top', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6', color: isExpanded ? '#0D9488' : '#d1d5db', fontSize: 12, fontWeight: isExpanded ? 700 : 400 }}>
                    {hasRejected && !isExpanded ? <span style={{ color: '#dc2626', fontWeight: 700, fontSize: 12 }}>!</span> : (isExpanded ? '\u25be' : '\u25b8')}
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'top', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', letterSpacing: '-0.2px', marginBottom: 2 }}>
                      {trip.customer.name}
                      {trip.priority && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3, color: '#b45309', background: '#fefce8', border: '1px solid #fde68a' }}>PRIORITY</span>}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9ca3af', background: '#f3f4f6', padding: '1px 5px', borderRadius: 4, border: '1px solid #e5e7eb' }}>{trip.id}</span>
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'top', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#374151' }}>{trip.mawb}</div>
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'top', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    {(() => {
                      const firstDate = trip.jobs[0]?.origin.date;
                      if (!firstDate) return <span style={{ fontSize: 11, color: '#d1d5db' }}>—</span>;
                      const d = new Date(firstDate.replace(' ', 'T'));
                      const hoursUntil = (d.getTime() - Date.now()) / 3600000;
                      const dateColor = hoursUntil < 2 ? '#dc2626' : hoursUntil <= 24 ? '#374151' : '#9ca3af';
                      return (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: dateColor }}>
                          {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          <div style={{ fontSize: 10, color: dateColor }}>{d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'top', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: 11, color: '#374151' }}>{route}</span>
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'top', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{trip.bags} bags &middot; {trip.weight} kg</span>
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'top', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {trip.jobs.map((job, i) => {
                        const c = getChipColor(job.status);
                        return (
                          <button
                            key={job.id}
                            onClick={(e) => { e.stopPropagation(); setPanelIds({ tripId: trip.id, jobId: job.id }); }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, border: `1px solid ${c.border}`, background: c.bg, color: c.text, cursor: 'pointer', fontFamily: 'inherit', transition: 'box-shadow 0.15s' }}
                          >
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
                            {job.vendor.name} &middot; {job.service.code}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '8px 4px', verticalAlign: 'top', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6', textAlign: 'center' }}>
                    <span
                      onClick={(e) => { e.stopPropagation(); navigate(`/create-trip?duplicate=${trip.id}`); }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.3'; }}
                      style={{ color: '#9ca3af', cursor: 'pointer', opacity: 0.3, transition: 'opacity 0.15s', display: 'inline-flex' }}
                    >
                      <Copy size={12} />
                    </span>
                  </td>
                </tr>
              ];

              if (isExpanded) {
                const subTh: React.CSSProperties = { textAlign: 'left', padding: '4px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' };
                const quickStatuses: { label: string; value: JobStatus; short: string }[] = [
                  { label: 'Pending', value: 'Pending', short: 'Pend' },
                  { label: 'In Progress', value: 'In Progress', short: 'In Prog' },
                  { label: 'Completed', value: 'Completed', short: 'Done' },
                ];
                rows.push(
                  <tr key={`${trip.id}-exp`} style={{ background: '#f9fafb' }} onClick={(e) => e.stopPropagation()}>
                    <td colSpan={8} style={{ padding: 0, borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ paddingLeft: 40, paddingRight: 12, paddingTop: 4, paddingBottom: 10 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ ...subTh, width: 50 }}>Job</th>
                              <th style={subTh}>Vendor</th>
                              <th style={subTh}>Service</th>
                              <th style={subTh}>Route</th>
                              <th style={{ ...subTh, width: 100 }}>Total Cost</th>
                              <th style={{ ...subTh, width: 140 }}>Status</th>
                              <th style={{ ...subTh, width: 40 }}>Proofs</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trip.jobs.map((job, i) => {
                              const proofCount = (job.proofDocuments ?? []).length;
                              const fees = job.fees ?? [];
                              // Calculate total cost from fees
                              const costMap = new Map<string, number>();
                              fees.forEach((f) => costMap.set(f.currency, (costMap.get(f.currency) ?? 0) + f.amount));
                              const isJobExpanded = expandedJobId === job.id;
                              const isCompleted = job.status === 'Completed';

                              return (
                                <React.Fragment key={job.id}>
                                  <tr
                                    onClick={(e) => { e.stopPropagation(); setExpandedJobId(isJobExpanded ? null : job.id); }}
                                    style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                                  >
                                    <td style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#0D9488' }}>
                                      {isJobExpanded ? '▾' : '▸'} J{String(i + 1).padStart(2, '0')}
                                    </td>
                                    <td style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#111827' }}>
                                      {job.vendor.name}
                                    </td>
                                    <td style={{ padding: '6px 10px' }}>
                                      <ServiceTag service={job.service} />
                                    </td>
                                    <td style={{ padding: '6px 10px', fontSize: 10, color: '#374151' }}>
                                      {job.origin.location === job.destination.location ? job.origin.location : `${job.origin.location} → ${job.destination.location}`}
                                    </td>
                                    <td style={{ padding: '6px 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: '#111827' }}>
                                      {costMap.size > 0
                                        ? Array.from(costMap.entries()).map(([curr, total]) => (
                                            <div key={curr}>{formatCurrency(curr as any, total)}</div>
                                          ))
                                        : <span style={{ color: '#9ca3af', fontWeight: 400 }}>&mdash;</span>
                                      }
                                    </td>
                                    <td style={{ padding: '6px 10px' }} onClick={(e) => e.stopPropagation()}>
                                      {/* Inline quick status buttons */}
                                      <div style={{ display: 'flex', gap: 2 }}>
                                        {quickStatuses.map((qs) => {
                                          const isActive = job.status === qs.value;
                                          const isCompletedBtn = qs.value === 'Completed';
                                          const activeColor = isCompletedBtn ? '#059669' : '#0D9488';
                                          const activeBg = isCompletedBtn ? '#f0fdf4' : 'rgba(13,148,136,0.06)';
                                          const activeBorder = isCompletedBtn ? '#a7f3d0' : '#0D9488';
                                          return (
                                            <button
                                              key={qs.value}
                                              onClick={() => onStatus(trip.id, job.id, qs.value)}
                                              style={{
                                                padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 600,
                                                border: isActive ? `1.5px solid ${activeBorder}` : '1px solid transparent',
                                                background: isActive ? activeBg : '#f3f4f6',
                                                color: isActive ? activeColor : '#9ca3af',
                                                cursor: 'pointer', fontFamily: 'inherit',
                                              }}
                                            >
                                              {qs.short}{isActive && qs.value === 'Completed' ? ' ✓' : ''}
                                            </button>
                                          );
                                        })}
                                        <button
                                          onClick={() => setPanelIds({ tripId: trip.id, jobId: job.id })}
                                          title="More actions"
                                          style={{ padding: '2px 4px', borderRadius: 3, fontSize: 9, border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'pointer' }}
                                        >⋯</button>
                                      </div>
                                    </td>
                                    <td style={{ padding: '6px 10px', fontSize: 12, fontWeight: 700, color: proofCount > 0 ? '#059669' : '#9ca3af' }}>
                                      {proofCount > 0 ? '✓' : '○'}
                                    </td>
                                  </tr>
                                  {/* L2 Fee breakdown (expanded) */}
                                  {isJobExpanded && fees.length > 0 && (
                                    <tr>
                                      <td colSpan={7} style={{ padding: 0, background: '#fff' }}>
                                        <div style={{ paddingLeft: 52, paddingRight: 10, paddingTop: 2, paddingBottom: 8 }}>
                                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                              <tr>
                                                <th style={{ textAlign: 'left', padding: '3px 8px', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>Fee</th>
                                                <th style={{ textAlign: 'left', padding: '3px 8px', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>Rate</th>
                                                <th style={{ textAlign: 'center', padding: '3px 8px', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', width: 50 }}>Qty</th>
                                                <th style={{ textAlign: 'right', padding: '3px 8px', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', width: 80 }}>Amount</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {fees.map((fee) => (
                                                <tr key={fee.id}>
                                                  <td style={{ padding: '3px 8px', fontSize: 10, color: '#374151' }}>{fee.name}</td>
                                                  <td style={{ padding: '3px 8px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#9ca3af' }}>
                                                    {formatCurrency(fee.currency, fee.rate)} /{fee.unit === 'flat' ? 'trip' : fee.unit.replace('per-', '')}
                                                  </td>
                                                  <td style={{ padding: '3px 8px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#6b7280', textAlign: 'center' }}>
                                                    {fee.quantity}
                                                  </td>
                                                  <td style={{ padding: '3px 8px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#111827', textAlign: 'right' }}>
                                                    {formatCurrency(fee.currency, fee.amount)}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                  {isJobExpanded && fees.length === 0 && (
                                    <tr>
                                      <td colSpan={7} style={{ padding: '6px 52px', fontSize: 10, color: '#9ca3af', fontStyle: 'italic', background: '#fff' }}>
                                        No fee line items — click ⋯ to add fees in the slide-out
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                );
              }

              return rows;
            }) : (
              <tr>
                <td colSpan={8} style={{ padding: '60px 12px', textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(13,148,136,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Ship size={18} style={{ color: '#0D9488' }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                    {trips.length === 0 ? 'No delivery orders yet' : 'No orders match your filters'}
                  </p>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, marginBottom: 16 }}>
                    {trips.length === 0
                      ? 'Create your first order to start managing vendor deliveries.'
                      : 'Try adjusting your search or filters above.'}
                  </p>
                  <button
                    onClick={() => navigate('/create-trip')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#0D9488', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <Plus size={12} /> New Order
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* -- Slide-out Panel -- */}
      <SlideOutPanel isOpen={!!panelTrip && !!panelJob} onClose={() => setPanelIds(null)} title={panelJob?.vendor.name}>
        {panelTrip && panelJob && (
          <JobSlideOut
            job={panelJob}
            trip={panelTrip}
            jobIndex={panelJobIdx}
            onStatusChange={(s) => { onStatus(panelTrip.id, panelJob.id, s); }}
            onUploadProof={(f) => onUpload(panelTrip.id, panelJob.id, f)}
            onRemoveProof={(d) => onRemoveProof(panelTrip.id, panelJob.id, d)}
            onReassign={(vc) => onReassign(panelTrip.id, panelJob.id, vc)}
            onAddFee={(fee) => addFee(panelTrip.id, panelJob.id, fee)}
            onRemoveFee={(feeId) => removeFee(panelTrip.id, panelJob.id, feeId)}
            onUpdateFeeQty={(feeId, qty) => updateFeeQty(panelTrip.id, panelJob.id, feeId, qty)}
            onUpdateJobQty={(qtys) => updateJobQty(panelTrip.id, panelJob.id, qtys)}
          />
        )}
      </SlideOutPanel>
    </div>
  );
}
