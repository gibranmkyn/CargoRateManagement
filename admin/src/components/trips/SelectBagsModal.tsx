import { useState, useMemo, useEffect } from 'react';
import { X, Search, Package } from 'lucide-react';
import { seedBagPackages } from '@shared/mockData';
import type { BagPackage } from '@shared/mockData';

interface SelectBagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bagIds: string[]) => void;
  initialSelected: string[];
  mawbHint?: string;  // pre-filter to this MAWB if provided
}

export default function SelectBagsModal({ isOpen, onClose, onConfirm, initialSelected, mawbHint }: SelectBagsModalProps) {
  const [mawbFilter, setMawbFilter] = useState(mawbHint ?? '');
  const [bagFilter, setBagFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));

  // Reset filters when opening
  useEffect(() => {
    if (isOpen) {
      setMawbFilter(mawbHint ?? '');
      setBagFilter('');
      setSelected(new Set(initialSelected));
    }
  }, [isOpen, mawbHint, initialSelected]);

  // Escape to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Available bags: unassigned or already selected by this shipment
  const availableBags = useMemo(() =>
    seedBagPackages.filter((b) => !b.assignedTripId || initialSelected.includes(b.id)),
    [initialSelected]
  );

  const filtered = useMemo(() => {
    let bags = availableBags;
    if (mawbFilter) bags = bags.filter((b) => b.mawb.includes(mawbFilter));
    if (bagFilter) bags = bags.filter((b) => b.bagNumber.toLowerCase().includes(bagFilter.toLowerCase()));
    return bags;
  }, [availableBags, mawbFilter, bagFilter]);

  // Unique MAWBs for quick-filter pills
  const uniqueMawbs = useMemo(() => [...new Set(availableBags.map((b) => b.mawb))], [availableBags]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const allFilteredIds = filtered.map((b) => b.id);
    const allSelected = allFilteredIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        allFilteredIds.forEach((id) => next.delete(id));
      } else {
        allFilteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  const selectedWeight = useMemo(() =>
    seedBagPackages.filter((b) => selected.has(b.id)).reduce((sum, b) => sum + b.weightKg, 0),
    [selected]
  );

  if (!isOpen) return null;

  const allFilteredSelected = filtered.length > 0 && filtered.every((b) => selected.has(b));
  const someFilteredSelected = filtered.some((b) => selected.has(b.id));

  const th: React.CSSProperties = { padding: '6px 10px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', textAlign: 'left', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '6px 10px', fontSize: 11, color: '#374151', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap' };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 50 }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 920, maxHeight: '80vh', background: '#fff', borderRadius: 6,
        border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        zIndex: 51, display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={14} style={{ color: '#152CFF' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Select Bags</span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{availableBags.length} available</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}><X size={16} /></button>
        </div>

        {/* Filters */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 200 }}>
            <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text" value={mawbFilter} onChange={(e) => setMawbFilter(e.target.value)}
              placeholder="Filter MAWB..."
              style={{ width: '100%', padding: '5px 8px 5px 26px', fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 4, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
          <div style={{ position: 'relative', flex: 1, maxWidth: 220 }}>
            <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text" value={bagFilter} onChange={(e) => setBagFilter(e.target.value)}
              placeholder="Filter bag number..."
              style={{ width: '100%', padding: '5px 8px 5px 26px', fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 4, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
            {uniqueMawbs.map((m) => (
              <button key={m} type="button" onClick={() => setMawbFilter(mawbFilter === m ? '' : m)} style={{
                padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                border: mawbFilter === m ? '1px solid #152CFF' : '1px solid #e5e7eb',
                background: mawbFilter === m ? 'rgba(21,44,255,0.06)' : '#fff',
                color: mawbFilter === m ? '#152CFF' : '#6b7280',
              }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1 }}>
              <tr>
                <th style={{ ...th, width: 36, textAlign: 'center' }}>
                  <input type="checkbox" checked={allFilteredSelected} ref={(el) => { if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected; }} onChange={toggleAll} style={{ cursor: 'pointer' }} />
                </th>
                <th style={th}>MAWB Number</th>
                <th style={th}>Bag Number</th>
                <th style={th}>Latest Location</th>
                <th style={th}>Pickup Date</th>
                <th style={th}>Origin</th>
                <th style={th}>Destination</th>
                <th style={{ ...th, textAlign: 'right' }}>Weight (kg)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ ...td, textAlign: 'center', padding: 24, color: '#9ca3af' }}>No bags match filters</td></tr>
              ) : (
                filtered.map((bag) => {
                  const isSelected = selected.has(bag.id);
                  return (
                    <tr
                      key={bag.id}
                      onClick={() => toggle(bag.id)}
                      style={{ cursor: 'pointer', background: isSelected ? 'rgba(21,44,255,0.03)' : undefined }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f9fafb'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'rgba(21,44,255,0.03)' : ''; }}
                    >
                      <td style={{ ...td, textAlign: 'center' }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggle(bag.id)} style={{ cursor: 'pointer' }} />
                      </td>
                      <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{bag.mawb}</td>
                      <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{bag.bagNumber}</td>
                      <td style={td}>{bag.latestLocation}</td>
                      <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{bag.pickupDate}</td>
                      <td style={td}>{bag.origin}</td>
                      <td style={{ ...td, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{bag.destination}</td>
                      <td style={{ ...td, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{bag.weightKg.toFixed(1)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb' }}>
          <div style={{ fontSize: 11, color: '#374151' }}>
            {selected.size > 0 ? (
              <>
                <span style={{ fontWeight: 700, color: '#152CFF' }}>{selected.size} bag{selected.size !== 1 ? 's' : ''}</span>
                <span style={{ color: '#9ca3af' }}> selected · </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{selectedWeight.toFixed(1)} kg</span>
              </>
            ) : (
              <span style={{ color: '#9ca3af' }}>Click rows to select bags</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={onClose} style={{ padding: '5px 12px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#fff', color: '#374151', border: '1px solid #e5e7eb', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button type="button" onClick={() => { onConfirm([...selected]); onClose(); }} style={{ padding: '5px 12px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#152CFF', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Done{selected.size > 0 ? ` (${selected.size})` : ''}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
