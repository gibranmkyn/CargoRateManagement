# Slop Reduction — Handoff Package

> **Source:** `Slop Audit.html` → 4-phase prototype in `phases/index.html`
> **For:** FE engineers integrating changes into the existing `CargoManagementSystem` codebase
> **Status:** Design approved · ready to implement

## What's in this package

```
handoff/
  README.md                  ← this file (start here)
  SPEC.md                    ← per-phase implementation spec
  DESIGN-DIFF.md             ← proposed edits to DESIGN.md
  src/
    shared/
      statusStyles.patch.ts  ← drop-in rewrite of statusStyles (adds getStateStyle)
    components/
      StateCell.tsx          ← NEW — single "State" column cell
      JobSlideOut.new.tsx    ← drop-in replacement (flattened)
    snippets/
      JobsPage.filter-bar.tsx    ← replace existing filter bar
      JobsPage.stats-bar.tsx     ← DELETE this block
      TripsPage.row-state.tsx    ← replace row Status+Verification cells
```

## Implementation order (recommended)

| # | Phase | Files touched | Risk | Impact |
|---|---|---|---|---|
| 1 | **P1 — Chrome** | `JobsPage.tsx`, `TripsPage.tsx` (delete stats bar; merge search; drop verification filter) | Low | High visual payoff |
| 2 | **P2 — State column** | `statusStyles.ts` (+ `getStateStyle`), `StateCell.tsx` (new), `JobsPage.tsx`, `TripsPage.tsx`, `MyJobsPage.tsx` | Medium | Cuts a column, removes ambiguity |
| 3 | **P3 — Slide-out** | `JobSlideOut.tsx` (replace), `JobDetailPage.tsx` (same action-row pattern) | Low-Medium | Kills stacked containers |
| 4 | **P4 — Color budget** | `ServiceTag.tsx`, Trip-ID chip in `JobsPage`, `FleetPage`, global CSS | Low (mechanical) | Hierarchy restored |

Phases are independent — P1 and P3 can ship in parallel.

## Key rules the code must enforce

1. **Blue = interactive only.** Not statuses, not IDs, not service tags, not proof icons.
2. **Verified replaces Completed**, not alongside it. Single `State` column.
3. **One colored container per panel** at a time (the one the user must act on).
4. **Amber is text only** — no tinted background containers.
5. **Row tints removed.** Use explicit chips/text for exception states.

See `SPEC.md` for per-phase detail, and `DESIGN-DIFF.md` for the changes to propagate into your design doc.

---

## Using the drop-in files

Each `.tsx` in `src/` targets its real location in your repo:

- `src/shared/statusStyles.patch.ts` → replaces `@shared/statusStyles.ts`
- `src/components/StateCell.tsx` → new file, place next to `ServiceTag.tsx`
- `src/components/JobSlideOut.new.tsx` → replaces `components/trips/JobSlideOut.tsx`

All imports already use your `@shared/` aliases and expect the `Job`, `Trip`, `JobStatus`, `VerificationStatus` types from `@shared/types`. Nothing needs rewiring — they're drop-ins.
