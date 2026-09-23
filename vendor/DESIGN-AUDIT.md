# Design Audit — Teleport OS Vendor

> Last updated: 2026-09-23
> Scope: `vendor/src/` — checked against `admin/DESIGN.md` + `vendor/DESIGN.md`
> Method: Full file read of MyJobsPage.tsx, JobDetailPage.tsx, FleetPage.tsx, Navbar.tsx, StatusCell.tsx, shared/statusStyles.ts

---

## Summary

The vendor app is substantially compliant with the design system. The slop-reduction pass (2026-03-30) and the status model reconciliation (2026-04-21) have both landed cleanly. Five findings remain — two medium-severity data/component inconsistencies, one medium-severity signal-conflation issue, and two low-severity observations.

---

## Findings

### FINDING-01 — MEDIUM: `JobDetailPage.tsx` uses a local `StateCell` (merged) instead of shared `StatusCell`

**File:** `vendor/src/pages/JobDetailPage.tsx:49–68, 442`
**Standard:** 2026-04-21 decision — Status and Verification are **separate signals**. The platform uses `StatusCell` and `VerificationCell` (shared components) everywhere else to enforce this.

**Detail:**
`JobDetailPage.tsx` defines a local `StateCell` component (lines 49–68) that calls `getStateStyle`, the **merged** state style getter from before the 2026-04-21 split. This component is used on line 442 inside the Status Action Bar to render the current status.

The Status Action Bar is legitimately intended to show only the operational Status (not Verification) — so the **visual output** is currently correct for most states. However:

1. The component uses `getStateStyle` which may conflate status + verificationStatus in edge cases (e.g., if `getStateStyle` was updated to handle the split model differently).
2. Diverging from the shared `StatusCell` creates a maintenance burden — future changes to `StatusCell` won't automatically apply to the detail page header.
3. The Status Action Bar's left content (per `vendor/DESIGN.md`) should render the Status chip using the same shared component pattern for consistency.

**Recommended fix:** Replace the local `StateCell` at line 442 with the shared `StatusCell` component (already imported in other vendor pages). The `StatusCell` shows `status` only (operational signal), which is exactly what the Status Action Bar needs.

```tsx
// Before (line 442):
<StateCell job={job} fontSize={12} withSubline={false} />

// After:
import StatusCell from '../components/StatusCell';
// …
<StatusCell job={job} />
```

---

### FINDING-02 — LOW: `rejectionReason` field referenced in cancelled/rejected display logic

**File:** `vendor/src/pages/JobDetailPage.tsx:471`
**Standard:** TODO-026 (✅) renamed `rejectionReason → cancelReason` for operational cancellations. However, Verification rejection (when `verificationStatus === 'Rejected'`) may still use a different field.

**Detail:**
Line 471 references `job.rejectionReason` in the context of `verificationStatus === 'Rejected'`. This is logically separate from `job.cancelReason` (operational cancellation). The field name suggests it predates the rename and may not be populated if the type no longer declares it.

**Check needed:** Verify that `Job` type in `shared/types.ts` still declares `rejectionReason?: string` for verification rejection reasons (as distinct from `cancelReason` for status cancellations). If the field was removed or renamed as part of TODO-026, the rejection reason will silently never display.

---

### FINDING-03 — LOW: Filter bar has no search input (documented gap, not a violation)

**File:** `vendor/src/pages/MyJobsPage.tsx`
**Standard:** `vendor/DESIGN.md` — "No search — no search input currently (future iteration)"

**Detail:**
The current filter bar (status pills + service pills + date range) has no text search. This is a documented intentional gap, not a design violation. The design exploration for this is captured in HMW-V17.

**Status:** Design explored in `vendor/design-hypotheses/17-hmw-vendor-job-search.html`. Awaiting user decision before implementation.

---

### FINDING-04 — MEDIUM: `JobDetailPage.tsx` loads fleet data from seed constants, not Fleet page's localStorage store

**File:** `vendor/src/pages/JobDetailPage.tsx:104–105, 151–153`
**Standard:** Fleet page (TODO-047 ✅) stores vendor fleet data under `localStorage` key `vendor_fleet_{vendorCode}`. Driver and vehicle additions via the Fleet page are persisted there.

**Detail:**
`JobDetailPage.tsx` lines 104–105 query `seedDrivers` and `seedVehicles` directly (hardcoded imports from `shared/mockData`):
```ts
const vendorDrivers = seedDrivers.filter((d) => d.vendorCode === vendorCode && d.isActive);
const vendorVehicles = seedVehicles.filter((v) => v.vendorCode === vendorCode && v.isActive);
```
And lines 151–153 also look up driver/vehicle from the same seed arrays for the `handleAssignDispatch` function.

This means: any driver or vehicle added, edited, or deactivated via the **Fleet** page is invisible in the **Job Detail dispatch dropdowns**. The two views are out of sync. A dispatcher who adds a new driver in Fleet and then opens a job expects to see that driver in the assignment dropdown — currently they won't.

