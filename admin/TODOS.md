# TODOS — Teleport OS Platform

## 2026-04-21 — Client Status Model Reconciliation (completed)

### ~~TODO-060: Foundation cells~~ ✅
`StatusCell`, `VerificationCell`, `TripStatusCell`, `TripVerificationCell` in `admin/src/components/trips/`. Deleted `StateCell` and `TripStateCell`. Helpers in `shared/statusStyles.ts`: `getJobStatusDot`, `getVerificationDot`, `getTripStatusDot`, `getTripVerificationDisplay`, `isTripCancelled`, re-exports `deriveTripStatus`/`deriveTripVerification`/`tripHasRejectedJob`.

### ~~TODO-061: UPDATE_JOB_STATUS audit logging~~ ✅
`shared/TripContext.tsx` reducer appends `{ action: 'Status → <NewStatus>', user: 'Ops Admin' }` to `job.activityLog` and sets `job.statusChangedAt` on every status change.

### ~~TODO-062: TripsPage restructure~~ ✅
Two trip-level columns: Trip Status + Trip Verification (replaced single TripStateCell). Sub-rows: StatusCell + VerificationCell (with `showReason`). Segment pills: `All / Pending / In Progress / Completed / Cancelled`. CSV split into Status, Status Updated, Verification, Verification Updated.

### ~~TODO-063: JobsPage restructure~~ ✅
Two job columns: StatusCell + VerificationCell (~9% each; Origin/Destination narrowed to 15%). Workflow pills: `All / Pending / In Progress / To verify / Verified / Cancelled`. Verification `<select>` dropdown removed. CSV columns: Status, Status Updated, Verification, Verification Updated.

### ~~TODO-064: JobSlideOut labeled pair~~ ✅
Header action row shows labeled "Status" (StatusCell + showReason) + "Verification" (VerificationCell + showReason). All action buttons (Start/Upload/Reject/Verify/Unverify/Re-verify/Re-upload) and "Edit L2" entry preserved.

### ~~TODO-065: Netlify `_redirects`~~ ✅
Added `/*  /index.html  200` to `admin/public/`, `vendor/public/`, `admin/dist/`, `vendor/dist/`.

## ~~PRIORITY: Vendor FM Trucking — Driver & Vehicle Assignment~~ (completed)

### ~~TODO-047: Vendor master data — Drivers and Vehicles~~ ✅
- **What:** Vendors need to manage their own fleet data within Teleport OS Vendor:
  - **Drivers:** name, phone number, WeChat ID, license plate (if fixed), active/inactive
  - **Vehicles:** plate number, truck type (1.5T/3T/5T/8T/10T/12T/40HQ/45HQ), capacity, active/inactive
- **Where:** New "Fleet" or "Master Data" page in vendor app (second nav item after My Jobs)
- **Data model:** `Driver` and `Vehicle` types in shared/types.ts. Vendor-scoped — each vendor manages their own. Stored in localStorage (prototype).
- **Files:** `shared/types.ts`, `vendor/src/pages/FleetPage.tsx` (new), `vendor/src/components/Navbar.tsx` (add nav item)

