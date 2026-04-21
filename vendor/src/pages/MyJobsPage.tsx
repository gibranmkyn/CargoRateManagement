import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { seedLocations, seedZones } from '../../../shared/mockData';
import type { Trip, Job } from '../../../shared/mockData';
import DateRangePopover from '../components/DateRangePopover';
import { useTrips } from '../../../shared/TripContext';
import { useVendorAuth } from '../context/VendorAuthContext';
import {
  VERIFICATION_LABELS,
  STATUS_LABELS,
  parsePickupDate,
  stateSortRank,
} from '../../../shared/statusStyles';
import StatusCell from '../components/StatusCell';
import VerificationCell from '../components/VerificationCell';

// -- Types --

type SegmentKey = 'All' | 'Pending' | 'In Progress' | 'To verify' | 'Verified' | 'Cancelled';

interface FlatJob extends Job {
  trip: Trip;
}

// -- Helpers --

function buildSegmentCounts(jobs: FlatJob[]): Record<SegmentKey | 'Rejected', number> {
  let All = 0, Pending = 0, InProgress = 0, ToVerify = 0, Verified = 0, Cancelled = 0, Rejected = 0;
  for (const j of jobs) {
    All++;
    if (j.status === 'Pending') Pending++;
    else if (j.status === 'In Progress') InProgress++;
    else if (j.status === 'Cancelled') Cancelled++;

    if (j.status === 'Completed' && j.verificationStatus !== 'Verified') ToVerify++;
    if (j.verificationStatus === 'Verified') Verified++;
    if (j.verificationStatus === 'Rejected') Rejected++;
  }
  return {
    All, Pending,
    'In Progress': InProgress,
    'To verify': ToVerify,
    Verified, Cancelled, Rejected,
  };
}

type LocationEntry = { code: string; zoneName: string };

function buildLocationMap(): Map<string, LocationEntry> {
  const zoneMap = new Map<string, string>(seedZones.map((z) => [z.id, z.name]));
  try {
    const storedZones = localStorage.getItem('tripmanager_zones');
    if (storedZones) {
      const zones = JSON.parse(storedZones) as Array<{ id: string; name: string }>;
      for (const z of zones) zoneMap.set(z.id, z.name);
    }
  } catch { /* ignore */ }

  const map = new Map<string, LocationEntry>();
  for (const l of seedLocations) {
    const zoneName = zoneMap.get(l.zoneId) ?? '';
    map.set(l.name, { code: l.code ?? '', zoneName });
  }
  try {
    const stored = localStorage.getItem('tripmanager_locations');
    if (stored) {
      const locs = JSON.parse(stored) as Array<{ name: string; code?: string; zoneId?: string }>;
      for (const l of locs) {
        const zoneName = l.zoneId ? (zoneMap.get(l.zoneId) ?? '') : '';
        map.set(l.name, { code: l.code ?? '', zoneName });
      }
    }
  } catch { /* ignore */ }
  return map;
}

