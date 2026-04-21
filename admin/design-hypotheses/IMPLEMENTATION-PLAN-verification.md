# Implementation Plan — Verification Lifecycle

**Scope:** Implement Kim's feedback (Apr 17, 2026) separating Job Verification Status from Job Status, with Reject (per-job, reason required), Unverify, timestamps, and trip-level rollups.

**Design references:**
- HMW-60 — Verification column + reject UX on Jobs page
- HMW-61 — Timestamp surfacing on status & verification chips
- HMW-63 — Trips page status + verification columns (with red row tint for rejected jobs)

**Authoritative behavior spec — carry these rules into every subagent prompt:**

1. **Job Status:** `'Pending' | 'In Progress' | 'Completed' | 'Cancelled'`. No `'Verified'` here.
2. **Verification Status:** `'Pending' | 'Verified' | 'Rejected'`. Only meaningful when Job Status ≥ Completed.
3. **Reject:** per-job (not per-document). Requires non-empty reason. Flips `verificationStatus` to `'Rejected'`. Does NOT change Job Status. Vendor notified via UI callout.
4. **Re-upload after reject:** when a vendor adds a new proof while `verificationStatus === 'Rejected'`, flip verification back to `'Pending'`. Admin re-reviews.
5. **Unverify ≠ Reject.** Unverify = admin self-correction, no reason required, flips `verificationStatus` from `'Verified'` back to `'Pending'`, keeps proofs.
6. **Trip Status** (derived, read-only): `'In Progress'` if any job In Progress; `'Completed'` if all non-cancelled jobs Completed; otherwise `'Pending'`.
7. **Trip Verification** (derived, read-only, binary): `'Verified'` if all non-cancelled jobs Verified; otherwise `'Pending'`. Rejected jobs do NOT bubble up to trip state.
8. **Trip row red tint:** any trip with at least one `verificationStatus === 'Rejected'` job gets the existing `.rj` row treatment.
9. **Timestamps:** every job stores `statusChangedAt` (updated on status transitions) and optional `verificationChangedAt` (updated on verification transitions). Activity log remains authoritative for full history.
10. **Color discipline** (from HMW-60 + saved memory): Status column = filled pill; Verification column = text-only (colored text + tiny dot, no filled background). Never stack two filled pills in one row.
11. **Simple > clever** (saved memory): don't add counts, progress bars, or badges we didn't design for.

---

## File-anchored change map

### Phase 1 — Foundation (serial, blocking)

#### 1a. `shared/types.ts`
- Narrow `JobStatus` to `'Pending' | 'In Progress' | 'Completed' | 'Cancelled'` (drop `'Verified'`).
- Add `VerificationStatus = 'Pending' | 'Verified' | 'Rejected'`.
- Job interface additions:
  - `verificationStatus: VerificationStatus`
  - `rejectionReason?: string` (populated when `verificationStatus === 'Rejected'`)
  - `statusChangedAt: string` (ISO)
  - `verificationChangedAt?: string` (ISO)
- Fix `getTripVerification()` / `deriveTripStatus()` (lines 323–340) to key off `verificationStatus`, not `status`.
- Export a new `deriveTripVerification(trip): 'Pending' | 'Verified'` helper for the Trips page.
- Export a new `tripHasRejectedJob(trip): boolean` helper for row tint + filter chip.

#### 1b. `shared/statusStyles.ts`
- Remove `'Verified'` case from `getStatusChipStyle` and `STATUS_LABELS`.
- Add `getVerificationChipStyle(v: VerificationStatus)` returning **text-only** styles — `{ color, dot }` only. No `bg`, no `border` (honors HMW-60 rule).
- Add `VERIFICATION_LABELS`.
- Add `formatRelativeTime(iso: string): string` per HMW-61 convention (just now / Nm ago / Nh ago / Nd ago / "Apr 12" / "Apr 12, 2025"). Deliberately one helper — don't scatter date-formatting.

#### 1c. `shared/TripContext.tsx`
- Bump `SEED_VERSION` → `'v17-verification-lifecycle'` (forces reseed; no schema migration needed).
- Update reducer:
  - `UPDATE_JOB_STATUS` → also set `statusChangedAt: now`.
  - `VERIFY_JOB` → set `verificationStatus: 'Verified'`, `verificationChangedAt: now`, clear `rejectionReason`. Does NOT change `job.status`.
  - Add `REJECT_JOB` (payload: `{ tripId, jobId, reason }`) → set `verificationStatus: 'Rejected'`, `rejectionReason`, `verificationChangedAt: now`. Actor = Ops Admin. Activity log entry: `Verification → Rejected: "<reason>"`.
  - Add `UNVERIFY_JOB` (payload: `{ tripId, jobId }`) → set `verificationStatus: 'Pending'`, clear `rejectionReason`, `verificationChangedAt: now`. Actor = Ops Admin. Activity log entry: `Verification → Pending (unverified)`.
  - Update `ADD_PROOF_DOCUMENT` → if current `verificationStatus === 'Rejected'`, flip it to `'Pending'` and update `verificationChangedAt`. Activity log: `Verification → Pending (vendor re-uploaded)`.
