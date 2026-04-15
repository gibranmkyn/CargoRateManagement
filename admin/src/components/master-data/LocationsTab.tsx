import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, MapPin } from 'lucide-react';
import { useLocations, generateLocationId } from '../../context/LocationContext';
import { useToast } from '@shared/Toast';
import type { Location, LocationType } from '@shared/mockData';
import DistrictSearchDropdown from '../shared/DistrictSearchDropdown';

const LOCATION_TYPES: LocationType[] = ['warehouse', 'airport', 'port', 'checkpoint', 'hub'];
const TYPE_LABEL: Record<LocationType, string> = { warehouse: 'Warehouse', airport: 'Airport', port: 'Port', checkpoint: 'Checkpoint', hub: 'Hub' };

const th: React.CSSProperties = { textAlign: 'left', padding: '6px 12px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' };
const td: React.CSSProperties = { padding: '8px 12px', fontSize: 11, color: '#374151', borderBottom: '1px solid #f3f4f6' };
const typeBadge = (_type: LocationType): React.CSSProperties => ({ padding: '1px 5px', borderRadius: 4, fontSize: 9, fontWeight: 600, color: '#6b7280', background: '#f3f4f6', border: '1px solid #e5e7eb' });

// Blank state for both add and edit forms
const blankForm = () => ({ name: '', code: '', type: 'warehouse' as LocationType, zone: '', district: '', districtCode: '', city: '' });

