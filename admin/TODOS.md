# TODOS — Teleport OS

## Completed

### ~~TODO-010: Create form — FM truck type + district picker (US-026/027)~~ ✅
Implemented: district pickers from Regions + truck type chip selector + FTL rate lookup.

### ~~TODO-011: Create form — vendor fee auto-populate for services (US-031)~~ ✅
Implemented: VendorFee lookup auto-populates all fees with subtractive model.

### ~~TODO-012: Slide-out — subtractive fee selection (HMW-43)~~ ✅
Implemented: ✓/+ toggle per fee, muted line-through for removed, active fee count, locked on validate.

### ~~TODO-013: CSV upload for service fee schedules (US-035)~~ ✅
Implemented: facility selector + CSV upload/download on EC/CS/CR/OH tabs. Template download, name matching, summary banner.

### ~~TODO-014: Vendors master data tab~~ ✅
Implemented: CRUD table with vendor code, name, service capabilities (FM/EC/CS/CR/OH chips), active/inactive toggle.

### ~~TODO-015: Customers master data tab~~ ✅
Implemented: CRUD table with customer code, name, active/inactive toggle, search.

### ~~TODO-016: Link facilities to districts~~ ✅
Implemented: `districtCode` field on Location interface. All 23 seed facilities mapped to GB/T 2260 codes. District name + code shown in Facilities table.

### ~~TODO-017: Old VendorRate type cleanup~~ ✅
Removed: VendorRate interface, seedRates, AddRateSlideOut component, all legacy rate actions (ADD_RATE, UPDATE_RATE, DEACTIVATE_RATE, AUTO_END_RATE). Updated ServicesTab and VendorComparisonPopover to use vendorFees.

### ~~TODO-018: Seed data alignment~~ ✅
Updated: DO-001 Gonda EC fees → 报关费/查验费/报关服务费, DO-001 Gonda CS fees → 地面操作费/安检费/货站操作费 with subtractive example, DO-008 CS → real vendor fees auto-populated.

## Design Debt

### TODO-019: HMW mockup for Add Rate form (never built)
- **What:** Create HTML mockup for the Add Rate slide-out form for vendor fee schedules.
- **Why:** TODO-001 from earlier — form was designed in spec but never mockuped.

## Iteration 10 — Jobs Page + Unified Status (completed)

### ~~TODO-020: Unified status lifecycle refactor~~ ✅
Implemented: Single `status` field: `Pending | In Progress | Completed | Verified | Cancelled`. Proof upload → Completed. Admin verify → Verified. Cancel → Cancelled (reassign resets to Pending).

### ~~TODO-021: 5-color status system~~ ✅
Implemented: gray (Pending), blue (In Progress), amber (Completed), green (Verified), red (Cancelled) across all components.

### ~~TODO-022: Jobs page~~ ✅
Implemented: `/jobs` route with flat power table, status pills, service filters, vendor dropdown, Group by toggle (None/Vendor/Service/Date). Percentage-based column widths (Route 38%).

### ~~TODO-023: Nav update~~ ✅
Implemented: Shipments | Jobs | Rates | Master Data.

### ~~TODO-024: Update Shipments page for new status model~~ ✅
Implemented: Stats bar, sub-table, and filter logic updated. Active = any job not Verified/Cancelled.

### ~~TODO-025: Slide-out panel — Status Action Bar~~ ✅
Implemented: Status Action Bar adapts per stage (Start Job / Upload hint / Verify / Ready for billing / Cancelled + reassign). Vendor reassignment wired up.

### ~~TODO-026: Rejected → Cancelled rename~~ ✅
Implemented: Renamed across all 11 source files. `cancelReason` replaces `rejectionReason`. 3PL can't reject — only admin cancels.

### ~~TODO-027: Jobs page column widths + page consistency~~ ✅
Implemented: Percentage-based columns, 1400px max-width matching DO page, Route ellipsis truncation.

## Iteration 11 — Cancellation, Reassignment & Partial Completion

### TODO-028: Data model — add cancellation & linkage fields
- **What:** Add `completionRemark?: string`, `replacedByJobId?: string`, `replacesJobId?: string` to Job interface. Make `cancelReason` mandatory when status = Cancelled.
- **Why:** Current model has no linkage between cancelled/replacement jobs, no completion remarks, and optional cancel reason. See PRD Iteration 11.
- **Files:** `shared/types.ts` (or `mockData.ts`)

