# Design Audit — Teleport OS Vendor App

> Last audit: 2026-10-20. Checked against `admin/DESIGN.md` + `vendor/DESIGN.md`.

## Critical Bugs

### AUDIT-01: StateCell conflates Status + Verification in Job Detail action bar
**File:** `vendor/src/pages/JobDetailPage.tsx` lines 9, 49–68, 442  
**Severity:** High — wrong information shown to vendor for Completed+Rejected jobs  

The Status Action Bar in `JobDetailPage.tsx` uses a local `StateCell` component that calls `getStateStyle()` from `shared/statusStyles.ts`. This is the *merged* state getter — it collapses both `status` and `verificationStatus` into a single label. For a job with `status === 'Completed'` and `verificationStatus === 'Rejected'`, it returns the merged label "Verify rejected" instead of showing the operational status "Completed" correctly.

**Expected behavior:** The Status Action Bar should show the operational status chip only (dot + label from `StatusCell`), separate from the verification signal. This matches the two-signal model documented in `admin/DESIGN.md` and is how `MyJobsPage.tsx` already works (it uses `StatusCell` + `VerificationCell` independently).

**Fix:** Replace the local `StateCell` with the shared `StatusCell` component:
```diff
- import { getStateStyle, ... } from '../../../shared/statusStyles';
+ import StatusCell from '../components/StatusCell';

// In the status action bar JSX (line 442):
- <StateCell job={job} fontSize={12} withSubline={false} />
+ <StatusCell job={job} />
```

**Reference:** HMW-V19 (`19-hmw-status-verification-action-bar.html`) documents this bug and recommends Option C (StatusCell swap).

---

### AUDIT-02: Fleet data plumbing — seedDrivers/seedVehicles bypass localStorage fleet
**File:** `vendor/src/pages/JobDetailPage.tsx` lines 6–7, 104–105, 151–153  
**Severity:** High — Fleet page changes are invisible in job assignment dropdowns  

`JobDetailPage.tsx` imports `seedDrivers` and `seedVehicles` from `shared/mockData`:
```ts
import { seedDrivers, seedVehicles } from '../../../shared/mockData';
```
Then uses them to populate the driver/vehicle assignment dropdowns (line 104–105) and to look up the assigned driver/vehicle on confirm (lines 151–153).

`FleetPage.tsx` stores its data at `localStorage key: vendor_fleet_${vendorCode}` (see `FleetPage.tsx` lines 38–60). Drivers/vehicles added, edited, or deactivated via the Fleet page are **never read by `JobDetailPage.tsx`**, so the assignment dropdowns always show the 3 hardcoded seed records regardless of what the vendor has set up.

**Fix:** Read fleet data from localStorage in `JobDetailPage.tsx`, using the same `loadFleetData(vendorCode)` pattern as `FleetPage.tsx`. The function already handles the seed-data fallback.

```ts
// Instead of: const vendorDrivers = seedDrivers.filter(...)
// Use the same localStorage reader that FleetPage uses:
const [fleetData] = useState(() => loadFleetData(vendorCode));
const vendorDrivers = fleetData.drivers.filter((d) => d.isActive);
const vendorVehicles = fleetData.vehicles.filter((v) => v.isActive);
```

The `loadFleetData` function (or a version of it) should be extracted to a shared utility so both pages use the same source of truth.

**Reference:** HMW-V18 (`18-hmw-fleet-dispatch-availability.html`) lists this as a prerequisite bug.

---

## Design System Violations

### AUDIT-03: Proof of Service section missing upload drop zone
**File:** `vendor/src/pages/JobDetailPage.tsx` lines 186–204  
**Severity:** Medium — tablet/warehouse UX degraded; camera affordance absent  

The current "Proof of Service" section shows only a plain file list and a small "+ Add" button in the section header. Per `vendor/DESIGN.md`:

> Upload zone: dashed border (1.5px dashed rgba(21,44,255,0.25)), "Drop files here or browse", "📷 Take Photo" button

The dashed drop zone serves two purposes:
1. **Discoverability:** On an empty state ("No proof uploaded yet"), there is no visual affordance for drag-and-drop — only a small gray text link.
2. **Camera affordance:** The "📷 Take Photo" button (using `capture="environment"`) is the primary upload path for vendors at warehouses with tablets. It is completely absent.

