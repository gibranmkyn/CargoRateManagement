import { useState, useEffect } from 'react';
import { useRates, generateRateId } from '../../context/RateContext';
import { useToast } from '@shared/Toast';
import { vendors, serviceTypes, SERVICE_CONFIG, formatCurrency } from '@shared/mockData';
import type { VendorRate, Currency, RateUnit } from '@shared/mockData';
import LocationDropdown from '../shared/LocationDropdown';

const CURRENCIES: Currency[] = ['MYR', 'CNY', 'USD'];
const UNITS: { value: RateUnit; label: string }[] = [
  { value: 'flat', label: 'Per trip (flat)' },
  { value: 'per-kg', label: 'Per kg' },
  { value: 'per-bag', label: 'Per bag' },
  { value: 'per-cbm', label: 'Per CBM' },
];

interface Props {
  editingRate?: VendorRate | null;
  onClose: () => void;
}

const label: React.CSSProperties = { fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 4, display: 'block' };
const section: React.CSSProperties = { marginBottom: 16 };

export default function AddRateSlideOut({ editingRate, onClose }: Props) {
  const { addRate, updateRate, getLocationById } = useRates();
  const toast = useToast();

  const [vendorCode, setVendorCode] = useState(editingRate?.vendorCode ?? '');
  const [serviceCode, setServiceCode] = useState(editingRate?.serviceCode ?? '');
  const [originLocationId, setOriginLocationId] = useState(editingRate?.originLocationId ?? '');
  const [destinationLocationId, setDestinationLocationId] = useState(editingRate?.destinationLocationId ?? '');
  const [locationId, setLocationId] = useState(editingRate?.locationId ?? '');
  const [currency, setCurrency] = useState<Currency>(editingRate?.currency ?? 'MYR');
  const [amount, setAmount] = useState(editingRate ? String(editingRate.amount) : '');
  const [unit, setUnit] = useState<RateUnit>(editingRate?.unit ?? 'flat');
  const [effectiveFrom, setEffectiveFrom] = useState(editingRate?.effectiveFrom ?? new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const svcConfig = serviceCode ? SERVICE_CONFIG[serviceCode] : null;
  const isRoute = svcConfig?.rateType === 'route';

  // Reset location fields when service changes
  useEffect(() => {
    if (!editingRate) {
      setOriginLocationId('');
      setDestinationLocationId('');
      setLocationId('');
    }
  }, [serviceCode, editingRate]);

  function handleSave() {
    setError('');
    if (!vendorCode) { setError('Select a vendor'); return; }
    if (!serviceCode) { setError('Select a service'); return; }
    if (isRoute && (!originLocationId || !destinationLocationId)) { setError('Select origin and destination'); return; }
    if (!isRoute && !locationId) { setError('Select a location'); return; }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { setError('Enter a valid rate amount'); return; }

    const vendorName = vendors.find((v) => v.code === vendorCode)?.name ?? vendorCode;
    const svcLabel = serviceTypes.find((s) => s.code === serviceCode)?.label ?? serviceCode;

    if (editingRate) {
      updateRate(editingRate.id, {
        vendorCode, serviceCode,
        rateType: isRoute ? 'route' : 'location',
        originLocationId: isRoute ? originLocationId : undefined,
        destinationLocationId: isRoute ? destinationLocationId : undefined,
        locationId: isRoute ? undefined : locationId,
        currency, amount: parsedAmount, unit, effectiveFrom,
      });
      toast.success(`Rate updated for ${vendorName} ${svcLabel}`);
    } else {
      addRate({
        id: generateRateId(),
        vendorCode, serviceCode,
        rateType: isRoute ? 'route' : 'location',
        originLocationId: isRoute ? originLocationId : undefined,
        destinationLocationId: isRoute ? destinationLocationId : undefined,
        locationId: isRoute ? undefined : locationId,
        currency, amount: parsedAmount, unit, effectiveFrom,
        isActive: true,
      });
      const locLabel = isRoute
        ? `${getLocationById(originLocationId)?.name ?? '?'} → ${getLocationById(destinationLocationId)?.name ?? '?'}`
        : getLocationById(locationId)?.name ?? '?';
      toast.success(`Rate saved for ${vendorName} ${svcLabel}: ${locLabel}`);
    }
    onClose();
  }

  const inputStyle: React.CSSProperties = { width: '100%', fontSize: 11, padding: '5px 8px', border: '1px solid #e5e7eb', borderRadius: 4, outline: 'none' };

  return (
    <div>
      {/* Vendor */}
      <div style={section}>
        <span style={label}>Vendor</span>
        <select value={vendorCode} onChange={(e) => setVendorCode(e.target.value)} style={inputStyle}>
          <option value="">Select vendor...</option>
          {vendors.map((v) => <option key={v.code} value={v.code}>{v.name}</option>)}
        </select>
      </div>

      {/* Service */}
      <div style={section}>
        <span style={label}>Service</span>
        <select value={serviceCode} onChange={(e) => setServiceCode(e.target.value)} style={inputStyle}>
          <option value="">Select service...</option>
          {serviceTypes.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
        </select>
      </div>

      {/* Rate Type indicator */}
      {svcConfig && (
        <div style={{ ...section, marginBottom: 12 }}>
          <span style={label}>Rate Type</span>
          <div style={{ fontSize: 11, color: '#152CFF', fontWeight: 600, padding: '4px 8px', background: 'rgba(21,44,255,0.06)', borderRadius: 4, display: 'inline-block' }}>
            {isRoute ? 'Route (Origin → Destination)' : 'Location'}
          </div>
        </div>
      )}

      {/* Location fields */}
      {svcConfig && isRoute && (
        <>
          <div style={section}>
            <span style={label}>Origin</span>
            <LocationDropdown value={originLocationId} onChange={setOriginLocationId} placeholder="Select origin..." excludeId={destinationLocationId} />
          </div>
          <div style={section}>
            <span style={label}>Destination</span>
            <LocationDropdown value={destinationLocationId} onChange={setDestinationLocationId} placeholder="Select destination..." excludeId={originLocationId} />
          </div>
        </>
      )}
      {svcConfig && !isRoute && (
        <div style={section}>
          <span style={label}>Location</span>
          <LocationDropdown value={locationId} onChange={setLocationId} placeholder="Select location..." />
        </div>
      )}

      {/* Rate amount + currency */}
      <div style={section}>
        <span style={label}>Rate</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} style={{ ...inputStyle, width: 70, flexShrink: 0 }}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }} />
        </div>
      </div>

      {/* Unit */}
      <div style={section}>
        <span style={label}>Unit</span>
        <select value={unit} onChange={(e) => setUnit(e.target.value as RateUnit)} style={inputStyle}>
          {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
        </select>
      </div>

      {/* Effective from */}
      <div style={section}>
        <span style={label}>Effective From</span>
        <input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }} />
      </div>

      {/* Error */}
      {error && <div style={{ fontSize: 10, color: '#dc2626', marginBottom: 12, padding: '4px 8px', background: '#fef2f2', borderRadius: 4 }}>{error}</div>}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '6px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handleSave} style={{ flex: 1, padding: '6px 12px', borderRadius: 6, border: 'none', background: '#152CFF', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          {editingRate ? 'Update Rate' : 'Save Rate'}
        </button>
      </div>
    </div>
  );
}
