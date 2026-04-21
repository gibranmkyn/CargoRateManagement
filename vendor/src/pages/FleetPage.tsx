import { useState, useEffect, useMemo, useCallback } from 'react';
import { Truck, X } from 'lucide-react';
import { TRUCK_TYPES } from '../../../shared/mockData';
import type { Driver, Vehicle, TruckType } from '../../../shared/mockData';
import { useVendorAuth } from '../context/VendorAuthContext';
import { useToast } from '../../../shared/Toast';

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

// -- Seed data --

const SEED_VEHICLES: Vehicle[] = [
  { id: 'VEH-S01', vendorCode: '', plateNumber: '\u7CA4B\u00B712345', truckType: '5T', maxKg: 4500, maxCbm: 30, isActive: true },
  { id: 'VEH-S02', vendorCode: '', plateNumber: '\u7CA4B\u00B767890', truckType: '8T', maxKg: 7500, maxCbm: 43, isActive: true },
  { id: 'VEH-S03', vendorCode: '', plateNumber: '\u6E2FC\u00B711111', truckType: '5T', maxKg: 4500, maxCbm: 30, isActive: true },
];

const SEED_DRIVERS: Driver[] = [
  { id: 'DRV-S01', vendorCode: '', name: 'Zhang Wei', phone: '+86 138****1234', wechatId: 'zhangwei88', defaultVehicleId: 'VEH-S01', isActive: true },
  { id: 'DRV-S02', vendorCode: '', name: 'Li Ming', phone: '+86 139****5678', wechatId: 'liming99', defaultVehicleId: 'VEH-S02', isActive: true },
  { id: 'DRV-S03', vendorCode: '', name: 'Wang Jun', phone: '+86 137****9012', wechatId: 'wangjun77', defaultVehicleId: 'VEH-S03', isActive: true },
];

function getStorageKey(vendorCode: string): string {
  return `vendor_fleet_${vendorCode}`;
}

interface FleetData {
  drivers: Driver[];
  vehicles: Vehicle[];
}

function loadFleetData(vendorCode: string): FleetData {
  const key = getStorageKey(vendorCode);
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as FleetData;
      if (Array.isArray(parsed.drivers) && Array.isArray(parsed.vehicles)) {
        return parsed;
      }
    } catch { /* fall through to seed */ }
  }
  // Seed data — stamp vendorCode onto each record
  const drivers = SEED_DRIVERS.map((d) => ({ ...d, vendorCode }));
  const vehicles = SEED_VEHICLES.map((v) => ({ ...v, vendorCode }));
  return { drivers, vehicles };
}

