# Teleport OS — Delivery Order Management

> **Terminology:** "Trip" in the codebase = "Delivery Order" in the UI. "Job" = a vendor assignment within an order.

## Overview
TripManager is a logistics operations module for Teleport OS that enables ops planners to create, track, and validate cargo trips without requiring handling unit (HU) data upfront. It replaces the current spreadsheet-based workflow.

## Users & Context

### Primary User: Operations Planner
- Works at Teleport's operations center in Malaysia
- Manages 10-50 trips per day across Southeast Asia corridors (primarily China → Malaysia)
- Coordinates with 3PL vendors (trucking companies, customs agents, cargo handlers)
- Currently uses spreadsheets + WhatsApp + phone to manage trips because the existing Teleport OS requires HU data before trip creation
- Cares about: speed of booking, visibility of all active trips, and billing accuracy

### Secondary User: Operations Admin
- Reviews and validates completed trips for billing
- Ensures proof-of-service documentation is complete before authorizing vendor payments
- Manages master data (vendors, customers, facilities, service types)

### Most Common Use Case (Real Workflow)
1. Customer (e.g., TikTok in Shenzhen) notifies Teleport: "Goods ready for pickup"
2. Ops planner needs to orchestrate getting goods from customer warehouse to the airport
3. Multiple things need to happen in parallel:
   - **FM Trucking:** Pick up goods from warehouse, deliver to cargo terminal. Proof of delivery required.
   - **EC Export Customs:** Clear goods through customs (can happen in parallel with trucking)
   - **CS Cargo Submission:** Submit goods at airport X-ray and cargo terminal
   - **OH Origin Handling:** Final processing at airport, goods ready to fly
4. Each service may be handled by a different vendor (or same vendor handles multiple services)
5. Ops planner creates a TRIP (customer + MAWB), adds JOBS (vendor assignments), tracks progress
6. Each job needs: vendor assignment, origin/destination, service types, status tracking, activity log, and proof-of-service documents
7. When all jobs are complete with proofs uploaded, ops admin validates the trip for billing

### Key Insight: Services Are Parallel, Not Sequential
Unlike a relay race, logistics services often happen simultaneously. Export customs clearance can be processed while trucking is still in transit. The UI must reflect this reality — jobs are shown as parallel cards, not a sequential pipeline.

## User Stories

### Trip Management
- **US-001:** As an ops planner, I want to create a trip by specifying customer, MAWB, and required services, so I can book vendor capacity before HU data is available.
- **US-002:** As an ops planner, I want to assign a vendor to each service (1 job = 1 vendor + 1 service), so billing and tracking are unambiguous.
- **US-003:** As an ops planner, I want to see all trips in a list with search/filter by MAWB, customer, and date, so I can quickly find any trip.
- **US-004:** As an ops planner, I want to expand an order to see all its jobs in a sub-table, so I can see vendor, service, status, and proof count at a glance.

### Job Lifecycle
- **US-005:** As an ops planner, I want to update a job's status (Pending → In Progress → Completed), so the trip progress is tracked in real-time.
- **US-006:** As an ops planner, I want to deep-dive into a job detail page to see full route info, vendor details, and all associated documents.
- **US-007:** As an ops planner, I want every status change to be automatically logged with timestamp and user, so there's an audit trail for billing.
- **US-008:** As an ops planner, I want to upload proof-of-service documents (photos, PDFs) per job, so Teleport can verify the vendor completed the work before paying them.
- **US-009:** As an ops planner, I want to view the activity log for each job showing all status changes and uploads, so I have a complete history for billing validation.

### Billing Validation
- **US-010:** As an ops admin, I want each job to track which services were performed (with L1/L2 cost IDs), so billing can be calculated per service.
- **US-011:** As an ops admin, I want proof documents attached to jobs, so I can validate completion before approving vendor payment.

### Dashboard
- **US-012:** As an ops planner, I want to see summary cards (total trips, active jobs, completed jobs, pending jobs) at the top of the trip list, so I get an instant health check of operations.

