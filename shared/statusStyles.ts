import type { Job, JobStatus, VerificationStatus, Trip, TripStatus } from './types';
import { deriveTripStatus, deriveTripVerification, tripHasRejectedJob } from './types';

// -- Single-signal state styling (HMW-SLOP) --

export type StateTone = 'neutral' | 'attention' | 'success' | 'danger';

export interface StateStyle {
  /** Display label, eg "Awaiting verify" */
  label: string;
  /** 6px dot color */
  dot: string;
  /** Primary text color */
  color: string;
  /** 500 for in-flight, 600 for terminal/attention */
  fontWeight: 500 | 600;
  /** Semantic tone — useful for row-level grouping / sorting */
  tone: StateTone;
  /** Optional rejection / cancellation reason to render on line 2 */
  subline?: string;
}

/** Derive a single State style from a job's status + verificationStatus.
 *
 *  Rules (in order):
 *   1. Cancelled  → red + cancelReason
 *   2. Rejected   → red + rejectionReason (stays loud until re-completed)
 *   3. Verified   → green terminal
 *   4. Completed (+ Pending verif) → amber dot, attention
 *   5. In Progress → ink text + blue dot
 *   6. Pending    → muted
 */
export function getStateStyle(job: Pick<Job, 'status' | 'verificationStatus' | 'cancelReason' | 'rejectionReason'>): StateStyle {
  const { status, verificationStatus: v, cancelReason, rejectionReason } = job;

  if (status === 'Cancelled') {
    return { label: 'Cancelled', dot: '#dc2626', color: '#dc2626', fontWeight: 600, tone: 'danger', subline: cancelReason };
  }
  if (v === 'Rejected') {
    return { label: 'Verify rejected', dot: '#dc2626', color: '#dc2626', fontWeight: 600, tone: 'danger', subline: rejectionReason };
  }
  if (v === 'Verified') {
    return { label: 'Verified', dot: '#059669', color: '#059669', fontWeight: 600, tone: 'success' };
  }
  if (status === 'Completed') {
    return { label: 'Awaiting verify', dot: '#a16207', color: '#374151', fontWeight: 500, tone: 'attention' };
  }
  if (status === 'In Progress') {
    return { label: 'In progress', dot: '#152CFF', color: '#111827', fontWeight: 500, tone: 'neutral' };
  }
  return { label: 'Pending', dot: '#d1d5db', color: '#6b7280', fontWeight: 500, tone: 'neutral' };
}

/** Sort order for the new State column — rejected/cancelled surface first,
 *  then attention, then in-flight, then terminal success. */
export function stateSortRank(job: Pick<Job, 'status' | 'verificationStatus'>): number {
  if (job.verificationStatus === 'Rejected') return 0;
  if (job.status === 'Cancelled') return 1;
  if (job.status === 'Completed' && job.verificationStatus === 'Pending') return 2;
  if (job.status === 'In Progress') return 3;
  if (job.status === 'Pending') return 4;
  if (job.verificationStatus === 'Verified') return 5;
  return 6;
}

// -- Flattened single-dot styling for Status + Verification columns (client model) --

export interface DotStyle {
  label: string;
  dot: string;
  color: string;
  fontWeight: 500 | 600;
}

export function getJobStatusDot(status: JobStatus): DotStyle {
  switch (status) {
    case 'Pending':     return { label: 'Pending',     dot: '#d1d5db', color: '#6b7280', fontWeight: 500 };
    case 'In Progress': return { label: 'In progress', dot: '#152CFF', color: '#111827', fontWeight: 500 };
    case 'Completed':   return { label: 'Completed',   dot: '#a16207', color: '#374151', fontWeight: 500 };
    case 'Cancelled':   return { label: 'Cancelled',   dot: '#dc2626', color: '#dc2626', fontWeight: 600 };
    default:            return { label: 'Pending',     dot: '#d1d5db', color: '#6b7280', fontWeight: 500 };
  }
}

export function getVerificationDot(v: VerificationStatus): DotStyle {
  switch (v) {
    case 'Pending':  return { label: 'Pending',  dot: '#d1d5db', color: '#6b7280', fontWeight: 500 };
    case 'Verified': return { label: 'Verified', dot: '#059669', color: '#059669', fontWeight: 600 };
    case 'Rejected': return { label: 'Rejected', dot: '#dc2626', color: '#dc2626', fontWeight: 600 };
    default:         return { label: 'Pending',  dot: '#d1d5db', color: '#6b7280', fontWeight: 500 };
  }
}