function saveFleetData(vendorCode: string, data: FleetData) {
  localStorage.setItem(getStorageKey(vendorCode), JSON.stringify(data));
}

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
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('drivers');

  // Hydrate from localStorage (or seed)
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!vendorCode) return;
    const data = loadFleetData(vendorCode);
    setDrivers(data.drivers);
    setVehicles(data.vehicles);
    setHydrated(true);
  }, [vendorCode]);

  // Persist to localStorage on every change (after initial hydration)
  useEffect(() => {
    if (!vendorCode || !hydrated) return;
    saveFleetData(vendorCode, { drivers, vehicles });
  }, [drivers, vehicles, vendorCode, hydrated]);

  // Add-row state
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [driverForm, setDriverForm] = useState<DriverForm>({ ...BLANK_DRIVER });
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>({ ...BLANK_VEHICLE });

  // Edit-row state
  const [editDriverId, setEditDriverId] = useState<string | null>(null);
  const [editDriverForm, setEditDriverForm] = useState<DriverForm>({ ...BLANK_DRIVER });
  const [editVehicleId, setEditVehicleId] = useState<string | null>(null);
  const [editVehicleForm, setEditVehicleForm] = useState<VehicleForm>({ ...BLANK_VEHICLE });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Vehicle lookup for driver's default vehicle display
  const vehicleMap = useMemo(() => {
    const m = new Map<string, Vehicle>();
    vehicles.forEach((v) => m.set(v.id, v));
    return m;
  }, [vehicles]);

  // -- Dismiss helpers --
  const dismissAll = useCallback(() => {
    setShowAddDriver(false);
    setShowAddVehicle(false);
    setEditDriverId(null);
    setEditVehicleId(null);
    setDeleteConfirm(null);
    setDriverForm({ ...BLANK_DRIVER });
    setVehicleForm({ ...BLANK_VEHICLE });
  }, []);

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
    toast.addToast('Driver added', 'success');
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
    toast.addToast('Driver updated', 'success');
  }

  function toggleDriverActive(id: string) {
    setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, isActive: !d.isActive } : d)));
  }

  function deleteDriver(id: string) {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
    setDeleteConfirm(null);
    toast.addToast('Driver removed', 'neutral');
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
    toast.addToast('Vehicle added', 'success');
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
    toast.addToast('Vehicle updated', 'success');
  }

  function toggleVehicleActive(id: string) {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, isActive: !v.isActive } : v)));
  }

  function deleteVehicle(id: string) {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    setDeleteConfirm(null);
    toast.addToast('Vehicle removed', 'neutral');
  }

  // -- Shared styles --

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
  };

  const td: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: 11,
    color: '#111827',
    verticalAlign: 'middle',
  };

  const inputStyle: React.CSSProperties = {
    padding: '4px 8px',
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    fontSize: 11,
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
      ? { color: '#059669', fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }
      : { color: '#9ca3af', fontSize: 10, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 };
  }

  function statusDot(isActive: boolean): React.CSSProperties {
    return {
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: isActive ? '#059669' : '#d1d5db',
      flexShrink: 0,
    };
  }

  function truckTypeBadge(): React.CSSProperties {
    return {
      color: '#6b7280',
      fontSize: 10,
      fontWeight: 600,
      fontFamily: 'var(--font-mono)',
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
  };

  // Tab button styling (matches status pill active/inactive from My Jobs)
  function tabStyle(isActive: boolean): React.CSSProperties {
    return isActive
      ? { padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid #111827', background: '#111827', color: '#fff', textTransform: 'capitalize' as const }
      : { padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', textTransform: 'capitalize' as const };
  }

  // -- Render --

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* Page header + tabs + add button */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '16px 16px 0 16px' }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', color: '#111827', margin: 0 }}>Fleet</h1>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0 0' }}>Manage your drivers and vehicles</p>
        </div>
        <button
          onClick={() => {
            if (tab === 'drivers') {
              setShowAddDriver(true);
              setEditDriverId(null);
              setDeleteConfirm(null);
            } else {
              setShowAddVehicle(true);
              setEditVehicleId(null);
              setDeleteConfirm(null);
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 12px',
            borderRadius: 6,
            fontSize: 9,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: '#fff',
            color: '#152CFF',
            border: '1px solid rgba(21,44,255,0.3)',
            cursor: 'pointer',
          }}
        >
          + Add {tab === 'drivers' ? 'Driver' : 'Vehicle'}
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 16px', borderBottom: '1px solid #e5e7eb' }}>
        {(['drivers', 'vehicles'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); dismissAll(); }}
            style={tabStyle(tab === t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Drivers tab */}
      {tab === 'drivers' && (
        <div style={{ padding: '0 16px 24px 16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: '20%' }}>Name</th>
                <th style={{ ...th, width: '16%' }}>Phone</th>
                <th style={{ ...th, width: '14%' }}>WeChat ID</th>
                <th style={{ ...th, width: '20%' }}>Default Vehicle</th>
                <th style={{ ...th, width: '10%' }}>Status</th>
                <th style={{ ...th, width: '20%', textAlign: 'right' }}>Actions</th>
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
                      style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                      placeholder="+86 138****0000"
                      value={driverForm.phone}
                      onChange={(e) => setDriverForm((f) => ({ ...f, phone: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && addDriver()}
                    />
                  </td>
                  <td style={td}>
                    <input
                      style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
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
                    <span style={statusBadge(true)}><span style={statusDot(true)} />Active</span>
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
                          style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                          value={editDriverForm.phone}
                          onChange={(e) => setEditDriverForm((f) => ({ ...f, phone: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && saveEditDriver()}
                        />
                      </td>
                      <td style={td}>
                        <input
                          style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
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
                          <span style={statusDot(d.isActive)} />{d.isActive ? 'Active' : 'Inactive'}
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
                    <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 10 }}>{d.phone}</td>
                    <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 10, color: d.wechatId ? '#374151' : '#d1d5db' }}>
                      {d.wechatId || '\u2014'}
                    </td>
                    <td style={{ ...td, fontSize: 10 }}>
                      {veh ? (
                        <span>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{veh.plateNumber}</span>
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
                        <span style={statusDot(d.isActive)} />{d.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {deleteConfirm === d.id ? (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: '#dc2626' }}>Delete?</span>
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
                  <td colSpan={6} style={{ padding: '60px 12px', textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(21,44,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Truck size={18} style={{ color: '#152CFF' }} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>No drivers yet</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Click "+ Add Driver" to get started</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Vehicles tab */}
      {tab === 'vehicles' && (
        <div style={{ padding: '0 16px 24px 16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: '22%' }}>Plate</th>
                <th style={{ ...th, width: '16%' }}>Truck Type</th>
                <th style={{ ...th, width: '28%' }}>Capacity</th>
                <th style={{ ...th, width: '12%' }}>Status</th>
                <th style={{ ...th, width: '22%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Add row */}
              {showAddVehicle && (
                <tr style={{ background: '#fafbff' }}>
                  <td style={td}>
                    <input
                      style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                      placeholder="\u7CA4B\u00B700000"
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
                  <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                    {(() => {
                      const def = TRUCK_TYPES.find((t) => t.type === vehicleForm.truckType);
                      const kg = vehicleForm.maxKg ? Number(vehicleForm.maxKg) : def?.maxKg ?? 0;
                      const cbm = def?.maxCbm ?? 0;
                      return <span>{kg.toLocaleString()} kg &middot; {cbm} CBM</span>;
                    })()}
                  </td>
                  <td style={td}>
                    <span style={statusBadge(true)}><span style={statusDot(true)} />Active</span>
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
                          style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
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
                      <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                        {(() => {
                          const def = TRUCK_TYPES.find((t) => t.type === editVehicleForm.truckType);
                          const kg = editVehicleForm.maxKg ? Number(editVehicleForm.maxKg) : def?.maxKg ?? 0;
                          const cbm = def?.maxCbm ?? 0;
                          return <span>{kg.toLocaleString()} kg &middot; {cbm} CBM</span>;
                        })()}
                      </td>
                      <td style={td}>
                        <span style={statusBadge(v.isActive)} onClick={() => toggleVehicleActive(v.id)}>
                          <span style={statusDot(v.isActive)} />{v.isActive ? 'Active' : 'Inactive'}
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
                    <td style={{ ...td, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11 }}>{v.plateNumber}</td>
                    <td style={td}>
                      <span style={truckTypeBadge()}>{v.truckType}</span>
                    </td>
                    <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                      {v.maxKg.toLocaleString()} kg &middot; {v.maxCbm} CBM
                    </td>
                    <td style={td}>
                      <span
                        style={statusBadge(v.isActive)}
                        onClick={(e) => { e.stopPropagation(); toggleVehicleActive(v.id); }}
                      >
                        <span style={statusDot(v.isActive)} />{v.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {deleteConfirm === v.id ? (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: '#dc2626' }}>Delete?</span>
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
                  <td colSpan={5} style={{ padding: '60px 12px', textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(21,44,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Truck size={18} style={{ color: '#152CFF' }} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>No vehicles yet</p>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Click "+ Add Vehicle" to get started</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
