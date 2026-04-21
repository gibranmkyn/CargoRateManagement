import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Globe } from 'lucide-react';
import { useZones, generateZoneId } from '@shared/ZoneContext';
import { useLocations } from '../../context/LocationContext';
import { useToast } from '@shared/Toast';
import type { Zone } from '@shared/types';

const th: React.CSSProperties = { textAlign: 'left', padding: '6px 12px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' };
const td: React.CSSProperties = { padding: '8px 12px', fontSize: 11, color: '#374151', borderBottom: '1px solid #f3f4f6' };

const blankForm = () => ({ name: '', code: '' });

function autoCode(name: string): string {
  return name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
}

export default function ZonesTab() {
  const { zones, addZone, updateZone, deleteZone } = useZones();
  const { locations } = useLocations();
  const toast = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addError, setAddError] = useState('');

  const [addForm, setAddForm] = useState(blankForm());
  const [editForm, setEditForm] = useState(blankForm());

  const inputStyle: React.CSSProperties = { fontSize: 11, padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 4, outline: 'none' };

  function facilityCount(zoneId: string): number {
    return locations.filter((l) => l.zoneId === zoneId).length;
  }

  function handleAdd() {
    setAddError('');
    if (!addForm.name.trim()) { setAddError('Name is required'); return; }
    const duplicate = zones.find((z) => z.name.toLowerCase() === addForm.name.trim().toLowerCase());
    if (duplicate) {
      toast.error(`"${addForm.name.trim()}" already exists`);
      setAddError(`"${addForm.name.trim()}" already exists`);
      return;
    }
    const code = addForm.code.trim() || autoCode(addForm.name.trim());
    addZone({ id: generateZoneId(), name: addForm.name.trim(), code });
    toast.success(`Added: ${addForm.name.trim()}`);
    setAddForm(blankForm());
    setShowAddForm(false);
  }

  function startEdit(zone: Zone) {
    setEditingId(zone.id);
    setEditForm({ name: zone.name, code: zone.code });
  }

  function handleSaveEdit() {
    if (!editingId || !editForm.name.trim()) return;
    updateZone(editingId, { name: editForm.name.trim(), code: editForm.code.trim() });
    toast.success(`Updated: ${editForm.name.trim()}`);
    setEditingId(null);
  }

  function handleDelete(zone: Zone) {
    const count = facilityCount(zone.id);
    if (count > 0) {
      toast.error(`Cannot delete — ${count} ${count === 1 ? 'facility uses' : 'facilities use'} this zone`);
      return;
    }
    deleteZone(zone.id);
    toast.success(`Deleted: ${zone.name}`);
  }

  function AddRow() {
    return (
      <tr style={{ background: 'rgba(21,44,255,0.03)', borderTop: '2px solid rgba(21,44,255,0.12)' }}>
        {/* Name */}
        <td style={td}>
          <input
            autoFocus
            type="text"
            placeholder="Zone name *"
            value={addForm.name}
            onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            onBlur={(e) => {
              if (e.target.value && !addForm.code) {
                setAddForm((f) => ({ ...f, code: autoCode(e.target.value) }));
              }
            }}
            style={{ ...inputStyle, width: '100%' }}
          />
          {addError && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>{addError}</div>}
        </td>
        {/* Code */}
        <td style={td}>
          <input
            type="text"
            placeholder={addForm.name ? autoCode(addForm.name) : 'Auto'}
            value={addForm.code}
            onChange={(e) => setAddForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            style={{ ...inputStyle, width: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}
          />
        </td>
        {/* # Facilities — empty for new row */}
        <td style={{ ...td, color: '#9ca3af' }}>—</td>
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
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#6b7280' }}>
          <strong style={{ color: '#111827' }}>{zones.length}</strong> zones
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => { setShowAddForm(true); setAddError(''); setAddForm(blankForm()); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 6, border: 'none', background: '#152CFF', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={12} /> Add Zone
          </button>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: 6 }}>
        <thead>
          <tr>
            <th style={th}>Name</th>
            <th style={{ ...th, width: 90 }}>Code</th>
            <th style={{ ...th, width: 100 }}># Facilities</th>
            <th style={{ ...th, width: 70, textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Inline add form row */}
          {showAddForm && <AddRow />}

          {/* Data rows */}
          {zones.map((zone) => {
            const isEditing = editingId === zone.id;
            const count = facilityCount(zone.id);
            return (
              <tr
                key={zone.id}
                onMouseEnter={(e) => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
                onMouseLeave={(e) => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = ''; }}
              >
                {/* Name */}
                <td style={{ ...td, fontWeight: isEditing ? 400 : 600, color: '#111827' }}>
                  {isEditing
                    ? <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} style={{ ...inputStyle, width: '100%', fontWeight: 600 }} />
                    : zone.name
                  }
                </td>
                {/* Code */}
                <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#9ca3af' }}>
                  {isEditing
                    ? <input type="text" value={editForm.code} onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} style={{ ...inputStyle, width: '100%' }} />
                    : zone.code
                  }
                </td>
                {/* # Facilities */}
                <td style={{ ...td, color: count > 0 ? '#374151' : '#d1d5db' }}>
                  {count > 0 ? count : '—'}
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
                      <button onClick={() => startEdit(zone)} title="Edit" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}><Pencil size={12} /></button>
                      <button onClick={() => handleDelete(zone)} title="Delete" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2, marginLeft: 4 }}><Trash2 size={12} /></button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}

          {/* Empty state */}
          {zones.length === 0 && !showAddForm && (
            <tr>
              <td colSpan={4} style={{ padding: '48px 16px', textAlign: 'center', color: '#9ca3af' }}>
                <Globe size={20} style={{ color: '#152CFF', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>No zones yet</div>
                <div style={{ fontSize: 11, marginBottom: 12 }}>Add zones to group facilities for reporting and rate lookups</div>
                <button
                  onClick={() => setShowAddForm(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 6, border: 'none', background: '#152CFF', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Plus size={12} /> Add Zone
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
