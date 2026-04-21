// DELETE THIS BLOCK from JobsPage.tsx
//
// This is the existing stats bar that duplicates the segment pills.
// Phase 1 removes it entirely. The segment pills in JobsFilterBar carry counts.

{/* ----- DELETE START ----- */}
<div
  style={{
    display: 'flex', alignItems: 'center', gap: 0,
    padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
    fontSize: 11,
  }}
>
  <b style={{ color: '#111827', fontWeight: 600 }}>{counts.all} jobs</b>
  <span style={{ width: 1, height: 12, background: '#e5e7eb', margin: '0 10px' }} />
  <b style={{ color: '#9ca3af', fontWeight: 600 }}>{counts.pending} pending</b>
  <span style={{ width: 1, height: 12, background: '#e5e7eb', margin: '0 10px' }} />
  <b style={{ color: '#152CFF', fontWeight: 600 }}>{counts.inProgress} in progress</b>
  <span style={{ width: 1, height: 12, background: '#e5e7eb', margin: '0 10px' }} />
  <b style={{ color: '#a16207', fontWeight: 600 }}>{counts.completed} completed</b>
  <span style={{ width: 1, height: 12, background: '#e5e7eb', margin: '0 10px' }} />
  <b style={{ color: '#059669', fontWeight: 600 }}>{counts.verified} verified</b>
  <span style={{ width: 1, height: 12, background: '#e5e7eb', margin: '0 10px' }} />
  <b style={{ color: '#dc2626', fontWeight: 600 }}>{counts.cancelled} cancelled</b>
</div>
{/* ----- DELETE END ----- */}
