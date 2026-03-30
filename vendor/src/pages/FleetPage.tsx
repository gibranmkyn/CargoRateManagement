import { useState, useMemo } from 'react';
import { Truck, X } from 'lucide-react';
import { seedDrivers, seedVehicles, TRUCK_TYPES } from '../../../shared/mockData';
import type { Driver, Vehicle, TruckType } from '../../../shared/mockData';
import { useVendorAuth } from '../context/VendorAuthContext';

// -- Helpers --

let _driverId = 100;
function nextDriverId(): string {
  _driverId += 1;
  return `DRV-${String(_driverId).padStart(3, '0')}`;
}

let _vehicleId = 100;
function nextVehicleId(): string {
  _vehicleId += 1;
  return `VEH-${String(_vehicleId).padStart(3, '0')}`;
}

type Tab = 'drivers' | 'vehicles';

// -- Blank form states --

interface DriverForm {
  name: string;
  phone: string;
  wechatId: string;
  defaultVehicleId: string;
}

interface VehicleForm {
  plateNumber: string;
  truckType: TruckType;
  maxKg: string;
}

const BLANK_DRIVER: DriverForm = { name: '', phone: '', wechatId: '', defaultVehicleId: '' };
const BLANK_VEHICLE: VehicleForm = { plateNumber: '', truckType: '5T', maxKg: '' };

// -- Component --

