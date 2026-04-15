# HMW-58: L2 Subservices per Job

## Context
Jobs have 1 L1 service but need multiple L2 subservices. The L1/L2 hierarchy exists in `shared/types.ts` (`SERVICE_HIERARCHY`: CR=2, CS=6, EC=3, FM=3, OH=5 L2s). User needs L2 selection in create/edit trip, display in job detail, and export at job × subservice level.

## Design Decision
**Scrollable checklist** — fixed-height (~80px) scrollable box with checkboxes per job. All unchecked by default (opt-in). Scales to 10+ L2s.
Mockup: `admin/design-hypotheses/58-hmw-subservices-per-job.html`

## Implementation

### 1. Data model — `shared/types.ts`
- Add `l2CostIds: string[]` to `Job` interface (line ~66), default `[]`
- Remove `unit: RateUnit` from `L2SubService` interface (line ~246)
- Remove `unit` values from all L2 entries in `SERVICE_HIERARCHY` (lines ~261-306)

### 2. Create Trip — `admin/src/pages/CreateTripPage.tsx`
- Add `l2CostIds: string[]` to inline `JobDraft` type (line ~13)
- Initialize as `[]` in `addJobForService()` (line ~91) and `addAllServices()` (line ~105)
- Render scrollable checklist below vendor/location fields per job (after line ~420):
  - Container: `max-height: 80px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 4px; background: #fff`
  - Get L2s from `SERVICE_HIERARCHY` by job's `serviceCode`
  - Each row: checkbox + L2 name + cost ID (mono, right-aligned)
  - Toggle updates `l2CostIds` via `updateJob()`
- Include `l2CostIds` when dispatching `ADD_JOB` on submit

### 3. Edit Trip — `admin/src/pages/EditTripPage.tsx`
- Add `l2CostIds: string[]` to `JobDraft` interface (line ~14)
- Initialize from existing `job.l2CostIds ?? []` for editable jobs
- Same scrollable checklist UI as CreateTripPage
- Locked jobs: show checked L2s as disabled checkboxes
- Include `l2CostIds` in UPDATE_JOB dispatch

### 4. Job Detail — `admin/src/components/trips/JobSlideOut.tsx`
- Add "Subservices" section between Route (line ~195) and Proof of Service (line ~197)
- List checked L2s: cost ID (mono) + name
- Empty state: "No subservices selected"
- Editable until Verified (same lock rules as fees)

### 5. Export — `admin/src/pages/JobsPage.tsx`
- Modify `exportJobsCSV()` (line ~55) to flatMap jobs by `l2CostIds`
- Each checked L2 = 1 CSV row, job columns repeat
- Add columns: Cost ID, Subservice (L2) — NO unit column
- Jobs with empty `l2CostIds` → 0 export rows
- Use `getL2ByCostId()` from `shared/types.ts` to resolve names

### 6. Clean up unit references
- Remove `unit` from `L2SubService` interface in `shared/types.ts`
- Remove `unit` values from `SERVICE_HIERARCHY` entries
- Update any code referencing `l2.unit` (check `seedVendorFees`, master data services tab)

### 7. Seed data — `shared/mockData.ts`
- Add `l2CostIds` to seed jobs with realistic selections

## Files to modify
| File | Change |
|------|--------|
| `shared/types.ts` | Add `l2CostIds` to Job, remove `unit` from `L2SubService` |
| `admin/src/pages/CreateTripPage.tsx` | l2CostIds in JobDraft + scrollable checklist UI |
| `admin/src/pages/EditTripPage.tsx` | Mirror create page changes |
| `admin/src/components/trips/JobSlideOut.tsx` | Subservices display section |
| `admin/src/pages/JobsPage.tsx` | Export flatMap at job × subservice level (no unit col) |
| `shared/mockData.ts` | Add l2CostIds to seed jobs |

## Verification
1. Create a trip with OH + CS + FM jobs, check different L2s on each
2. Verify scrollable box works (CS with 6 L2s scrolls at ~80px)
3. Edit trip — verify L2 checkboxes persist, locked jobs are read-only
4. Open job slide-out — verify selected L2s display (no unit shown)
5. Export CSV — verify job × subservice row structure, no Unit column
6. Jobs with 0 checked L2s produce 0 export rows
7. Master data services tab — verify unit is removed from L2 display
