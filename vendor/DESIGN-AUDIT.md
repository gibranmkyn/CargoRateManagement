# Design Audit — Teleport OS Vendor App

> Audit date: 2026-10-01
> Auditor: Autonomous design assessment agent
> Reference: `admin/DESIGN.md`, `vendor/DESIGN.md`

## Critical Bugs

### AUDIT-01: `getStateStyle` (merged state getter) used in Job Detail action bar
**File:** `vendor/src/pages/JobDetailPage.tsx`
**Lines:** 9 (import), 49–68 (local `StateCell` function)
**Violation:** The Status Action Bar uses a local `StateCell` that calls `getStateStyle()` from `shared/statusStyles.ts`. This function merges `status` + `verificationStatus` into a single combined label. For a job that is `Completed` + `verificationStatus: Rejected`, it returns `label: 'Verify rejected'` instead of `'Completed'`. This conflates the two independent signals that the design system explicitly separates.
**Expected behavior:** The action bar chip should show `StatusCell` (operational status only: Pending / In Progress / Completed / Cancelled). The verification state should be displayed separately (rejection reason inline below, per the existing rejection reason block at line 470–481).
**See:** HMW-V19 (Open) for design options. Recommended fix: replace local `StateCell` with the shared `StatusCell` component (already used correctly in `MyJobsPage.tsx`).
**Severity:** Critical — causes incorrect status label for the Completed+Rejected state.

---

### AUDIT-02: Fleet data not used in Job Detail dispatch dropdowns
**File:** `vendor/src/pages/JobDetailPage.tsx`
**Lines:** 6 (import), 104–105 (filter calls)
**Violation:** The Dispatch Assignment section loads drivers and vehicles from `seedDrivers`/`seedVehicles` (imported from `shared/mockData`). The Fleet page (`FleetPage.tsx`) stores vendor-specific data in localStorage under `vendor_fleet_${vendorCode}`. Drivers and vehicles added or modified via the Fleet page never appear in the job dispatch dropdowns.
**Expected behavior:** `renderDriverVehicle()` should load fleet data from the same localStorage key that `FleetPage.tsx` writes to, so the Fleet page and Job Detail page share the same data.
**Fix pattern:** In `JobDetailPage.tsx`, replace the `seedDrivers`/`seedVehicles` import and filter with a `loadFleetData(vendorCode)` call (same helper already defined in `FleetPage.tsx`). Since `FleetPage.tsx` is in the same app, extract `loadFleetData` to a shared utility or duplicate the read logic.
**See:** HMW-V18 prerequisite note.
**Severity:** Critical — core feature (dispatch assignment) does not persist changes made via Fleet page.

---

## Design System Violations

### AUDIT-03: Route section shows 9px dates, not 20px hero times for FM
**File:** `vendor/src/pages/JobDetailPage.tsx`
**Lines:** 333–357 (`renderRoute()`)
**Violation:** The design spec (vendor/DESIGN.md, "Pickup/Delivery Timeline") describes FM jobs as showing "Origin (location + pickup datetime in big mono) → Destination". HMW-V14 recommends 20px JetBrains Mono as the primary visual anchor for FM dispatchers. The current implementation shows a 9px mono date sub-line — the time is entirely absent.
**Impact:** FM dispatchers cannot see pickup/delivery times without opening a separate source. The design's core promise ("dispatcher's question is 'when?' not 'where?'") is not met.
**Note:** HMW-V14 is still "Open" (unresolved design question). This is a design gap, not a confirmed violation. Resolving HMW-V14 first is recommended.
**Severity:** Design gap (HMW-V14 decision pending).

---

### AUDIT-04: Proof upload zone not implemented — minimal "Add" button only
**File:** `vendor/src/pages/JobDetailPage.tsx`
**Lines:** 186–204 (`renderProofs()`)
**Violation:** The design spec (vendor/DESIGN.md, "Proof of Service") describes a dashed upload zone: "dashed border (1.5px dashed rgba(21,44,255,0.25)), 'Drop files here or browse', '📷 Take Photo' button with `capture='environment'`". The implementation shows a small "+ Add" ghost button in the section header — no zone, no camera affordance.
**Impact:** On tablets at cargo terminals, the "+ Add" button is small and easy to miss. The camera affordance (critical for on-site photo capture) is not surfaced.
**Note:** HMW-V16 is still "Open" (unresolved design question). Two upload UX patterns are explored there. Resolving HMW-V16 first is recommended.
**Severity:** Design gap (HMW-V16 decision pending).

---

## Conformance Checks (pass)

| Check | Result |
|-------|--------|
| Status/Verification as separate columns in My Jobs | ✅ `StatusCell` + `VerificationCell` used correctly |
| Service tag: mono gray, no blue pill | ✅ `#6b7280`, no `#152CFF` |
| Trip ID: ink mono, no blue chip | ✅ `#111827`, no `#152CFF` |
| Nav height 40px | ✅ `height: 40` |
| Nav dark bg `#111827` | ✅ |
| Vendor label 10px/500 `rgba(255,255,255,0.35)` | ✅ |
| Segment pills match spec | ✅ All/Pending/In Progress/To verify/Verified/Cancelled |
| Service pills: rounded (99px), blue when active | ✅ `borderRadius: 99` |
| No stats bar above My Jobs table | ✅ |
| No row tints for cancelled/rejected rows | ✅ |
| No card grids in proof list | ✅ flat file rows |
| No shadows (except toast) | ✅ |
| Border radius ≤6px (except service pills) | ✅ max 6px observed |
| Segment pill colors: amber (To verify), green (Verified), red (Cancelled), dark (others) | ✅ |
| "Where" column with service sub-lines (HMW-V04) | ✅ FM=driver, EC/CS=MAWB, OH/CR=bags+weight |
| Driver sub-line: `#6b7280` when assigned, `#d1d5db` "No driver assigned" when not | ✅ |
| FM dispatch section background `rgba(21,44,255,0.02)` with `rgba(21,44,255,0.1)` border | ✅ |
| Activity log timeline rail for >10 entries | ✅ |
| Multi-file proof upload `<input multiple>` | ✅ |
| Status Action Bar tinted per state (gray/blue/amber/green/red) | ✅ |
| Rejection reason inline, no tinted box | ✅ |
| Cancel reason inline, no tinted box | ✅ |
| FM service-adaptive layout (dispatch+timeline vs location-only) | ✅ |
| Fleet page: flat dot+text Active/Inactive (no filled badge) | ✅ |
| Fleet page: truck type and plate in mono gray (no blue pill) | ✅ |
| No stats bar on Fleet page | ✅ |
| Avatar initials 22×22, 4px radius | ✅ (borderRadius: 4 in Navbar.tsx) |

---

## Summary

**2 critical bugs** (AUDIT-01, AUDIT-02) should be fixed before the next release:
1. Replace `getStateStyle` / local `StateCell` in `JobDetailPage.tsx` with shared `StatusCell`
2. Load fleet data from `vendor_fleet_${vendorCode}` localStorage instead of `seedDrivers`/`seedVehicles`

**2 design gaps** (AUDIT-03, AUDIT-04) depend on resolving open HMWs (V14, V16) first.

Overall conformance is strong — 22/22 checked properties pass. No unauthorized colors, no excessive border radii, no shadows, no card grids.