export default function FleetPage() {
  const { vendorCode } = useVendorAuth();
  const [tab, setTab] = useState<Tab>('drivers');

  // In-memory CRUD state seeded from shared mock data
  const [drivers, setDrivers] = useState<Driver[]>(() => seedDrivers.filter((d) => d.vendorCode === vendorCode));
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => seedVehicles.filter((v) => v.vendorCode === vendorCode));

  // Add-row state
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [driverForm, setDriverForm] = useState<DriverForm>({ ...BLANK_DRIVER });
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>({ ...BLANK_VEHICLE });

  // Edit-row state (id of row being edited, null if none)
  const [editDriverId, setEditDriverId] = useState<string | null>(null);
  const [editDriverForm, setEditDriverForm] = useState<DriverForm>({ ...BLANK_DRIVER });
  const [editVehicleId, setEditVehicleId] = useState<string | null>(null);
  const [editVehicleForm, setEditVehicleForm] = useState<VehicleForm>({ ...BLANK_VEHICLE });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Stats
  const stats = useMemo(() => ({
    drivers: drivers.length,
    vehicles: vehicles.length,
  }), [drivers, vehicles]);

  // Vehicle lookup for driver's default vehicle display
  const vehicleMap = useMemo(() => {
    const m = new Map<string, Vehicle>();
    vehicles.forEach((v) => m.set(v.id, v));
    return m;
  }, [vehicles]);

  // -- Driver CRUD --

  function addDriver() {
    if (!driverForm.name.trim() || !driverForm.phone.trim()) return;
    const newDriver: Driver = {
      id: nextDriverId(),
      vendorCode: vendorCode!,
      name: driverForm.name.trim(),
      phone: driverForm.phone.trim(),
      wechatId: driverForm.wechatId.trim() || undefined,
      defaultVehicleId: driverForm.defaultVehicleId || undefined,
      isActive: true,
    };
    setDrivers((prev) => [...prev, newDriver]);
    setDriverForm({ ...BLANK_DRIVER });
    setShowAddDriver(false);
  }

  function startEditDriver(d: Driver) {
    setEditDriverId(d.id);
    setEditDriverForm({
      name: d.name,
      phone: d.phone,
      wechatId: d.wechatId ?? '',
      defaultVehicleId: d.defaultVehicleId ?? '',
    });
  }

  function saveEditDriver() {
    if (!editDriverForm.name.trim() || !editDriverForm.phone.trim()) return;
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === editDriverId
          ? {
              ...d,
              name: editDriverForm.name.trim(),
              phone: editDriverForm.phone.trim(),
              wechatId: editDriverForm.wechatId.trim() || undefined,
              defaultVehicleId: editDriverForm.defaultVehicleId || undefined,
            }
          : d,
      ),
    );
    setEditDriverId(null);
  }

  function toggleDriverActive(id: string) {
    setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, isActive: !d.isActive } : d)));
  }

  function deleteDriver(id: string) {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
    setDeleteConfirm(null);
  }

  // -- Vehicle CRUD --

  function addVehicle() {
    if (!vehicleForm.plateNumber.trim()) return;
    const truckDef = TRUCK_TYPES.find((t) => t.type === vehicleForm.truckType);
    const maxKg = vehicleForm.maxKg ? Number(vehicleForm.maxKg) : truckDef?.maxKg ?? 0;
    const newVehicle: Vehicle = {
      id: nextVehicleId(),
      vendorCode: vendorCode!,
      plateNumber: vehicleForm.plateNumber.trim(),
      truckType: vehicleForm.truckType,
      maxKg,
      maxCbm: truckDef?.maxCbm ?? 0,
      isActive: true,
    };
    setVehicles((prev) => [...prev, newVehicle]);
    setVehicleForm({ ...BLANK_VEHICLE });
    setShowAddVehicle(false);
  }

  function startEditVehicle(v: Vehicle) {
    setEditVehicleId(v.id);
    setEditVehicleForm({
      plateNumber: v.plateNumber,
      truckType: v.truckType,
      maxKg: String(v.maxKg),
    });
  }

  function saveEditVehicle() {
    if (!editVehicleForm.plateNumber.trim()) return;
    const truckDef = TRUCK_TYPES.find((t) => t.type === editVehicleForm.truckType);
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === editVehicleId
          ? {
              ...v,
              plateNumber: editVehicleForm.plateNumber.trim(),
              truckType: editVehicleForm.truckType,
              maxKg: editVehicleForm.maxKg ? Number(editVehicleForm.maxKg) : truckDef?.maxKg ?? v.maxKg,
              maxCbm: truckDef?.maxCbm ?? v.maxCbm,
            }
          : v,
      ),
    );
    setEditVehicleId(null);
  }

  function toggleVehicleActive(id: string) {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, isActive: !v.isActive } : v)));
  }

  function deleteVehicle(id: string) {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    setDeleteConfirm(null);
  }

  // -- Shared styles --

  const fontUI = "'Instrument Sans', -apple-system, system-ui, sans-serif";
  const fontMono = "'JetBrains Mono', 'SF Mono', monospace";

  const th: React.CSSProperties = {
    textAlign: 'left',
    padding: '6px 12px',
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#9ca3af',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
    fontFamily: fontUI,
  };

  const td: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: 11,
    color: '#111827',
    fontFamily: fontUI,
    verticalAlign: 'middle',
  };

  const inputStyle: React.CSSProperties = {
    padding: '4px 8px',
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    fontSize: 11,
    fontFamily: fontUI,
    color: '#111827',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'auto' as React.CSSProperties['appearance'],
  };

  function statusBadge(isActive: boolean): React.CSSProperties {
    return isActive
      ? { background: '#f0fdf4', color: '#059669', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: fontUI, cursor: 'pointer', display: 'inline-block' }
      : { background: '#f9fafb', color: '#9ca3af', border: '1px solid #e5e7eb', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: fontUI, cursor: 'pointer', display: 'inline-block' };
  }

  function truckTypeBadge(): React.CSSProperties {
    return {
      background: 'rgba(21,44,255,0.06)',
      color: '#152CFF',
      border: '1px solid rgba(21,44,255,0.15)',
      padding: '2px 6px',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 600,
      fontFamily: fontMono,
      display: 'inline-block',
    };
  }

  const btnSave: React.CSSProperties = {
    padding: '3px 10px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    background: '#152CFF',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontFamily: fontUI,
  };

  const btnCancel: React.CSSProperties = {
    padding: '3px 10px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    background: '#fff',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    fontFamily: fontUI,
  };

  // -- Render --

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 20 }}>

      {/* Stats bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0', fontSize: 12, fontFamily: fontUI, color: '#6b7280', fontWeight: 600 }}>
        <span style={{ color: '#111827' }}>{stats.drivers} drivers</span>
        <span style={{ margin: '0 8px', color: '#d1d5db' }}>&middot;</span>
        <span style={{ color: '#111827' }}>{stats.vehicles} vehicles</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: 16 }}>
        {(['drivers', 'vehicles'] as Tab[]).map((t) => {
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => { setTab(t); setShowAddDriver(false); setShowAddVehicle(false); setEditDriverId(null); setEditVehicleId(null); setDeleteConfirm(null); }}
              style={{
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#111827' : '#9ca3af',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #152CFF' : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: fontUI,
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Drivers tab */}
      {tab === 'drivers' && (
        <>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: '22%' }}>Name</th>
                  <th style={{ ...th, width: '18%' }}>Phone</th>
                  <th style={{ ...th, width: '16%' }}>WeChat ID</th>
                  <th style={{ ...th, width: '18%' }}>Default Vehicle</th>
                  <th style={{ ...th, width: '12%' }}>Status</th>
                  <th style={{ ...th, width: '14%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Add row */}
                {showAddDriver && (
                  <tr style={{ background: '#fafbff' }}>
                    <td style={td}>
                      <input
                        style={inputStyle}
                        placeholder="Name"
                        value={driverForm.name}
                        onChange={(e) => setDriverForm((f) => ({ ...f, name: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addDriver()}
                        autoFocus
                      />
                    </td>
                    <td style={td}>
                      <input
                        style={{ ...inputStyle, fontFamily: fontMono }}
                        placeholder="138-0000-0000"
                        value={driverForm.phone}
                        onChange={(e) => setDriverForm((f) => ({ ...f, phone: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addDriver()}
                      />
                    </td>
                    <td style={td}>
                      <input
                        style={{ ...inputStyle, fontFamily: fontMono }}
                        placeholder="wechat_id"
                        value={driverForm.wechatId}
                        onChange={(e) => setDriverForm((f) => ({ ...f, wechatId: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addDriver()}
                      />
                    </td>
                    <td style={td}>
                      <select
                        style={selectStyle}
                        value={driverForm.defaultVehicleId}
                        onChange={(e) => setDriverForm((f) => ({ ...f, defaultVehicleId: e.target.value }))}
                      >
                        <option value="">None</option>
                        {vehicles.filter((v) => v.isActive).map((v) => (
                          <option key={v.id} value={v.id}>{v.plateNumber} ({v.truckType})</option>
                        ))}
                      </select>
                    </td>
                    <td style={td}>
                      <span style={statusBadge(true)}>Active</span>
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button onClick={addDriver} style={btnSave}>Save</button>
                        <button onClick={() => { setShowAddDriver(false); setDriverForm({ ...BLANK_DRIVER }); }} style={btnCancel}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Driver rows */}
                {drivers.length > 0 ? drivers.map((d) => {
                  const isEditing = editDriverId === d.id;
                  const veh = d.defaultVehicleId ? vehicleMap.get(d.defaultVehicleId) : null;

                  if (isEditing) {
                    return (
                      <tr key={d.id} style={{ background: '#fafbff' }}>
                        <td style={td}>
                          <input
                            style={inputStyle}
                            value={editDriverForm.name}
                            onChange={(e) => setEditDriverForm((f) => ({ ...f, name: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditDriver()}
                            autoFocus
                          />
                        </td>
                        <td style={td}>
                          <input
                            style={{ ...inputStyle, fontFamily: fontMono }}
                            value={editDriverForm.phone}
                            onChange={(e) => setEditDriverForm((f) => ({ ...f, phone: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditDriver()}
                          />
                        </td>
                        <td style={td}>
                          <input
                            style={{ ...inputStyle, fontFamily: fontMono }}
                            value={editDriverForm.wechatId}
                            onChange={(e) => setEditDriverForm((f) => ({ ...f, wechatId: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditDriver()}
                          />
                        </td>
                        <td style={td}>
                          <select
                            style={selectStyle}
                            value={editDriverForm.defaultVehicleId}
                            onChange={(e) => setEditDriverForm((f) => ({ ...f, defaultVehicleId: e.target.value }))}
                          >
                            <option value="">None</option>
                            {vehicles.filter((v) => v.isActive).map((v) => (
                              <option key={v.id} value={v.id}>{v.plateNumber} ({v.truckType})</option>
                            ))}
                          </select>
                        </td>
                        <td style={td}>
                          <span style={statusBadge(d.isActive)} onClick={() => toggleDriverActive(d.id)}>
                            {d.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button onClick={saveEditDriver} style={btnSave}>Save</button>
                            <button onClick={() => setEditDriverId(null)} style={btnCancel}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={d.id}
                      onClick={() => startEditDriver(d)}
                      style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                    >
                      <td style={{ ...td, fontWeight: 600 }}>{d.name}</td>
                      <td style={{ ...td, fontFamily: fontMono, fontSize: 10 }}>{d.phone}</td>
                      <td style={{ ...td, fontFamily: fontMono, fontSize: 10, color: d.wechatId ? '#374151' : '#d1d5db' }}>
                        {d.wechatId || '\u2014'}
                      </td>
                      <td style={{ ...td, fontSize: 10 }}>
                        {veh ? (
                          <span>
                            <span style={{ fontFamily: fontMono }}>{veh.plateNumber}</span>
                            <span style={{ ...truckTypeBadge(), marginLeft: 4 }}>{veh.truckType}</span>
                          </span>
                        ) : (
                          <span style={{ color: '#d1d5db' }}>&mdash;</span>
                        )}
                      </td>
                      <td style={td}>
                        <span
                          style={statusBadge(d.isActive)}
                          onClick={(e) => { e.stopPropagation(); toggleDriverActive(d.id); }}
                        >
                          {d.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        {deleteConfirm === d.id ? (
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: '#dc2626', fontFamily: fontUI }}>Delete?</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteDriver(d.id); }}
                              style={{ ...btnSave, background: '#dc2626', fontSize: 9, padding: '2px 8px' }}
                            >
                              Yes
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                              style={{ ...btnCancel, fontSize: 9, padding: '2px 8px' }}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(d.id); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 2, display: 'inline-flex', alignItems: 'center' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#d1d5db'; }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 12px', textAlign: 'center' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(21,44,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                        <Truck size={16} style={{ color: '#152CFF' }} />
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', margin: 0, fontFamily: fontUI }}>No drivers yet</p>
                      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, fontFamily: fontUI }}>Click "+ Add Driver" to add one</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add button */}
          {!showAddDriver && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                onClick={() => { setShowAddDriver(true); setEditDriverId(null); setDeleteConfirm(null); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  background: '#152CFF',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: fontUI,
                }}
              >
                + Add Driver
              </button>
            </div>
          )}
        </>
      )}

      {/* Vehicles tab */}
      {tab === 'vehicles' && (
        <>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: '24%' }}>Plate Number</th>
                  <th style={{ ...th, width: '18%' }}>Truck Type</th>
                  <th style={{ ...th, width: '18%' }}>Capacity (kg)</th>
                  <th style={{ ...th, width: '14%' }}>Status</th>
                  <th style={{ ...th, width: '26%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Add row */}
                {showAddVehicle && (
                  <tr style={{ background: '#fafbff' }}>
                    <td style={td}>
                      <input
                        style={{ ...inputStyle, fontFamily: fontMono }}
                        placeholder="粤B·00000"
                        value={vehicleForm.plateNumber}
                        onChange={(e) => setVehicleForm((f) => ({ ...f, plateNumber: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addVehicle()}
                        autoFocus
                      />
                    </td>
                    <td style={td}>
                      <select
                        style={selectStyle}
                        value={vehicleForm.truckType}
                        onChange={(e) => {
                          const tt = e.target.value as TruckType;
                          const def = TRUCK_TYPES.find((t) => t.type === tt);
                          setVehicleForm((f) => ({ ...f, truckType: tt, maxKg: def ? String(def.maxKg) : f.maxKg }));
                        }}
                      >
                        {TRUCK_TYPES.map((t) => (
                          <option key={t.type} value={t.type}>{t.type}</option>
                        ))}
                      </select>
                    </td>
                    <td style={td}>
                      <input
                        style={{ ...inputStyle, fontFamily: fontMono }}
                        placeholder="kg"
                        value={vehicleForm.maxKg}
                        onChange={(e) => setVehicleForm((f) => ({ ...f, maxKg: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addVehicle()}
                      />
                    </td>
                    <td style={td}>
                      <span style={statusBadge(true)}>Active</span>
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button onClick={addVehicle} style={btnSave}>Save</button>
                        <button onClick={() => { setShowAddVehicle(false); setVehicleForm({ ...BLANK_VEHICLE }); }} style={btnCancel}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Vehicle rows */}
                {vehicles.length > 0 ? vehicles.map((v) => {
                  const isEditing = editVehicleId === v.id;

                  if (isEditing) {
                    return (
                      <tr key={v.id} style={{ background: '#fafbff' }}>
                        <td style={td}>
                          <input
                            style={{ ...inputStyle, fontFamily: fontMono }}
                            value={editVehicleForm.plateNumber}
                            onChange={(e) => setEditVehicleForm((f) => ({ ...f, plateNumber: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditVehicle()}
                            autoFocus
                          />
                        </td>
                        <td style={td}>
                          <select
                            style={selectStyle}
                            value={editVehicleForm.truckType}
                            onChange={(e) => {
                              const tt = e.target.value as TruckType;
                              const def = TRUCK_TYPES.find((t) => t.type === tt);
                              setEditVehicleForm((f) => ({ ...f, truckType: tt, maxKg: def ? String(def.maxKg) : f.maxKg }));
                            }}
                          >
                            {TRUCK_TYPES.map((t) => (
                              <option key={t.type} value={t.type}>{t.type}</option>
                            ))}
                          </select>
                        </td>
                        <td style={td}>
                          <input
                            style={{ ...inputStyle, fontFamily: fontMono }}
                            value={editVehicleForm.maxKg}
                            onChange={(e) => setEditVehicleForm((f) => ({ ...f, maxKg: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditVehicle()}
                          />
                        </td>
                        <td style={td}>
                          <span style={statusBadge(v.isActive)} onClick={() => toggleVehicleActive(v.id)}>
                            {v.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button onClick={saveEditVehicle} style={btnSave}>Save</button>
                            <button onClick={() => setEditVehicleId(null)} style={btnCancel}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={v.id}
                      onClick={() => startEditVehicle(v)}
                      style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                    >
                      <td style={{ ...td, fontFamily: fontMono, fontWeight: 600, fontSize: 11 }}>{v.plateNumber}</td>
                      <td style={td}>
                        <span style={truckTypeBadge()}>{v.truckType}</span>
                      </td>
                      <td style={{ ...td, fontFamily: fontMono, fontSize: 10 }}>
                        {v.maxKg.toLocaleString()} kg
                      </td>
                      <td style={td}>
                        <span
                          style={statusBadge(v.isActive)}
                          onClick={(e) => { e.stopPropagation(); toggleVehicleActive(v.id); }}
                        >
                          {v.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        {deleteConfirm === v.id ? (
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: '#dc2626', fontFamily: fontUI }}>Delete?</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteVehicle(v.id); }}
                              style={{ ...btnSave, background: '#dc2626', fontSize: 9, padding: '2px 8px' }}
                            >
                              Yes
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                              style={{ ...btnCancel, fontSize: 9, padding: '2px 8px' }}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(v.id); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 2, display: 'inline-flex', alignItems: 'center' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#d1d5db'; }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '48px 12px', textAlign: 'center' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(21,44,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                        <Truck size={16} style={{ color: '#152CFF' }} />
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', margin: 0, fontFamily: fontUI }}>No vehicles yet</p>
                      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, fontFamily: fontUI }}>Click "+ Add Vehicle" to add one</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add button */}
          {!showAddVehicle && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                onClick={() => { setShowAddVehicle(true); setEditVehicleId(null); setDeleteConfirm(null); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  background: '#152CFF',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: fontUI,
                }}
              >
                + Add Vehicle
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
