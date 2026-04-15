import { useState, useCallback, useMemo } from 'react';
import { Download, Search, Ship } from 'lucide-react';
import { Link } from 'react-router-dom';
import { vendors, getL2ByCostId } from '@shared/mockData';
import type { Trip, Job, JobStatus } from '@shared/mockData';
import DateRangePopover from '../components/shared/DateRangePopover';
import { useTrips, generateJobId } from '@shared/TripContext';
import { useLocations } from '../context/LocationContext';
import { useToast } from '@shared/Toast';
import SlideOutPanel from '../components/SlideOutPanel';
import JobSlideOut from '../components/trips/JobSlideOut';
import ServiceTag from '../components/trips/ServiceTag';
import { getStatusChipStyle, parsePickupDate } from '@shared/statusStyles';

// -- Types --

type StatusFilter = 'active' | 'completed' | 'verified' | 'all';
type GroupBy = 'none' | 'vendor' | 'service' | 'date';

interface FlatJob extends Job {
  trip: Trip;
}

// -- Helpers --

const STATUS_ORDER: Record<string, number> = {
  Rejected: 0,
  'In Progress': 1,
  Pending: 2,
  Completed: 3,
  Verified: 4,
  Cancelled: 5,
};


function sortActiveJobs(a: FlatJob, b: FlatJob): number {
  const orderA = STATUS_ORDER[a.status] ?? 5;
  const orderB = STATUS_ORDER[b.status] ?? 5;
  if (orderA !== orderB) return orderA - orderB;
  // Within same status group, sort by pickup date soonest first
  const dateA = a.origin.date || '';
  const dateB = b.origin.date || '';
  return dateA.localeCompare(dateB);
}

function sortDefaultJobs(a: FlatJob, b: FlatJob): number {
  // For non-active views, sort by pickup date soonest first
  const dateA = a.origin.date || '';
  const dateB = b.origin.date || '';
  return dateA.localeCompare(dateB);
}

type LocationMap = Map<string, { code: string; city: string; district: string }>;

