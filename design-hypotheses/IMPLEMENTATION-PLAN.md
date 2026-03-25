# Implementation Plan — Iteration 3

## Approach
Rewrite the entire frontend in one pass based on all resolved design hypotheses.
Don't patch the current code — rebuild each screen from the mockups.

## Component Architecture (new/rewritten)

### New Components
1. **`SlideOutPanel.tsx`** — Generic slide-out from right. Props: isOpen, onClose, children. Handles overlay, animation, click-outside-to-close.
2. **`JobSlideOut.tsx`** — Job-specific content for the panel: status picker, route, services, proof upload, activity log, reassignment (when rejected). Used from both trip list and job detail.
3. **`ToastProvider.tsx` + `useToast()`** — Toast notification system. Context-based. Methods: toast.success(), toast.warning(), toast.error(). Auto-dismiss 4s. Stacks up to 3.
4. **`RejectionBanner.tsx`** — Alert banner at top of trip list. Shows count of rejected jobs + quick action button.
5. **`BillingChecklist.tsx`** — Readiness checklist for expanded trip view. Shows per-job: status check + proof check. "Validate" button when all pass.
6. **`ValidationPage.tsx`** — Dedicated page for billing admin. Shows only trips with all jobs completed. Validate/approve buttons.

### Rewritten Components
7. **`TripsPage.tsx`** — Full rewrite as table layout (from HMW-01 mockup). Columns: Customer, MAWB, Route, Jobs (inline chips), Created. Expandable rows show job cards + billing checklist.
8. **`ParentTripRow.tsx`** → **`TripTableRow.tsx`** — Table row with proper `<td>` cells. Inline job status chips. Red highlight for rejected. Expandable section below.
9. **`JobCard.tsx`** — Simplified. Removed inline activity log (moved to slide-out). Click card → opens SlideOutPanel.
10. **`CreateTripPage.tsx`** — Polish with resolved design system. Add success toast on creation.
11. **`JobDetailPage.tsx`** — Keep as full-page deep-dive. Add inline edit mode for trip-level fields. Link to slide-out is now the quick path; this page is the comprehensive path.

### Unchanged
- `mockData.ts` — types and seed data are correct
- `TripContext.tsx` — all actions already exist
- `ServiceMultiSelect.tsx` — works as-is
- `ServiceTag.tsx` — works as-is
- `StatusBadge.tsx` — works as-is

## Screen-by-Screen Plan

### Screen 1: Trip List (TripsPage)
```
┌─────────────────────────────────────────────┐
│ Nav: TripManager | Trips | Create | Valid.  │
├─────────────────────────────────────────────┤
│ [RejectionBanner — if any rejected jobs]    │
├─────────────────────────────────────────────┤
│ Page Title: "Trips"        [Export] [+New]  │
├─────────────────────────────────────────────┤
│ Dashboard Cards (4x)                        │
├─────────────────────────────────────────────┤
│ Filter Bar (MAWB, Customer, Date, Count)    │
├─────────────────────────────────────────────┤
│ TABLE                                       │
│ ┌───┬────────┬──────┬───────┬──────┬──────┐ │
│ │   │Customer│ MAWB │ Route │ Jobs │ Date │ │
│ ├───┼────────┼──────┼───────┼──────┼──────┤ │
│ │ ▸ │AliExp  │176-..│Yantia→│✓ FM  │08 Mar│ │
│ │ ▾ │Shopee  │176-..│Yantia→│● CR  │08 Mar│ │
│ │   │        │      │       │○ EC  │      │ │
│ │   ├────────┴──────┴───────┴──────┴──────┤ │
│ │   │ EXPANDED: Job Cards + Billing Check │ │
│ │   │ [J01 Hoboken ●] [J02 V3 ○]         │ │
│ │   │ Billing: 1/2 ready ████░░           │ │
│ ├───┼────────┬──────┬───────┬──────┬──────┤ │
│ │ ! │AliExp  │176-..│Qianhai│✕ REJ │09 Mar│ │ ← red highlight
│ └───┴────────┴──────┴───────┴──────┴──────┘ │
├─────────────────────────────────────────────┤
│ [SlideOutPanel — when job chip clicked]     │
│ Status picker / Route / Proof / Activity    │
└─────────────────────────────────────────────┘
```

### Screen 2: Create Trip
No structural changes. Polish:
- Toast on successful creation
- Redirect to trip list with "JUST CREATED" highlight on new row

### Screen 3: Job Detail
No structural changes. Add:
- Edit button for trip-level fields
- Link back to slide-out for quick actions

### Screen 4: Validation Page (NEW)
```
┌─────────────────────────────────────────────┐
│ Nav: TripManager | Trips | Create | Valid.  │
├─────────────────────────────────────────────┤
│ "Validation"                                │
│ Review completed trips for vendor payment   │
├─────────────────────────────────────────────┤
│ Tabs: [Ready (2)] [Incomplete (1)] [Done(4)]│
├─────────────────────────────────────────────┤
│ Trip card: AliExpress                       │
│ 1 job · All completed · All proofs ✓        │
│ Services: FM, OH  Total: 2    [✓ Validate]  │
├─────────────────────────────────────────────┤
│ Trip card: Shein                            │
│ 2 jobs · All completed · 1 proof missing ⚠  │
│ Services: FM, OH  Total: 2    [Validate 🔒] │
└─────────────────────────────────────────────┘
```

## Implementation Order
1. Toast system (used by everything else)
2. SlideOutPanel + JobSlideOut (core interaction)
3. TripTableRow rewrite (table layout)
4. TripsPage rewrite (table + dashboard + filters + rejection banner)
5. BillingChecklist (expanded view)
6. RejectionBanner
7. ValidationPage
8. Edit mode for trips
9. Polish: empty states, hover states, transitions