### ~~TODO-048: Assign driver + vehicle to FM Trucking jobs~~ ✅
- **What:** On vendor Job Detail page for FM Trucking jobs, vendor can assign a driver and vehicle from their fleet master data:
  - Driver dropdown (from vendor's driver list)
  - Vehicle dropdown (from vendor's vehicle list, filtered by compatible truck type)
  - Assignment saved on the job, visible in activity log
  - Can reassign before job is Completed
- **Where:** Vendor Job Detail page — new section between Status Action Bar and Fee Breakdown (only for FM service)
- **Files:** `vendor/src/pages/JobDetailPage.tsx`, `shared/types.ts` (add driverAssignment + vehicleAssignment fields to Job)

### TODO-049: WeChat Mini Program — driver job access
- **What:** When an FM job is assigned to a driver, the driver accesses the job via WeChat Mini Program:
  - Driver sees: pickup location + address, delivery location + address, pickup time, cargo details (bags, weight), customer name
  - Driver can: mark arrived at pickup, mark departed, mark arrived at delivery, upload proof photos (from phone camera)
  - Status updates from WeChat flow back to Teleport OS Vendor (and then to Admin via shared localStorage/API)
- **Design needed:** WeChat Mini Program has its own constraints (small screen, WeChat UI kit, camera-first). Needs separate design exploration.
- **Dependencies:** TODO-047 (driver master data), TODO-048 (driver assignment)
- **Note:** This introduces a 3rd app in the platform: Admin → Vendor → Driver (WeChat). The data flow is: Admin creates trip + assigns vendor → Vendor assigns driver + vehicle → Driver executes + uploads proof.

### TODO-050: Driver status updates flow back to vendor + admin
- **What:** When a driver updates status in WeChat (arrived at pickup, departed, arrived at delivery, proof uploaded), those updates must:
  - Update the job status in shared state
  - Add activity log entries with driver name as actor (e.g., "Driver Zhang Wei — Arrived at pickup")
  - Be visible in both vendor app and admin app
  - Proof photos uploaded by driver appear in the job's proof documents
- **Dependencies:** TODO-049 (WeChat Mini Program)
- **Files:** `shared/TripContext.tsx` (new actions for driver status), `shared/types.ts` (driver status enum)

## AI Slop Cleanup (from design audit 2026-03-29)

### ~~TODO-038: Delete or replace DashboardCards component (admin)~~ ✅
Deleted — component was unused (no imports anywhere).

### ~~TODO-039: Rewrite VendorViewTab — cards → table section headers (admin)~~ ✅
Replaced `rounded-xl` + shadow cards with dense border-only section headers using inline styles.

### ~~TODO-040: De-cardify vendor JobDetailPage~~ ✅
Route → compact inline row with MapPin. Cargo → single inline row (`24 bags · 1,280 kg`). Proofs → simple file list rows (no card boxes).

### ~~TODO-041: Remove shadow creep from admin interactive elements~~ ✅
JobCard: hover shadow → bg color change. JobTable: popover shadow removed. ServiceMultiSelect: dropdown shadow removed.

### ~~TODO-042: Replace emoji status icons in JobSlideOut (admin)~~ ✅
Removed emoji icon field from STATUS_LABELS — slide-out already uses colored dots consistently.

### ~~TODO-044: Vendor multi-file proof upload~~ ✅
Implemented: `<input multiple>` on both vendor JobDetailPage and admin JobSlideOut. Batch activity log entry ("Uploaded 3 files: ..."). Camera button on vendor upload zone.

### ~~TODO-045: Vendor job detail — show pickup/delivery dates for FM Trucking~~ ✅
Implemented: Service-adaptive layout. FM jobs show Pickup/Delivery Timeline with big mono times. Non-FM shows single Location row.

### ~~TODO-046: Service-adaptive vendor job views~~ ✅
Implemented: FM Trucking layout = Dispatch Assignment + Pickup/Delivery Timeline + Cargo. Non-FM layout = single Location + Cargo. Same skeleton, adaptive middle section.

### ~~TODO-047: Vendor fleet master data (Drivers & Vehicles)~~ ✅
Implemented: New FleetPage.tsx with Drivers/Vehicles tabs, dense CRUD tables, inline add/edit, active toggle. Nav updated: My Jobs | Fleet. Driver/Vehicle types in shared/types.ts. Seed data for HaleSun + The Lorry.

### ~~TODO-048: Assign driver + vehicle to FM Trucking jobs~~ ✅
Implemented: Dispatch Assignment section on vendor JobDetailPage for FM jobs only. Driver + vehicle dropdowns from fleet data. Auto-fills default vehicle from driver. Locked after Completed. Activity log on assignment.

### ~~TODO-043: Tighten vendor padding (minor)~~ ✅
Login form 32→20px. Upload zone 20→12px. Fee table header fontSize 8→9px.

## Completed

### ~~TODO-010: Create form — FM truck type + district picker (US-026/027)~~ ✅
Implemented: district pickers from Regions + truck type chip selector + FTL rate lookup. *(Rate lookup deferred — see project_rates_deferred.md)*

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

### ~~TODO-017: Old VendorRate type cleanup~~ ✅ *(Rate module deferred — see project_rates_deferred.md)*
Removed: VendorRate interface, seedRates, AddRateSlideOut component, all legacy rate actions (ADD_RATE, UPDATE_RATE, DEACTIVATE_RATE, AUTO_END_RATE). Updated ServicesTab and VendorComparisonPopover to use vendorFees.

### ~~TODO-018: Seed data alignment~~ ✅
Updated: DO-001 Gonda EC fees → 报关费/查验费/报关服务费, DO-001 Gonda CS fees → 地面操作费/安检费/货站操作费 with subtractive example, DO-008 CS → real vendor fees auto-populated.

## Design Debt

### ~~TODO-019: HMW mockup for Add Rate form~~ DEFERRED
- **What:** Create HTML mockup for the Add Rate slide-out form for vendor fee schedules.
- **Why:** TODO-001 from earlier — form was designed in spec but never mockuped.
- **Status:** Deferred — rate management module deferred (see project_rates_deferred.md).

## Iteration 10 — Jobs Page + Unified Status (completed)

### ~~TODO-020: Unified status lifecycle refactor~~ ✅
Implemented: Single `status` field: `Pending | In Progress | Completed | Verified | Cancelled`. Proof upload → Completed. Admin verify → Verified. Cancel → Cancelled (reassign resets to Pending).

### ~~TODO-021: 5-color status system~~ ✅
Implemented: gray (Pending), blue (In Progress), amber (Completed), green (Verified), red (Cancelled) across all components.

### ~~TODO-022: Jobs page~~ ✅
Implemented: `/jobs` route with flat power table, status pills, service filters, vendor dropdown, Group by toggle (None/Vendor/Service/Date). Percentage-based column widths (Route 38%).

### ~~TODO-023: Nav update~~ ✅
Implemented: Trips | Jobs | Master Data. *(Rates removed from nav — rate module deferred.)*

### ~~TODO-024: Update Trips page for new status model~~ ✅
Implemented: Stats bar, sub-table, and filter logic updated. Active = any job not Verified/Cancelled.

### ~~TODO-025: Slide-out panel — Status Action Bar~~ ✅
Implemented: Status Action Bar adapts per stage (Start Job / Upload hint / Verify / Ready for billing / Cancelled + reassign). Vendor reassignment wired up.

### ~~TODO-026: Rejected → Cancelled rename~~ ✅
Implemented: Renamed across all 11 source files. `cancelReason` replaces `rejectionReason`. 3PL can't reject — only admin cancels.

### ~~TODO-027: Jobs page column widths + page consistency~~ ✅
Implemented: Percentage-based columns, 1400px max-width matching DO page, Route ellipsis truncation.

## Iteration 11 — Cancellation, Reassignment & Partial Completion (completed)

### ~~TODO-028: Data model — add cancellation & linkage fields~~ ✅
Added `completionRemark`, `replacedByJobId`, `replacesJobId` to Job interface in shared/types.ts.

### ~~TODO-029: Remove vendor reassignment on cancelled jobs~~ ✅
Removed "Reassign Vendor" dropdown from JobSlideOut and RejectedTab. Cancelled jobs are now immutable. RejectedTab shows read-only cancel reason + replacement link.

### ~~TODO-030: Cancel Job action — inline form in slide-out (HMW-51)~~ ✅
Red outline "Cancel Job" button at bottom of slide-out for Pending/In Progress. Expands inline: mandatory reason + "Create replacement" checkbox + vendor picker + "Cancel & Replace" / "Cancel Only" buttons.

### ~~TODO-031: Cancel & Replace atomic action~~ ✅
CANCEL_AND_REPLACE action in TripContext: atomically cancels original (with reason + replacedByJobId) and creates new job (with replacesJobId + activity log). Wired in both TripsPage and JobsPage.

### ~~TODO-032: Cancelled state — immutable display + replacement link~~ ✅
Cancelled slide-out: red status bar (read-only), cancel reason in white/red box, "Replaced By" navigable link card. Header text strikethrough. No edit controls.

### ~~TODO-033: Completion remark field + UI~~ ✅
"+ Add Completion Remark" button on Completed jobs. Expands amber form with textarea. SET_COMPLETION_REMARK action in TripContext. Saved remark shows as amber box.

### ~~TODO-034: Create Follow-up Job action~~ ✅
"+ Create Follow-up Job" button on Completed jobs (no existing follow-up). CREATE_FOLLOWUP action in TripContext. Vendor picker defaults to same vendor. Linked via replacesJobId.

### ~~TODO-035: Replacement/follow-up link cards in slide-out~~ ✅
Bidirectional navigable cards: "Replaced By J05" / "Replaces J02" on cancelled jobs. "Follow-up J06" / "Follows J01" on partial completions. Click opens linked job in slide-out.

### ~~TODO-036: Vendor app — cancel reason + completion remark visibility~~ ✅
Cancel reason (red box) and completion remark (amber box) display on vendor JobDetailPage between status bar and adaptive section.

### ~~TODO-037: Activity log entries for cancellation/replacement/follow-up~~ ✅
Auto-logged in TripContext reducers: "Cancelled — replaced by J05 (HaleSun)", "Job created — replaces J02 (Gonda, cancelled)", "Follow-up created — J06", "Job created — follows J01 (partial)".