function exportJobsCSV(jobs: FlatJob[], locationMap: LocationMap) {
  const header = [
    'Trip ID', 'MAWB', 'Bags', 'Weight (kg)', 'Pickup Date', 'Delivery Date', 'Remarks',
    'Customer', 'Job ID', 'Vendor', 'Service (L1)',
    'Cost ID', 'Subservice (L2)',
    'Origin Code', 'Origin', 'Origin District', 'Origin City',
    'Dest Code', 'Destination', 'Dest District', 'Dest City',
    'Job Pickup', 'Status',
  ];
  const rows = jobs.flatMap((j) => {
    const orig = locationMap.get(j.origin.location);
    const dest = locationMap.get(j.destination.location);
    const l2Ids = j.l2CostIds ?? [];
    return l2Ids.map((costId) => {
      const l2 = getL2ByCostId(costId);
      return [
        j.trip.id,
        j.trip.mawb,
        j.trip.bags,
        j.trip.weight,
        j.trip.pickupDate || '-',
        j.trip.deliveryDate || '-',
        j.trip.remarks || '-',
        j.trip.customer.name,
        j.id,
        j.vendor.name,
        j.service.code,
        costId,
        l2?.name ?? costId,
        orig?.code ?? '',
        j.origin.location,
        orig?.district ?? '',
        orig?.city ?? '',
        dest?.code ?? '',
        j.destination.location,
        dest?.district ?? '',
        dest?.city ?? '',
        j.origin.date || '-',
        j.status,
      ];
    });
  });
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jobs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// -- Component --

export default function JobsPage() {
  const toast = useToast();
  const { trips, updateJobStatus, addProofDocument, removeProofDocument, addActivityLog, updateJob, updateFeeQty, toggleFee, startJob, verifyJob, cancelJob, cancelAndReplace, createFollowup, setCompletionRemark } = useTrips();
  const { locations } = useLocations();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [serviceFilter, setServiceFilter] = useState<string | null>(null);
  const [vendorFilter, setVendorFilter] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [dateStart, setDateStart] = useState<string | null>(null);
  const [dateEnd, setDateEnd] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [panelIds, setPanelIds] = useState<{ tripId: string; jobId: string } | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // Flatten all jobs
  const allJobs: FlatJob[] = useMemo(() =>
    trips.flatMap((t) => t.jobs.map((j) => ({ ...j, trip: t }))),
    [trips]
  );

  // Location lookup map for CSV export (includes user-created locations)
  const locationMap: LocationMap = useMemo(() => {
    const map = new Map<string, { code: string; city: string; district: string }>();
    for (const l of locations) {
      map.set(l.name, { code: l.code ?? '', city: l.city ?? '', district: l.district ?? '' });
    }
    return map;
  }, [locations]);

  // Stats (computed from ALL jobs, not filtered)
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
        jobs = jobs.filter((j) => j.status === 'Pending' || j.status === 'In Progress' || j.status === 'Cancelled');
        break;
      case 'completed':
        jobs = jobs.filter((j) => j.status === 'Completed');
        break;
      case 'verified':
        jobs = jobs.filter((j) => j.status === 'Verified');
        break;
      case 'all':
        break;
    }

    // Service filter
    if (serviceFilter) {
      jobs = jobs.filter((j) => j.service.code === serviceFilter);
    }

    // Vendor filter
    if (vendorFilter) {
      jobs = jobs.filter((j) => j.vendor.name.toLowerCase().includes(vendorFilter.toLowerCase()));
    }

    // Job search (trip ID, job ID, customer name)
    if (jobSearch) {
      const q = jobSearch.toLowerCase();
      jobs = jobs.filter((j) =>
        j.trip.id.toLowerCase().includes(q) ||
        j.id.toLowerCase().includes(q) ||
        j.trip.customer.name.toLowerCase().includes(q)
      );
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
    if (statusFilter === 'active') {
      jobs = [...jobs].sort(sortActiveJobs);
    } else {
      jobs = [...jobs].sort(sortDefaultJobs);
    }

    return jobs;
  }, [allJobs, statusFilter, serviceFilter, vendorFilter, jobSearch, dateStart, dateEnd]);

  // Status pill counts (from allJobs filtered only by service/vendor/date, NOT status)
  const pillCounts = useMemo(() => {
    let jobs = allJobs;
    if (serviceFilter) jobs = jobs.filter((j) => j.service.code === serviceFilter);
    if (vendorFilter) jobs = jobs.filter((j) => j.vendor.name.toLowerCase().includes(vendorFilter.toLowerCase()));
    if (jobSearch) {
      const q = jobSearch.toLowerCase();
      jobs = jobs.filter((j) =>
        j.trip.id.toLowerCase().includes(q) ||
        j.id.toLowerCase().includes(q) ||
        j.trip.customer.name.toLowerCase().includes(q)
      );
    }
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
      active: jobs.filter((j) => j.status === 'Pending' || j.status === 'In Progress' || j.status === 'Cancelled').length,
      completed: jobs.filter((j) => j.status === 'Completed').length,
      verified: jobs.filter((j) => j.status === 'Verified').length,
      all: jobs.length,
    };
  }, [allJobs, serviceFilter, vendorFilter, jobSearch, dateStart, dateEnd]);

  // Unique vendors in filtered results
  const activeVendorCount = useMemo(() => {
    const vendorSet = new Set(filtered.map((j) => j.vendor.code));
    return vendorSet.size;
  }, [filtered]);

  // Pagination
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const paginatedJobs = totalFiltered > PAGE_SIZE ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : filtered;

  // Panel data
  const panelTrip = panelIds ? trips.find((t) => t.id === panelIds.tripId) : null;
  const panelJob = panelTrip ? panelTrip.jobs.find((j) => j.id === panelIds.jobId) : null;
  const panelJobIdx = panelTrip && panelJob ? panelTrip.jobs.indexOf(panelJob) : -1;

  // -- Handlers --

  const onUpload = useCallback((tripId: string, jobId: string, file: File) => {
    addProofDocument(tripId, jobId, { id: `d${Date.now()}`, name: file.name, type: file.type, uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16), uploadedBy: 'Ops Admin', url: URL.createObjectURL(file) });
    addActivityLog(tripId, jobId, { id: `l${Date.now()}`, timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16), action: 'Proof uploaded', user: 'Ops Admin', details: file.name });
    toast.success(`Uploaded ${file.name}`);
  }, [addProofDocument, addActivityLog, toast]);

  const onRemoveProof = useCallback((tripId: string, jobId: string, docId: string) => {
    removeProofDocument(tripId, jobId, docId);
  }, [removeProofDocument]);

  const onStartJob = useCallback((tripId: string, jobId: string) => {
    startJob(tripId, jobId);
    addActivityLog(tripId, jobId, { id: `l${Date.now()}`, timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16), action: 'Job started', user: 'Ops Admin' });
    toast.success('Job started');
  }, [startJob, addActivityLog, toast]);

  const onVerify = useCallback((tripId: string, jobId: string) => {
    verifyJob(tripId, jobId);
    toast.success('Job verified — ready for payment');
  }, [verifyJob, toast]);

  const onCancelJob = useCallback((tripId: string, jobId: string, reason: string) => {
    cancelJob(tripId, jobId, reason);
    toast.success('Job cancelled');
  }, [cancelJob, toast]);

  const onCancelAndReplace = useCallback((tripId: string, jobId: string, reason: string, newVendorCode: string) => {
    const trip = trips.find((t) => t.id === tripId);
    const job = trip?.jobs.find((j) => j.id === jobId);
    if (!trip || !job) return;
    const v = vendors.find((x) => x.code === newVendorCode)!;
    const newId = generateJobId(tripId, trip.jobs);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newJob: Job = {
      id: newId, vendor: { code: v.code, name: v.name },
      origin: { ...job.origin }, destination: { ...job.destination },
      service: { ...job.service }, status: 'Pending', duration: null, execution: null,
      activityLog: [{ id: `log-${Date.now()}`, timestamp: now, action: `Job created — replaces ${job.id} (${job.vendor.name}, cancelled)`, user: 'Ops Admin' }],
      proofDocuments: [], fees: [],
      replacesJobId: job.id,
    };
    cancelAndReplace(tripId, jobId, reason, newJob);
    toast.success(`Cancelled & replaced with ${v.name}`);
    setPanelIds(null);
  }, [trips, cancelAndReplace, toast]);

  const onCreateFollowup = useCallback((tripId: string, jobId: string, vendorCode: string) => {
    const trip = trips.find((t) => t.id === tripId);
    const job = trip?.jobs.find((j) => j.id === jobId);
    if (!trip || !job) return;
    const v = vendors.find((x) => x.code === vendorCode)!;
    const newId = generateJobId(tripId, trip.jobs);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newJob: Job = {
      id: newId, vendor: { code: v.code, name: v.name },
      origin: { ...job.origin }, destination: { ...job.destination },
      service: { ...job.service }, status: 'Pending', duration: null, execution: null,
      activityLog: [{ id: `log-${Date.now()}`, timestamp: now, action: `Job created — follows ${job.id} (${job.completionRemark || 'partial'})`, user: 'Ops Admin' }],
      proofDocuments: [], fees: [],
      replacesJobId: job.id,
    };
    createFollowup(tripId, jobId, newJob);
    toast.success(`Follow-up created — ${newId}`);
  }, [trips, createFollowup, toast]);

  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // -- Grouped data --

  const groupedData = useMemo(() => {
    if (groupBy === 'none') return null;

    const groups = new Map<string, { label: string; jobs: FlatJob[]; sortKey: number | string }>();

    for (const job of filtered) {
      let key: string;
      let label: string;
      let sortKey: number | string;

      switch (groupBy) {
        case 'vendor':
          key = job.vendor.code;
          label = job.vendor.name;
          sortKey = 0; // will be overridden
          break;
        case 'service':
          key = job.service.code;
          label = job.service.label;
          // Fixed order: FM, EC, CS, CR, OH
          sortKey = ['FM', 'EC', 'CS', 'CR', 'OH'].indexOf(job.service.code);
          break;
        case 'date': {
          const d = job.origin.date ? parsePickupDate(job.origin.date) : null;
          if (d) {
            key = d.toISOString().slice(0, 10);
            label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          } else {
            key = 'no-date';
            label = 'No date';
          }
          sortKey = key;
          break;
        }
        default:
          key = 'all';
          label = 'All';
          sortKey = 0;
      }

      if (!groups.has(key)) {
        groups.set(key, { label, jobs: [], sortKey });
      }
      groups.get(key)!.jobs.push(job);
    }

    // Sort groups
    let sorted = Array.from(groups.entries());
    if (groupBy === 'vendor') {
      // Rejected vendors first, then by most active jobs
      sorted.sort(([, a], [, b]) => {
        const aRej = a.jobs.some((j) => j.status === 'Cancelled') ? 0 : 1;
        const bRej = b.jobs.some((j) => j.status === 'Cancelled') ? 0 : 1;
        if (aRej !== bRej) return aRej - bRej;
        return b.jobs.length - a.jobs.length;
      });
    } else if (groupBy === 'service') {
      sorted.sort(([, a], [, b]) => (a.sortKey as number) - (b.sortKey as number));
    } else if (groupBy === 'date') {
      sorted.sort(([, a], [, b]) => (b.sortKey as string).localeCompare(a.sortKey as string));
    }

    return sorted;
  }, [filtered, groupBy]);

  // Initialize all groups as collapsed when groupBy changes
  const effectiveCollapsed = useMemo(() => {
    if (!groupedData) return new Set<string>();
    // All groups collapsed by default unless user has toggled them open
    const allKeys = new Set(groupedData.map(([key]) => key));
    // If collapsedGroups is empty (first render after groupBy change), collapse all
    // We track "expanded" groups instead — a group is collapsed unless explicitly expanded
    return allKeys;
  }, [groupedData]);

  // Track expanded groups (inverse of collapsed)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroupExpand = useCallback((key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // -- Styles --

  const th: React.CSSProperties = { textAlign: 'left', padding: '6px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' };

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

  function renderJobRow(job: FlatJob, hideColumn?: 'vendor' | 'service' | 'pickup') {
    const isRejected = job.status === 'Cancelled';
    return (
      <tr
        key={`${job.trip.id}-${job.id}`}
        onClick={() => setPanelIds({ tripId: job.trip.id, jobId: job.id })}
        style={{ cursor: 'pointer', background: isRejected ? '#fefafa' : undefined, transition: 'background 0.1s' }}
        onMouseEnter={(e) => { if (!isRejected) e.currentTarget.style.background = '#f9fafb'; }}
        onMouseLeave={(e) => { if (!isRejected) e.currentTarget.style.background = ''; }}
      >
        {/* Trip ID */}
        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
          <Link
            to="/trips"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#152CFF', background: 'rgba(21,44,255,0.04)', padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(21,44,255,0.1)', textDecoration: 'none', cursor: 'pointer' }}
          >
            {job.trip.id}
          </Link>
        </td>

        {/* Pickup */}
        {hideColumn !== 'pickup' && (
          <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontFamily: 'var(--font-mono)', fontSize: 10, verticalAlign: 'middle' }}>
            {job.origin.date ? (() => {
              const d = parsePickupDate(job.origin.date);
              return (
                <>
                  <div>{d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                  <div style={{ color: '#9ca3af' }}>{d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                </>
              );
            })() : <span style={{ color: '#d1d5db' }}>&mdash;</span>}
          </td>
        )}

        {/* Job ID */}
        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#374151' }}>{job.id}</span>
        </td>

        {/* Customer */}
        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 11, fontWeight: 600, color: '#111827', verticalAlign: 'middle' }}>
          {job.trip.customer.name}
        </td>

        {/* Vendor */}
        {hideColumn !== 'vendor' && (
          <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 11, fontWeight: 600, color: '#111827', verticalAlign: 'middle' }}>
            {job.vendor.name}
          </td>
        )}

        {/* Service */}
        {hideColumn !== 'service' && (
          <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
            <ServiceTag service={job.service} />
          </td>
        )}

        {/* Origin */}
        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 10, color: '#374151', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 0 }}>
          {job.origin.location}
        </td>

        {/* Destination */}
        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 10, color: '#374151', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 0 }}>
          {job.destination.location}
        </td>

        {/* Status */}
        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
          {renderStatusChip(job.status)}
        </td>

      </tr>
    );
  }

  function renderGroupStatusBadges(jobs: FlatJob[]) {
    const counts: { label: string; count: number; style: React.CSSProperties }[] = [];
    const cancelled = jobs.filter((j) => j.status === 'Cancelled').length;
    const inProgress = jobs.filter((j) => j.status === 'In Progress').length;
    const pending = jobs.filter((j) => j.status === 'Pending').length;
    const completed = jobs.filter((j) => j.status === 'Completed').length;
    const verified = jobs.filter((j) => j.status === 'Verified').length;

    if (cancelled > 0) counts.push({ label: `${cancelled} cancelled`, count: cancelled, style: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' } });
    if (inProgress > 0) counts.push({ label: `${inProgress} in progress`, count: inProgress, style: { background: 'rgba(21,44,255,0.04)', color: '#152CFF', border: '1px solid rgba(21,44,255,0.12)' } });
    if (pending > 0) counts.push({ label: `${pending} pending`, count: pending, style: { background: '#f9fafb', color: '#9ca3af', border: '1px solid #e5e7eb' } });
    if (completed > 0) counts.push({ label: `${completed} completed`, count: completed, style: { background: '#fefce8', color: '#a16207', border: '1px solid #fde68a' } });
    if (verified > 0) counts.push({ label: `${verified} verified`, count: verified, style: { background: '#f0fdf4', color: '#059669', border: '1px solid #a7f3d0' } });

    return (
      <div style={{ display: 'flex', gap: 4 }}>
        {counts.map(({ label, style: badgeStyle }) => (
          <span key={label} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, fontWeight: 600, whiteSpace: 'nowrap', ...badgeStyle }}>{label}</span>
        ))}
      </div>
    );
  }

  // Table columns for grouped modes
  function getHideColumn(): 'vendor' | 'service' | 'pickup' | undefined {
    switch (groupBy) {
      case 'vendor': return 'vendor';
      case 'service': return 'service';
      case 'date': return 'pickup';
      default: return undefined;
    }
  }

  const hideColumn = getHideColumn();

  // Right-aligned count text
  const rightCountText = useMemo(() => {
    if (statusFilter === 'active') return `${filtered.length} active \u00b7 ${activeVendorCount} vendors`;
    if (statusFilter === 'completed') return `${filtered.length} completed \u00b7 needs verification`;
    if (statusFilter === 'verified') return `${filtered.length} verified`;
    return `${filtered.length} jobs \u00b7 ${activeVendorCount} vendors`;
  }, [statusFilter, filtered.length, activeVendorCount]);

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
        {stats.cancelled > 0 && (
          <>
            <span style={{ width: 1, height: 14, background: '#e5e7eb', margin: '0 12px' }} />
            <span style={{ color: '#dc2626', fontWeight: 600 }}>{stats.cancelled} cancelled</span>
          </>
        )}
      </div>

      {/* -- Page header -- */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '16px 16px 0 16px' }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', color: '#111827', margin: 0 }}>Jobs</h1>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0 0' }}>All vendor assignments across shipments</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => exportJobsCSV(filtered, locationMap)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff', color: '#374151', border: '1px solid #e5e7eb', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* -- Filter bar -- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {/* Status pills */}
        {([
          ['active', 'Active', pillCounts.active] as const,
          ['completed', 'Completed', pillCounts.completed] as const,
          ['verified', 'Verified', pillCounts.verified] as const,
          ['all', 'All', pillCounts.all] as const,
        ]).map(([key, label, count]) => {
          const isOn = statusFilter === key;
          // Verified pill uses green style when selected
          const isVerifiedPill = key === 'verified';
          const isCompletedPill = key === 'completed';
          let pillStyle: React.CSSProperties;
          if (isOn && isVerifiedPill) {
            pillStyle = { border: '1px solid #059669', background: '#f0fdf4', color: '#059669' };
          } else if (isOn && isCompletedPill) {
            pillStyle = { border: '1px solid #a16207', background: '#fefce8', color: '#a16207' };
          } else if (isOn) {
            pillStyle = { border: '1px solid #152CFF', background: 'rgba(21,44,255,0.06)', color: '#152CFF' };
          } else {
            pillStyle = { border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280' };
          }
          // Badge style
          let badgeStyle: React.CSSProperties;
          if (isOn && isVerifiedPill) {
            badgeStyle = { background: '#f0fdf4', color: '#059669', border: '1px solid #a7f3d0' };
          } else if (isOn && isCompletedPill) {
            badgeStyle = { background: '#fefce8', color: '#a16207', border: '1px solid #fde68a' };
          } else if (isOn) {
            badgeStyle = { background: 'rgba(21,44,255,0.1)', color: '#152CFF', border: '1px solid rgba(21,44,255,0.2)' };
          } else {
            badgeStyle = { background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' };
          }

          return (
            <button
              key={key}
              onClick={() => { setStatusFilter(key); setPage(1); }}
              style={{
                padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                ...pillStyle,
              }}
            >
              {label}
              <span style={{ fontSize: 9, padding: '0 5px', borderRadius: 99, fontWeight: 700, minWidth: 16, textAlign: 'center', ...badgeStyle }}>{count}</span>
            </button>
          );
        })}

        <span style={{ width: 1, height: 16, background: '#e5e7eb' }} />

        {/* Date range */}
        <DateRangePopover
          startDate={dateStart}
          endDate={dateEnd}
          onChange={(s, e) => { setDateStart(s); setDateEnd(e); setPage(1); }}
        />

        <span style={{ width: 1, height: 16, background: '#e5e7eb' }} />

        {/* Service dropdown */}
        <select
          value={serviceFilter ?? ''}
          onChange={(e) => { setServiceFilter(e.target.value || null); setPage(1); }}
          style={{
            fontSize: 11, borderRadius: 4, padding: '4px 8px', fontFamily: 'inherit',
            border: serviceFilter ? '1px solid #152CFF' : '1px solid #e5e7eb',
            color: serviceFilter ? '#152CFF' : '#6b7280',
            fontWeight: serviceFilter ? 600 : undefined,
            background: serviceFilter ? 'rgba(21,44,255,0.04)' : '#fff',
          }}
        >
          <option value="">Service</option>
          <option value="FM">FM</option>
          <option value="EC">EC</option>
          <option value="CS">CS</option>
          <option value="CR">CR</option>
          <option value="OH">OH</option>
        </select>

        <span style={{ width: 1, height: 16, background: '#e5e7eb' }} />

        {/* Text search inputs */}
        <div style={{ position: 'relative' }}>
          <Search size={11} style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', color: '#d1d5db', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Trip, job, customer…"
            value={jobSearch}
            onChange={(e) => { setJobSearch(e.target.value); setPage(1); }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, borderRadius: 4, padding: '4px 8px 4px 22px', border: '1px solid #e5e7eb', outline: 'none', width: 155 }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={11} style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', color: '#d1d5db', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Vendor"
            value={vendorFilter}
            onChange={(e) => { setVendorFilter(e.target.value); setPage(1); }}
            style={{ fontSize: 11, borderRadius: 4, padding: '4px 8px 4px 22px', border: '1px solid #e5e7eb', outline: 'none', width: 110 }}
          />
        </div>

        <span style={{ width: 1, height: 16, background: '#e5e7eb' }} />

        {/* Group by dropdown */}
        <span style={{ fontSize: 11, color: '#9ca3af' }}>Group</span>
        <select
          value={groupBy}
          onChange={(e) => { setGroupBy(e.target.value as GroupBy); setExpandedGroups(new Set()); setPage(1); }}
          style={{
            fontSize: 11, borderRadius: 4, padding: '4px 8px', fontFamily: 'inherit',
            border: groupBy !== 'none' ? '1px solid #152CFF' : '1px solid #e5e7eb',
            color: groupBy !== 'none' ? '#152CFF' : undefined,
            fontWeight: groupBy !== 'none' ? 600 : undefined,
            background: groupBy !== 'none' ? 'rgba(21,44,255,0.04)' : undefined,
          }}
        >
          <option value="none">None</option>
          <option value="vendor">Vendor</option>
          <option value="service">Service</option>
          <option value="date">Date</option>
        </select>

        {/* Right count */}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
          {rightCountText}
        </span>
      </div>

      {/* -- Table -- */}
      <div style={{ padding: '0 16px 24px 16px' }}>
        {groupBy === 'none' ? (
          /* Flat table */
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: '7%' }}>Trip ID</th>
                <th style={{ ...th, width: '7%' }}>Pickup</th>
                <th style={{ ...th, width: '7%' }}>Job ID</th>
                <th style={{ ...th, width: '10%' }}>Customer</th>
                <th style={{ ...th, width: '10%' }}>Vendor</th>
                <th style={{ ...th, width: '6%' }}>Service</th>
                <th style={{ ...th, width: '20%' }}>Origin</th>
                <th style={{ ...th, width: '20%' }}>Destination</th>
                <th style={{ ...th, width: '10%' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedJobs.length > 0 ? paginatedJobs.map((job) => renderJobRow(job)) : (
                <tr>
                  <td colSpan={9} style={{ padding: '60px 12px', textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(21,44,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Ship size={18} style={{ color: '#152CFF' }} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>No jobs match your filters</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Try adjusting your search or filters above</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          /* Grouped table */
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
            {groupedData && groupedData.length > 0 ? groupedData.map(([key, group]) => {
              const isExpanded = expandedGroups.has(key);
              return (
                <div key={key}>
                  {/* Group header */}
                  <div
                    onClick={() => toggleGroupExpand(key)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                  >
                    <span style={{ color: '#152CFF', fontSize: 11, fontWeight: 700, width: 16, flexShrink: 0 }}>{isExpanded ? '\u25be' : '\u25b8'}</span>
                    {groupBy === 'service' && (
                      <ServiceTag service={{ code: key, label: group.label }} />
                    )}
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                      {groupBy !== 'service' ? group.label : ''}
                    </span>
                    {renderGroupStatusBadges(group.jobs)}
                  </div>
                  {/* Group body */}
                  {isExpanded && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                      <thead>
                        <tr>
                          <th style={{ ...th, width: '7%' }}>Trip ID</th>
                          {hideColumn !== 'pickup' && <th style={{ ...th, width: '7%' }}>Pickup</th>}
                          <th style={{ ...th, width: '7%' }}>Job ID</th>
                          <th style={{ ...th, width: '10%' }}>Customer</th>
                          {hideColumn !== 'vendor' && <th style={{ ...th, width: '10%' }}>Vendor</th>}
                          {hideColumn !== 'service' && <th style={{ ...th, width: '6%' }}>Service</th>}
                          <th style={{ ...th, width: '20%' }}>Origin</th>
                          <th style={{ ...th, width: '20%' }}>Destination</th>
                          <th style={{ ...th, width: '10%' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.jobs.map((job) => renderJobRow(job, hideColumn))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            }) : (
              <div style={{ padding: '60px 12px', textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(21,44,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Ship size={18} style={{ color: '#152CFF' }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>No jobs match your filters</p>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Try adjusting your search or filters above</p>
              </div>
            )}
          </div>
        )}
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

      {/* -- Slide-out Panel -- */}
      <SlideOutPanel isOpen={!!panelTrip && !!panelJob} onClose={() => setPanelIds(null)} title={panelJob?.vendor.name}>
        {panelTrip && panelJob && (
          <JobSlideOut
            job={panelJob}
            trip={panelTrip}
            jobIndex={panelJobIdx}
            onUploadProof={(f) => onUpload(panelTrip.id, panelJob.id, f)}
            onRemoveProof={(d) => onRemoveProof(panelTrip.id, panelJob.id, d)}
            onVerify={() => onVerify(panelTrip.id, panelJob.id)}
            onStartJob={() => onStartJob(panelTrip.id, panelJob.id)}
            onCancelJob={(reason) => onCancelJob(panelTrip.id, panelJob.id, reason)}
            onCancelAndReplace={(reason, vendorCode) => onCancelAndReplace(panelTrip.id, panelJob.id, reason, vendorCode)}
            onCreateFollowup={(vendorCode) => onCreateFollowup(panelTrip.id, panelJob.id, vendorCode)}
            onSetCompletionRemark={(remark) => { setCompletionRemark(panelTrip.id, panelJob.id, remark); toast.success('Remark saved'); }}
            onOpenJob={(tId, jId) => setPanelIds({ tripId: tId, jobId: jId })}
            onUpdateFeeQty={(feeId, qty) => updateFeeQty(panelTrip.id, panelJob.id, feeId, qty)}
            onToggleFee={(feeId) => toggleFee(panelTrip.id, panelJob.id, feeId)}
          />
        )}
      </SlideOutPanel>
    </div>
  );
}
