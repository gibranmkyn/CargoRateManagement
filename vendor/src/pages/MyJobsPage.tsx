import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Ship } from 'lucide-react';
import { formatCurrency } from '../../../shared/mockData';
import type { Trip, Job, JobStatus, Currency } from '../../../shared/mockData';
import DateRangePopover from '../components/DateRangePopover';
import { useTrips } from '../../../shared/TripContext';
import { useVendorAuth } from '../context/VendorAuthContext';

// -- Types --

type StatusFilter = 'active' | 'completed' | 'verified' | 'cancelled' | 'all';

interface FlatJob extends Job {
  trip: Trip;
}

// -- Helpers --

const STATUS_ORDER: Record<string, number> = {
  Pending: 0,
  'In Progress': 1,
  Completed: 2,
  Verified: 3,
  Cancelled: 4,
};

function getStatusChipStyle(status: JobStatus): { bg: string; border: string; text: string; dot: string } {
  switch (status) {
    case 'Pending': return { bg: '#f9fafb', border: '#e5e7eb', text: '#9ca3af', dot: '#9ca3af' };
    case 'In Progress': return { bg: 'rgba(21,44,255,0.04)', border: 'rgba(21,44,255,0.15)', text: '#152CFF', dot: '#152CFF' };
    case 'Completed': return { bg: '#fefce8', border: '#fde68a', text: '#a16207', dot: '#a16207' };
    case 'Verified': return { bg: '#f0fdf4', border: '#a7f3d0', text: '#059669', dot: '#059669' };
    case 'Cancelled': return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#dc2626' };
    default: return { bg: '#f9fafb', border: '#e5e7eb', text: '#9ca3af', dot: '#9ca3af' };
  }
}

function getJobCostMap(job: Job): Map<string, number> {
  const fees = (job.fees ?? []).filter((f) => f.active !== false);
  const costMap = new Map<string, number>();
  fees.forEach((f) => costMap.set(f.currency, (costMap.get(f.currency) ?? 0) + f.amount));
  return costMap;
}

function parsePickupDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  return new Date(dateStr.replace(' ', 'T'));
}


function sortActiveJobs(a: FlatJob, b: FlatJob): number {
  const orderA = STATUS_ORDER[a.status] ?? 5;
  const orderB = STATUS_ORDER[b.status] ?? 5;
  if (orderA !== orderB) return orderA - orderB;
  const dateA = a.origin.date || '';
  const dateB = b.origin.date || '';
  return dateA.localeCompare(dateB);
}

function sortDefaultJobs(a: FlatJob, b: FlatJob): number {
  const dateA = a.origin.date || '';
  const dateB = b.origin.date || '';
  return dateA.localeCompare(dateB);
}