**Recommended fix:** Replace the direct seed imports with the same `loadFleetData(vendorCode)` helper the Fleet page already uses:
```ts
import { loadFleetData } from '../pages/FleetPage'; // or extract to a shared util
const { drivers: vendorDrivers, vehicles: vendorVehicles } = useMemo(
  () => vendorCode ? loadFleetData(vendorCode) : { drivers: [], vehicles: [] },
  [vendorCode]
);
const activeDrivers = vendorDrivers.filter(d => d.isActive);
const activeVehicles = vendorVehicles.filter(v => v.isActive);
```
Alternatively, extract `loadFleetData` and `saveFleetData` into a shared utility file (e.g., `vendor/src/utils/fleetStorage.ts`) so both pages import from the same place.

**Severity note:** This is a data-plumbing bug, not a visual design violation. However, it is the prerequisite for the HMW-V18 Option B (dispatch availability column) — availability can only be derived correctly once the data pipeline is end-to-end.

---

### FINDING-05 — MEDIUM: Status Action Bar shows merged label ("Verify rejected") instead of independent Status chip

**File:** `vendor/src/pages/JobDetailPage.tsx:442`
**Standard:** 2026-04-21 client status model — Status and Verification are **separate independent signals**. The "Status chip" in the action bar (per `vendor/DESIGN.md`) must reflect only the operational `status` field.

**Detail:**
FINDING-01 noted that `JobDetailPage.tsx` uses a local `StateCell` component calling `getStateStyle()`. The impact is more specific than just a maintenance concern: for a job with `status === 'Completed'` and `verificationStatus === 'Rejected'`, `getStateStyle()` returns `{ label: 'Verify rejected', dot: '#dc2626' }` (see `shared/statusStyles.ts:40–41`). This makes the Status chip in the action bar show **"Verify rejected"** instead of **"Completed"**.

This breaks the design system's separation principle:
- The operational **Status** is "Completed" (the work was done; amber dot)
- The billing-gate **Verification** is "Rejected" (the proof needs resubmission; red)
- The current output collapses both into a single merged label "Verify rejected"

The bar background being red is correct (urgency signal). But the chip label is wrong — a vendor who understands the two-signal model would be confused to see their job described as "Verify rejected" when the correct reading is "Completed, verification rejected."

**Design exploration:** HMW-V19 (`19-hmw-status-verification-action-bar.html`) explores three options. **Verdict: Option C** — replace `StateCell` at line 442 with `StatusCell` (status-only chip) and add an inline verification badge that appears only when verification is Rejected. This is a two-line implementation change with no layout impact.

**Recommended fix:**
```tsx
// Before (line 442, inside the Status Action Bar IIFE):
<StateCell job={job} fontSize={12} withSubline={false} />

// After:
import StatusCell from '../components/StatusCell';
// The verification badge (only shown when Rejected):
<>
  <StatusCell job={job} />
  {job.verificationStatus === 'Rejected' && (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'1px 6px',
      borderRadius:4, border:'1px solid #fecaca', background:'rgba(220,38,38,0.06)',
      fontSize:9, fontWeight:600, color:'#dc2626' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:'#dc2626' }} />
      Verification rejected
    </span>
  )}
</>
```

---

## Clean Areas (no violations found)

| Area | Verdict | Notes |
|------|---------|-------|
| Colors | ✅ Clean | All status dots/text use the 5-color system exactly. `#152CFF` used only on interactive elements (buttons, active nav, active service pills, pagination). No decorative colors. |
| Border radius | ✅ Clean | 4px on inputs/buttons, 6px on containers, 99px on service pills. No violations. |
| Shadows | ✅ Clean | No `boxShadow` found on any data surface. Borders used throughout. |
| Typography | ✅ Clean | Table headers 9px/600/uppercase, body 11px, mono data in JetBrains Mono. Consistent across pages. |
| Table density | ✅ Clean | `padding: 7px 12px` on cells, `6px 12px` on headers — matches spec. |
| Navbar | ✅ Clean | 40px height, dark bg `#111827`, vendor name + initials avatar, correct logo treatment. |
| Status/Verification cells (My Jobs) | ✅ Clean | Shared `StatusCell` + `VerificationCell` used correctly. Dot + label + timestamp subline. No filled chips. |
| Service tags | ✅ Clean | Mono gray `#6b7280`, 10px JetBrains Mono — no blue, no pill chrome. |
| Trip ID | ✅ Clean | Ink mono `#111827`, 10px — no chip, no blue. |
| Fleet page (Drivers/Vehicles) | ✅ Clean | Dense CRUD table. Status as flat dot+text (green `#059669` active, ghost `#d1d5db` inactive). No filled badge. Plate numbers as ink mono. Truck type as mono gray. |
| Empty state | ✅ Clean | Muted text + `clear filters` link. No decorative icon, no tinted box. |
| Pagination | ✅ Clean | Active page uses `rgba(21,44,255,0.06)` bg + `#152CFF` text — correct interactive treatment. |

---

## Previously Resolved (for reference)

These were findings from the 2026-03-30 slop-reduction pass and are confirmed resolved:

- ~~Cards in VendorViewTab~~ — replaced with dense border-only section headers ✅
- ~~Shadow on JobCard/JobTable~~ — removed ✅
- ~~Emoji status icons~~ — removed ✅
- ~~Over-padded Login form~~ — tightened 32→20px ✅
- ~~Stats bar on My Jobs~~ — removed ✅
- ~~Blue chips for service tags~~ — replaced with mono gray ✅
- ~~Blue chip for Trip ID~~ — replaced with ink mono ✅
- ~~Single State column~~ — reverted to separate Status + Verification per client spec ✅