export default function LocationsTab() {
  const { locations, addLocation, updateLocation, deleteLocation } = useLocations();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addError, setAddError] = useState('');

  // Shared form state (used for both add and edit via derived state)
  const [addForm, setAddForm] = useState(blankForm());
  const [editForm, setEditForm] = useState(blankForm());

  const filtered = locations.filter((l) => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && l.type !== typeFilter) return false;
    return true;
  });

  const inputStyle: React.CSSProperties = { fontSize: 11, padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 4, outline: 'none' };

  function handleAdd() {
    setAddError('');
    if (!addForm.name.trim()) { setAddError('Name is required'); return; }
    if (!addForm.district.trim()) { setAddError('District is required'); return; }
    const duplicate = locations.find((l) => l.name.toLowerCase() === addForm.name.trim().toLowerCase());
    if (duplicate) { setAddError(`"${addForm.name}" already exists`); return; }
    const code = addForm.code.trim() || addForm.name.trim().substring(0, 8).toUpperCase().replace(/[\s,]/g, '-');
    addLocation({
      id: generateLocationId(),
      name: addForm.name.trim(),
      code,
      zone: addForm.zone.trim() || addForm.city || '',
      type: addForm.type,
      district: addForm.district,
      districtCode: addForm.districtCode,
      city: addForm.city,
    });
    toast.success(`Added: ${addForm.name.trim()}`);
    setAddForm(blankForm());
    setShowAddForm(false);
  }

  function startEdit(loc: Location) {
    setEditingId(loc.id);
    setEditForm({
      name: loc.name,
      code: loc.code,
      type: loc.type,
      zone: loc.zone ?? '',
      district: loc.district ?? '',
      districtCode: loc.districtCode ?? '',
      city: loc.city ?? '',
    });
  }

  function handleSaveEdit() {
    if (!editingId || !editForm.name.trim()) return;
    updateLocation(editingId, {
      name: editForm.name.trim(),
      code: editForm.code.trim(),
      type: editForm.type,
      zone: editForm.zone.trim() || editForm.city || '',
      district: editForm.district,
      districtCode: editForm.districtCode,
      city: editForm.city,
    });
    toast.success(`Updated: ${editForm.name.trim()}`);
    setEditingId(null);
  }

  function handleDelete(loc: Location) {
    deleteLocation(loc.id);
    toast.success(`Deleted: ${loc.name}`);
  }

  // Shared inline add-row for the table
  function AddRow() {
    return (
      <tr style={{ background: 'rgba(21,44,255,0.03)', borderTop: '2px solid rgba(21,44,255,0.12)' }}>
        {/* Name */}
        <td style={td}>
          <input
            autoFocus
            type="text"
            placeholder="Location name *"
            value={addForm.name}
            onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            style={{ ...inputStyle, width: '100%' }}
          />
          {addError && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>{addError}</div>}
        </td>
        {/* Short Code */}
        <td style={td}>
          <input
            type="text"
            placeholder={addForm.name ? addForm.name.substring(0, 8).toUpperCase().replace(/[\s,]/g, '-') : 'Auto'}
            value={addForm.code}
            onChange={(e) => setAddForm((f) => ({ ...f, code: e.target.value }))}
            style={{ ...inputStyle, width: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}
          />
        </td>
        {/* Type */}
        <td style={td}>
          <select
            value={addForm.type}
            onChange={(e) => setAddForm((f) => ({ ...f, type: e.target.value as LocationType }))}
            style={{ ...inputStyle, width: '100%' }}
          >
            {LOCATION_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        </td>
        {/* District — search dropdown, auto-fills code + city + zone */}
        <td style={{ ...td, position: 'relative' }}>
          <DistrictSearchDropdown
            value={addForm.district}
            onSelect={({ district, districtCode, city, zone }) =>
              setAddForm((f) => ({ ...f, district, districtCode, city, zone: f.zone || zone }))
            }
            placeholder="Type Shenzhen, 宝安, or 440306…"
          />
          {addForm.districtCode && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#9ca3af', marginTop: 2 }}>
              {addForm.districtCode}
            </div>
          )}
        </td>
        {/* City (read-only, auto-filled) */}
        <td style={{ ...td, color: addForm.city ? '#374151' : '#9ca3af', fontStyle: addForm.city ? 'normal' : 'italic' }}>
          {addForm.city || 'auto'}
        </td>
        {/* Zone (auto-filled from city, manually overrideable) */}
        <td style={td}>
          <input
            type="text"
            placeholder={addForm.city || 'Zone'}
            value={addForm.zone}
            onChange={(e) => setAddForm((f) => ({ ...f, zone: e.target.value }))}
            style={{ ...inputStyle, width: '100%', color: addForm.zone ? '#374151' : '#9ca3af' }}
          />
        </td>
        {/* Actions */}
        <td style={{ ...td, textAlign: 'center', whiteSpace: 'nowrap' }}>
          <button onClick={handleAdd} title="Save" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#059669', padding: 2 }}><Check size={14} /></button>
          <button
            onClick={() => { setShowAddForm(false); setAddForm(blankForm()); setAddError(''); }}
            title="Cancel"
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', padding: 2, marginLeft: 4 }}
          ><X size={14} /></button>
        </td>
      </tr>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', marginBottom: 12 }}>
        <label style={{ fontSize: 11, color: '#9ca3af' }}>Type</label>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ ...inputStyle, minWidth: 100 }}>
          <option value="">All types</option>
          {LOCATION_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
        <input
          type="text"
          placeholder="Search name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, minWidth: 160, marginLeft: 8 }}
        />
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => { setShowAddForm(true); setAddError(''); setAddForm(blankForm()); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 6, border: 'none', background: '#152CFF', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={12} /> Add Facility
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
        <strong style={{ color: '#111827' }}>{locations.length}</strong> facilities
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: 6 }}>
        <thead>
          <tr>
            <th style={th}>Name</th>
            <th style={{ ...th, width: 90 }}>Short Code</th>
            <th style={{ ...th, width: 90 }}>Type</th>
            <th style={{ ...th, width: 180 }}>District</th>
            <th style={{ ...th, width: 90 }}>City</th>
            <th style={{ ...th, width: 90 }}>Zone</th>
            <th style={{ ...th, width: 70, textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Inline add form row */}
          {showAddForm && <AddRow />}

          {/* Data rows */}
          {filtered.map((loc) => {
            const isEditing = editingId === loc.id;
            return (
              <tr
                key={loc.id}
                onMouseEnter={(e) => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
                onMouseLeave={(e) => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = ''; }}
              >
                {/* Name */}
                <td style={{ ...td, fontWeight: isEditing ? 400 : 600, color: '#111827' }}>
                  {isEditing
                    ? <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} style={{ ...inputStyle, width: '100%', fontWeight: 600 }} />
                    : loc.name
                  }
                </td>
                {/* Short Code */}
                <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#9ca3af' }}>
                  {isEditing
                    ? <input type="text" value={editForm.code} onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))} style={{ ...inputStyle, width: '100%' }} />
                    : loc.code
                  }
                </td>
                {/* Type */}
                <td style={td}>
                  {isEditing
                    ? <select value={editForm.type} onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value as LocationType }))} style={{ ...inputStyle, width: '100%' }}>
                        {LOCATION_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                      </select>
                    : <span style={typeBadge(loc.type)}>{TYPE_LABEL[loc.type]}</span>
                  }
                </td>
                {/* District */}
                <td style={{ ...td, position: 'relative' }}>
                  {isEditing ? (
                    <>
                      <DistrictSearchDropdown
                        value={editForm.district}
                        onSelect={({ district, districtCode, city, zone }) =>
                          setEditForm((f) => ({ ...f, district, districtCode, city, zone: f.zone || zone }))
                        }
                        placeholder="Type Shenzhen, 宝安, or 440306…"
                      />
                      {editForm.districtCode && (
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#9ca3af', marginTop: 2 }}>
                          {editForm.districtCode}
                        </div>
                      )}
                    </>
                  ) : (
                    <span>
                      {loc.district || <span style={{ color: '#d1d5db' }}>—</span>}
                      {loc.districtCode && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#d1d5db', marginLeft: 5 }}>
                          {loc.districtCode}
                        </span>
                      )}
                    </span>
                  )}
                </td>
                {/* City */}
                <td style={{ ...td, color: '#6b7280' }}>
                  {isEditing
                    ? <span style={{ fontSize: 11, color: editForm.city ? '#374151' : '#9ca3af', fontStyle: editForm.city ? 'normal' : 'italic' }}>{editForm.city || 'auto'}</span>
                    : (loc.city || <span style={{ color: '#d1d5db' }}>—</span>)
                  }
                </td>
                {/* Zone */}
                <td style={{ ...td, color: '#6b7280' }}>
                  {isEditing
                    ? <input
                        type="text"
                        value={editForm.zone}
                        placeholder={editForm.city || 'Zone'}
                        onChange={(e) => setEditForm((f) => ({ ...f, zone: e.target.value }))}
                        style={{ ...inputStyle, width: '100%' }}
                      />
                    : (loc.zone || <span style={{ color: '#d1d5db' }}>—</span>)
                  }
                </td>
                {/* Actions */}
                <td style={{ ...td, textAlign: 'center', whiteSpace: 'nowrap' }}>
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
                <MapPin size={20} style={{ color: '#152CFF', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                  {locations.length === 0 ? 'No facilities yet' : 'No facilities match filters'}
                </div>
                <div style={{ fontSize: 11, marginBottom: 12 }}>
                  {locations.length === 0 ? 'Add warehouses, airports, ports, and checkpoints' : 'Try adjusting your filters'}
                </div>
                {locations.length === 0 && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 6, border: 'none', background: '#152CFF', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Plus size={12} /> Add Facility
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
