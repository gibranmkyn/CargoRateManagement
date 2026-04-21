import { useState, useCallback, useMemo } from 'react';
import { Search, Download, Plus, Copy, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { vendors, getTripPickupDate } from '@shared/mockData';
import type { Trip, Job } from '@shared/mockData';
import { deriveTripStatus, tripHasRejectedJob, isTripCancelled, getTripVerificationDisplay } from '@shared/statusStyles';
import { useTrips, generateJobId } from '@shared/TripContext';
import { useToast } from '@shared/Toast';
import SlideOutPanel from '../components/SlideOutPanel';
import JobSlideOut from '../components/trips/JobSlideOut';
import ServiceTag from '../components/trips/ServiceTag';
import StatusCell from '../components/trips/StatusCell';
import VerificationCell from '../components/trips/VerificationCell';
import TripStatusCell from '../components/trips/TripStatusCell';
import TripVerificationCell from '../components/trips/TripVerificationCell';
import DateRangePopover from '../components/shared/DateRangePopover';

// -- Types --

type SegmentKey = 'All' | 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

// -- Helpers --

function exportTripsCSV(trips: Trip[]) {
  const header = ['Trip ID', 'Customer', 'MAWB', 'Origin', 'Destination', 'Pickup Date', 'Status', 'Verification', 'Jobs'];
  const rows = trips.map((t) => {
    const pickup = getTripPickupDate(t) || '-';
    const statusLabel = isTripCancelled(t) ? 'Cancelled' : deriveTripStatus(t);
    const verifLabel = getTripVerificationDisplay(t);
    return [t.id, t.customer.name, t.mawb, t.origin, t.destination, pickup, statusLabel, verifLabel, String(t.jobs.length)];
  });
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trips-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// -- Component --

export default function TripsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { trips, addProofDocument, removeProofDocument, addActivityLog, startJob, verifyJob, cancelJob, cancelAndReplace, createFollowup, setCompletionRemark } = useTrips();
  const [segment, setSegment] = useState<SegmentKey>('All');
  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState<string | null>(null);
  const [dateEnd, setDateEnd] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [panelIds, setPanelIds] = useState<{ tripId: string; jobId: string } | null>(null);
  const PAGE_SIZE = 50;

  // Derive panel data from context (always fresh)
  const panelTrip = panelIds ? trips.find((t) => t.id === panelIds.tripId) : null;
  const panelJob = panelTrip ? panelTrip.jobs.find((j) => j.id === panelIds.jobId) : null;
  const panelJobIdx = panelTrip && panelJob ? panelTrip.jobs.indexOf(panelJob) : -1;

  // -- Segment counts (computed from ALL trips) --
  const segmentCounts = useMemo(() => {
    const counts = { All: 0, Pending: 0, 'In Progress': 0, Completed: 0, Cancelled: 0, Rejected: 0 };
    for (const t of trips) {
      const status = deriveTripStatus(t);
      const cancelled = isTripCancelled(t);
      counts.All++;
      if (cancelled) {
        counts.Cancelled++;
      } else if (status === 'Completed') {
        counts.Completed++;
      } else if (status === 'In Progress') {
        counts['In Progress']++;
      } else {
        counts.Pending++;
      }
      if (tripHasRejectedJob(t)) {
        counts.Rejected++;
      }
    }
    return counts;
  }, [trips]);

  // -- Filter logic --
  const filtered = useMemo(() => {
    return trips.filter((t) => {
      const status = deriveTripStatus(t);
      const cancelled = isTripCancelled(t);

      // Segment filter
      switch (segment) {
        case 'Pending':
          if (status !== 'Pending' || cancelled) return false;
          break;
        case 'In Progress':
          if (status !== 'In Progress') return false;
          break;
        case 'Completed':
          if (status !== 'Completed' || cancelled) return false;
          break;
        case 'Cancelled':
          if (!cancelled) return false;
          break;
        case 'All':
        default:
          break;
      }

      // Date filter — by pickup date
      if (dateStart || dateEnd) {
        const pickupDate = getTripPickupDate(t);
        if (!pickupDate) return false;
        if (dateStart && pickupDate < dateStart) return false;
        if (dateEnd && pickupDate > dateEnd) return false;
      }

      // Unified search
      if (search) {
        const q = search.toLowerCase();
        const matchesId = t.id.toLowerCase().includes(q);
        const matchesMawb = t.mawb.toLowerCase().includes(q);
        const matchesCustomer = t.customer.name.toLowerCase().includes(q);
        const matchesVendor = t.jobs.some((j) => j.vendor.name.toLowerCase().includes(q));
        if (!matchesId && !matchesMawb && !matchesCustomer && !matchesVendor) return false;
      }

      return true;
    });
  }, [trips, segment, search, dateStart, dateEnd]);

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aDate = a.jobs[0]?.origin.date || '';
      const bDate = b.jobs[0]?.origin.date || '';
      return bDate.localeCompare(aDate); // newest first
    });
  }, [filtered]);

  const paginatedFiltered = totalFiltered > PAGE_SIZE ? sortedFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : sortedFiltered;

  // -- Clear filters helper --
  function clearFilters() {
    setSegment('All');
    setSearch('');
    setDateStart(null);
    setDateEnd(null);
    setPage(1);
  }

  // -- Handlers --

  const onUpload = useCallback((tripId: string, jobId: string, file: File) => {
    addProofDocument(tripId, jobId, { id: `d${Date.now()}`, name: file.name, type: file.type, uploadedAt: new Date().toISOString().replace('T',' ').slice(0,16), uploadedBy: 'Ops Admin', url: URL.createObjectURL(file) });
    addActivityLog(tripId, jobId, { id: `l${Date.now()}`, timestamp: new Date().toISOString().replace('T',' ').slice(0,16), action: 'Proof uploaded', user: 'Ops Admin', details: file.name });
    toast.success(`Uploaded ${file.name}`);
  }, [addProofDocument, addActivityLog, toast]);

  const onRemoveProof = useCallback((tripId: string, jobId: string, docId: string) => {
    removeProofDocument(tripId, jobId, docId);
  }, [removeProofDocument]);

  function makeReplacementJob(tripId: string, sourceJob: Job, newVendorCode: string): Job {
    const v = vendors.find((x) => x.code === newVendorCode)!;
    const trip = trips.find((t) => t.id === tripId)!;
    const newId = generateJobId(tripId, trip.jobs);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return {
      id: newId, vendor: { code: v.code, name: v.name },
      origin: { ...sourceJob.origin }, destination: { ...sourceJob.destination },
      service: { ...sourceJob.service }, status: 'Pending', verificationStatus: 'Pending' as const, statusChangedAt: now, duration: null, execution: null,
      activityLog: [{ id: `log-${Date.now()}`, timestamp: now, action: `Job created — replaces ${sourceJob.id} (${sourceJob.vendor.name}, cancelled)`, user: 'Ops Admin' }],
      proofDocuments: [], fees: [],
      replacesJobId: sourceJob.id,
    };
  }

  const onCancelJob = useCallback((tripId: string, jobId: string, reason: string) => {
    cancelJob(tripId, jobId, reason);
    toast.success('Job cancelled');
  }, [cancelJob, toast]);

  const onCancelAndReplace = useCallback((tripId: string, jobId: string, reason: string, newVendorCode: string) => {
    const trip = trips.find((t) => t.id === tripId);
    const job = trip?.jobs.find((j) => j.id === jobId);
    if (!trip || !job) return;
    const newJob = makeReplacementJob(tripId, job, newVendorCode);
    cancelAndReplace(tripId, jobId, reason, newJob);
    const v = vendors.find((x) => x.code === newVendorCode);
    toast.success(`Cancelled & replaced with ${v?.name}`);
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
      service: { ...job.service }, status: 'Pending', verificationStatus: 'Pending' as const, statusChangedAt: now, duration: null, execution: null,
      activityLog: [{ id: `log-${Date.now()}`, timestamp: now, action: `Job created — follows ${job.id} (${job.completionRemark || 'partial'})`, user: 'Ops Admin' }],
      proofDocuments: [], fees: [],
      replacesJobId: job.id,
    };
    createFollowup(tripId, jobId, newJob);
    toast.success(`Follow-up created — ${newId}`);
  }, [trips, createFollowup, toast]);

  // -- Table header style --
  const th: React.CSSProperties = { textAlign: 'left', padding: '6px 12px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' };

  // -- Segment pill labels --
  const SEGMENTS: SegmentKey[] = ['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* -- Page header -- */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '16px 16px 0 16px' }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', color: '#111827', margin: 0 }}>Trips</h1>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0 0' }}>Monitor and manage trips across vendors</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => exportTripsCSV(filtered)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fff', color: '#374151', border: '1px solid #e5e7eb', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Download size={12} /> Export
          </button>
          <button
            onClick={() => navigate('/create-trip')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#152CFF', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Plus size={12} /> New Trip
          </button>
        </div>
      </div>

      {/* -- Filter bar — row 1: segment pills + alert -- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 16px 0 16px' }}>
        {SEGMENTS.map((s) => {
          const isActive = segment === s;
          const count = segmentCounts[s];
          return (
            <button
              key={s}
              onClick={() => { setSegment(s); setPage(1); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: isActive ? 600 : 500,
                cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                background: isActive ? '#111827' : 'transparent',
                color: isActive ? '#fff' : '#6b7280',
                transition: 'background 0.1s, color 0.1s',
              }}
            >
              {s}
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 16, height: 16, borderRadius: 8, padding: '0 4px',
                fontSize: 9, fontWeight: 700,
                background: isActive ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                color: isActive ? '#fff' : '#6b7280',
              }}>
                {count}
              </span>
            </button>
          );
        })}

        {/* Inline alert for cancelled / rejected */}
        {(segmentCounts.Cancelled > 0 || segmentCounts.Rejected > 0) && (
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#dc2626' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
            {segmentCounts.Cancelled > 0 && `${segmentCounts.Cancelled} cancelled`}
            {segmentCounts.Cancelled > 0 && segmentCounts.Rejected > 0 && ' · '}
            {segmentCounts.Rejected > 0 && `${segmentCounts.Rejected} has rejected`}
            {' · '}
            <button
              onClick={() => { setSegment('All'); setPage(1); }}
              style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, padding: 0, textDecoration: 'underline', fontFamily: 'inherit' }}
            >
              view
            </button>
          </span>
        )}
      </div>

      {/* -- Filter bar — row 2: search + date range -- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px 8px 16px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={11} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#d1d5db', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by trip, customer, vendor, or MAWB…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ fontFamily: 'inherit', fontSize: 11, borderRadius: 4, padding: '5px 8px 5px 26px', border: '1px solid #e5e7eb', outline: 'none', width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        <DateRangePopover
          startDate={dateStart}
          endDate={dateEnd}
          onChange={(s, e) => { setDateStart(s); setDateEnd(e); setPage(1); }}
        />
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9ca3af' }}>
          {filtered.length} trips
        </span>
      </div>

      {/* -- Trip Table -- */}
      <div style={{ padding: '0 16px 24px 16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 24, padding: '6px 8px' }} />
              <th style={th}>Trip</th>
              <th style={th}>Customer</th>
              <th style={th}>Pickup</th>
              <th style={th}>Delivery</th>
              <th style={th}>MAWB</th>
              <th style={th}>Origin</th>
              <th style={th}>Destination</th>
              <th style={th}>Load</th>
              <th style={{ ...th, width: 140 }}>Status</th>
              <th style={{ ...th, width: 140 }}>Verification</th>
              <th style={{ ...th, width: 60 }} />
            </tr>
          </thead>
          <tbody>
            {paginatedFiltered.length > 0 ? paginatedFiltered.flatMap((trip) => {
              const isExpanded = expandedId === trip.id;
              const expandedBg = '#f9fafb';
              const rowBg = isExpanded ? expandedBg : undefined;

              const rows = [
                <tr
                  key={trip.id}
                  onClick={() => setExpandedId(isExpanded ? null : trip.id)}
                  style={{ cursor: 'pointer', background: rowBg, transition: 'background 0.1s' }}
                  onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = expandedBg; }}
                  onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = ''; }}
                >
                  <td style={{ padding: '8px 4px 8px 12px', verticalAlign: 'middle', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6', color: isExpanded ? '#152CFF' : '#d1d5db', fontSize: 12, fontWeight: isExpanded ? 700 : 400 }}>
                    {isExpanded ? '\u25be' : '\u25b8'}
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'middle', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: '#111827' }}>{trip.id}</span>
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'middle', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>{trip.customer.name}</span>
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'middle', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
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
                  <td style={{ padding: '8px 12px', verticalAlign: 'middle', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    {trip.deliveryDate ? (() => {
                      const d = new Date(trip.deliveryDate + 'T00:00:00');
                      return <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#374151' }}>{d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>;
                    })() : <span style={{ fontSize: 11, color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'middle', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#374151' }}>{trip.mawb}</div>
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'middle', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: 11, color: '#374151' }}>{trip.origin}</span>
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'middle', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: 11, color: '#374151' }}>{trip.destination}</span>
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'middle', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{trip.bags} bags &middot; {trip.weight} kg</span>
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'middle', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    <TripStatusCell trip={trip} />
                  </td>
                  <td style={{ padding: '8px 12px', verticalAlign: 'middle', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    <TripVerificationCell trip={trip} />
                  </td>
                  <td style={{ padding: '8px 4px', verticalAlign: 'middle', borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span
                        onClick={(e) => { e.stopPropagation(); navigate(`/trips/${trip.id}/edit`); }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.3'; }}
                        style={{ color: '#9ca3af', cursor: 'pointer', opacity: 0.3, transition: 'opacity 0.15s', display: 'inline-flex' }}
                      >
                        <Pencil size={12} />
                      </span>
                      <span
                        onClick={(e) => { e.stopPropagation(); navigate(`/create-trip?duplicate=${trip.id}`); }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.3'; }}
                        style={{ color: '#9ca3af', cursor: 'pointer', opacity: 0.3, transition: 'opacity 0.15s', display: 'inline-flex' }}
                      >
                        <Copy size={12} />
                      </span>
                    </div>
                  </td>
                </tr>
              ];

              if (isExpanded) {
                const subTh: React.CSSProperties = { textAlign: 'left', padding: '4px 10px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' };
                rows.push(
                  <tr key={`${trip.id}-exp`} style={{ background: expandedBg }} onClick={(e) => e.stopPropagation()}>
                    <td colSpan={12} style={{ padding: 0, borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ paddingLeft: 40, paddingRight: 12, paddingTop: 4, paddingBottom: 10 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ ...subTh, width: 50 }}>Job</th>
                              <th style={subTh}>Vendor</th>
                              <th style={subTh}>Service</th>
                              <th style={subTh}>Origin</th>
                              <th style={subTh}>Destination</th>
                              <th style={{ ...subTh, width: 140 }}>Status</th>
                              <th style={{ ...subTh, width: 140 }}>Verification</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trip.jobs.map((job, i) => {
                              const jobHoverBg = '#f3f4f6';
                              return (
                                <tr
                                  key={job.id}
                                  onClick={(e) => { e.stopPropagation(); setPanelIds({ tripId: trip.id, jobId: job.id }); }}
                                  style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = jobHoverBg; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                                >
                                  <td style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#111827' }}>
                                    J{String(i + 1).padStart(2, '0')}
                                  </td>
                                  <td style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#111827' }}>
                                    {job.vendor.name}
                                  </td>
                                  <td style={{ padding: '6px 10px' }}>
                                    <ServiceTag service={job.service} />
                                  </td>
                                  <td style={{ padding: '6px 10px', fontSize: 10, color: '#374151' }}>
                                    {job.origin.location}
                                  </td>
                                  <td style={{ padding: '6px 10px', fontSize: 10, color: '#374151' }}>
                                    {job.destination.location}
                                  </td>
                                  <td style={{ padding: '6px 10px' }}>
                                    <StatusCell job={job} />
                                  </td>
                                  <td style={{ padding: '6px 10px' }}>
                                    <VerificationCell job={job} showReason />
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
                <td colSpan={12} style={{ padding: 0, textAlign: 'center' }}>
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6b7280', fontSize: 12 }}>
                    {trips.length === 0 ? 'No trips yet. Create your first trip to start managing vendor assignments.' : 'No trips match · '}
                    {trips.length > 0 && <button onClick={clearFilters} style={{ color: '#152CFF', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0 }}>clear filters</button>}
                    {trips.length === 0 && <button onClick={() => navigate('/create-trip')} style={{ marginLeft: 8, color: '#152CFF', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0 }}>+ New Trip</button>}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* -- Pagination -- */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderTop: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>Page {page} of {totalPages} · {totalFiltered} trips</span>
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
            onCancelJob={(reason) => onCancelJob(panelTrip.id, panelJob.id, reason)}
            onCancelAndReplace={(reason, vendorCode) => onCancelAndReplace(panelTrip.id, panelJob.id, reason, vendorCode)}
            onCreateFollowup={(vendorCode) => onCreateFollowup(panelTrip.id, panelJob.id, vendorCode)}
            onSetCompletionRemark={(remark) => { setCompletionRemark(panelTrip.id, panelJob.id, remark); toast.success('Remark saved'); }}
            onOpenJob={(tId, jId) => setPanelIds({ tripId: tId, jobId: jId })}
          />
        )}
      </SlideOutPanel>
    </div>
  );
}
