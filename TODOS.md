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
Implemented: Delivery Orders | Jobs | Rates | Master Data.

### ~~TODO-024: Update Delivery Orders for new status model~~ ✅
Implemented: Stats bar, sub-table, and filter logic updated. Active = any job not Verified/Cancelled.

### ~~TODO-025: Slide-out panel — Status Action Bar~~ ✅
Implemented: Status Action Bar adapts per stage (Start Job / Upload hint / Verify / Ready for billing / Cancelled + reassign). Vendor reassignment wired up.

### ~~TODO-026: Rejected → Cancelled rename~~ ✅
Implemented: Renamed across all 11 source files. `cancelReason` replaces `rejectionReason`. 3PL can't reject — only admin cancels.

### ~~TODO-027: Jobs page column widths + page consistency~~ ✅
Implemented: Percentage-based columns, 1400px max-width matching DO page, Route ellipsis truncation.