export function getTripStatusDot(s: TripStatus): DotStyle {
  switch (s) {
    case 'Pending':     return { label: 'Pending',     dot: '#d1d5db', color: '#6b7280', fontWeight: 500 };
    case 'In Progress': return { label: 'In progress', dot: '#152CFF', color: '#111827', fontWeight: 500 };
    case 'Completed':   return { label: 'Completed',   dot: '#a16207', color: '#374151', fontWeight: 500 };
    default:            return { label: 'Pending',     dot: '#d1d5db', color: '#6b7280', fontWeight: 500 };
  }
}

/** Trip-level verification display — elevates Rejected when any job is rejected. */
export function getTripVerificationDisplay(trip: Trip): 'Pending' | 'Verified' | 'Rejected' {
  if (tripHasRejectedJob(trip)) return 'Rejected';
  return deriveTripVerification(trip);
}

/** True iff the trip is cancelled (all jobs cancelled, or no jobs). */
export function isTripCancelled(trip: Trip): boolean {
  return trip.jobs.length > 0 && trip.jobs.every((j) => j.status === 'Cancelled');
}

// Re-export for convenience so callers only pull from statusStyles
export { deriveTripStatus, deriveTripVerification, tripHasRejectedJob };

export function getStatusChipStyle(status: JobStatus): { bg: string; border: string; text: string; dot: string } {
  switch (status) {
    case 'Pending': return { bg: '#f9fafb', border: '#e5e7eb', text: '#9ca3af', dot: '#9ca3af' };
    case 'In Progress': return { bg: 'rgba(21,44,255,0.04)', border: 'rgba(21,44,255,0.15)', text: '#152CFF', dot: '#152CFF' };
    case 'Completed': return { bg: '#fefce8', border: '#fde68a', text: '#a16207', dot: '#a16207' };
    case 'Cancelled': return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#dc2626' };
    default: return { bg: '#f9fafb', border: '#e5e7eb', text: '#9ca3af', dot: '#9ca3af' };
  }
}

export const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  Pending: { label: 'Pending', color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' },
  'In Progress': { label: 'In Progress', color: '#152CFF', bg: 'rgba(21,44,255,0.04)', border: 'rgba(21,44,255,0.15)' },
  Completed: { label: 'Completed', color: '#a16207', bg: '#fefce8', border: '#fde68a' },
  Cancelled: { label: 'Cancelled', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

/** Text-only verification styles — no bg, no border (HMW-60 hard rule) */
export function getVerificationChipStyle(v: VerificationStatus): { color: string; dot: string } {
  switch (v) {
    case 'Pending':  return { color: '#9ca3af', dot: '#d1d5db' };
    case 'Verified': return { color: '#059669', dot: '#059669' };
    case 'Rejected': return { color: '#dc2626', dot: '#dc2626' };
    default:         return { color: '#9ca3af', dot: '#d1d5db' };
  }
}

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  Pending:  'Pending',
  Verified: 'Verified',
  Rejected: 'Rejected',
};

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Format a timestamp as a short relative string per HMW-61 conventions.
 *  <1 min → 'just now'
 *  <60 min → 'Nm ago'
 *  <24 h → 'Nh ago'
 *  <7 d → 'Nd ago'
 *  same calendar year → 'Apr 12'
 *  different year → 'Apr 12, 2025'
 *  Invalid/empty → ''
 */
export function formatRelativeTime(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso.replace(' ', 'T'));
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return '';               // future timestamp — show nothing
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr  = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr  / 24);
    if (diffSec < 60)  return 'just now';
    if (diffMin < 60)  return `${diffMin}m ago`;
    if (diffHr  < 24)  return `${diffHr}h ago`;
    if (diffDay <  7)  return `${diffDay}d ago`;
    // Older: use absolute short date
    const month = SHORT_MONTHS[d.getMonth()];
    const day   = d.getDate();
    const year  = d.getFullYear();
    if (year === now.getFullYear()) return `${month} ${day}`;
    return `${month} ${day}, ${year}`;
  } catch {
    return '';
  }
}

export function fmtDateTime(dt: string): string {
  if (!dt) return '\u2014';
  const d = new Date(dt.replace(' ', 'T'));
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' \u00b7 ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function fmtTime(dt: string): string {
  return new Date(dt.replace(' ', 'T')).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function fmtDateShort(dt: string): string {
  return new Date(dt.replace(' ', 'T')).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function parsePickupDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  return new Date(dateStr.replace(' ', 'T'));
}
