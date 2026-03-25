# TODOS — Teleport OS

## Critical — Next Session

### TODO-010: Create form — FM truck type + district picker (US-026/027)
- **What:** When creating an FM Trucking job, ops picks origin district (from Regions), destination district, and truck type (chip buttons). System looks up FTL rate for that combo.
- **Why:** Create form still uses old facility-based location dropdowns for FM. No truck type selector. FTL rate data exists but isn't connected to job creation.
- **Depends on:** FtlRate data model (done), Regions master data (done)

### TODO-011: Create form — vendor fee auto-populate for services (US-031)
- **What:** When creating an EC/CS/CR/OH job, auto-populate all fees from vendor's fee schedule for that service+location. Ops removes exceptions.
- **Why:** Create form still uses old L2 rate system. VendorFee data exists but isn't connected to job creation.
- **Depends on:** VendorFee data model (done)

### TODO-012: Slide-out — subtractive fee selection (HMW-43)
- **What:** Fee breakdown in slide-out shows all vendor fees with ✓ toggle. Active fees have editable qty. Removed fees show muted line-through. Click + to re-add.
- **Why:** Slide-out still shows old FeeLineItem model without active/inactive toggle. HMW-43 design is done but not implemented.
- **Depends on:** FeeLineItem.active field (done)

## Medium Priority

### TODO-013: CSV upload for service fee schedules (US-035)
- **What:** Upload CSV on service tabs (EC, CS, CR, OH) same as FM trucking. Format: fee_name, unit, rate, min_charge, currency.
- **Why:** Currently only FTL trucking has CSV upload. Service rates need the same.

### TODO-014: Vendors master data tab
- **What:** CRUD table for vendors with service capabilities and location mappings.
- **Why:** Per CR Trip Management reference, vendors should be mapped to specific L1 services + locations.

### TODO-015: Customers master data tab
- **What:** CRUD table for customers with code, name, status.
- **Why:** Currently hardcoded in mockData.ts. Admin should manage.

### TODO-016: Link facilities to districts
- **What:** Add districtCode field to facilities (locations). TikTok WH → 宝安区 (440306).
- **Why:** Needed for FTL rate auto-resolution when ops picks a facility instead of a district.

## Design Debt

### TODO-017: Old VendorRate type cleanup
- **What:** Remove the old VendorRate interface and all references. Replace remaining usages with VendorFee or FtlRate.
- **Why:** Three rate systems coexist in code (VendorRate, FtlRate, VendorFee). VendorRate is legacy.

### TODO-018: Seed data alignment
- **What:** Update seed trip jobs to use VendorFee-based FeeLineItems with active field and real vendor fee names.
- **Why:** Seed jobs still have old L2-based fees. Should show real vendor fees (前置仓操作费 etc.)

### TODO-019: HMW mockup for Add Rate form (never built)
- **What:** Create HTML mockup for the Add Rate slide-out form for vendor fee schedules.
- **Why:** TODO-001 from earlier — form was designed in spec but never mockuped.