- Expose hook callbacks: `rejectJob(tripId, jobId, reason)`, `unverifyJob(tripId, jobId)`. Existing `verifyJob` keeps same signature but sets verification fields instead of status.

#### 1d. `shared/mockData.ts`
- Convert any seed job with `status: 'Verified'` → `status: 'Completed'`, `verificationStatus: 'Verified'`, populate `verificationChangedAt`. Preserve `statusChangedAt` from existing pickup/activity timestamps.
- Do NOT convert `status: 'Cancelled'` jobs to rejected — those are genuinely cancelled. Keep them as-is.
- Add one seeded Rejected job + one trip containing it (for QA walkthrough). Include `rejectionReason` like "Proof of delivery photo is blurry — license plate not readable."
- Add `statusChangedAt` + `verificationStatus: 'Pending'` to every seed job that doesn't already have them.

**Exit criteria for Phase 1:** TS compiles, app boots, localStorage reseeds cleanly, no references to `'Verified'` as a `JobStatus` remain anywhere in shared/.

---

### Phase 2 — Admin UI (parallel after Phase 1 merges)

#### 2a. Admin Jobs page — `admin/src/pages/JobsPage.tsx`
- Status filter: drop `'verified'`, keep `'active' | 'completed' | 'all'` (now Completed means Job Status = Completed, regardless of verification).
- **New Verification filter** (separate control, right of Status): `All | Pending | Verified | Rejected`.
- STATUS_ORDER update: sort by `status` primarily, then by `verificationStatus` (Rejected first among Completed jobs).
- CSV export: add two separate columns `Job Status`, `Verification Status`, plus `Status Updated`, `Verification Updated` (ISO).
- Table: add **Verification** column after Status (narrow ~100px, text-only styling per HMW-60).
- Under every Status chip render inline `formatRelativeTime(statusChangedAt)` in mono 9px gray (HMW-61).
- Under every Verification tag render inline `formatRelativeTime(verificationChangedAt)` when present; em-dash when Verification is Pending-unset (i.e., job hasn't reached Completed yet).
- Tooltip on each chip: absolute timestamp + attribution (`Apr 20, 2026 · 14:32 · by Ops Admin` / vendor name).
- Row hover stays as-is. Add red `.rj` tint via existing pattern when `verificationStatus === 'Rejected'`.
- **L2 subservices edit entry** from Jobs row: add an "Edit L2" button inside the existing JobSlideOut (port the component used in EditTripPage). No new slide-out, no new route.

#### 2b. Admin Trips page — `admin/src/pages/TripsPage.tsx`
- Add two trip-row columns: **Status** (filled pill, derived via `deriveTripStatus`), **Verification** (text-only tag, derived via `deriveTripVerification`). No timestamps on trip rows.
- Add filter bar groups:
  - **Status**: `All | Pending | In Progress | Completed`
  - **Verification**: `All | Pending | Verified | Has Rejected` — the "Has Rejected" chip is a filter shortcut calling `tripHasRejectedJob(t)`, not a verification state.
- Row tint: add `.rj` className to any trip row where `tripHasRejectedJob(trip) === true`.
- Expanded sub-rows (existing): job chips inherit HMW-60 (Status pill + Verification text) and HMW-61 (inline timestamps + tooltip). No new sub-row design — pull rendering helpers from JobsPage work.
- CSV export: add `Trip Status`, `Trip Verification` columns.
- Remove or repurpose the HMW-54 "N/M verified" progress bar display from current trip rows — superseded.

#### 2c. Slide-out — `admin/src/components/trips/JobSlideOut.tsx`
- Add two action bars (stacked top of panel), replacing the single current status bar:
  1. **Status Action Bar** (existing, minor refactor): shows current `job.status`, primary action per HMW-49 (Start Job / upload hint / "ready for verification" hint).
  2. **Verification Action Bar** (new, below Status bar): only rendered when `job.status === 'Completed'`.
     - If `verificationStatus === 'Pending'` → amber bar "Awaiting Verification" + [Reject] (danger styling) + [✓ Verify] (primary styling)
     - If `verificationStatus === 'Verified'` → green bar "Verified · <relative> · <actor>" + [Unverify to edit]
     - If `verificationStatus === 'Rejected'` → red bar "Rejected · <relative>" + rejection reason readout + [Re-verify] (opens the same Verify confirmation) + [Unreject → back to Pending]
- **Reject flow:** click [Reject] → inline reason form appears within the panel body (not a separate modal). Textarea + "Confirm Reject" button. On confirm: dispatch `rejectJob(tripId, jobId, reason.trim())`. Validate non-empty.
- **Fees/quantities editability:** Job remains editable until `verificationStatus === 'Verified'`. Unverify re-opens editing. Current "editable until Completed" logic needs to change — now it's "editable until Verified."

#### 2d. Edit Trip page — `admin/src/pages/EditTripPage.tsx`
- Lock logic (lines 28, 74–93): treat a job as locked for editing when
  `LOCKED_STATUSES.has(job.status) || job.verificationStatus === 'Verified' || job.verificationStatus === 'Rejected'`.
- Rationale: Rejected jobs should not be edited by admin until vendor re-uploads (then verification returns to Pending and editability returns).

---

### Phase 3 — Vendor UI (parallel with Phase 2 after Phase 1)

#### 3a. Vendor Job Detail — `vendor/src/pages/JobDetailPage.tsx`
- When `job.verificationStatus === 'Rejected'`:
  - Render a red-border callout at the top of the detail page, above proofs.
  - Callout content: "Verification Rejected" label, the `rejectionReason` text, and metadata line "Rejected by Ops Admin · <absolute timestamp>".
  - Primary CTA: "Upload New Proof" — same upload flow as existing. On successful upload, rely on reducer to auto-flip verification to Pending (no extra wiring).
- When `job.verificationStatus === 'Verified'` and Status is Completed: render a subtle green verified badge near the top (read-only celebration; doesn't block anything).
- Show `verificationStatus` text next to Job Status header.
- Ensure `canUpload` / `canAssign` still permit upload when Rejected (that's the whole point).

#### 3b. Vendor My Jobs — `vendor/src/pages/MyJobsPage.tsx`
- Add a Verification column (same text-only treatment as admin).
- Add a **Verification** filter group (`All | Pending | Verified | Rejected`). Vendors will actively use Rejected filter to prioritize re-uploads.
- CSV export: add `Verification Status`.
- Inline timestamps below chips (HMW-61 convention).

---

### Phase 4 — QA & acceptance (main session)

Run both apps side-by-side. Walk through Kim's checklist against the built prototype:

| Kim | Behavior to verify |
|-----|--------------------|
| 1a | Trip row shows auto-derived Status pill (Pending/In Progress/Completed) |
| 1b | Trip flips to In Progress when any job starts (vendor Start Job) |
| 1c | Trip flips to Completed when all non-cancelled jobs Completed |
| 1 (filter) | Both Trip-level and Job-level filters present on their respective pages |
| 2a | Audit log captures status and verification transitions |
| 2b | Jobs page shows Verification column separate from Status |
| 2c | Trips page shows Verification column (binary) |
| 2d | Edit L2 services accessible from Jobs slide-out |
| Reject | Admin can reject with reason; vendor sees callout + can re-upload; verification flips to Pending on re-upload |
| Timestamps | Inline relative under every chip, absolute + attribution in tooltip |

Check the "simple > clever" principle: no trip-row counts, no progress bars, no duplicate colored pills.

---

## Subagent chunking

Main session (me) = QA + orchestration. Each chunk below → one Sonnet subagent with a self-contained prompt that includes: the behavior spec rules above, the exact file paths + line anchors, and explicit "don't touch" boundaries.

```
Phase 1 (serial, single subagent — shared foundation):
  chunk-1: types + statusStyles + TripContext + mockData (1a → 1d, one subagent end-to-end)

Phase 2 + 3 (parallel after chunk-1 lands):
  chunk-2a: Admin JobsPage (verification column, filters, timestamps, L2 edit entry)
  chunk-2b: Admin TripsPage (columns, Has Rejected filter, row tint)
  chunk-2c: JobSlideOut (verification action bar, reject flow, unverify, editability rules)
  chunk-2d: EditTripPage lock logic (tiny — fold into chunk-2a if subagent reports low load)
  chunk-3a: Vendor JobDetailPage (rejection callout, re-upload auto-unflag)
  chunk-3b: Vendor MyJobsPage (verification column + filter)

Phase 4 (main session only):
  QA walkthrough against Kim's checklist + design-hypothesis mockups.
```

**Parallelism rule:** chunks 2a, 2b, 2c, 3a, 3b are independent in terms of files touched and can run concurrently. 2d is trivial and best folded in. All consume the same Phase 1 foundation.

**Per-subagent prompt checklist** (I'll write fully when spawning):
- Link to behavior spec rules 1–11 above
- Link to the relevant HMW file(s)
- List of files to modify with line anchors
- List of files NOT to touch
- Explicit reminder on color discipline (one dominant pill per row) and simplicity (no extras)
- Reminder to add activity log entries for every state transition
- Ask subagent to compile TypeScript + run `npm run dev` sanity check before returning

---

## Open implementation questions (to resolve before spawning)

1. **Activity log attribution:** CLAUDE.md says admin actions log as "Ops Admin", vendor as vendor company name. The reducer doesn't currently know "who is acting" at dispatch time. Does the reducer hardcode "Ops Admin" for admin-originated actions and pull `vendorName` from the vendor context for vendor-originated ones, or do we pass an `actor` argument through the action payload? Pick one convention and apply uniformly.
2. **Cancelled jobs' verification status:** Cancelled jobs excluded from trip derivations per decision. But do they still carry a `verificationStatus` field (default `'Pending'`) or should cancellation force the field to a special value / skip it? Simplest: keep `'Pending'`, ignore in derivations. (Recommend: simplest.)
3. **Vendor re-upload unflag:** if multiple proofs exist and vendor uploads a fourth after rejection, does the reducer flip to Pending on ANY new upload, or only when the file count increases? (Recommend: ANY add-proof mutation while Rejected → flip.)

I'll confirm these with you before handing off to the Phase 1 subagent.
