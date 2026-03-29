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

## Iteration 10 — Jobs Page + Unified Status

### TODO-020: Unified status lifecycle refactor
- **What:** Replace dual `status` + `proofStatus` fields with single `status` field: `Pending | In Progress | Completed | Verified | Rejected | Cancelled`
- **Files:** mockData.ts (types + seed), TripContext.tsx (actions + reducer), all components referencing JobStatus/ProofStatus
- **Key:** Proof upload triggers → Completed. Admin verify → Verified. Rejection → Rejected (reassign resets to Pending).

### TODO-021: 5-color status system
- **What:** Update all status color mappings from 3-color (green/red/gray) to 5-color (gray/blue/amber/green/red)
- **Files:** StatusBadge.tsx, JobCard.tsx, ParentTripRow.tsx, JobTable.tsx, TripsPage.tsx, JobSlideOut.tsx
- **Colors:** Pending=#9ca3af, In Progress=#152CFF, Completed=#a16207, Verified=#059669, Rejected=#dc2626

### TODO-022: Jobs page
- **What:** New page at `/jobs` — flat power table with status pills, service filters, vendor dropdown, Group by toggle
- **Design ref:** `design-hypotheses/48-hmw-job-view-final.html`
- **Includes:** Status pills (Active/Completed/Verified/All), Group by (None/Vendor/Service/Date), vendor search, slide-out integration

### TODO-023: Nav update
- **What:** Add "Jobs" to navbar between "Delivery Orders" and "Rates"
- **Files:** Navbar.tsx, App.tsx (add route)

### TODO-024: Update Delivery Orders for new status model
- **What:** Update TripsPage sub-table, slide-out panel, and filter logic to use unified status instead of proofStatus
- **Key:** Active = any job not Verified. Completed filter = all jobs Verified. Sub-table shows status chips instead of proof icons.

### TODO-025: Slide-out panel — Status Action Bar (HMW-49)
- **What:** Add Status Action Bar at top of JobSlideOut — colored bar showing current status + primary action
- **Design ref:** `design-hypotheses/49-hmw-slideout-status-lifecycle.html`
- **States:**
  - Pending: gray bar + `[Start Job →]` button → transitions to In Progress
  - In Progress: blue bar + hint "Upload proof to complete →"
  - Completed: amber bar + `[✓ Verify]` green button → transitions to Verified
  - Verified: green bar + "Ready for billing" — everything locked (no toggles, no inputs, no upload)
  - Rejected: red bar + rejection reason text + reassign vendor dropdown below
- **Auto-transitions:** proof upload triggers → Completed (even from Pending). Verify → Verified + lock all.
- **Editability:** fees toggleable + quantities editable from Pending through Completed. All locked on Verified.
- **Files:** JobSlideOut.tsx, TripContext.tsx (new actions: START_JOB, VERIFY_JOB)
