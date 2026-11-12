# Design Audit — Teleport OS Vendor

> Run: 2026-11-12. Audit against `vendor/DESIGN.md` and `admin/DESIGN.md`.
> Prior run: 2026-11-07. Items AUDIT-01 through AUDIT-04 remain open (unchanged). AUDIT-05 resolved. AUDIT-06 is new.

## Critical (Functional Regressions)

### AUDIT-01: Fee Breakdown section missing from Job Detail page
**File:** `vendor/src/pages/JobDetailPage.tsx:500–517`
**Severity:** Critical — vendor reconciliation is the app's primary purpose
**Status:** Open (unchanged from 2026-11-07)

The service-adaptive layout renders:
```
FM:     renderDriverVehicle() → renderRoute() → renderCargo() → renderProofs() → renderActivityLog()
Non-FM: renderLocation() → renderHubOpsProgress() → renderCargo() → renderProofs() → renderActivityLog()
```

No `renderFees()` function exists in this file. The fee breakdown table (the reason vendors open the app) is not shown anywhere on the job detail page.

**Spec (`vendor/DESIGN.md`):**
FM: Dispatch Assignment → Pickup/Delivery Timeline → Cargo → **Fee Breakdown** → Proofs → Log
Non-FM: Location → Cargo → **Fee Breakdown** → Proofs → Log

**Fix:** Implement a `renderFees()` section that renders the fee breakdown table (read-only: Fee | Unit | Rate | Qty | Amount, with struck-through rows for removed fees and per-currency totals). Call it between `renderCargo()` and `renderProofs()` in both branches.

---

### AUDIT-02: Status Action Bar conflates Status + Verification into one label
**File:** `vendor/src/pages/JobDetailPage.tsx:49–68, 442`
**Severity:** High — design spec violation, misreports job state to vendors
**Status:** Open (unchanged from 2026-11-07)

A local `StateCell` function (lines 49–68) calls `getStateStyle()`, which merges Status + Verification into a single combined label. For a Completed + Rejected job, this shows "Verify rejected" instead of the correct operational status ("Completed").

The two-signal model (Status and Verification are independent) is a first-class design principle. `getStateStyle` was the old merged approach; `StatusCell` + `VerificationCell` are the corrected components.

**Spec:** Use `StatusCell` from `vendor/src/components/StatusCell.tsx` for the operational status chip in the action bar. The verification signal (Rejected/Verified) is handled by the bar color and hint text, which are already correct — only the chip needs fixing.

**Reference:** HMW-V19 (Open) documents this exact bug.

**Fix:**
1. Remove local `StateCell` function (lines 49–68) and `getStateStyle` import (line 9).
2. Import `StatusCell` from `../components/StatusCell`.
3. Replace `<StateCell job={job} fontSize={12} withSubline={false} />` at line 442 with `<StatusCell job={job} />`.

---

### AUDIT-03: Driver/Vehicle assignment loads seed data instead of fleet localStorage
**File:** `vendor/src/pages/JobDetailPage.tsx:6, 104–105, 151–153, 298`
**Severity:** High — functional bug; drivers added via Fleet page don't appear in job assignment dropdowns
**Status:** Open (unchanged from 2026-11-07)

Lines 104–105:
```ts
const vendorDrivers = seedDrivers.filter((d) => d.vendorCode === vendorCode && d.isActive);
const vendorVehicles = seedVehicles.filter((v) => v.vendorCode === vendorCode && v.isActive);
```

`seedDrivers` and `seedVehicles` are static fixtures. The Fleet page stores data under `vendor_fleet_{vendorCode}` in localStorage. Any driver or vehicle added via FleetPage is invisible to the assignment dropdowns.

Lines 151–153 repeat the error on save. Line 298 uses `seedDrivers` again in the `onChange` handler for the driver select.

**Reference:** HMW-V18 (Open) flags this as a prerequisite: "Fix `JobDetailPage.tsx` data plumbing — currently loads `seedDrivers`/`seedVehicles` instead of Fleet page's localStorage fleet data."

**Fix:** Load fleet data from `localStorage.getItem('vendor_fleet_' + vendorCode)` and fall back to seed data if absent, mirroring `FleetPage.tsx`'s `loadFleetData()` helper (lines 47–62 of FleetPage.tsx). Use the loaded lists in the dropdown render, `onChange` handlers, and save handler.

---

## Design Spec Deviations

