import { Ship, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { useTrips } from '../../context/TripContext';

export default function DashboardCards() {
  const { trips } = useTrips();

  const totalTrips = trips.length;
  const allJobs = trips.flatMap((t) => t.jobs);
  const totalJobs = allJobs.length;
  const active = allJobs.filter((j) => j.status === 'In Progress').length;
  const completed = allJobs.filter((j) => j.status === 'Completed').length;
  const pending = allJobs.filter((j) => j.status === 'Pending').length;
  const completionRate = totalJobs > 0 ? Math.round((completed / totalJobs) * 100) : 0;

  const cards = [
    {
      label: 'Delivery Orders',
      value: totalTrips,
      sub: `${totalJobs} jobs total`,
      icon: Ship,
      color: 'var(--color-accent)',
      bg: 'var(--color-accent-soft)',
      borderColor: 'rgba(13, 148, 136, 0.15)',
    },
    {
      label: 'Active Jobs',
      value: active,
      sub: 'in progress now',
      icon: TrendingUp,
      color: 'var(--color-status-active)',
      bg: 'var(--color-status-active-bg)',
      borderColor: 'var(--color-status-active-border)',
    },
    {
      label: 'Completed',
      value: completed,
      sub: `${completionRate}% completion`,
      icon: CheckCircle2,
      color: 'var(--color-status-completed)',
      bg: 'var(--color-status-completed-bg)',
      borderColor: 'var(--color-status-completed-border)',
    },
    {
      label: 'Pending',
      value: pending,
      sub: 'awaiting action',
      icon: Clock,
      color: 'var(--color-status-pending)',
      bg: 'var(--color-status-pending-bg)',
      borderColor: 'var(--color-status-pending-border)',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {cards.map(({ label, value, sub, icon: Icon, color, bg, borderColor }) => (
        <div
          key={label}
          className="bg-white rounded-2xl border border-[var(--color-border)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
              style={{ background: bg, border: `1px solid ${borderColor}` }}
            >
              <Icon size={20} style={{ color }} strokeWidth={2} />
            </div>
          </div>

          <div
            className="text-[32px] font-bold leading-none tracking-[-1px] mb-1.5"
            style={{ fontFamily: "'Instrument Sans', system-ui", color }}
          >
            {value}
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className="text-[12px] font-semibold text-[var(--color-ink-secondary)] tracking-[-0.1px]"
              style={{ fontFamily: "'Instrument Sans', system-ui" }}
            >
              {label}
            </span>
            <span className="text-[11px] text-[var(--color-ink-muted)]">{sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
