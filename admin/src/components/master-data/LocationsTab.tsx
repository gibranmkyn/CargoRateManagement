import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, MapPin } from 'lucide-react';
import { useRates, generateLocationId } from '../../context/RateContext';
import { useTrips } from '@shared/TripContext';
import { useToast } from '@shared/Toast';
import type { Location, LocationType } from '@shared/mockData';

const LOCATION_TYPES: LocationType[] = ['warehouse', 'airport', 'port', 'checkpoint', 'hub'];
const TYPE_LABEL: Record<LocationType, string> = { warehouse: 'Warehouse', airport: 'Airport', port: 'Port', checkpoint: 'Checkpoint', hub: 'Hub' };

const th: React.CSSProperties = { textAlign: 'left', padding: '6px 12px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' };
const td: React.CSSProperties = { padding: '8px 12px', fontSize: 11, color: '#374151', borderBottom: '1px solid #f3f4f6' };
const typeBadge = (type: LocationType): React.CSSProperties => ({ padding: '1px 5px', borderRadius: 4, fontSize: 9, fontWeight: 600, color: '#6b7280', background: '#f3f4f6', border: '1px solid #e5e7eb' });

export default function LocationsTab() {
  const { locations, rates, addLocation, updateLocation, deleteLocation } = useRates();
  const { trips } = useTrips();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newZone, setNewZone] = useState('');
  const [newType, setNewType] = useState<LocationType>('warehouse');
  const [addError, setAddError] = useState('');

  // Edit state
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editZone, setEditZone] = useState('');
  const [editType, setEditType] = useState<LocationType>('warehouse');

  const zones = [...new Set(locations.map((l) => l.zone))].sort();

  // Derived counts
  function ratesLinked(locId: string): number {
    return rates.filter((r) => r.locationId === locId || r.originLocationId === locId || r.destinationLocationId === locId).length;
  }
  function jobsCount(locName: string): number {
    return trips.flatMap((t) => t.jobs).filter((j) => j.origin.location === locName || j.destination.location === locName).length;
  }

  const filtered = locations.filter((l) => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (zoneFilter && l.zone !== zoneFilter) return false;
    if (typeFilter && l.type !== typeFilter) return false;
    return true;
  });

  function handleAdd() {
    setAddError('');
    if (!newName.trim()) { setAddError('Name is required'); return; }
    if (!newZone.trim()) { setAddError('Zone is required'); return; }
    const duplicate = locations.find((l) => l.name.toLowerCase() === newName.trim().toLowerCase() && l.zone === newZone.trim());
    if (duplicate) { setAddError(`A location named "${newName}" already exists in ${newZone}`); return; }

    const code = newCode.trim() || newName.trim().substring(0, 6).toUpperCase().replace(/\s/g, '-');
    addLocation({ id: generateLocationId(), name: newName.trim(), code, zone: newZone.trim(), type: newType });
    toast.success(`Location added: ${newName.trim()}`);
    setNewName(''); setNewCode(''); setNewZone(''); setNewType('warehouse');
    setShowAddForm(false);
  }

  function startEdit(loc: Location) {
    setEditingId(loc.id);
    setEditName(loc.name);
    setEditCode(loc.code);
    setEditZone(loc.zone);
    setEditType(loc.type);
  }

  function handleSaveEdit() {
    if (!editingId || !editName.trim()) return;
    updateLocation(editingId, { name: editName.trim(), code: editCode.trim(), zone: editZone.trim(), type: editType });
    toast.success(`Location updated: ${editName.trim()}`);
    setEditingId(null);
  }

  function handleDelete(loc: Location) {
    const linked = ratesLinked(loc.id);
    if (linked > 0) { toast.error(`Cannot delete ${loc.name} — ${linked} rate(s) linked`); return; }
    deleteLocation(loc.id);
    toast.success(`Location deleted: ${loc.name}`);
  }

  const inputStyle: React.CSSProperties = { fontSize: 11, padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 4, outline: 'none' };

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', marginBottom: 12 }}>
        <label style={{ fontSize: 11, color: '#9ca3af' }}>Zone</label>
        <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} style={{ ...inputStyle, minWidth: 100 }}>
          <option value="">All zones</option>
          {zones.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
        <label style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>Type</label>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ ...inputStyle, minWidth: 100 }}>
          <option value="">All types</option>
          {LOCATION_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, minWidth: 140, marginLeft: 8 }} />
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => { setShowAddForm(true); setAddError(''); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 6, border: 'none', background: '#152CFF', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={12} /> Add Location
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
        <strong style={{ color: '#111827' }}>{locations.length}</strong> locations &middot; {zones.length} zones
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: 6 }}>
        <thead>
          <tr>
            <th style={th}>Name</th>
            <th style={{ ...th, width: 80 }}>Code</th>
            <th style={{ ...th, width: 100 }}>Zone</th>
            <th style={{ ...th, width: 90 }}>Type</th>
            <th style={{ ...th, width: 50, textAlign: 'center' }}>Rates</th>
            <th style={{ ...th, width: 50, textAlign: 'center' }}>Jobs</th>
            <th style={{ ...th, width: 70, textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Inline add form */}
          {showAddForm && (
            <tr style={{ background: 'rgba(21,44,255,0.04)' }}>
              <td style={td}>
                <input autoFocus type="text" placeholder="Location name" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                {addError && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>{addError}</div>}
              </td>
              <td style={td}><input type="text" placeholder="Auto" value={newCode} onChange={(e) => setNewCode(e.target.value)} style={{ ...inputStyle, width: '100%' }} /></td>
              <td style={td}>
                <input type="text" list="zones-list" placeholder="Zone" value={newZone} onChange={(e) => setNewZone(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                <datalist id="zones-list">{zones.map((z) => <option key={z} value={z} />)}</datalist>
              </td>
              <td style={td}>
                <select value={newType} onChange={(e) => setNewType(e.target.value as LocationType)} style={{ ...inputStyle, width: '100%' }}>
                  {LOCATION_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                </select>
              </td>
              <td style={{ ...td, textAlign: 'center' }}>—</td>
              <td style={{ ...td, textAlign: 'center' }}>—</td>
              <td style={{ ...td, textAlign: 'center' }}>
                <button onClick={handleAdd} title="Save" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#059669', padding: 2 }}><Check size={14} /></button>
                <button onClick={() => setShowAddForm(false)} title="Cancel" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', padding: 2, marginLeft: 4 }}><X size={14} /></button>
              </td>
            </tr>
          )}

          {/* Data rows */}
          {filtered.map((loc) => {
            const isEditing = editingId === loc.id;
            return (
              <tr key={loc.id} onMouseEnter={(e) => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }} onMouseLeave={(e) => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = ''; }}>
                <td style={{ ...td, fontWeight: 600, color: '#111827' }}>
                  {isEditing ? <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ ...inputStyle, width: '100%', fontWeight: 600 }} /> : loc.name}
                </td>
                <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#9ca3af' }}>
                  {isEditing ? <input type="text" value={editCode} onChange={(e) => setEditCode(e.target.value)} style={{ ...inputStyle, width: '100%' }} /> : loc.code}
                </td>
                <td style={td}>
                  {isEditing ? <input type="text" list="zones-list" value={editZone} onChange={(e) => setEditZone(e.target.value)} style={{ ...inputStyle, width: '100%' }} /> : loc.zone}
                </td>
                <td style={td}>
                  {isEditing
                    ? <select value={editType} onChange={(e) => setEditType(e.target.value as LocationType)} style={{ ...inputStyle, width: '100%' }}>{LOCATION_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select>
                    : <span style={typeBadge(loc.type)}>{TYPE_LABEL[loc.type]}</span>
                  }
                </td>
                <td style={{ ...td, textAlign: 'center', fontSize: 10, color: '#6b7280' }}>{ratesLinked(loc.id)}</td>
                <td style={{ ...td, textAlign: 'center', fontSize: 10, color: '#6b7280' }}>{jobsCount(loc.name)}</td>
                <td style={{ ...td, textAlign: 'center' }}>
                  {isEditing ? (
                    <>
                      <button onClick={handleSaveEdit} title="Save" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#059669', padding: 2 }}><Check size={13} /></button>
                      <button onClick={() => setEditingId(null)} title="Cancel" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', padding: 2, marginLeft: 4 }}><X size={13} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(loc)} title="Edit" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}><Pencil size={12} /></button>
                      <button onClick={() => handleDelete(loc)} title="Delete" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2, marginLeft: 4 }}><Trash2 size={12} /></button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}

          {/* Empty state */}
          {filtered.length === 0 && !showAddForm && (
            <tr>
              <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: '#9ca3af' }}>
                <MapPin size={20} style={{ color: '#152CFF', marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  {locations.length === 0 ? 'No locations yet' : 'No locations match filters'}
                </div>
                <div style={{ fontSize: 11, marginBottom: 12 }}>
                  {locations.length === 0 ? 'Add managed locations for rate lookups' : 'Try adjusting your filters'}
                </div>
                {locations.length === 0 && (
                  <button onClick={() => setShowAddForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 6, border: 'none', background: '#152CFF', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={12} /> Add Location
                  </button>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