function exportCSV(jobs: FlatJob[]) {
  const locationMap = buildLocationMap();
  const header = [
    'Trip', 'Customer', 'Service',
    'Origin Code', 'Origin', 'Origin Zone',
    'Dest Code', 'Destination', 'Dest Zone',
    'Pickup', 'Status', 'Verification Status', 'Verification Updated',
  ];
  const rows = jobs.map((j) => {
    const orig = locationMap.get(j.origin.location);
    const dest = locationMap.get(j.destination.location);
    return [
      j.trip.id,
      j.trip.customer.name,
      j.service.code,
      orig?.code ?? '',
      j.origin.location,
      orig?.zoneName ?? '',
      dest?.code ?? '',
      j.destination.location,
      dest?.zoneName ?? '',
      j.origin.date || '-',
      STATUS_LABELS[j.status]?.label ?? j.status,
      VERIFICATION_LABELS[j.verificationStatus] ?? j.verificationStatus,
      j.verificationChangedAt ?? '',
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

const SEGMENTS: SegmentKey[] = ['All', 'Pending', 'In Progress', 'To verify', 'Verified', 'Cancelled'];

// -- Component --

export default function MyJobsPage() {
  const navigate = useNavigate();
  const { trips } = useTrips();
  const { vendorCode } = useVendorAuth();
  const [segment, setSegment] = useState<SegmentKey>('All');
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

  // Segment counts (from allJobs filtered only by service/date, NOT segment)
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
    return buildSegmentCounts(jobs);
  }, [allJobs, serviceFilters, dateStart, dateEnd]);

  // Filter jobs
  const filtered = useMemo(() => {
    let jobs = allJobs;

    // Segment filter
    switch (segment) {
      case 'Pending':
        jobs = jobs.filter((j) => j.status === 'Pending');
        break;
      case 'In Progress':
        jobs = jobs.filter((j) => j.status === 'In Progress');
        break;
      case 'To verify':
        jobs = jobs.filter((j) => j.status === 'Completed' && (j.verificationStatus === 'Pending' || j.verificationStatus === 'Rejected'));
        break;
      case 'Verified':
        jobs = jobs.filter((j) => j.verificationStatus === 'Verified');
        break;
      case 'Cancelled':
        jobs = jobs.filter((j) => j.status === 'Cancelled');
        break;
      case 'All':
      default:
        break;
    }

    // Service filter (multi-select toggle)
    if (serviceFilters.size > 0) {
      jobs = jobs.filter((j) => serviceFilters.has(j.service.code));
    }

    // Date filter — by pickup date
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
    if (segment === 'All') {
      jobs = [...jobs].sort((a, b) => {
        const ra = stateSortRank(a);
        const rb = stateSortRank(b);
        if (ra !== rb) return ra - rb;
        return (a.origin.date || '').localeCompare(b.origin.date || '');
      });
    } else {
      jobs = [...jobs].sort((a, b) =>
        (a.origin.date || '').localeCompare(b.origin.date || '')
      );
    }

    return jobs;
  }, [allJobs, segment, serviceFilters, dateStart, dateEnd]);

  // Pagination
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const paginatedJobs = totalFiltered > PAGE_SIZE ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : filtered;

  // Clear filters
  const clearFilters = useCallback(() => {
    setSegment('All');
    setServiceFilters(new Set());
    setDateStart(null);
    setDateEnd(null);
    setPage(1);
  }, []);

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

  // -- Pill styling (match admin pattern) --

  function getSegmentPillStyle(key: SegmentKey, isOn: boolean): { pill: React.CSSProperties; badge: React.CSSProperties } {
    if (!isOn) {
      return {
        pill: { border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280' },
        badge: { background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' },
      };
    }
    switch (key) {
      case 'To verify':
        return {
          pill: { border: '1px solid #a16207', background: '#fefce8', color: '#a16207' },
          badge: { background: '#fefce8', color: '#a16207', border: '1px solid #fde68a' },
        };
      case 'Verified':
        return {
          pill: { border: '1px solid #059669', background: '#f0fdf4', color: '#059669' },
          badge: { background: '#f0fdf4', color: '#059669', border: '1px solid #a7f3d0' },
        };
      case 'Cancelled':
        return {
          pill: { border: '1px solid #dc2626', background: '#fef2f2', color: '#dc2626' },
          badge: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
        };
      case 'All':
      case 'Pending':
      case 'In Progress':
      default:
        return {
          pill: { border: '1px solid #111827', background: '#111827', color: '#fff' },
          badge: { background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' },
        };
    }
  }

  // -- Render helpers --

  function renderJobRow(job: FlatJob) {
    return (
      <tr
        key={`${job.trip.id}-${job.id}`}
        onClick={() => navigate(`/jobs/${job.trip.id}/${job.id}`)}
        style={{ cursor: 'pointer', transition: 'background 0.1s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
      >
        {/* Trip */}
        <td style={{ padding: '7px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#111827', fontWeight: 500 }}>
            {job.trip.id}
          </span>
        </td>

        {/* Customer */}
        <td style={{ padding: '7px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 11, fontWeight: 600, color: '#111827', verticalAlign: 'middle' }}>
          {job.trip.customer.name}
        </td>

        {/* Service */}
        <td style={{ padding: '7px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: '#6b7280', letterSpacing: '0.02em' }}>
            {job.service.code}
          </span>
          {job.service.label && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9ca3af', marginLeft: 4 }}>
              {job.service.label}
            </span>
          )}
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
                <span style={{ color: '#6b7280', display: 'inline-flex', alignItems: 'center' }}>
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
          <StatusCell job={job} showReason />
        </td>

        {/* Verification */}
        <td style={{ padding: '7px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
          <VerificationCell job={job} showReason />
        </td>

      </tr>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>

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
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        {/* Segment pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {SEGMENTS.map((k) => {
            const isOn = segment === k;
            const styles = getSegmentPillStyle(k, isOn);
            return (
              <button
                key={k}
                onClick={() => { setSegment(k); setPage(1); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px', borderRadius: 4,
                  fontSize: 11, fontWeight: isOn ? 600 : 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  ...styles.pill,
                }}
              >
                <span>{k}</span>
                <span
                  style={{
                    fontSize: 10, padding: '0 5px', borderRadius: 8, fontWeight: 700,
                    minWidth: 14, textAlign: 'center',
                    ...styles.badge,
                  }}
                >
                  {pillCounts[k] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Service pills + date + right count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
            {totalFiltered} jobs
          </span>
        </div>
      </div>

      {/* -- Table -- */}
      <div style={{ padding: '0 16px 24px 16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: '10%' }}>Trip</th>
              <th style={{ ...th, width: '12%' }}>Customer</th>
              <th style={{ ...th, width: '7%' }}>Service</th>
              <th style={{ ...th, width: '29%' }}>Where</th>
              <th style={{ ...th, width: '9%' }}>Pickup</th>
              <th style={{ ...th, width: '14%' }}>Status</th>
              <th style={{ ...th, width: '11%' }}>Verification</th>
            </tr>
          </thead>
          <tbody>
            {paginatedJobs.length > 0 ? paginatedJobs.map((job) => renderJobRow(job)) : (
              <tr>
                <td colSpan={7}>
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6b7280', fontSize: 12 }}>
                    No jobs match &middot; <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#152CFF', cursor: 'pointer', fontSize: 12, padding: 0, fontFamily: 'inherit' }}>clear filters</button>
                  </div>
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
