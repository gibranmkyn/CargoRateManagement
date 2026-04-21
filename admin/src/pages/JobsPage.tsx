import { useState, useCallback, useMemo } from 'react';
import { Download, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { vendors, getL2ByCostId } from '@shared/mockData';
import type { Trip, Job } from '@shared/mockData';
import DateRangePopover from '../components/shared/DateRangePopover';
import { useTrips, generateJobId } from '@shared/TripContext';
import { useLocations } from '../context/LocationContext';
import { useZones } from '@shared/ZoneContext';
import { useToast } from '@shared/Toast';
import SlideOutPanel from '../components/SlideOutPanel';
import JobSlideOut from '../components/trips/JobSlideOut';
import ServiceTag from '../components/trips/ServiceTag';
import StatusCell from '../components/trips/StatusCell';
import VerificationCell from '../components/trips/VerificationCell';
import { stateSortRank, parsePickupDate } from '@shared/statusStyles';

// -- Types --

type SegmentKey = 'All' | 'Pending' | 'In Progress' | 'To verify' | 'Verified' | 'Cancelled';
type GroupBy = 'none' | 'vendor' | 'service' | 'date';

interface FlatJob extends Job {
  trip: Trip;
}

type LocationMap = Map<string, { code: string; zoneId: string }>;

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

function exportJobsCSV(jobs: FlatJob[], locationMap: LocationMap, zoneMap: Map<string, string>) {
  const header = [
    'Trip ID', 'MAWB', 'Bags', 'Weight (kg)', 'Pickup Date', 'Delivery Date', 'Remarks',
    'Customer', 'Job ID', 'Vendor', 'Service (L1)',
    'Cost ID', 'Subservice (L2)',
    'Origin Code', 'Origin', 'Origin Zone',
    'Dest Code', 'Destination', 'Dest Zone',
    'Job Pickup', 'Status', 'Status Updated', 'Verification', 'Verification Updated',
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
        orig ? (zoneMap.get(orig.zoneId) ?? '') : '',
        dest?.code ?? '',
        j.destination.location,
        dest ? (zoneMap.get(dest.zoneId) ?? '') : '',
        j.origin.date || '-',
        j.status,
        j.statusChangedAt || '',
        j.verificationStatus,
        j.verificationChangedAt || '',
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

const SEGMENTS: SegmentKey[] = ['All', 'Pending', 'In Progress', 'To verify', 'Verified', 'Cancelled'];

// -- Component --

export default function JobsPage() {
  const toast = useToast();
  const { trips, updateJobStatus, addProofDocument, removeProofDocument, addActivityLog, updateJob, updateFeeQty, toggleFee, startJob, verifyJob, cancelJob, cancelAndReplace, createFollowup, setCompletionRemark } = useTrips();
  const { locations } = useLocations();
  const { zones } = useZones();
  const [segment, setSegment] = useState<SegmentKey>('All');
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState<string | null>(null);
  const [dateEnd, setDateEnd] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [panelIds, setPanelIds] = useState<{ tripId: string; jobId: string } | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // Flatten all jobs
  const allJobs: FlatJob[] = useMemo(() =>
    trips.flatMap((t) => t.jobs.map((j) => ({ ...j, trip: t }))),
    [trips]
  );

  // Location lookup map for CSV export
  const locationMap: LocationMap = useMemo(() => {
    const map = new Map<string, { code: string; zoneId: string }>();
    for (const l of locations) {
      map.set(l.name, { code: l.code ?? '', zoneId: l.zoneId ?? '' });
    }
    return map;
  }, [locations]);

  // Zone id → name map for CSV export
  const zoneMap = useMemo(() => {
    return new Map<string, string>(zones.map((z) => [z.id, z.name]));
  }, [zones]);

  // Segment counts (from allJobs filtered only by service/search/date, NOT segment or verificationFilter)
  const pillCounts = useMemo(() => {
    let jobs = allJobs;
    if (serviceFilter) jobs = jobs.filter((j) => j.service.code === serviceFilter);
    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter((j) =>
        j.trip.id.toLowerCase().includes(q) ||
        j.id.toLowerCase().includes(q) ||
        j.trip.customer.name.toLowerCase().includes(q) ||
        j.vendor.name.toLowerCase().includes(q) ||
        (j.trip.mawb ?? '').toLowerCase().includes(q)
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
    return buildSegmentCounts(jobs);
  }, [allJobs, serviceFilter, search, dateStart, dateEnd]);

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

    // Service filter
    if (serviceFilter) {
      jobs = jobs.filter((j) => j.service.code === serviceFilter);
    }

    // Unified search
    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter((j) =>
        j.trip.id.toLowerCase().includes(q) ||
        j.id.toLowerCase().includes(q) ||
        j.trip.customer.name.toLowerCase().includes(q) ||
        j.vendor.name.toLowerCase().includes(q) ||
        (j.trip.mawb ?? '').toLowerCase().includes(q)
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

    // Sort: All uses stateSortRank as primary; specific segments sort by pickup date
    if (segment === 'All') {
      jobs = [...jobs].sort((a, b) => {
        const ra = stateSortRank(a);
        const rb = stateSortRank(b);
        if (ra !== rb) return ra - rb;
        const dateA = a.origin.date || '';
        const dateB = b.origin.date || '';
        return dateA.localeCompare(dateB);
      });
    } else {
      jobs = [...jobs].sort((a, b) => {
        const dateA = a.origin.date || '';
        const dateB = b.origin.date || '';
        return dateA.localeCompare(dateB);
      });
    }

    return jobs;
  }, [allJobs, segment, serviceFilter, search, dateStart, dateEnd]);

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

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearch('');
    setServiceFilter('');
    setSegment('All');
    setDateStart(null);
    setDateEnd(null);
    setPage(1);
  }, []);

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
      service: { ...job.service }, status: 'Pending', verificationStatus: 'Pending', statusChangedAt: now, duration: null, execution: null,
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
      service: { ...job.service }, status: 'Pending', verificationStatus: 'Pending', statusChangedAt: now, duration: null, execution: null,
      activityLog: [{ id: `log-${Date.now()}`, timestamp: now, action: `Job created — follows ${job.id} (${job.completionRemark || 'partial'})`, user: 'Ops Admin' }],
      proofDocuments: [], fees: [],
      replacesJobId: job.id,
    };
    createFollowup(tripId, jobId, newJob);
    toast.success(`Follow-up created — ${newId}`);
  }, [trips, createFollowup, toast]);

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
          sortKey = 0;
          break;
        case 'service':
          key = job.service.code;
          label = job.service.label;
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

    let sorted = Array.from(groups.entries());
    if (groupBy === 'vendor') {
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

  // Track expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroupExpanded = useCallback((key: string) => {
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

  function renderJobRow(job: FlatJob, hideColumn?: 'vendor' | 'service' | 'pickup') {
    return (
      <tr
        key={`${job.trip.id}-${job.id}`}
        onClick={() => setPanelIds({ tripId: job.trip.id, jobId: job.id })}
        style={{ cursor: 'pointer', transition: 'background 0.1s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
      >
        {/* Trip ID */}
        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
          <Link
            to="/trips"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#111827', fontWeight: 500, textDecoration: 'none' }}
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
          <StatusCell job={job} showReason />
        </td>

        {/* Verification */}
        <td style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
          <VerificationCell job={job} showReason />
        </td>

      </tr>
    );
  }

  function renderGroupStatusBadges(jobs: FlatJob[]) {
    const badgeCounts: { label: string; count: number; style: React.CSSProperties }[] = [];
    const cancelled = jobs.filter((j) => j.status === 'Cancelled').length;
    const inProgress = jobs.filter((j) => j.status === 'In Progress').length;
    const pending = jobs.filter((j) => j.status === 'Pending').length;
    const completed = jobs.filter((j) => j.status === 'Completed').length;
    const verified = jobs.filter((j) => j.verificationStatus === 'Verified').length;

    if (cancelled > 0) badgeCounts.push({ label: `${cancelled} cancelled`, count: cancelled, style: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' } });
    if (inProgress > 0) badgeCounts.push({ label: `${inProgress} in progress`, count: inProgress, style: { background: 'rgba(21,44,255,0.04)', color: '#152CFF', border: '1px solid rgba(21,44,255,0.12)' } });
    if (pending > 0) badgeCounts.push({ label: `${pending} pending`, count: pending, style: { background: '#f9fafb', color: '#9ca3af', border: '1px solid #e5e7eb' } });
    if (completed > 0) badgeCounts.push({ label: `${completed} completed`, count: completed, style: { background: '#fefce8', color: '#a16207', border: '1px solid #fde68a' } });
    if (verified > 0) badgeCounts.push({ label: `${verified} verified`, count: verified, style: { background: '#f0fdf4', color: '#059669', border: '1px solid #a7f3d0' } });

    return (
      <div style={{ display: 'flex', gap: 4 }}>
        {badgeCounts.map(({ label, style: badgeStyle }) => (
          <span key={label} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, fontWeight: 600, whiteSpace: 'nowrap', ...badgeStyle }}>{label}</span>
        ))}
      </div>
    );
  }

  function getHideColumn(): 'vendor' | 'service' | 'pickup' | undefined {
    switch (groupBy) {
      case 'vendor': return 'vendor';
      case 'service': return 'service';
      case 'date': return 'pickup';
      default: return undefined;
    }
  }

  const hideColumn = getHideColumn();

  const rightCountText = `${filtered.length} jobs \u00b7 ${activeVendorCount} vendors`;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* -- Page header -- */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '16px 16px 0 16px' }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', color: '#111827', margin: 0 }}>Jobs</h1>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0 0' }}>All vendor assignments across shipments</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => exportJobsCSV(filtered, locationMap, zoneMap)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff', color: '#374151', border: '1px solid #e5e7eb', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* -- Filter bar -- */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        {/* Segment pills + inline exception alert */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          {SEGMENTS.map((k) => {
            const active = segment === k;
            return (
              <button
                key={k}
                onClick={() => { setSegment(k); setPage(1); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px', borderRadius: 4,
                  fontSize: 11, fontWeight: active ? 600 : 500,
                  border: `1px solid ${active ? '#111827' : '#e5e7eb'}`,
                  background: active ? '#111827' : '#fff',
                  color: active ? '#fff' : '#374151',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <span>{k}</span>
                <span
                  style={{
                    fontSize: 10, padding: '0 5px', borderRadius: 8, fontWeight: 700,
                    background: active ? 'rgba(255,255,255,0.16)' : '#f3f4f6',
                    color: active ? '#fff' : '#6b7280',
                    minWidth: 14, textAlign: 'center',
                  }}
                >
                  {pillCounts[k] ?? 0}
                </span>
              </button>
            );
          })}

          {(pillCounts.Cancelled > 0 || pillCounts.Rejected > 0) && (
            <button
              onClick={() => { setSegment('All'); setPage(1); }}
              style={{
                marginLeft: 'auto',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 11, color: '#dc2626', fontWeight: 500,
                fontFamily: 'inherit',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
              {pillCounts.Cancelled > 0 && <>{pillCounts.Cancelled} cancelled</>}
              {pillCounts.Cancelled > 0 && pillCounts.Rejected > 0 && <> &middot; </>}
              {pillCounts.Rejected > 0 && <>{pillCounts.Rejected} rejected</>}
              <span style={{ color: '#152CFF', marginLeft: 4 }}>view &rarr;</span>
            </button>
          )}
        </div>

        {/* Single search + service select + date range + group by + right count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={11} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#d1d5db', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search by trip, customer, vendor, or MAWB…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 11, borderRadius: 4, padding: '5px 8px 5px 26px', border: '1px solid #e5e7eb', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <select
            value={serviceFilter}
            onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }}
            style={{
              fontSize: 11, borderRadius: 4, padding: '5px 8px', fontFamily: 'inherit',
              border: serviceFilter ? '1px solid #152CFF' : '1px solid #e5e7eb',
              color: serviceFilter ? '#152CFF' : '#6b7280',
              fontWeight: serviceFilter ? 600 : undefined,
              background: serviceFilter ? 'rgba(21,44,255,0.04)' : '#fff',
            }}
          >
            <option value="">Service · All</option>
            <option value="FM">FM · Trucking</option>
            <option value="CS">CS · Cargo Submission</option>
            <option value="EC">EC · Export Customs</option>
            <option value="OH">OH · Origin Handling</option>
            <option value="CR">CR · Cargo Retrieval</option>
          </select>

          <DateRangePopover
            startDate={dateStart}
            endDate={dateEnd}
            onChange={(s, e) => { setDateStart(s); setDateEnd(e); setPage(1); }}
          />

          <span style={{ width: 1, height: 16, background: '#e5e7eb' }} />

          <span style={{ fontSize: 11, color: '#9ca3af' }}>Group</span>
          <select
            value={groupBy}
            onChange={(e) => { setGroupBy(e.target.value as GroupBy); setExpandedGroups(new Set()); setPage(1); }}
            style={{
              fontSize: 11, borderRadius: 4, padding: '5px 8px', fontFamily: 'inherit',
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

          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
            {rightCountText}
          </span>
        </div>
      </div>

      {/* -- Table -- */}
      <div style={{ padding: '0 16px 24px 16px' }}>
        {groupBy === 'none' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: '7%' }}>Trip ID</th>
                <th style={{ ...th, width: '7%' }}>Pickup</th>
                <th style={{ ...th, width: '7%' }}>Job ID</th>
                <th style={{ ...th, width: '9%' }}>Customer</th>
                <th style={{ ...th, width: '9%' }}>Vendor</th>
                <th style={{ ...th, width: '6%' }}>Service</th>
                <th style={{ ...th, width: '15%' }}>Origin</th>
                <th style={{ ...th, width: '15%' }}>Destination</th>
                <th style={{ ...th, width: '9%' }}>Status</th>
                <th style={{ ...th, width: '9%' }}>Verification</th>
              </tr>
            </thead>
            <tbody>
              {paginatedJobs.length > 0 ? paginatedJobs.map((job) => renderJobRow(job)) : (
                <tr>
                  <td colSpan={10}>
                    <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6b7280', fontSize: 12 }}>
                      No jobs match &middot; <button onClick={clearFilters} style={{ color: '#152CFF', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0 }}>clear filters</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
            {groupedData && groupedData.length > 0 ? groupedData.map(([key, group]) => {
              const isExpanded = expandedGroups.has(key);
              return (
                <div key={key}>
                  <div
                    onClick={() => toggleGroupExpanded(key)}
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
                  {isExpanded && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                      <thead>
                        <tr>
                          <th style={{ ...th, width: '7%' }}>Trip ID</th>
                          {hideColumn !== 'pickup' && <th style={{ ...th, width: '7%' }}>Pickup</th>}
                          <th style={{ ...th, width: '7%' }}>Job ID</th>
                          <th style={{ ...th, width: '9%' }}>Customer</th>
                          {hideColumn !== 'vendor' && <th style={{ ...th, width: '9%' }}>Vendor</th>}
                          {hideColumn !== 'service' && <th style={{ ...th, width: '6%' }}>Service</th>}
                          <th style={{ ...th, width: '15%' }}>Origin</th>
                          <th style={{ ...th, width: '15%' }}>Destination</th>
                          <th style={{ ...th, width: '9%' }}>Status</th>
                          <th style={{ ...th, width: '9%' }}>Verification</th>
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
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6b7280', fontSize: 12 }}>
                No jobs match &middot; <button onClick={clearFilters} style={{ color: '#152CFF', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0 }}>clear filters</button>
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
