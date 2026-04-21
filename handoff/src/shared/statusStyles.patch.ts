// statusStyles.patch.ts — additive patch for @shared/statusStyles
//
// ADD this to your existing @shared/statusStyles.ts file.
// Keep the existing `getStatusChipStyle` / `getVerificationChipStyle` /
// `STATUS_LABELS` / `VERIFICATION_LABELS` exports — the vendor-facing
// MyJobsPage + JobDetailPage still consume them until that audit ships.

import type { Job, JobStatus, VerificationStatus } from '@shared/types';

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
  return { label: 'Pending', dot: '#d1d5db', color: '#6b7280', fontWeight: 400 as 500, tone: 'neutral' };
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
