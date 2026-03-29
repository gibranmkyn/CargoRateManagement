import { useState, useCallback } from 'react';
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
  if (trip.origin === trip.destination) return trip.origin;
  return `${trip.origin} → ${trip.destination}`;
}

function getStatusColors(status: JobStatus): { border: string; bg: string; text: string; dot: string } {
  switch (status) {
    case 'In Progress': return { border: 'rgba(21,44,255,0.15)', bg: 'rgba(21,44,255,0.04)', text: '#152CFF', dot: '#152CFF' };
    case 'Completed':   return { border: '#fde68a', bg: '#fefce8', text: '#a16207', dot: '#a16207' };
    case 'Verified':    return { border: '#a7f3d0', bg: '#f0fdf4', text: '#059669', dot: '#059669' };
    case 'Cancelled':    return { border: '#fecaca', bg: '#fef2f2', text: '#dc2626', dot: '#dc2626' };
    case 'Cancelled':
    case 'Pending':
    default:            return { border: '#e5e7eb', bg: '#f9fafb', text: '#9ca3af', dot: '#9ca3af' };
  }
}

// -- Component --

export default function TripsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { trips, updateJobStatus, addProofDocument, removeProofDocument, addActivityLog, updateJob, updateFeeQty, toggleFee, updateJobQty, startJob, verifyJob } = useTrips();
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'completed'>('active');
  const [datePeriod, setDatePeriod] = useState<'today' | 'week' | 'month' | 'last-month' | 'all-time'>('month');
  const [page, setPage] = useState(1);
  const [mawbSearch, setMawbSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [panelIds, setPanelIds] = useState<{ tripId: string; jobId: string } | null>(null);
  const PAGE_SIZE = 50;

  // Derive panel data from context (always fresh)
  const panelTrip = panelIds ? trips.find((t) => t.id === panelIds.tripId) : null;
  const panelJob = panelTrip ? panelTrip.jobs.find((j) => j.id === panelIds.jobId) : null;
  const panelJobIdx = panelTrip && panelJob ? panelTrip.jobs.indexOf(panelJob) : -1;

  // Status counts — active = any job NOT verified and NOT cancelled; completed = ALL verified
  const isOrderActive = (t: Trip) => t.jobs.some((j) => j.status !== 'Verified' && j.status !== 'Cancelled');
  const activeCount = trips.filter(isOrderActive).length;
  const completedCount = trips.filter((t) => !isOrderActive(t)).length;
  const showDatePicker = statusFilter !== 'active';

  // Date range helper
  function getDateRange(): { start: Date; end: Date } | null {
    if (statusFilter === 'active') return null; // Active never date-filtered
    const now = new Date();
    switch (datePeriod) {
      case 'today': { const s = new Date(now); s.setHours(0,0,0,0); return { start: s, end: now }; }
      case 'week': { const s = new Date(now); s.setDate(s.getDate() - s.getDay()); s.setHours(0,0,0,0); return { start: s, end: now }; }
      case 'month': { const s = new Date(now.getFullYear(), now.getMonth(), 1); return { start: s, end: now }; }
      case 'last-month': { const s = new Date(now.getFullYear(), now.getMonth() - 1, 1); const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59); return { start: s, end: e }; }
      default: return null;
    }
  }

  function parseCreatedAt(ca: string): Date {
    // Format: "08 Mar 2026, 09:00"
    return new Date(ca.replace(',', ''));
  }

  const dateRange = getDateRange();

  const filtered = trips.filter((t) => {
    // Status filter
    if (statusFilter === 'active' && !isOrderActive(t)) return false;
    if (statusFilter === 'completed' && isOrderActive(t)) return false;
    // Date filter (only for All/Completed)
    if (dateRange) {
      const created = parseCreatedAt(t.createdAt);
      if (created < dateRange.start || created > dateRange.end) return false;
    }
    // Existing filters
    if (mawbSearch && !t.mawb.toLowerCase().includes(mawbSearch.toLowerCase())) return false;
    if (customerFilter && t.customer.code !== customerFilter) return false;
    if (vendorFilter && !t.jobs.some((j) => j.vendor.code === vendorFilter)) return false;
    return true;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

  filtered.sort((a, b) => {
    const aDate = a.jobs[0]?.origin.date || '';
    const bDate = b.jobs[0]?.origin.date || '';
    return bDate.localeCompare(aDate); // newest first
  });

  // Paginate (only for All/Completed — Active shows everything)
  const paginatedFiltered = statusFilter === 'active' ? filtered : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    updateJob(tripId, jobId, { vendor: { code: v.code, name: v.name }, status: 'Pending', cancelReason: undefined });
    addActivityLog(tripId, jobId, { id: `l${Date.now()}`, timestamp: new Date().toISOString().replace('T',' ').slice(0,16), action: `Reassigned \u2192 ${v.name}`, user: 'Ops Admin' });
    toast.success(`Reassigned to ${v.name}`);
    setPanelIds(null);
  }, [updateJob, addActivityLog, toast]);

  // -- Stats --
  const allJobs = trips.flatMap((t) => t.jobs);
  const stats = {
    orders: trips.length,
    pending: allJobs.filter((j) => j.status === 'Pending').length,
    inProgress: allJobs.filter((j) => j.status === 'In Progress').length,
    completed: allJobs.filter((j) => j.status === 'Completed').length,
    verified: allJobs.filter((j) => j.status === 'Verified').length,
    cancelled: allJobs.filter((j) => j.status === 'Cancelled').length,
  };

  // -- Table header style --
  const th: React.CSSProperties = { textAlign: 'left', padding: '6px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* -- Stats bar -- */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 12, gap: 0 }}>
        <span style={{ color: '#111827', fontWeight: 600 }}>{filtered.length} orders</span>
        <span style={{ width: 1, height: 14, background: '#e5e7eb', margin: '0 12px' }} />
        <span style={{ color: '#9ca3af', fontWeight: 600 }}>{stats.pending} pending</span>
        <span style={{ width: 1, height: 14, background: '#e5e7eb', margin: '0 12px' }} />
        <span style={{ color: '#152CFF', fontWeight: 600 }}>{stats.inProgress} in progress</span>
        <span style={{ width: 1, height: 14, background: '#e5e7eb', margin: '0 12px' }} />
        <span style={{ color: '#a16207', fontWeight: 600 }}>{stats.completed} completed</span>
        <span style={{ width: 1, height: 14, background: '#e5e7eb', margin: '0 12px' }} />
        <span style={{ color: '#059669', fontWeight: 600 }}>{stats.verified} verified</span>
        {stats.cancelled > 0 && (<>
          <span style={{ width: 1, height: 14, background: '#e5e7eb', margin: '0 12px' }} />
          <span style={{ color: '#dc2626', fontWeight: 600 }}>{stats.cancelled} cancelled</span>
        </>)}
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
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#152CFF', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Plus size={12} /> New Order
          </button>
        </div>
      </div>

      {/* -- Filter bar -- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px', borderBottom: '1px solid #e5e7eb' }}>
        {/* Status filter chips */}
        {([['active', `Active (${activeCount})`], ['all', `All (${trips.length})`], ['completed', `Completed (${completedCount})`]] as const).map(([key, label]) => (
          <button key={key} onClick={() => { setStatusFilter(key as any); setPage(1); }} style={{
            padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            border: statusFilter === key ? '1px solid #152CFF' : '1px solid #e5e7eb',
            background: statusFilter === key ? 'rgba(21,44,255,0.06)' : '#fff',
            color: statusFilter === key ? '#152CFF' : '#6b7280',
          }}>{label}</button>
        ))}

        {/* Date period picker — only for All/Completed */}
        {showDatePicker && <>
          <span style={{ width: 1, height: 16, background: '#e5e7eb', margin: '0 2px' }} />
          <span style={{ fontSize: 10, color: '#9ca3af' }}>Period:</span>
          {([['today', 'Today'], ['week', 'This week'], ['month', 'This month'], ['last-month', 'Last month'], ['all-time', 'All time']] as const).map(([key, label]) => (
            <button key={key} onClick={() => { setDatePeriod(key as any); setPage(1); }} style={{
              padding: '2px 8px', borderRadius: 99, fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              border: datePeriod === key ? '1px solid #152CFF' : '1px solid #e5e7eb',
              background: datePeriod === key ? 'rgba(21,44,255,0.06)' : '#fff',
              color: datePeriod === key ? '#152CFF' : '#9ca3af',
            }}>{label}</button>
          ))}
        </>}

        <span style={{ width: 1, height: 16, background: '#e5e7eb' }} />
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
              <th style={th}>Delivery Date</th>
              <th style={th}>Route</th>
              <th style={th}>Cargo</th>
              <th style={th}>Jobs</th>
              <th style={{ ...th, width: 40 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedFiltered.length > 0 ? paginatedFiltered.flatMap((trip) => {
              const isExpanded = expandedId === trip.id;
              const hasRejected = trip.jobs.some((j) => j.status === 'Cancelled');
              const route = buildRoute(trip);

              const rows = [
                <tr
                  key={trip.id}
                  onClick={() => setExpandedId(isExpanded ? null : trip.id)}
                  style={{ cursor: 'pointer', background: hasRejected ? '#fefafa' : isExpanded ? '#f9fafb' : undefined, transition: 'background 0.1s' }}
                  onMouseEnter={(e) => { if (!isExpanded && !hasRejected) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={(e) => { if (!isExpanded && !hasRejected) e.currentTarget.style.background = ''; }}
                >
                  <td style={{ padding: '8px 4px 8px 12px', verticalAlign: 'top', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6', color: isExpanded ? '#152CFF' : '#d1d5db', fontSize: 12, fontWeight: isExpanded ? 700 : 400 }}>
                    {hasRejected && !isExpanded ? <span style={{ color: '#dc2626', fontWeight: 700, fontSize: 12 }}>!</span> : (isExpanded ? '\u25be' : '\u25b8')}
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'top', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', letterSpacing: '-0.2px', marginBottom: 2 }}>
                      {trip.customer.name}
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
                      const dateColor = '#374151';
                      return (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: dateColor }}>
                          {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          <div style={{ fontSize: 10, color: dateColor }}>{d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'top', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    {trip.deliveryDate ? (() => {
                      const d = new Date(trip.deliveryDate + 'T00:00:00');
                      return <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#374151' }}>{d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>;
                    })() : <span style={{ fontSize: 11, color: '#d1d5db' }}>—</span>}
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
                        const c = getStatusColors(job.status);
                        return (
                          <button
                            key={job.id}
                            onClick={(e) => { e.stopPropagation(); setPanelIds({ tripId: trip.id, jobId: job.id }); }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, border: `1px solid ${c.border}`, background: c.bg, color: c.text, cursor: 'pointer', fontFamily: 'inherit', transition: 'box-shadow 0.15s' }}
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
                rows.push(
                  <tr key={`${trip.id}-exp`} style={{ background: '#f9fafb' }} onClick={(e) => e.stopPropagation()}>
                    <td colSpan={9} style={{ padding: 0, borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ paddingLeft: 40, paddingRight: 12, paddingTop: 4, paddingBottom: 10 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ ...subTh, width: 50 }}>Job</th>
                              <th style={subTh}>Vendor</th>
                              <th style={subTh}>Service</th>
                              <th style={subTh}>Route</th>
                              <th style={{ ...subTh, width: 100 }}>Total Cost</th>
                              <th style={{ ...subTh, width: 120 }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trip.jobs.map((job, i) => {
                              const fees = job.fees ?? [];
                              const costMap = new Map<string, number>();
                              fees.forEach((f) => costMap.set(f.currency, (costMap.get(f.currency) ?? 0) + f.amount));

                              return (
                                <tr
                                  key={job.id}
                                  onClick={(e) => { e.stopPropagation(); setPanelIds({ tripId: trip.id, jobId: job.id }); }}
                                  style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                                >
                                  <td style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#152CFF' }}>
                                    J{String(i + 1).padStart(2, '0')}
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
                                  <td style={{ padding: '6px 10px' }}>
                                    {(() => {
                                      const sc = getStatusColors(job.status);
                                      return (
                                        <span style={{
                                          display: 'inline-flex', alignItems: 'center', gap: 5,
                                          padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                                          border: `1px solid ${sc.border}`, background: sc.bg, color: sc.text,
                                        }}>
                                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                                          {job.status}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                </tr>
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
                <td colSpan={9} style={{ padding: '60px 12px', textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(21,44,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Ship size={18} style={{ color: '#152CFF' }} />
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
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#152CFF', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <Plus size={12} /> New Order
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* -- Pagination (only for All/Completed) -- */}
      {showDatePicker && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderTop: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>Page {page} of {totalPages} · {totalFiltered} orders</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#fff', color: page <= 1 ? '#d1d5db' : '#6b7280', fontSize: 10, cursor: page <= 1 ? 'default' : 'pointer', fontFamily: 'inherit' }}>← Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} style={{
                padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: page === p ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
                border: page === p ? '1px solid #152CFF' : '1px solid #e5e7eb',
                background: page === p ? 'rgba(21,44,255,0.06)' : '#fff',
                color: page === p ? '#152CFF' : '#6b7280',
              }}>{p}</button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#fff', color: page >= totalPages ? '#d1d5db' : '#6b7280', fontSize: 10, cursor: page >= totalPages ? 'default' : 'pointer', fontFamily: 'inherit' }}>Next →</button>
          </div>
        </div>
      )}

      {/* -- Slide-out Panel -- */}
      <SlideOutPanel isOpen={!!panelTrip && !!panelJob} onClose={() => setPanelIds(null)} title={panelJob?.vendor.name}>
        {panelTrip && panelJob && (
          <JobSlideOut
            job={panelJob}
            trip={panelTrip}
            jobIndex={panelJobIdx}
            onUploadProof={(f) => onUpload(panelTrip.id, panelJob.id, f)}
            onRemoveProof={(d) => onRemoveProof(panelTrip.id, panelJob.id, d)}
            onVerify={() => { verifyJob(panelTrip.id, panelJob.id); toast.success('Job verified — ready for payment'); }}
            onStartJob={() => { startJob(panelTrip.id, panelJob.id); toast.success('Job started — status is now In Progress'); }}
            onReassign={(vendorCode) => onReassign(panelTrip.id, panelJob.id, vendorCode)}
            onUpdateFeeQty={(feeId, qty) => updateFeeQty(panelTrip.id, panelJob.id, feeId, qty)}
            onToggleFee={(feeId) => toggleFee(panelTrip.id, panelJob.id, feeId)}
            onUpdateJobQty={(qtys) => updateJobQty(panelTrip.id, panelJob.id, qtys)}
          />
        )}
      </SlideOutPanel>
    </div>
  );
}
