# Design Audit — Teleport OS Vendor

> Last updated: 2026-09-16
> Scope: `vendor/src/` — checked against `admin/DESIGN.md` + `vendor/DESIGN.md`
> Method: Full file read of MyJobsPage.tsx, JobDetailPage.tsx, FleetPage.tsx, Navbar.tsx

---

## Summary

The vendor app is substantially compliant with the design system. The slop-reduction pass (2026-03-30) and the status model reconciliation (2026-04-21) have both landed cleanly. Three findings remain — one medium-severity inconsistency and two low-severity observations.

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