function exportCSV(jobs: FlatJob[]) {
  const header = ['Trip', 'Customer', 'Service', 'Origin', 'Destination', 'Pickup', 'Status', 'Cost'];
  const rows = jobs.map((j) => {
    const costMap = getJobCostMap(j);
    const costStr = Array.from(costMap.entries()).map(([c, t]) => formatCurrency(c as Currency, t)).join(' + ') || '-';
    return [
      j.trip.id,
      j.trip.customer.name,
      j.service.code,
      j.origin.location,
      j.destination.location,
      j.origin.date || '-',
      j.status,
      costStr,
    ];
  });
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `my-jobs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// -- Component --

export default function MyJobsPage() {
  const navigate = useNavigate();
  const { trips } = useTrips();
  const { vendorCode } = useVendorAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [serviceFilters, setServiceFilters] = useState<Set<string>>(new Set());
  const [dateStart, setDateStart] = useState<string | null>(null);
  const [dateEnd, setDateEnd] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // Flatten all jobs, filter by logged-in vendor
  const allJobs: FlatJob[] = useMemo(() =>
    trips.flatMap((t) => t.jobs.map((j) => ({ ...j, trip: t }))).filter((j) => j.vendor.code === vendorCode),
    [trips, vendorCode]
  );

  // Stats (computed from ALL vendor jobs, not filtered)
  const stats = useMemo(() => ({
    total: allJobs.length,
    pending: allJobs.filter((j) => j.status === 'Pending').length,
    inProgress: allJobs.filter((j) => j.status === 'In Progress').length,
    completed: allJobs.filter((j) => j.status === 'Completed').length,
    verified: allJobs.filter((j) => j.status === 'Verified').length,
    cancelled: allJobs.filter((j) => j.status === 'Cancelled').length,
  }), [allJobs]);

  // Filter jobs
  const filtered = useMemo(() => {
    let jobs = allJobs;

    // Status filter
    switch (statusFilter) {
      case 'active':
        jobs = jobs.filter((j) => j.status === 'Pending' || j.status === 'In Progress');
        break;
      case 'completed':
        jobs = jobs.filter((j) => j.status === 'Completed');
        break;
      case 'verified':
        jobs = jobs.filter((j) => j.status === 'Verified');
        break;
      case 'cancelled':
        jobs = jobs.filter((j) => j.status === 'Cancelled');
        break;
      case 'all':
        break;
    }

    // Service filter (multi-select toggle)
    if (serviceFilters.size > 0) {
      jobs = jobs.filter((j) => serviceFilters.has(j.service.code));
    }

    // Date filter — by pickup date, works on all tabs
    if (dateStart || dateEnd) {
      jobs = jobs.filter((j) => {
        const d = j.origin.date ? j.origin.date.slice(0, 10) : null;
        if (!d) return false;
        if (dateStart && d < dateStart) return false;
        if (dateEnd && d > dateEnd) return false;
        return true;
      });
    }

    // Sort
    if (statusFilter === 'active') {
      jobs = [...jobs].sort(sortActiveJobs);
    } else {
      jobs = [...jobs].sort(sortDefaultJobs);
    }

    return jobs;
  }, [allJobs, statusFilter, serviceFilters, dateStart, dateEnd]);

  // Status pill counts (from allJobs filtered only by service/date, NOT status)
  const pillCounts = useMemo(() => {
    let jobs = allJobs;
    if (serviceFilters.size > 0) jobs = jobs.filter((j) => serviceFilters.has(j.service.code));
    if (dateStart || dateEnd) {
      jobs = jobs.filter((j) => {
        const d = j.origin.date ? j.origin.date.slice(0, 10) : null;
        if (!d) return false;
        if (dateStart && d < dateStart) return false;
        if (dateEnd && d > dateEnd) return false;
        return true;
      });
    }
    return {
      active: jobs.filter((j) => j.status === 'Pending' || j.status === 'In Progress').length,
      completed: jobs.filter((j) => j.status === 'Completed').length,
      verified: jobs.filter((j) => j.status === 'Verified').length,
      cancelled: jobs.filter((j) => j.status === 'Cancelled').length,
      all: jobs.length,
    };
  }, [allJobs, serviceFilters, dateStart, dateEnd]);

  // Pagination
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const paginatedJobs = totalFiltered > PAGE_SIZE ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : filtered;

  // Service toggle handler
  function toggleService(code: string) {
    setServiceFilters((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
    setPage(1);
  }


  // -- Styles --

  const th: React.CSSProperties = {
    textAlign: 'left',
    padding: '6px 12px',
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#9ca3af',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
  };

  // Service code list for pills
  const serviceCodes = ['FM', 'EC', 'CS', 'CR', 'OH'];

  // -- Render helpers --

  function renderStatusChip(status: JobStatus) {
    const c = getStatusChipStyle(status);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, border: `1px solid ${c.border}`, background: c.bg, color: c.text }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
        {status}
      </span>
    );
  }

  function renderCost(job: Job) {
    const costMap = getJobCostMap(job);
    if (costMap.size === 0) return <span style={{ color: '#9ca3af' }}>&mdash;</span>;
    return (
      <>
        {Array.from(costMap.entries()).map(([curr, total]) => (
          <div key={curr}>{formatCurrency(curr as Currency, total)}</div>
        ))}
      </>
    );
  }

  function renderServiceTag(service: { code: string; label: string }) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          padding: '1px 5px',
          borderRadius: 99,
          fontSize: 9,
          fontWeight: 600,
          background: 'rgba(21,44,255,0.06)',
          border: '1px solid rgba(21,44,255,0.1)',
        }}
      >
        <span style={{ color: '#152CFF', fontFamily: "var(--font-mono)" }}>{service.code}</span>
        <span style={{ color: '#374151' }}>{service.label}</span>
      </span>
    );
  }

  function renderJobRow(job: FlatJob) {
    const isRejected = job.status === 'Cancelled';
    return (
      <tr
        key={`${job.trip.id}-${job.id}`}
        onClick={() => navigate(`/jobs/${job.trip.id}/${job.id}`)}
        style={{ cursor: 'pointer', background: isRejected ? '#fefafa' : undefined, transition: 'background 0.1s' }}
        onMouseEnter={(e) => { if (!isRejected) e.currentTarget.style.background = '#f9fafb'; }}
        onMouseLeave={(e) => { if (!isRejected) e.currentTarget.style.background = ''; }}
      >
        {/* Trip */}
        <td style={{ padding: '7px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
          <span
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#152CFF', background: 'rgba(21,44,255,0.04)', padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(21,44,255,0.1)' }}
          >
            {job.trip.id}
          </span>
        </td>

        {/* Customer */}
        <td style={{ padding: '7px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 11, fontWeight: 600, color: '#111827', verticalAlign: 'middle' }}>
          {job.trip.customer.name}
        </td>

        {/* Service */}
        <td style={{ padding: '7px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
          {renderServiceTag(job.service)}
        </td>

        {/* Where */}
        <td style={{ padding: '7px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 10, color: '#374151', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 0 }}>
          <div>
            {job.service.code === 'FM'
              ? `${job.origin.location} \u2192 ${job.destination.location}`
              : job.origin.location}
          </div>
          <div style={{ fontSize: 9, marginTop: 2 }}>
            {job.service.code === 'FM' ? (
              job.driverAssignment ? (
                <span style={{ color: '#152CFF', display: 'inline-flex', alignItems: 'center' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: 8, height: 8, verticalAlign: 'middle', marginRight: 2 }}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {job.driverAssignment.name}{job.vehicleAssignment ? ` · ${job.vehicleAssignment.plateNumber}` : ''}
                </span>
              ) : (
                <span style={{ color: '#d1d5db' }}>No driver assigned</span>
              )
            ) : (job.service.code === 'EC' || job.service.code === 'CS') ? (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#6b7280' }}>
                MAWB {job.trip.mawb}
              </span>
            ) : (job.service.code === 'OH' || job.service.code === 'CR') ? (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#6b7280' }}>
                {job.trip.bags.toLocaleString()} bags &middot; {job.trip.weight.toLocaleString()} kg
              </span>
            ) : null}
          </div>
        </td>

        {/* Pickup */}
        <td style={{ padding: '7px 12px', borderBottom: '1px solid #f3f4f6', fontFamily: 'var(--font-mono)', fontSize: 10, verticalAlign: 'middle' }}>
          {job.origin.date ? (() => {
            const d = parsePickupDate(job.origin.date);
            return (
              <>
                <div>{d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                <div style={{ color: '#9ca3af', fontSize: 9 }}>{d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
              </>
            );
          })() : <span style={{ color: '#d1d5db' }}>&mdash;</span>}
        </td>

        {/* Status */}
        <td style={{ padding: '7px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
          {renderStatusChip(job.status)}
        </td>

        {/* Cost */}
        <td style={{ padding: '7px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: '#111827', verticalAlign: 'middle' }}>
          {renderCost(job)}
        </td>
      </tr>
    );
  }

  // Status pill config
  const statusPills: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'active', label: 'Active', count: pillCounts.active },
    { key: 'completed', label: 'Completed', count: pillCounts.completed },
    { key: 'verified', label: 'Verified', count: pillCounts.verified },
    { key: 'cancelled', label: 'Cancelled', count: pillCounts.cancelled },
    { key: 'all', label: 'All', count: pillCounts.all },
  ];

  function getPillStyle(key: StatusFilter, isOn: boolean): { pill: React.CSSProperties; badge: React.CSSProperties } {
    if (!isOn) {
      return {
        pill: { border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280' },
        badge: { background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' },
      };
    }
    switch (key) {
      case 'verified':
        return {
          pill: { border: '1px solid #059669', background: '#f0fdf4', color: '#059669' },
          badge: { background: '#f0fdf4', color: '#059669', border: '1px solid #a7f3d0' },
        };
      case 'completed':
        return {
          pill: { border: '1px solid #a16207', background: '#fefce8', color: '#a16207' },
          badge: { background: '#fefce8', color: '#a16207', border: '1px solid #fde68a' },
        };
      case 'cancelled':
        return {
          pill: { border: '1px solid #dc2626', background: '#fef2f2', color: '#dc2626' },
          badge: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
        };
      case 'active':
      default:
        return {
          pill: { border: '1px solid #111827', background: '#111827', color: '#fff' },
          badge: { background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' },
        };
      case 'all':
        return {
          pill: { border: '1px solid #152CFF', background: 'rgba(21,44,255,0.06)', color: '#152CFF' },
          badge: { background: 'rgba(21,44,255,0.1)', color: '#152CFF', border: '1px solid rgba(21,44,255,0.2)' },
        };
    }
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* -- Stats bar -- */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 12, gap: 0 }}>
        <span style={{ color: '#111827', fontWeight: 600 }}>{stats.total} jobs</span>
        <span style={{ width: 1, height: 14, background: '#e5e7eb', margin: '0 12px' }} />
        <span style={{ color: '#9ca3af', fontWeight: 600 }}>{stats.pending} pending</span>
        <span style={{ width: 1, height: 14, background: '#e5e7eb', margin: '0 12px' }} />
        <span style={{ color: '#152CFF', fontWeight: 600 }}>{stats.inProgress} in progress</span>
        <span style={{ width: 1, height: 14, background: '#e5e7eb', margin: '0 12px' }} />
        <span style={{ color: '#a16207', fontWeight: 600 }}>{stats.completed} completed</span>
        <span style={{ width: 1, height: 14, background: '#e5e7eb', margin: '0 12px' }} />
        <span style={{ color: '#059669', fontWeight: 600 }}>{stats.verified} verified</span>
      </div>

      {/* -- Page header -- */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '16px 16px 0 16px' }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', color: '#111827', margin: 0 }}>My Jobs</h1>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0 0' }}>Your assigned jobs</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => exportCSV(filtered)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff', color: '#374151', border: '1px solid #e5e7eb', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* -- Filter bar -- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {/* Status pills */}
        {statusPills.map(({ key, label, count }) => {
          const isOn = statusFilter === key;
          const styles = getPillStyle(key, isOn);
          return (
            <button
              key={key}
              onClick={() => { setStatusFilter(key); setPage(1); }}
              style={{
                padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                ...styles.pill,
              }}
            >
              {label}
              <span style={{ fontSize: 9, padding: '0 5px', borderRadius: 99, fontWeight: 700, minWidth: 16, textAlign: 'center', ...styles.badge }}>{count}</span>
            </button>
          );
        })}

        <span style={{ width: 1, height: 16, background: '#e5e7eb' }} />

        {/* Service pills */}
        <span style={{ fontSize: 10, color: '#9ca3af' }}>Service</span>
        {serviceCodes.map((code) => {
          const isOn = serviceFilters.has(code);
          return (
            <button
              key={code}
              onClick={() => toggleService(code)}
              style={{
                padding: '2px 6px', borderRadius: 99, fontSize: 9, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                border: isOn ? '1px solid #152CFF' : '1px solid #e5e7eb',
                background: isOn ? 'rgba(21,44,255,0.06)' : '#fff',
                color: isOn ? '#152CFF' : '#6b7280',
              }}
            >
              {code}
            </button>
          );
        })}

        <span style={{ width: 1, height: 16, background: '#e5e7eb' }} />
        <DateRangePopover
          startDate={dateStart}
          endDate={dateEnd}
          onChange={(s, e) => { setDateStart(s); setDateEnd(e); setPage(1); }}
        />

        {/* Right count */}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
          {totalFiltered} {statusFilter === 'all' ? 'jobs' : statusFilter === 'active' ? 'active' : statusFilter}
        </span>
      </div>

      {/* -- Table -- */}
      <div style={{ padding: '0 16px 24px 16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: '10%' }}>Trip</th>
              <th style={{ ...th, width: '13%' }}>Customer</th>
              <th style={{ ...th, width: '7%' }}>Service</th>
              <th style={{ ...th, width: '35%' }}>Where</th>
              <th style={{ ...th, width: '10%' }}>Pickup</th>
              <th style={{ ...th, width: '11%' }}>Status</th>
              <th style={{ ...th, width: '10%', textAlign: 'right' }}>Cost</th>
            </tr>
          </thead>
          <tbody>
            {paginatedJobs.length > 0 ? paginatedJobs.map((job) => renderJobRow(job)) : (
              <tr>
                <td colSpan={7} style={{ padding: '60px 12px', textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(21,44,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Ship size={18} style={{ color: '#152CFF' }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>No jobs match your filters</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Try adjusting your filters above</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* -- Pagination -- */}
      {totalFiltered > PAGE_SIZE && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderTop: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>Page {page} of {totalPages} &middot; {totalFiltered} jobs</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#fff', color: page <= 1 ? '#d1d5db' : '#6b7280', fontSize: 10, cursor: page <= 1 ? 'default' : 'pointer', fontFamily: 'inherit' }}>&larr; Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} style={{
                padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: page === p ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
                border: page === p ? '1px solid #152CFF' : '1px solid #e5e7eb',
                background: page === p ? 'rgba(21,44,255,0.06)' : '#fff',
                color: page === p ? '#152CFF' : '#6b7280',
              }}>{p}</button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#fff', color: page >= totalPages ? '#d1d5db' : '#6b7280', fontSize: 10, cursor: page >= totalPages ? 'default' : 'pointer', fontFamily: 'inherit' }}>Next &rarr;</button>
          </div>
        </div>
      )}
    </div>
  );
}