The design spec in `vendor/DESIGN.md` also describes smart collapse behavior (HMW-V16): full drop zone when empty, compact "+ Add files" in header after first upload. The current implementation has neither the zone nor the collapse behavior.

**Impact:** Vendors at warehouses using tablets cannot easily photograph proof — the most common upload path for on-site cargo verification.

**Fix:** Implement the dashed drop zone on the empty state, with a `📷 Take Photo` button using `<input capture="environment">`. After first upload, collapse the zone and keep the small "+ Add" in the section header.

---

### AUDIT-04: Activity log count badge uses borderRadius: 6 (should be 4)
**File:** `vendor/src/pages/JobDetailPage.tsx` line 210  
**Severity:** Low — 2px visual inconsistency  

```tsx
<span style={{ ...mono, fontSize: 9, background: '#f3f4f6', color: '#9ca3af', 
  padding: '1px 5px', borderRadius: 6 }}>{log.length}</span>
```

Per `admin/DESIGN.md`: "Job chips: 4px" — inline data badges should use `borderRadius: 4`. The value `6` is the table-container radius, not the chip radius.

**Fix:** Change `borderRadius: 6` → `borderRadius: 4` on the activity log count badge.

---

### AUDIT-05: Cargo section layout deviates from design spec
**File:** `vendor/src/pages/JobDetailPage.tsx` lines 170–184 (`renderCargo`)  
**Severity:** Low — density regression from spec  

Current implementation renders Bags and Weight as two separate labeled columns (like a mini data grid). `vendor/DESIGN.md` specifies:

> Cargo — compact inline row: `24 bags · 1,280 kg · 8.4 CBM`

The inline row format is denser, matches the sub-table sub-line format already used in `MyJobsPage.tsx`, and avoids the `sectionWrap` overhead for a single line of data.

**Fix:** Replace the two-column layout with a single inline row:
```tsx
<div style={sectionWrap}>
  <div style={sectionTitle}>Cargo</div>
  <div style={{ ...mono, fontSize: 11, fontWeight: 600, color: '#111827' }}>
    {trip.bags.toLocaleString()} bags · {trip.weight.toLocaleString()} kg
    {trip.cbm ? ` · ${trip.cbm} CBM` : ''}
  </div>
</div>
```

---

### AUDIT-06: `rejectionReason` field still referenced
**File:** `vendor/src/pages/JobDetailPage.tsx` line 471  
**Severity:** Low — potential undefined access if field has been renamed  

```tsx
{job.verificationStatus === 'Rejected' && job.rejectionReason && (
```

TODO-026 renamed `rejectionReason` to `cancelReason` for job cancellation. Verify whether `rejectionReason` still exists on the `Job` type for verification rejection (distinct from job cancellation). If the type was cleaned up and verification rejection uses a different field name, this renders nothing on rejected jobs.

**Fix:** Check `shared/types.ts` — if `rejectionReason` still exists for verification rejections, no change needed. If it was removed or renamed, update this reference.

---

## No Violations Found

- **Status/Verification color tokens:** `MyJobsPage.tsx` correctly uses `StatusCell` + `VerificationCell` with the 5-signal color system. Colors match `admin/DESIGN.md` exactly.
- **Border radius:** Buttons (`borderRadius: 4`), section containers (`borderRadius: 6`), service pills (`borderRadius: 99`) all correct.
- **Shadows:** No box-shadows found on table or cards in either page. Status Action Bar tint backgrounds are per the spec table in `vendor/DESIGN.md`.
- **Typography:** Page title 16px/800, section labels 9px/700 uppercase, body 11–12px/500–600, mono data with JetBrains Mono — all within spec.
- **Accent `#152CFF`:** Used only on interactive elements (primary buttons, back link, active nav). Not on trip IDs, service tags, or data chrome.
- **No decorative colors:** No gradients, teal accents, rainbow status chips, or filled status badges found.
- **Inline styles:** All visual properties use inline styles, not Tailwind color/spacing classes.
- **Table structure:** `MyJobsPage.tsx` uses `<table>` with `border-collapse: collapse`. No card-grid layouts.
