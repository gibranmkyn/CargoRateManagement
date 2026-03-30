import { useRef, useEffect } from 'react';
import { useLocations } from '../../context/LocationContext';
import { useTrips } from '@shared/TripContext';
import { vendors, SERVICE_CONFIG, seedVendorFees } from '@shared/mockData';

interface Props {
  serviceCode: string;
  locationId?: string;
  currentVendorCode?: string;
  onSelect: (vendorCode: string) => void;
  onClose: () => void;
}

export default function VendorComparisonPopover({ serviceCode, locationId, currentVendorCode, onSelect, onClose }: Props) {
  const { getLocationById } = useLocations();
  const { trips } = useTrips();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const cfg = SERVICE_CONFIG[serviceCode];

  // Find all matching vendor fees for this service + location
  const matchingFees = seedVendorFees.filter((f) => {
    if (f.serviceCode !== serviceCode || !f.isActive) return false;
    return f.locationId === locationId;
  });

  // Group by vendor, show fee count and total rate
  const vendorData = vendors.map((v) => {
    const fees = matchingFees.filter((f) => f.vendorCode === v.code);
    const allJobs = trips.flatMap((t) => t.jobs).filter((j) => j.vendor.code === v.code && j.service.code === serviceCode);
    const completed = allJobs.filter((j) => j.status === 'Verified').length;
    const total = allJobs.length;
    return { vendor: v, fees, feeCount: fees.length, completed, total };
  }).filter((d) => d.feeCount > 0);

  const locLabel = getLocationById(locationId ?? '')?.name ?? '?';

  if (vendorData.length === 0) {
    return (
      <div ref={ref} style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: 16, width: 320, zIndex: 50 }}>
        <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>No vendor fees configured for this service/location</div>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', width: 400, zIndex: 50 }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>Compare vendors</div>
        <div style={{ fontSize: 10, color: '#9ca3af' }}>{cfg?.label} — {locLabel}</div>
      </div>
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {vendorData.map(({ vendor, feeCount, completed, total }) => {
          const isCurrent = vendor.code === currentVendorCode;
          return (
            <div
              key={vendor.code}
              onClick={() => { onSelect(vendor.code); onClose(); }}
              style={{
                padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                background: isCurrent ? 'rgba(21,44,255,0.04)' : 'transparent',
                borderLeft: isCurrent ? '3px solid #152CFF' : '3px solid transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
              onMouseLeave={(e) => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: isCurrent ? '#152CFF' : '#111827' }}>
                  {vendor.name} {isCurrent && <span style={{ fontSize: 9, fontWeight: 400, color: '#9ca3af' }}>current</span>}
                </div>
                {total > 0 && (
                  <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 1 }}>
                    {completed}/{total} jobs validated
                    {total >= 3 && <span style={{ marginLeft: 4 }}>({Math.round(completed / total * 100)}%)</span>}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#111827' }}>
                  {feeCount} fees
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
