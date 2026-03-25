import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Job, JobStatus } from '../../data/mockData';
import ServiceTag from './ServiceTag';

function getBorderColor(status: JobStatus): string {
  switch (status) {
    case 'Completed': return '#a7f3d0';
    case 'Rejected': return '#fecaca';
    default: return '#e5e7eb';
  }
}

function getStatusTextColor(status: JobStatus): string {
  switch (status) {
    case 'Completed': return '#059669';
    case 'Rejected': return '#dc2626';
    default: return '#6b7280';
  }
}

function getStatusDotColor(status: JobStatus): string {
  switch (status) {
    case 'Completed': return '#059669';
    case 'Rejected': return '#dc2626';
    default: return '#9ca3af';
  }
}

interface JobCardProps {
  job: Job;
  index: number;
  tripId?: string;
  totalJobs?: number;
  onClick?: () => void;
}

export default function JobCard({ job, index, tripId, totalJobs, onClick }: JobCardProps) {
  const bc = getBorderColor(job.status);

  return (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 200,
        maxWidth: 280,
        border: `1.5px solid ${bc}`,
        borderRadius: 6,
        background: '#fff',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'box-shadow 200ms',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Body */}
      <div style={{ padding: '10px 12px' }}>
        {/* Vendor name */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#111827',
            marginBottom: 6,
            letterSpacing: '-0.2px',
            fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif",
          }}
        >
          {job.vendor.name}
        </div>

        {/* Service pills */}
        <div style={{ marginBottom: 6 }}>
          <ServiceTag service={job.service} />
        </div>

        {/* Route */}
        <div
          style={{
            fontSize: 10,
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.origin.location}
          </span>
          <ArrowRight size={10} style={{ color: '#9ca3af', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.destination.location}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '5px 12px',
          borderTop: `1.5px solid ${bc}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fafbfc',
        }}
      >
        {/* Status */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: getStatusTextColor(job.status),
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: getStatusDotColor(job.status),
            }}
          />
          {job.status}
        </div>

        {/* Detail link */}
        {tripId && (
          <Link
            to={`/trips/${tripId}/jobs/${job.id}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: 10,
              color: '#9ca3af',
              textDecoration: 'none',
            }}
          >
            J{String(index + 1).padStart(2, '0')} →
          </Link>
        )}
      </div>
    </div>
  );
}
