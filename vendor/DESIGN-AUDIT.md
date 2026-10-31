# Design Audit — Teleport OS Vendor
**Audited:** 2026-10-31 | **Auditor:** Autonomous design assessment agent
**Scope:** `vendor/src/` against `admin/DESIGN.md` and `vendor/DESIGN.md`

---

## Summary

| # | Severity | File | Finding |
|---|----------|------|---------|
| 1 | **Bug** | `JobDetailPage.tsx:49–68` | Local `StateCell` uses merged `getStateStyle()` — conflates Status + Verification |
| 2 | **Bug** | `JobDetailPage.tsx:104–105` | Dispatch dropdowns read from `seedDrivers`/`seedVehicles`, not fleet localStorage data |
| 3 | Info | `JobDetailPage.tsx:333–358` | FM route section shows date only, not pickup/delivery time (design intent per HMW-V14) |
| 4 | Info | `MyJobsPage.tsx:418` | Segment pill badge `borderRadius: 8` — one pixel above the 6px cap |

No violations of color budget, shadow policy, or typography found in the audit.

---

## Finding 1 — StateCell conflation bug (HMW-V19)

**File:** `vendor/src/pages/JobDetailPage.tsx` lines 49–68, 442  
**Severity:** Bug — affects correctness of the Status Action Bar

**Problem:** `JobDetailPage.tsx` defines a local `StateCell` component that calls `getStateStyle()`. This function (`shared/statusStyles.ts`) derives a single merged label from Status + Verification together. For example, a job with `status: Completed, verificationStatus: Rejected` returns the merged label "Verify rejected" rather than showing the operational status "Completed" separately.

The vendor design spec requires: *"Status and Verification are independent signals"* and the Status Action Bar should show the operational status chip using `StatusCell` — the same component used in the `MyJobsPage` table.

**Also at line 442:** `<StateCell job={job} fontSize={12} withSubline={false} />` renders inside the action bar. This produces the wrong merged label for Completed+Rejected jobs.

**Fix:** Replace the local `StateCell` in `JobDetailPage.tsx` with the shared `StatusCell` component (already imported in `MyJobsPage.tsx`). For the Rejected verification state, add a small inline rejection badge (`#dc2626` border, "Rejected" label) beside the status chip — per HMW-V19 option C recommendation.

```tsx
// Remove lines 49–68 (local StateCell definition)
// Import StatusCell from '../components/StatusCell'
// At line 442, replace:
<StateCell job={job} fontSize={12} withSubline={false} />
// With:
<StatusCell job={job} />
{job.verificationStatus === 'Rejected' && (
  <span style={{ fontSize: 10, fontWeight: 600, color: '#dc2626', marginLeft: 6 }}>· Rejected</span>
)}
```

---

## Finding 2 — Fleet data plumbing bug (HMW-V18 prerequisite)

**File:** `vendor/src/pages/JobDetailPage.tsx` lines 104–105, 151–153  
**Severity:** Bug — drivers/vehicles added via Fleet page don't appear in dispatch dropdowns

**Problem:** `JobDetailPage.tsx` sources fleet data from `seedDrivers` and `seedVehicles` (imported from `shared/mockData`):

```ts
const vendorDrivers = seedDrivers.filter((d) => d.vendorCode === vendorCode && d.isActive);
const vendorVehicles = seedVehicles.filter((v) => v.vendorCode === vendorCode && v.isActive);
```

But `FleetPage.tsx` stores and loads fleet data from localStorage under the key `vendor_fleet_${vendorCode}` (see `FleetPage.tsx:39–62`). When a dispatcher adds a new driver via the Fleet page and then opens a job to assign that driver, the driver does not appear in the dispatch dropdown — because `JobDetailPage` never reads from localStorage.

Additionally, `handleAssignDispatch` (lines 151–153) uses `seedDrivers.find(...)` and `seedVehicles.find(...)` to look up driver/vehicle objects by ID, which will also fail for any fleet-added records since their IDs won't exist in the seed arrays.

**Fix:** Extract the `loadFleetData(vendorCode)` helper from `FleetPage.tsx` into a shared utility or hook, and call it from `JobDetailPage.tsx` instead of reading seed arrays directly.

```ts
// Option 1: Inline the same localStorage read in JobDetailPage
const fleetKey = `vendor_fleet_${vendorCode}`;
const fleetRaw = localStorage.getItem(fleetKey);
const fleet = fleetRaw ? JSON.parse(fleetRaw) as { drivers: Driver[]; vehicles: Vehicle[] } : { drivers: seedDrivers.filter(d => d.vendorCode === vendorCode), vehicles: seedVehicles.filter(v => v.vendorCode === vendorCode) };
const vendorDrivers = fleet.drivers.filter(d => d.isActive);
const vendorVehicles = fleet.vehicles.filter(v => v.isActive);

// Option 2 (recommended): Move loadFleetData to shared/fleetData.ts and import it in both FleetPage and JobDetailPage
```

**Blocker note:** This bug blocks HMW-V18's "dispatch-aware availability" column from being meaningful — the Fleet page's drivers won't appear in job detail assignment if this isn't fixed first.

---

## Finding 3 — FM route section shows date, not pickup/delivery time (Design intent, not bug)

**File:** `vendor/src/pages/JobDetailPage.tsx` lines 333–358  
**Severity:** Info — tracked in HMW-V14

**Observation:** The `renderRoute()` function shows pickup/delivery location names with `fmtDateMono()` (e.g., "26 Apr") but omits pickup and delivery times. The vendor DESIGN.md specifies: *"Pickup/Delivery Timeline — two-point layout: Origin (location + pickup datetime in big mono) → arrow → Destination."* Times are the most important data for FM dispatchers.

This matches the open question in HMW-V14 (urgency coloring when < 2h to pickup) which is still unresolved. The current implementation is not wrong per se — the time data may simply not be in the seed data — but the section title "Route" should be "Pickup/Delivery Timeline" to match the DESIGN.md spec, and datetime should use `fmtDateTime()` or similar when time data exists.

**Not a fix required now** — track against HMW-V14 resolution.

---

## Finding 4 — Segment pill badge border-radius 8px (minor)

**File:** `vendor/src/pages/MyJobsPage.tsx` line 418  
**Severity:** Minor — 2px over the 6px cap

**Observation:** The segment pill count badge uses `borderRadius: 8`:
```tsx
style={{ fontSize: 10, padding: '0 5px', borderRadius: 8, fontWeight: 700, ... }}
```

The design system cap is 4–6px for containers (99px allowed only for full-pill shapes). A badge at 8px is negligible visually but technically out of spec. Fix: change to `borderRadius: 6`.

---

## Design System Compliance (Pass)

| Check | Result |
|-------|--------|
| Status/Verification colors match the 5-color system | ✓ Pass |
| No Tailwind color classes in vendor pages | ✓ Pass |
| Service tag: mono gray `#6b7280`, no pill, no blue | ✓ Pass |
| Trip ID: ink mono `#111827`, no chip, no blue | ✓ Pass |
| Nav background `#111827`, height 40px | ✓ Pass |
| Accent `#152CFF` on interactive elements only | ✓ Pass |
| No box-shadow on table rows or cards | ✓ Pass |
| No filled status chips (dot + text only) | ✓ Pass |
| StatusCell + VerificationCell used in My Jobs table | ✓ Pass |
| No stats bar on My Jobs or Fleet page | ✓ Pass |
| Empty state: muted text + clear filters link | ✓ Pass |
| Driver/vehicle plate and truck type: mono gray, not blue | ✓ Pass |
| Fonts: Instrument Sans + JetBrains Mono | ✓ Pass |