### TODO-029: Remove vendor reassignment on cancelled jobs
- **What:** Remove the "Reassign Vendor" dropdown from JobSlideOut cancelled state and RejectedTab. Cancelled jobs become immutable — no vendor swap, no status reset.
- **Why:** Reassignment erases vendor A's history. New model: cancel + create new job instead.
- **Files:** `admin/src/components/trips/JobSlideOut.tsx`, `admin/src/components/trips/RejectedTab.tsx`

### TODO-030: Cancel Job action — inline form in slide-out (HMW-51)
- **What:** Add red outline "Cancel Job" button at bottom of slide-out for Pending/In Progress jobs. Clicking expands inline cancel form with:
  - Mandatory reason textarea (button disabled until filled)
  - "Create replacement job" checkbox + vendor picker
  - "Cancel & Replace" (red) and "Cancel Only" buttons
- **Why:** Ops needs to cancel and replace in one flow (80% case). HMW-51 Option A.
- **Files:** `admin/src/components/trips/JobSlideOut.tsx`

### TODO-031: Cancel & Replace atomic action
- **What:** Implement the "Cancel & Replace" action that atomically:
  1. Sets original job status → Cancelled with mandatory cancelReason
  2. Creates a new job on the same shipment (same service, same location, new vendor)
  3. Links them: original.replacedByJobId = new.id, new.replacesJobId = original.id
  4. Adds activity log entries to both jobs
- **Why:** Replacement must be atomic with bidirectional linkage for audit trail.
- **Files:** `shared/TripContext.tsx`, `admin/src/components/trips/JobSlideOut.tsx`

### TODO-032: Cancelled state — immutable display + replacement link
- **What:** Update slide-out Cancelled state:
  - Red status bar (read-only)
  - Cancel reason in white box with red border + timestamp/author
  - "Replaced By" card with navigable link to replacement job (if exists)
  - No edit capability — everything read-only
- **Why:** Cancelled jobs are permanent records. Both admin and vendor must see the full history.
- **Files:** `admin/src/components/trips/JobSlideOut.tsx`

### TODO-033: Completion remark field + UI
- **What:** Add "Complete with Remark" option in slide-out. When completing a job (or after completion), admin can add a completion remark. Displayed as amber box below status bar.
- **Why:** Partial completion (pickup not ready) needs a remark explaining why fees are adjusted. Also useful for any completion note.
- **Files:** `admin/src/components/trips/JobSlideOut.tsx`

### TODO-034: Create Follow-up Job action
- **What:** Add "Create Follow-up Job" blue outline button on Completed jobs. Creates a new job (same service, same location, same or different vendor) linked via replacesJobId/replacedByJobId. Shows "Follow-up" / "Follows" labels instead of "Replaced By" / "Replaces."
- **Why:** Partial completion + retry (e.g., pickup not ready → 2nd attempt) needs a linked follow-up as a separate billing event.
- **Files:** `admin/src/components/trips/JobSlideOut.tsx`, `shared/TripContext.tsx`

### TODO-035: Replacement/follow-up link cards in slide-out
- **What:** Display navigable link cards in slide-out for both directions:
  - On cancelled/partial job: "Replaced By J05" or "Follow-up J06" → click opens that job
  - On replacement/follow-up job: "Replaces J02" or "Follows J01" → click opens original
- **Why:** Admin needs to trace the full chain. Navigable links prevent context-switching.
- **Files:** `admin/src/components/trips/JobSlideOut.tsx`

### TODO-036: Vendor app — cancel reason + completion remark visibility
- **What:** Update vendor job detail page to display:
  - Cancel reason (red box) for cancelled jobs
  - Completion remark (amber box) for completed jobs
  - No replacement/follow-up links (vendor doesn't need to see other vendors' jobs)
- **Why:** Vendors must see why their job was cancelled and understand partial completion adjustments.
- **Files:** `vendor/src/pages/JobDetailPage.tsx`

### TODO-037: Activity log entries for cancellation/replacement/follow-up
- **What:** Auto-create activity log entries for:
  - "Cancelled — [reason]" (on cancelled job)
  - "Cancelled — replaced by J05 (HaleSun)" (on cancelled job when replacement created)
  - "Job created — replaces J02 (Gonda, cancelled)" (on replacement job)
  - "Job created — follows J01 (pickup not ready)" (on follow-up job)
- **Why:** Complete audit trail for billing reconciliation.
- **Files:** `shared/TripContext.tsx`
