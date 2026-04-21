// JobsPage — filter bar snippet (Phase 1).
// Replaces the existing filter-bar block in JobsPage.tsx.
// Paste inside the existing page JSX between <PageHeader/> and <JobsTable/>.

import { Search } from 'lucide-react';
import DateRangePopover from '../components/shared/DateRangePopover';
import type { JobStatus } from '@shared/types';

type SegmentKey = 'All' | 'Pending' | 'In Progress' | 'Awaiting Verify' | 'Verified';

interface Props {
  segment: SegmentKey;
  setSegment: (s: SegmentKey) => void;
  counts: Record<SegmentKey | 'Cancelled' | 'Rejected', number>;
  search: string;
  setSearch: (s: string) => void;
  service: string;
  setService: (s: string) => void;
  dateRange: { from?: string; to?: string };
  setDateRange: (r: { from?: string; to?: string }) => void;
  onViewCancelled: () => void;
}

const SEGMENTS: SegmentKey[] = ['All', 'Pending', 'In Progress', 'Awaiting Verify', 'Verified'];

export default function JobsFilterBar({
  segment, setSegment, counts,
  search, setSearch, service, setService,
  dateRange, setDateRange, onViewCancelled,
}: Props) {
  return (
    <div style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
      {/* Segment pills + inline exception alert */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
        {SEGMENTS.map((k) => {
          const active = segment === k;
          return (
            <button
              key={k}
              onClick={() => setSegment(k)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 10px', borderRadius: 4,
                fontSize: 11, fontWeight: active ? 600 : 500,
                border: `1px solid ${active ? '#111827' : '#e5e7eb'}`,
                background: active ? '#111827' : '#fff',
                color: active ? '#fff' : '#374151',
                cursor: 'pointer',
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
                {counts[k] ?? 0}
              </span>
            </button>
          );
        })}

        {/* Inline cancelled/rejected alert — never a tab */}
        {(counts.Cancelled > 0 || counts.Rejected > 0) && (
          <button
            onClick={onViewCancelled}
            style={{
              marginLeft: 'auto',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 11, color: '#dc2626', fontWeight: 500,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} />
            {counts.Cancelled > 0 && <>{counts.Cancelled} cancelled</>}
            {counts.Cancelled > 0 && counts.Rejected > 0 && ' · '}
            {counts.Rejected > 0 && <>{counts.Rejected} rejected</>}
            <span style={{ color: '#152CFF', marginLeft: 4 }}>view →</span>
          </button>
        )}
      </div>

      {/* Single search + 2 selects. No Verification dropdown. */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px', gap: 8 }}>
        <div style={{ position: 'relative' }}>
          <Search size={12} color="#6b7280" style={{ position: 'absolute', left: 10, top: 9 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by trip, customer, vendor, or MAWB…"
            style={{
              width: '100%', padding: '6px 10px 6px 28px',
              border: '1px solid #e5e7eb', borderRadius: 4,
              fontSize: 12, background: '#fff', outline: 'none',
            }}
          />
        </div>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          style={{ padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 12, background: '#fff' }}
        >
          <option value="">Service · All</option>
          <option value="FM">FM · Trucking</option>
          <option value="CS">CS · Cargo Submission</option>
          <option value="EC">EC · Export Customs</option>
          <option value="OH">OH · Origin Handling</option>
          <option value="CR">CR · Cargo Retrieval</option>
        </select>
        <DateRangePopover value={dateRange} onChange={setDateRange} />
      </div>
    </div>
  );
}

// Helper — your page should compute these from the flatJobs array
export function buildSegmentCounts(jobs: { status: JobStatus; verificationStatus: 'Pending' | 'Verified' | 'Rejected' }[]) {
  let All = 0, Pending = 0, InProgress = 0, Awaiting = 0, Verified = 0, Cancelled = 0, Rejected = 0;
  for (const j of jobs) {
    All++;
    if (j.status === 'Cancelled') { Cancelled++; continue; }
    if (j.verificationStatus === 'Rejected') { Rejected++; Awaiting++; continue; }
    if (j.verificationStatus === 'Verified') { Verified++; continue; }
    if (j.status === 'Pending') Pending++;
    else if (j.status === 'In Progress') InProgress++;
    else if (j.status === 'Completed') Awaiting++;
  }
  return {
    All, Pending,
    'In Progress': InProgress,
    'Awaiting Verify': Awaiting,
    Verified, Cancelled, Rejected,
  } as const;
}
