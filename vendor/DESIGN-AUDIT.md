# Design Audit — Teleport OS Vendor

> Run: 2026-11-07. Audit against `vendor/DESIGN.md` and `admin/DESIGN.md`.

## Critical (Functional Regressions)

### AUDIT-01: Fee Breakdown section missing from Job Detail page
**File:** `vendor/src/pages/JobDetailPage.tsx:501–517`
**Severity:** Critical — vendor reconciliation is the app's primary purpose

The service-adaptive layout renders:
```
FM:     renderDriverVehicle() → renderRoute() → renderCargo() → renderProofs() → renderActivityLog()
Non-FM: renderLocation() → renderHubOpsProgress() → renderCargo() → renderProofs() → renderActivityLog()
```

`renderFees()` is not called in either branch. The fee breakdown table (the reason vendors open the app) is not shown anywhere on the job detail page.

**Spec (`vendor/DESIGN.md`):**
FM: Dispatch Assignment → Pickup/Delivery Timeline → Cargo → **Fee Breakdown** → Proofs → Log
Non-FM: Location → Cargo → **Fee Breakdown** → Proofs → Log

**Fix:** Add `renderFees()` section between `renderCargo()` and `renderProofs()` in both branches.

---

### AUDIT-02: Status Action Bar conflates Status + Verification into one label
**File:** `vendor/src/pages/JobDetailPage.tsx:9, 47–68, 442`
**Severity:** High — design spec violation, misreports job state to vendors

A local `StateCell` component is defined using `getStateStyle()`, which merges Status + Verification into a single combined label. For a Completed + Rejected job, this shows "Verify rejected" instead of the correct status ("Completed").

The two-signal model (Status + Verification are independent) is a first-class design principle. `getStateStyle` was the old merged approach; `StatusCell` + `VerificationCell` are the corrected components.

**Spec:** Use `StatusCell` from `vendor/src/components/StatusCell.tsx` for the operational status chip in the action bar. The verification signal (Rejected/Verified) is handled by bar color + hint text, which is already correct — only the chip is wrong.

**Reference:** HMW-V19 (Open) documents this exact bug.

**Fix:**
1. Remove local `StateCell` function and `getStateStyle` import.
2. Import `StatusCell` from `../components/StatusCell`.
3. Replace `<StateCell job={job} fontSize={12} withSubline={false} />` at line 442 with `<StatusCell job={job} />`.

---

### AUDIT-03: Driver/Vehicle assignment loads seed data instead of fleet localStorage
**File:** `vendor/src/pages/JobDetailPage.tsx:6, 104–105, 151–153`
**Severity:** High — functional bug; drivers added via Fleet page don't appear in job assignment dropdowns

Lines 104–105:
```ts
const vendorDrivers = seedDrivers.filter((d) => d.vendorCode === vendorCode && d.isActive);
const vendorVehicles = seedVehicles.filter((v) => v.vendorCode === vendorCode && v.isActive);
```

`seedDrivers` and `seedVehicles` are static fixtures from `mockData.ts`. The Fleet page stores its data under `vendor_fleet_{vendorCode}` in localStorage. Any driver or vehicle added via FleetPage is invisible to the assignment dropdowns.

Lines 151–153 repeat the error on save:
```ts
const driver = seedDrivers.find((d) => d.id === selectedDriverId);
const vehicle = seedVehicles.find((v) => v.id === selectedVehicleId);
```

**Reference:** HMW-V18 (Open) flags this as a prerequisite: "Fix `JobDetailPage.tsx` data plumbing — currently loads `seedDrivers`/`seedVehicles` instead of Fleet page's localStorage fleet data."

**Fix:** Load fleet data from `localStorage.getItem('vendor_fleet_' + vendorCode)` and fall back to seed data if absent, mirroring `FleetPage.tsx`'s `loadFleetData()` helper. Then use the loaded lists in both the dropdown render and the save handler.

---

## Design Spec Deviations

### AUDIT-04: FM route section shows dates, not the big-mono-time hero layout
**File:** `vendor/src/pages/JobDetailPage.tsx:333–358`
**Severity:** Medium — spec calls for 20px JetBrains Mono time as primary visual anchor

`renderRoute()` shows location names at 11px with a date subline (`fmtDateMono` → "12 Nov"). The DESIGN.md spec (and HMW-V14 resolution) requires:

> "Time-first hero — 20px JetBrains Mono time as largest element, location name and date as secondary lines below"

The dispatcher's primary question is "when?" not "where?". Hiding the pickup time behind a date string actively hides urgency.

**Fix:** Render `fmtTime(job.origin.date)` at 20px JetBrains Mono as the primary text, with location name at 11px and date at 10px muted mono below. See `14-hmw-fm-timeline-times.html` for the designed layout.

---

### AUDIT-05: Rejection reason references `job.rejectionReason` (old field name)
**File:** `vendor/src/pages/JobDetailPage.tsx:471`
**Severity:** Low — verification rejection reason may not display

```tsx
{job.verificationStatus === 'Rejected' && job.rejectionReason && (
```

The active data model uses `job.rejectionReason` for verification rejections (distinct from `job.cancelReason` for job cancellations). If the shared types renamed this field, the rejection reason display will silently fail. Verify against `shared/types.ts` that `rejectionReason` is the current field name on the Job type for verification rejection reason.

---

## Compliant (no violations found)

- **Navbar.tsx** — Colors, sizing, avatar initials, vendor label, border-radius all correct.
- **MyJobsPage.tsx** — Table density, pill styling, two-column Status+Verification, filter bar, service pills all correct. Pagination buttons correctly use blue only for active state.
- **FleetPage.tsx** — Tab styling, truck type as mono gray (not blue), status dots (green/ghost), CRUD table density, border-radius ≤6px all correct. No decorative colors or shadows.
- **StatusCell.tsx / VerificationCell.tsx** — Correct dot+label+timestamp pattern.
