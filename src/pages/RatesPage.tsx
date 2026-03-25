import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useRates } from '../context/RateContext';
import {
  vendors,
  SERVICE_HIERARCHY,
  ALL_L2_SERVICES,
  formatCurrency,
} from '../data/mockData';
import type { VendorRate, L1Service, L2SubService } from '../data/mockData';

// ─── Unit badge styles (from DESIGN.md) ───

const UNIT_LABELS: Record<string, string> = { flat: '/trip', 'per-kg': '/kg', 'per-bag': '/bag', 'per-cbm': '/CBM', 'per-km': '/km' };
const UNIT_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  flat: { text: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
  'per-kg': { text: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  'per-bag': { text: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  'per-cbm': { text: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'per-km': { text: '#059669', bg: '#f0fdf4', border: '#a7f3d0' },
};

// ─── Types ───

/** A column in the route-type grid: origin → destination */
interface RouteColumn {
  key: string;
  originId: string;
  destinationId: string;
  originName: string;
  destinationName: string;
  zone: string; // derived from origin zone
}

/** A column in the location-type grid: single location */
interface LocationColumn {
  key: string;
  locationId: string;
  locationName: string;
  zone: string;
}

// ─── Component ───

export default function RatesPage() {
  const { rates, locations, getLocationById } = useRates();

  const [selectedVendor, setSelectedVendor] = useState(vendors[0].code);
  const [collapsedZones, setCollapsedZones] = useState<Set<string>>(new Set());
  const [showAllL2, setShowAllL2] = useState(false);

  // ── Active rates for selected vendor ──

  const vendorRates = useMemo(
    () => rates.filter((r) => r.vendorCode === selectedVendor && r.isActive),
    [rates, selectedVendor],
  );

  // ── Separate route-type L1s from location-type L1s ──

  const routeL1s = SERVICE_HIERARCHY.filter((l1) => l1.rateType === 'route');
  const locationL1s = SERVICE_HIERARCHY.filter((l1) => l1.rateType === 'location');

  // ── Build route columns (origin→dest pairs) from vendor's route rates ──

  const routeColumns = useMemo((): RouteColumn[] => {
    const seen = new Set<string>();
    const cols: RouteColumn[] = [];
    for (const r of vendorRates) {
      if (r.rateType !== 'route') continue;
      const key = `${r.originLocationId}→${r.destinationLocationId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const o = getLocationById(r.originLocationId ?? '');
      const d = getLocationById(r.destinationLocationId ?? '');
      cols.push({
        key,
        originId: r.originLocationId ?? '',
        destinationId: r.destinationLocationId ?? '',
        originName: o?.name ?? '?',
        destinationName: d?.name ?? '?',
        zone: o?.zone ?? 'Unknown',
      });
    }
    return cols;
  }, [vendorRates, getLocationById]);

  // ── Build location columns from vendor's location rates ──

  const locationColumns = useMemo((): LocationColumn[] => {
    const seen = new Set<string>();
    const cols: LocationColumn[] = [];
    for (const r of vendorRates) {
      if (r.rateType !== 'location') continue;
      const lid = r.locationId ?? '';
      if (seen.has(lid)) continue;
      seen.add(lid);
      const loc = getLocationById(lid);
      cols.push({
        key: lid,
        locationId: lid,
        locationName: loc?.name ?? '?',
        zone: loc?.zone ?? 'Unknown',
      });
    }
    return cols;
  }, [vendorRates, getLocationById]);

  // ── Group columns by zone ──

  const routeZoneGroups = useMemo(() => groupByZone(routeColumns), [routeColumns]);
  const locationZoneGroups = useMemo(() => groupByZone(locationColumns), [locationColumns]);

  // ── L2 rows that have at least one rate (for the "show configured only" default) ──

  const configuredCostIds = useMemo(() => {
    const s = new Set<string>();
    for (const r of vendorRates) s.add(r.costId);
    return s;
  }, [vendorRates]);

  // ── Rate lookup map: costId + columnKey → VendorRate ──

  const rateLookup = useMemo(() => {
    const map = new Map<string, VendorRate>();
    for (const r of vendorRates) {
      let colKey: string;
      if (r.rateType === 'route') {
        colKey = `${r.originLocationId}→${r.destinationLocationId}`;
      } else {
        colKey = r.locationId ?? '';
      }
      const mapKey = `${r.costId}::${colKey}`;
      // Keep the one with the latest effectiveFrom
      const existing = map.get(mapKey);
      if (!existing || r.effectiveFrom > existing.effectiveFrom) {
        map.set(mapKey, r);
      }
    }
    return map;
  }, [vendorRates]);

  // ── Summary counts ──

  const configuredL2Count = configuredCostIds.size;
  const routeCount = routeColumns.length;
  const locationCount = locationColumns.length;

  // ── Zone collapse toggle ──

  function toggleZone(zone: string) {
    setCollapsedZones((prev) => {
      const next = new Set(prev);
      if (next.has(zone)) next.delete(zone);
      else next.add(zone);
      return next;
    });
  }

  // ── Dependency banner ──

  const noLocations = locations.length === 0;

  // ── Determine which L2 rows to show ──

  function shouldShowL2(l2: L2SubService, rateType: 'route' | 'location'): boolean {
    if (showAllL2) return true;
    // Only show if at least 1 rate exists for this costId in the current vendor's rates of the right type
    return vendorRates.some((r) => r.costId === l2.costId && r.rateType === rateType);
  }

  // ── Count visible L2 rows for a section ──

  function visibleL2Count(l1List: L1Service[], rateType: 'route' | 'location'): number {
    let count = 0;
    for (const l1 of l1List) {
      for (const l2 of l1.l2Services) {
        if (shouldShowL2(l2, rateType)) count++;
      }
    }
    return count;
  }

  // ───────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────

  return (
    <div style={{ maxWidth: 1800, margin: '0 auto' }}>
      {/* Dependency banner */}
      {noLocations && (
        <div style={{ padding: '8px 16px', background: '#fefce8', borderBottom: '1px solid #fde68a', fontSize: 11, color: '#b45309', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Add locations first.</span> Rate cards require managed locations for lookups to work.
          <a href="/master-data" style={{ color: '#152CFF', fontWeight: 600, textDecoration: 'none', marginLeft: 4 }}>Go to Locations</a>
        </div>
      )}

      {/* Page header */}
      <div style={{ padding: '16px 16px 0' }}>
        <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', color: '#111827', margin: 0 }}>Rate Cards</h1>
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Vendor rate sheet — view configured rates by L2 fee and route/location</p>
      </div>

      {/* Vendor selector pills */}
      <div style={{ padding: '12px 16px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {vendors.map((v) => {
          const isActive = v.code === selectedVendor;
          const vendorRateCount = rates.filter((r) => r.vendorCode === v.code && r.isActive).length;
          return (
            <button
              key={v.code}
              onClick={() => setSelectedVendor(v.code)}
              style={{
                padding: '4px 12px',
                borderRadius: 99,
                border: isActive ? '1px solid #152CFF' : '1px solid #e5e7eb',
                background: isActive ? 'rgba(21,44,255,0.06)' : '#fff',
                color: isActive ? '#152CFF' : '#374151',
                fontWeight: isActive ? 600 : 400,
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
            >
              {v.name}
              <span style={{ fontSize: 9, fontWeight: 600, color: isActive ? '#152CFF' : '#9ca3af' }}>{vendorRateCount}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════ ROUTE-TYPE SECTION (FM) ══════════ */}
      {routeColumns.length > 0 && visibleL2Count(routeL1s, 'route') > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 8 }}>
            Route-Based Services
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: routeColumns.length * 120 + 260 }}>
                {/* ── Zone group header row ── */}
                <thead>
                  <tr>
                    <th style={{ ...stickyFirstColHeader, minWidth: 260, width: 260 }} />
                    {routeZoneGroups.map(({ zone, columns: zoneCols }) => {
                      const isCollapsed = collapsedZones.has(`route:${zone}`);
                      return (
                        <th
                          key={zone}
                          colSpan={isCollapsed ? 1 : zoneCols.length}
                          style={{
                            padding: '4px 10px',
                            fontSize: 9,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            color: '#9ca3af',
                            background: '#f9fafb',
                            borderBottom: '1px solid #e5e7eb',
                            borderLeft: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            userSelect: 'none',
                            textAlign: 'left',
                            whiteSpace: 'nowrap',
                          }}
                          onClick={() => toggleZone(`route:${zone}`)}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                            {zone}
                            <span style={{ fontWeight: 400, fontSize: 9, color: '#d1d5db' }}>({zoneCols.length})</span>
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                  {/* ── Column headers (route names) ── */}
                  <tr>
                    <th style={{ ...stickyFirstColHeader, minWidth: 260, width: 260, background: '#111827', color: '#fff', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 10px', borderBottom: '1px solid #374151' }}>
                      L2 Fee
                    </th>
                    {routeZoneGroups.map(({ zone, columns: zoneCols }) => {
                      const isCollapsed = collapsedZones.has(`route:${zone}`);
                      if (isCollapsed) {
                        return (
                          <th key={`${zone}-collapsed`} style={{ ...darkColHeader, borderLeft: '1px solid #374151', padding: '6px 10px', textAlign: 'center' }}>
                            <span style={{ fontSize: 9, color: '#6b7280' }}>...</span>
                          </th>
                        );
                      }
                      return zoneCols.map((col) => (
                        <th key={col.key} style={{ ...darkColHeader, borderLeft: '1px solid #374151', minWidth: 120 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {abbreviate(col.originName)} &rarr; {abbreviate(col.destinationName)}
                          </div>
                          <div style={{ fontSize: 8, fontWeight: 400, color: '#9ca3af', marginTop: 1 }}>{col.zone}</div>
                        </th>
                      ));
                    })}
                  </tr>
                </thead>
                <tbody>
                  {routeL1s.map((l1) => {
                    const visibleL2s = l1.l2Services.filter((l2) => shouldShowL2(l2, 'route'));
                    if (visibleL2s.length === 0) return null;
                    return (
                      <L1SectionRows
                        key={l1.code}
                        l1={l1}
                        l2s={visibleL2s}
                        columns={routeColumns}
                        zoneGroups={routeZoneGroups}
                        collapsedZones={collapsedZones}
                        zonePrefix="route:"
                        rateLookup={rateLookup}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ LOCATION-TYPE SECTION (EC, CS, CR, OH) ══════════ */}
      {locationColumns.length > 0 && visibleL2Count(locationL1s, 'location') > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 8 }}>
            Location-Based Services
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: locationColumns.length * 120 + 260 }}>
                {/* ── Zone group header row ── */}
                <thead>
                  <tr>
                    <th style={{ ...stickyFirstColHeader, minWidth: 260, width: 260 }} />
                    {locationZoneGroups.map(({ zone, columns: zoneCols }) => {
                      const isCollapsed = collapsedZones.has(`loc:${zone}`);
                      return (
                        <th
                          key={zone}
                          colSpan={isCollapsed ? 1 : zoneCols.length}
                          style={{
                            padding: '4px 10px',
                            fontSize: 9,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            color: '#9ca3af',
                            background: '#f9fafb',
                            borderBottom: '1px solid #e5e7eb',
                            borderLeft: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            userSelect: 'none',
                            textAlign: 'left',
                            whiteSpace: 'nowrap',
                          }}
                          onClick={() => toggleZone(`loc:${zone}`)}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                            {zone}
                            <span style={{ fontWeight: 400, fontSize: 9, color: '#d1d5db' }}>({zoneCols.length})</span>
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                  {/* ── Column headers (location names) ── */}
                  <tr>
                    <th style={{ ...stickyFirstColHeader, minWidth: 260, width: 260, background: '#111827', color: '#fff', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 10px', borderBottom: '1px solid #374151' }}>
                      L2 Fee
                    </th>
                    {locationZoneGroups.map(({ zone, columns: zoneCols }) => {
                      const isCollapsed = collapsedZones.has(`loc:${zone}`);
                      if (isCollapsed) {
                        return (
                          <th key={`${zone}-collapsed`} style={{ ...darkColHeader, borderLeft: '1px solid #374151', padding: '6px 10px', textAlign: 'center' }}>
                            <span style={{ fontSize: 9, color: '#6b7280' }}>...</span>
                          </th>
                        );
                      }
                      return zoneCols.map((col) => (
                        <th key={col.key} style={{ ...darkColHeader, borderLeft: '1px solid #374151', minWidth: 120 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {abbreviate(col.locationName)}
                          </div>
                          <div style={{ fontSize: 8, fontWeight: 400, color: '#9ca3af', marginTop: 1 }}>{col.zone}</div>
                        </th>
                      ));
                    })}
                  </tr>
                </thead>
                <tbody>
                  {locationL1s.map((l1) => {
                    const visibleL2s = l1.l2Services.filter((l2) => shouldShowL2(l2, 'location'));
                    if (visibleL2s.length === 0) return null;
                    return (
                      <L1SectionRows
                        key={l1.code}
                        l1={l1}
                        l2s={visibleL2s}
                        columns={locationColumns}
                        zoneGroups={locationZoneGroups}
                        collapsedZones={collapsedZones}
                        zonePrefix="loc:"
                        rateLookup={rateLookup}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ Empty state ══════════ */}
      {vendorRates.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No rates configured</div>
          <div style={{ fontSize: 11 }}>No active rates for {vendors.find((v) => v.code === selectedVendor)?.name ?? selectedVendor}.</div>
        </div>
      )}

      {/* ══════════ Show all L2 toggle + summary footer ══════════ */}
      <div style={{ padding: '12px 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: '#6b7280' }}>
          <input
            type="checkbox"
            checked={showAllL2}
            onChange={(e) => setShowAllL2(e.target.checked)}
            style={{ accentColor: '#152CFF' }}
          />
          Show all L2 fees
          <span style={{ fontSize: 9, color: '#9ca3af' }}>
            ({ALL_L2_SERVICES.length} total)
          </span>
        </label>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>
          <strong style={{ color: '#111827' }}>{configuredL2Count}</strong> L2 fees configured across{' '}
          <strong style={{ color: '#111827' }}>{routeCount + locationCount}</strong> routes/locations
        </div>
      </div>

      {/* Edit mode note */}
      {/* TODO (HMW-33): Inline editing — cells are currently display-only.
          Use the AddRateSlideOut via Master Data for adding new rates. */}
    </div>
  );
}

// ─────────────────────────────────────────
// L1 Section Rows (header + L2 data rows)
// ─────────────────────────────────────────

interface L1SectionRowsProps {
  l1: L1Service;
  l2s: L2SubService[];
  columns: (RouteColumn | LocationColumn)[];
  zoneGroups: ZoneGroup<RouteColumn | LocationColumn>[];
  collapsedZones: Set<string>;
  zonePrefix: string;
  rateLookup: Map<string, VendorRate>;
}

function L1SectionRows({ l1, l2s, columns, zoneGroups, collapsedZones, zonePrefix, rateLookup }: L1SectionRowsProps) {
  // Count visible (non-collapsed) columns
  const visibleColCount = zoneGroups.reduce((sum, zg) => {
    return sum + (collapsedZones.has(`${zonePrefix}${zg.zone}`) ? 1 : zg.columns.length);
  }, 0);

  return (
    <>
      {/* L1 section header row */}
      <tr>
        <td
          colSpan={1 + visibleColCount}
          style={{
            padding: '6px 10px',
            background: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              padding: '1px 6px',
              borderRadius: 99,
              fontSize: 9,
              fontWeight: 600,
              color: '#fff',
              background: l1.color,
            }}>
              {l1.code}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>{l1.label}</span>
            <span style={{ fontSize: 9, color: '#9ca3af' }}>{l2s.length} fee{l2s.length !== 1 ? 's' : ''}</span>
          </span>
        </td>
      </tr>

      {/* L2 data rows */}
      {l2s.map((l2) => (
        <tr key={l2.costId}>
          {/* Sticky first column: L2 fee info */}
          <td style={stickyFirstCol}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                fontWeight: 500,
                color: '#9ca3af',
                flexShrink: 0,
              }}>
                {l2.costId}
              </span>
              <span style={{
                fontSize: 11,
                color: '#374151',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {l2.name}
              </span>
            </div>
            <div style={{ marginTop: 2 }}>
              {(() => {
                const u = UNIT_COLORS[l2.unit] ?? UNIT_COLORS.flat;
                return (
                  <span style={{
                    padding: '0px 4px',
                    borderRadius: 3,
                    fontSize: 8,
                    fontWeight: 600,
                    color: u.text,
                    background: u.bg,
                    border: `1px solid ${u.border}`,
                  }}>
                    {UNIT_LABELS[l2.unit] ?? l2.unit}
                  </span>
                );
              })()}
            </div>
          </td>

          {/* Rate cells per column (respecting zone collapse) */}
          {zoneGroups.map(({ zone, columns: zoneCols }) => {
            const isCollapsed = collapsedZones.has(`${zonePrefix}${zone}`);
            if (isCollapsed) {
              return (
                <td key={`${zone}-collapsed`} style={{ ...rateCell, borderLeft: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <span style={{ fontSize: 9, color: '#d1d5db' }}>...</span>
                </td>
              );
            }
            return zoneCols.map((col) => {
              const mapKey = `${l2.costId}::${col.key}`;
              const rate = rateLookup.get(mapKey);
              return (
                <td key={col.key} style={{ ...rateCell, borderLeft: '1px solid #f3f4f6' }}>
                  {rate ? (
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      fontWeight: 500,
                      color: '#111827',
                    }}>
                      {formatCurrency(rate.currency, rate.amount)}
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, color: '#d1d5db' }}>&mdash;</span>
                  )}
                </td>
              );
            });
          })}
        </tr>
      ))}
    </>
  );
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

interface ZoneGroup<T> {
  zone: string;
  columns: T[];
}

function groupByZone<T extends { zone: string }>(columns: T[]): ZoneGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const col of columns) {
    const group = map.get(col.zone) ?? [];
    group.push(col);
    map.set(col.zone, group);
  }
  return Array.from(map.entries()).map(([zone, cols]) => ({ zone, columns: cols }));
}

/** Shorten long location names for column headers */
function abbreviate(name: string): string {
  // Remove common suffixes to keep headers compact
  return name
    .replace(' Cargo Terminal', ' CT')
    .replace(' Warehouse', ' WH')
    .replace(' Checkpoint', ' CP')
    .replace(' Cross-dock', ' XD')
    .replace(' Free Trade Zone', ' FTZ')
    .replace(' Airport', ' Apt')
    .replace(' Region', ' Rgn');
}

// ─────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────

const stickyFirstColHeader: React.CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 2,
  background: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
  padding: '4px 10px',
};

const darkColHeader: React.CSSProperties = {
  background: '#111827',
  color: '#fff',
  fontSize: 9,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  padding: '6px 10px',
  borderBottom: '1px solid #374151',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

const stickyFirstCol: React.CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 1,
  background: '#fff',
  padding: '5px 10px',
  borderBottom: '1px solid #f3f4f6',
  minWidth: 260,
  width: 260,
  maxWidth: 260,
};

const rateCell: React.CSSProperties = {
  padding: '5px 10px',
  textAlign: 'right',
  borderBottom: '1px solid #f3f4f6',
  whiteSpace: 'nowrap',
};