### AUDIT-04: FM route section shows date abbreviations — pickup time absent entirely
**File:** `vendor/src/pages/JobDetailPage.tsx:333–358`
**Severity:** Medium — spec calls for 20px JetBrains Mono time as primary visual anchor
**Status:** Open (unchanged from 2026-11-07)

`renderRoute()` shows:
- Location names at 11px
- Date abbreviation sub-line (e.g., "12 Nov") via `fmtDateMono`
- **Pickup time is not shown at all**

The DESIGN.md spec (and HMW-V14 resolution) requires:
> "Time-first hero — 20px JetBrains Mono time as largest element, location name and date as secondary lines below"

The dispatcher's primary question is "when?" not "where?". Hiding the pickup time behind a date string actively hides urgency.

**Fix:** Render `fmtTime(job.origin.date)` at 20px JetBrains Mono as the primary text, with location name at 11px and date at 10px muted mono below. See `14-hmw-fm-timeline-times.html` for the designed layout.

---

### AUDIT-06: Proof upload zone not implemented — minimal "+ Add" button only
**File:** `vendor/src/pages/JobDetailPage.tsx:186–204`
**Severity:** Low — degrades tablet on-site capture experience; core upload still works
**Status:** New (found 2026-11-12)

Current implementation in `renderProofs()`: when `canUpload` is true, shows a small "+ Add" button in the section header. The file input is hidden (`display: 'none'`). No visible upload zone, no drag-and-drop, no camera shortcut.

**Spec (`vendor/DESIGN.md`):**
- Upload zone: dashed border (1.5px dashed rgba(21,44,255,0.25)), "Drop files here or browse", "📷 Take Photo" button using `capture="environment"` for on-site photo capture
- When files exist → zone collapses to compact "+ Add files" (HMW-V16, Option B smart collapse)
- Currently both zero-file state and existing-files state use the same "+ Add" button, which meets neither design intent

The dashed zone is the primary discoverability surface for first-time upload — without it, vendors on tablets may not find the upload action.

**Fix:** When `proofs.length === 0 && canUpload`, render a dashed zone (120px height, 1.5px dashed `rgba(21,44,255,0.25)`, 4px radius, centered text "Drop files or browse" + "📷 Take Photo" button with `capture="environment"`). When `proofs.length > 0 && canUpload`, collapse to the compact "+ Add" button already present (current behavior). See `16-hmw-proof-upload-zone.html`.

---

## Resolved

### ~~AUDIT-05: Rejection reason references `job.rejectionReason` (old field name)~~
**Resolved:** 2026-11-12. `shared/types.ts:75` confirms `rejectionReason?: string` is the current field name for verification rejection reason (distinct from `cancelReason` on line 80 for job cancellation). The reference at `JobDetailPage.tsx:471` is correct.

---

## Compliant (no violations found)

- **Navbar.tsx** — Colors, sizing, avatar initials, vendor label, border-radius all correct.
- **MyJobsPage.tsx** — Table density, pill styling, two-column Status+Verification, filter bar, service pills all correct. Pagination buttons correctly use blue only for active state. Service pill border-radius is 99px (full round — correct per design system). Filter bar background is white with 1px `#e5e7eb` bottom border (correct). Trip IDs are ink mono `#111827` (no blue chip). Service tags are mono gray `#6b7280` (no pill). No decorative colors or Tailwind classes.
- **FleetPage.tsx** — Tab styling, truck type as mono gray (not blue), status dots (green/ghost), CRUD table density, border-radius ≤6px all correct. No decorative colors or shadows. `loadFleetData()` correctly reads from `localStorage.getItem('vendor_fleet_' + vendorCode)`.
- **StatusCell.tsx / VerificationCell.tsx** — Correct dot+label+timestamp pattern.
- **DateRangePopover.tsx** — Popover styling matches admin pattern.

---

## Design Exploration Coverage (priority TODOs as of 2026-11-12)

All four priority TODOs from the scheduled task have HMW coverage and do not require new design exploration:

| TODO | Status | HMW coverage |
|------|--------|-------------|
| TODO-046: Service-adaptive vendor job views | ✅ Implemented | HMW-V04, HMW-V07, HMW-V08 |
| TODO-047: Vendor fleet master data | ✅ Implemented | HMW-V03 |
| TODO-048: Driver + vehicle assignment | ✅ Implemented | HMW-V07 |
| TODO-049: WeChat Mini Program | Pending implementation | HMW-V09 (Open) |

Next design exploration candidates (no existing mockup): none in TODOS.md. Next frontier is implementing open HMW decisions (HMW-V09 WeChat, HMW-V18 fleet availability, HMW-V19 status bar fix).