### FTL Trucking Rate Management
- **US-020:** As a rates admin, I want to manage FTL trucking rates in a route × truck type matrix, so I can see and edit all rates for a vendor at a glance — like the Excel rate cards vendors send us.
- **US-021:** As a rates admin, I want to select a vendor and see their full FTL rate sheet with rows as origin district → destination district routes and columns as truck types (1.5T, 3T, 5T, 8T, 10T, 12T, 40HQ, 45HQ), so I can manage rates in the same format vendors quote them.
- **US-022:** As a rates admin, I want to add rates in bulk by filling in a spreadsheet-style grid, so I don't have to add 100+ rates one by one when onboarding a new vendor.
- **US-023:** As a rates admin, I want to group routes by origin city/zone (Shenzhen, Dongguan, Guangzhou) with collapsible sections, so the rate sheet stays manageable with 50+ routes.
- **US-024:** As a rates admin, I want each truck type column to show capacity specs (weight cap, volume cap, dimensions), so I know what each truck type means when setting rates.
- **US-025:** As a rates admin, I want to see the currency per route (RMB for domestic, HKD for cross-border), so rates are quoted in the correct currency.
- **US-026:** As an ops planner, when creating an FM Trucking job, I want to select a truck type in addition to vendor and route, so the system can look up the correct FTL rate.
- **US-027:** As an ops planner, I want the FTL rate to auto-populate as a fee line item when I select vendor + origin district + destination district + truck type, so I see the cost before submitting the order.
- **US-028:** As a rates admin, I want FM accessorial fees (FM001 Warehouse Transfer, FM002 Pickup, FM003 Cross-Border Handling) to be managed separately from the base FTL rate, so the base trucking rate and surcharges are distinct.
- **US-029:** As a rates admin, I want origin and destination to be standardized China districts (GB/T 2260 codes) from the Regions master data, so rate lookup is unambiguous regardless of how the address is written.

### Service-Based Rate Management (EC, CS, CR, OH)
- **US-030:** As a rates admin, I want to manage service fees in an L2 Cost ID × location grid per vendor, so I can set rates for each sub-service (e.g., EC001 Customs Declaration, EC002 Inspection) at each facility.
- **US-031:** As a rates admin, I want service rates to auto-populate as fee line items when a job is created matching the vendor + service + location, so all applicable L2 fees are included automatically.

### Future (Phase 3+)
- **US-013:** As an ops planner, I want to save trip configurations as templates, so I can quickly create similar trips.
- **US-014:** As a vendor, I want to view trips assigned to me and update status/upload proofs from a vendor portal.
- **US-015:** As an ops admin, I want a validation dashboard to review completed trips and approve them for payment.
- **US-016:** As an ops admin, I want to manage master data (vendors, customers, facilities, service types) from the admin portal.
- **US-032:** As a rates admin, I want to import vendor rate cards from Excel/CSV, so I can onboard rates without manual data entry.
- **US-033:** As an ops planner, I want the system to auto-resolve a pickup address to its district using geocoding, so I don't have to manually look up which district the pickup is in.

## Key Design Decisions
1. **1 job = 1 service:** Each job has exactly 1 vendor + 1 service code + origin/destination. Same vendor can appear multiple times. Each job is a billable line item.
2. **Dense data design:** 40px nav, stats bar (no dashboard cards), 8px table cells, 4-6px radius, 3-color status system (green/red/gray).
3. **Sub-table for expanded jobs:** Not cards. Expanded orders show a nested table with Job/Vendor/Service/Route/Status/Proofs columns.
4. **Slide-out panel for actions:** Status change + proof upload + activity log in one panel without navigating away.
5. **Activity log per job:** Every status change and document upload is auto-logged for billing audit trail.
6. **Proof of service:** Document upload per job enables billing validation without HU-level scan data.
7. **localStorage for Phase 1:** Browser-only persistence. Auto-migrates stale data formats.

## Design Process Principles
- **Never anchor to current solution.** Every screen can be redesigned if it produces better UX.
- **Mockup before code.** Generate HTML wireframes to validate layout before touching components.
- **Research or hypothesize when uncertain.** Look at how best-in-class tools solve the same problem.
- **Begin with the end in mind.** Design for the ops planner's daily workflow, not for feature completeness.
- **Plan first, implement second.** Document the design rationale before writing code.

## Design Iterations

### Iteration 1 — Foundation (completed)
- [x] Data model with activity log and proof docs
- [x] TripContext with localStorage persistence
- [x] Basic trip list, create form, job detail page

