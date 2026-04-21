import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Plus, Check, X } from 'lucide-react';
import { useLocations, generateLocationId } from '../../context/LocationContext';
import { useZones } from '@shared/ZoneContext';
import { useToast } from '@shared/Toast';
import type { LocationType } from '@shared/mockData';

const LOCATION_TYPES: LocationType[] = ['warehouse', 'airport', 'port', 'checkpoint', 'hub'];
const TYPE_LABEL: Record<LocationType, string> = { warehouse: 'Warehouse', airport: 'Airport', port: 'Port', checkpoint: 'Checkpoint', hub: 'Hub' };

interface LocationDropdownProps {
  value: string | undefined;
  onChange: (locationId: string) => void;
  placeholder?: string;
  excludeId?: string;
}

export default function LocationDropdown({ value, onChange, placeholder = 'Select location...', excludeId }: LocationDropdownProps) {
  const { locations, getLocationsGroupedByZone, getLocationById, addLocation } = useLocations();
  const { zones } = useZones();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newZoneId, setNewZoneId] = useState('');
  const [newType, setNewType] = useState<LocationType>('warehouse');
  const [addError, setAddError] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const selected = value ? getLocationById(value) : undefined;

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowAddForm(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when opening
  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  // Focus name input when showing add form
  useEffect(() => {
    if (showAddForm && nameRef.current) nameRef.current.focus();
  }, [showAddForm]);

  // Build flat list for keyboard nav
  const grouped = getLocationsGroupedByZone(zones);
  const flatOptions: { id: string; name: string; zone: string; type: LocationType }[] = [];
  for (const [zone, locs] of grouped) {
    for (const loc of locs) {
      if (excludeId && loc.id === excludeId) continue;
      if (search && !loc.name.toLowerCase().includes(search.toLowerCase()) && !zone.toLowerCase().includes(search.toLowerCase())) continue;
      flatOptions.push({ id: loc.id, name: loc.name, zone, type: loc.type });
    }
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); }
      return;
    }
    if (e.key === 'Escape') { setOpen(false); setShowAddForm(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex((i) => Math.min(i + 1, flatOptions.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < flatOptions.length) {
      e.preventDefault();
      onChange(flatOptions[focusedIndex].id);
      setOpen(false);
      setSearch('');
      setFocusedIndex(-1);
    }
  }, [open, focusedIndex, flatOptions, onChange]);

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
    setSearch('');
    setFocusedIndex(-1);
  }

  function handleAddLocation() {
    setAddError('');
    if (!newName.trim()) { setAddError('Name is required'); return; }
    if (!newZoneId) { setAddError('Zone is required'); return; }
    const dup = locations.find((l) => l.name.toLowerCase() === newName.trim().toLowerCase() && l.zoneId === newZoneId);
    if (dup) {
      const zoneName = zones.find((z) => z.id === newZoneId)?.name ?? newZoneId;
      setAddError(`"${newName}" already exists in ${zoneName}`);
      return;
    }

    const id = generateLocationId();
    const code = newName.trim().substring(0, 6).toUpperCase().replace(/\s/g, '-');
    addLocation({ id, name: newName.trim(), code, type: newType, zoneId: newZoneId });
    toast.success(`Location added: ${newName.trim()}`);
    onChange(id); // Auto-select
    setNewName(''); setNewZoneId(''); setNewType('warehouse');
    setShowAddForm(false);
    setOpen(false);
  }

  // Group filtered options by zone
  const filteredGrouped = new Map<string, typeof flatOptions>();
  for (const opt of flatOptions) {
    const group = filteredGrouped.get(opt.zone) ?? [];
    group.push(opt);
    filteredGrouped.set(opt.zone, group);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }} onKeyDown={handleKeyDown}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { if (!showAddForm) setOpen(!open); }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '5px 8px', border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff',
          fontSize: 11, color: selected ? '#111827' : '#9ca3af', cursor: 'pointer', textAlign: 'left',
          outline: 'none',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown size={12} style={{ flexShrink: 0, color: '#9ca3af' }} />
      </button>

      {/* Inline add form (replaces dropdown when active) */}
      {showAddForm && (
        <div style={{ marginTop: 4, padding: 8, border: '1px solid #e5e7eb', borderRadius: 4, background: 'rgba(21,44,255,0.04)' }}>
          <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#152CFF', marginBottom: 6 }}>Add new location</div>
          <input ref={nameRef} type="text" placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ width: '100%', fontSize: 11, padding: '4px 6px', border: '1px solid #e5e7eb', borderRadius: 4, marginBottom: 4, outline: 'none' }} />
          {addError && <div style={{ fontSize: 10, color: '#dc2626', marginBottom: 4 }}>{addError}</div>}
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            <select value={newZoneId} onChange={(e) => setNewZoneId(e.target.value)} style={{ flex: 1, fontSize: 11, padding: '4px 6px', border: '1px solid #e5e7eb', borderRadius: 4, outline: 'none' }}>
              <option value="">Select zone…</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
            <select value={newType} onChange={(e) => setNewType(e.target.value as LocationType)} style={{ flex: 1, fontSize: 11, padding: '4px 6px', border: '1px solid #e5e7eb', borderRadius: 4, outline: 'none' }}>
              {LOCATION_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={handleAddLocation} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '4px 8px', borderRadius: 4, border: 'none', background: '#152CFF', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}><Check size={10} /> Add</button>
            <button onClick={() => { setShowAddForm(false); setAddError(''); setNewZoneId(''); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '4px 8px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}><X size={10} /> Cancel</button>
          </div>
        </div>
      )}

      {/* Dropdown panel */}
      {open && !showAddForm && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 2, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 50, maxHeight: 280, overflowY: 'auto' }}>
          {/* Search */}
          <div style={{ padding: '6px 8px', borderBottom: '1px solid #f3f4f6' }}>
            <input ref={searchRef} type="text" placeholder="Search locations..." value={search} onChange={(e) => { setSearch(e.target.value); setFocusedIndex(-1); }} style={{ width: '100%', fontSize: 11, padding: '4px 6px', border: '1px solid #e5e7eb', borderRadius: 4, outline: 'none' }} />
          </div>

          {/* Grouped options */}
          {Array.from(filteredGrouped.entries()).map(([zone, options]) => (
            <div key={zone}>
              <div style={{ padding: '6px 8px 2px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>{zone}</div>
              {options.map((opt) => {
                const globalIdx = flatOptions.indexOf(opt);
                const isFocused = globalIdx === focusedIndex;
                const isSelected = opt.id === value;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    style={{
                      padding: '5px 8px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: isFocused ? '#f9fafb' : isSelected ? 'rgba(21,44,255,0.04)' : 'transparent',
                      color: isSelected ? '#152CFF' : '#374151', fontWeight: isSelected ? 600 : 400,
                    }}
                    onMouseEnter={() => setFocusedIndex(globalIdx)}
                  >
                    <span>{opt.name}</span>
                    <span style={{ padding: '1px 5px', borderRadius: 4, fontSize: 8, fontWeight: 600, color: '#9ca3af', background: '#f3f4f6' }}>{TYPE_LABEL[opt.type]}</span>
                  </div>
                );
              })}
            </div>
          ))}

          {flatOptions.length === 0 && (
            <div style={{ padding: '12px 8px', textAlign: 'center', fontSize: 11, color: '#9ca3af' }}>No locations found</div>
          )}

          {/* Add new */}
          <div style={{ borderTop: '1px solid #f3f4f6', padding: '6px 8px' }}>
            <button onClick={() => { setShowAddForm(true); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%', padding: '4px 0', border: 'none', background: 'none', color: '#152CFF', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={12} /> Add new location
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
