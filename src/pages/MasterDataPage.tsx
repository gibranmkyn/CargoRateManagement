import { useState } from 'react';
import LocationsTab from '../components/master-data/LocationsTab';

type Tab = 'locations' | 'vendors' | 'customers' | 'services';

export default function MasterDataPage() {
  const [tab, setTab] = useState<Tab>('locations');

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0' }}>
        <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', color: '#111827', margin: 0 }}>Master Data</h1>
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Manage locations, vendors, customers, and services</p>
      </div>

      {/* Tabs */}
      <div style={{ padding: '12px 16px 0', display: 'flex', gap: 2 }}>
        {([['locations', 'Locations'], ['vendors', 'Vendors'], ['customers', 'Customers'], ['services', 'Services']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: tab === key ? 'rgba(21,44,255,0.06)' : 'transparent', color: tab === key ? '#152CFF' : '#9ca3af', fontWeight: tab === key ? 600 : 400, fontSize: 12, cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {tab === 'locations' && <LocationsTab />}
        {tab !== 'locations' && (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</div>
            <div style={{ fontSize: 11 }}>Coming soon</div>
          </div>
        )}
      </div>
    </div>
  );
}