### Iteration 2 — Design Hypotheses (completed)
- [x] 10+ HMW design hypotheses explored with HTML mockups
- [x] Key decisions: hybrid table, slide-out panel, billing checklist, 3-color system

### Iteration 3 — Dense Data Design (completed)
- [x] Dense layout: 40px nav, stats bar, 8px table cells, 4-6px radius
- [x] 3-color status system: green (completed), red (rejected), gray (everything else)
- [x] Sub-table for expanded jobs (columns: Job, Vendor, Service, Route, Status, Proofs)
- [x] 1 job = 1 service data model (replaces multi-service per job)
- [x] Slide-out panel for job actions (status, proof upload, activity log, reassignment)
- [x] Toast notifications for action feedback
- [x] Rejection banner with red row highlighting
- [x] Create form simplified: 2-step (details → assign vendors with 1 service per job)
- [x] localStorage auto-migration for stale data formats
- [x] All components use inline styles matching approved mockups exactly

### Iteration 4 — UX Refinements (completed)
- [x] Priority tag on urgent orders (amber "PRIORITY" next to customer name)
- [x] Pickup urgency coloring (red <2h, default today, muted future) + sort by soonest
- [x] Duplicate order button (copy icon on row hover)
- [x] Vendor filter dropdown in filter bar
- [x] Proof status icons in sub-table (green ✓ / gray ○)

### Iteration 5 — Core UX Fixes (completed)
- [x] Quick-add service bar in create form (HMW-21) — click [+FM] [+EC] etc. to add pre-filled jobs
- [x] Smart empty state (HMW-22) — "No orders yet" vs "No orders match filters"
- [x] Reactive slide-out panel (HMW-23) — derives data from context by ID, always fresh
- [x] Toast on order creation

### Iteration 6 — Rate Management (completed)
- [x] Location master data with CRUD, zone grouping, inline add (HMW-17)
- [x] Vendor rate cards: rate + unit type per service/location (HMW-18)
- [x] Rate management page under "Rates" nav with vendor/service tabs (HMW-16)
- [x] Add Rate slide-out form with dynamic route vs location fields
- [x] Rate versioning: auto-end previous rate when adding new rate
- [x] Location dropdown with zone grouping, search, inline "Add new" (HMW-17)
- [x] Inline rate display in create form with cost breakdown
- [x] Multi-currency support (MYR, CNY, USD)
- [x] Rate + Cost columns in delivery orders sub-table
- [x] Seed data: 23 locations, 21 rates, 10 orders with rate data

### Iteration 7 — Multi-Fee Model (completed)
- [x] FeeLineItem model: each job has N fee line items (L2 cost IDs) (HMW-25)
- [x] Fee = locked rate × editable quantity = calculated amount (HMW-26)
- [x] Per-job quantities (bags/weight/volume), editable until validated
- [x] Simplified sub-table: flat rows, click to slide-out for details (HMW-27)
- [x] Total Cost column shows sum of all fees
- [x] Removed priority tags (overdesign)
- [x] Removed pickup date urgency coloring

### Iteration 8 — Proof-Centric + Brand (completed)
- [x] Proof-centric job lifecycle replacing manual status (HMW-30):
  - Awaiting proof → Proof uploaded (auto) → Validated → Disputed
  - Only 2 manual actions: Validate and Dispute
  - No more Pending/In Progress/Completed/Rejected status picker
- [x] Rate-locked fees: removed free-text "+ Add fee", all fees from rate cards (HMW-30)
- [x] Smart default filter: Active/All/Completed with Active as default (HMW-28)
- [x] Date period picker for All/Completed: Today/This week/This month/Last month (HMW-29)
- [x] Pagination at 50/page for historical views
- [x] Dropped billing module — redundant with proof-centric delivery orders
- [x] Teleport.it brand: Future Blue #152CFF, dark nav, Instrument Sans
- [x] Nav: Delivery Orders | Rates | Master Data

### Deferred (Phase 3)
- [ ] Vendor comparison popover during order creation (HMW-19)
- [ ] Rate suggestion engine (HMW-16 Option C)
- [ ] Job detail page update for proof/fee model
- [ ] Inline edit mode for orders (HMW-11)
- [ ] Trip templates
- [ ] Vendor portal (US-014)
- [ ] Responsive design
- [ ] Keyboard shortcuts
