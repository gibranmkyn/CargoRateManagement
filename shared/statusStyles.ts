import type { JobStatus } from './types';

export function getStatusChipStyle(status: JobStatus): { bg: string; border: string; text: string; dot: string } {
  switch (status) {
    case 'Pending': return { bg: '#f9fafb', border: '#e5e7eb', text: '#9ca3af', dot: '#9ca3af' };
    case 'In Progress': return { bg: 'rgba(21,44,255,0.04)', border: 'rgba(21,44,255,0.15)', text: '#152CFF', dot: '#152CFF' };
    case 'Completed': return { bg: '#fefce8', border: '#fde68a', text: '#a16207', dot: '#a16207' };
    case 'Verified': return { bg: '#f0fdf4', border: '#a7f3d0', text: '#059669', dot: '#059669' };
    case 'Cancelled': return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#dc2626' };
    default: return { bg: '#f9fafb', border: '#e5e7eb', text: '#9ca3af', dot: '#9ca3af' };
  }
}

export const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  Pending: { label: 'Pending', color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' },
  'In Progress': { label: 'In Progress', color: '#152CFF', bg: 'rgba(21,44,255,0.04)', border: 'rgba(21,44,255,0.15)' },
  Completed: { label: 'Completed', color: '#a16207', bg: '#fefce8', border: '#fde68a' },
  Verified: { label: 'Verified', color: '#059669', bg: '#f0fdf4', border: '#a7f3d0' },
  Cancelled: { label: 'Cancelled', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

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
