# Design Hypotheses — TripManager

## How We Work
Every design decision starts with a **"How Might We"** question. We generate 2-3 hypothesis options, build HTML mockups, evaluate trade-offs, then decide. Mockups live in this folder — they are the source of truth for design intent before code.

---

## Resolved

### HMW-01: How might we display 50+ trips in a way that's fast to scan yet reveals job-level detail when needed?
**Options:** A) Table-first, B) Card-grid, C) Kanban by status
**Decision:** Hybrid A+B — table rows for scanning density, expandable to parallel job cards for detail
**File:** `01-trip-list-layout.html`

### HMW-02: How does the hybrid approach look end-to-end across all key screens?
**Decision:** Table + expandable sub-table for jobs, 3-step service-first form for creation, 2:1 grid for job detail
**File:** `02-hybrid-table-cards.html`

### HMW-08: How might we make the UI feel like a smart spreadsheet — dense enough for ops who live in Excel?
**Options:** A) Reduce spacing/radius/colors, B) Keep current
**Decision:** Dense design — 40px nav, stats bar (no cards), 8px 12px table cells, 4-6px radius, 3-color system (green/red/gray)
**File:** `08-hmw-data-density.html`

### HMW-08b: Color simplification
**Decision:** Only 3 status colors — Completed (green), Rejected (red), Everything else (neutral gray). Teal for interactive elements only.

### HMW-09b: How should jobs look when a delivery order is expanded?
**Options:** A) Sub-table (nested rows), B) Compact cards, C) Inline rows (no expand)
**Decision:** Option A — Sub-table with columns: Job, Vendor, Services, Route, Status, Proofs. Same table language as parent. Cards dropped.
**File:** `09-hmw-expanded-jobs.html`

### HMW-04: How might we let ops planners change job statuses 50x/day without losing context or making mistakes?
**Options:** A) Inline dropdown on chip, B) Slide-out panel, C) Navigate to job detail
**Decision:** Option B (Slide-out panel) — fast + contextual. Proof upload + status change in same flow. Full detail as escape hatch.
**File:** `03-status-change-interaction.html`

### HMW-07: How might we help ops admins confidently know which trips are ready for vendor payment?
**Options:** A) Visual indicator on row, B) Billing checklist in expanded view, C) Separate validation page
**Decision:** B+C combined — checklist in expanded view for ops, dedicated Validation page for billing admin.
**File:** `04-billing-readiness.html`

---

### HMW-10b: Should each job have exactly 1 service code, even if the same vendor handles multiple services?
**Options:** A) 1 job = 1 service, B) 1 job = multiple services
**Decision:** Option A — 1 job = 1 service. Billing unambiguous, per-service status/proof tracking. Same vendor can appear multiple times.
**File:** `10-hmw-one-service-per-job.html`

## In Progress (Iteration 4)

### HMW-11: How might we help ops instantly see which orders are urgent?
**Options:** A) Priority tag in customer cell, B) Full-row tint, C) Priority column with icon
**Decision:** Option A — small "PRIORITY" tag next to customer name. Amber color. Non-priority rows stay clean.
**File:** `11-hmw-order-priority.html`

### HMW-12: How might we help ops see at a glance which pickups are soon vs. days away?
**Options:** A) Color-coded pickup time, B) Countdown badge, C) Sort by urgency default
**Decision:** Option A+C — red text for <2h, default for today, muted for future. Table sorted by soonest pickup.
**File:** `12-hmw-pickup-urgency.html`

### HMW-13: How might we let ops create similar orders in seconds?
**Options:** A) Duplicate button on row hover, B) "Create similar" in slide-out, C) Recent orders on create page
**Decision:** Option A — duplicate icon on row hover. One click, pre-fills create form with same pattern.
**File:** `13-hmw-quick-duplicate.html`

### HMW-14: How might we let ops find all jobs for a specific vendor?
**Options:** A) Vendor dropdown in filter bar, B) Clickable vendor names, C) Vendor view tab
**Decision:** Option A — vendor dropdown in filter bar. Fits existing pattern, no new interactions.
**File:** `14-hmw-vendor-filter.html`

### HMW-15: How might we let ops verify proof documents at a glance?
**Options:** A) Tooltip on hover, B) Inline file names, C) Proof status icon (✓/○)
**Decision:** Option C — green ✓ for proof uploaded, gray ○ for missing. Aligns with 3-color system. Detail in slide-out.
**File:** `15-hmw-proof-preview.html`

### HMW-16: How might we incorporate vendor rate cards so ops sees costs and billing can validate invoices?
**Options:** A) Inline rate display in create form + sub-table, B) Rate management page + inline display, C) Rate suggestion engine
**Decision:** PENDING — Phase 1: Option A (inline rates from JSON), Phase 2: Option B (rate CRUD page + anomaly detection)
**File:** `16-hmw-rate-management.html`

### HMW-17: How might we structure locations as managed master data instead of free text?
**Options:** A) Strict dropdown, B) Autocomplete with fuzzy matching, C) Dropdown + "Add new" inline
**Decision:** Option C — dropdown for consistency, "Add new" for flexibility. Prerequisite for reliable rate lookups.
**File:** `17-hmw-location-master-data.html`

### HMW-18: How might we model vendor rates that reflect real pricing (flat, per-kg, per-bag)?
**Options:** A) Flat rate only, B) Rate + unit type, C) Tiered pricing
**Decision:** Option B — rate + unit type (flat/per-kg/per-bag/per-CBM). Minimum viable accuracy.
**File:** `18-hmw-rate-unit-pricing.html`

### HMW-19: How might we help ops compare vendors by rate and reliability during order creation?
**Options:** A) Rate shown after selection, B) Vendor comparison popover, C) Smart auto-select
**Decision:** Option B — comparison popover shows all vendors' rates + reliability. Informed decisions without changing default flow.
**File:** `19-hmw-vendor-selection-flow.html`

### HMW-20: How might we catch rate discrepancies between agreed rates and vendor invoices?
**Options:** A) Inline variance in validation page, B) Invoice upload + split view, C) Invoice amount field per job
**Decision:** Option C — add "Invoice Amount" field per job, system auto-calculates variance. Fits existing sub-table + validation flow.
**File:** `20-hmw-rate-anomaly-billing.html`

### HMW-21: How might we redesign the create order flow for service-first thinking?
**Options:** A) Restore 3-step with service checklist, B) 2-step with service chips creating rows, C) Quick-add service bar
**Decision:** Option C — horizontal service bar [+FM] [+EC] [+CS] [+CR] [+OH]. Click = create job row with that service pre-filled. Fastest, most visual, service-first by design.
**File:** `21-hmw-create-order-flow.html`

### HMW-22: How might we welcome a first-time ops planner with an empty app?
**Options:** A) Inline CTA in empty table, B) Getting started guide, C) Sample data with dismiss
**Decision:** Option A — teal icon + "No delivery orders yet" + [+ New Order] button in table body. Minimal, honest, professional.
**File:** `22-hmw-empty-state.html`

### HMW-23: How might we keep the slide-out panel data fresh after mutations?
**Options:** A) Read from context by ID (reactive), B) Optimistic local state, C) Close-and-reopen
**Decision:** Option A — panel stores tripId+jobId, derives job from context on every render. Always fresh, no stale data.
**File:** `23-hmw-slideout-data-freshness.html`

### HMW-25: How might we show multi-fee jobs, let ops edit quantities, and make status changes faster?
**Options:** A) Inline Fee Table + Quick Status Buttons, B) Slide-Out Focus + Progress Bar Status, C) Hybrid — Inline Status + Expandable Fee Panel
**Decision:** Option A — Inline 3-button quick status on sub-table (Pending/In Prog/Done), expandable L2 fee breakdown under each job, editable per-job quantities in slide-out until Completed.
**File:** `25-hmw-job-fees-status-quantities.html`

### HMW-26: How should fee line items and quantities be structured?
**Options:** A) Order-level qty + per-fee override, B) Per-job independent quantities, C) Simple order qty only
**Decision:** Option B (per-job quantities) with locked rates — quantities live at job level (default from order, editable per job). Rates come from rate card and are immutable. Only quantity is editable. Amount = locked rate × editable quantity.
**File:** `26-hmw-fee-quantity-model.html`

### HMW-27: How might we simplify the sub-table so it's fast to scan?
**Options:** A) Flat sub-table — click row opens slide-out, B) Flat + cost hover tooltip
**Decision:** Option A — flat sub-table, no inline fee expansion. Fee details in slide-out only. Priority tags removed.
**File:** `27-hmw-simplified-subtable.html`

### HMW-28: How might we help ops focus on active orders while keeping history accessible?
**Decision:** Smart default filter — Active/All/Completed chips, Active default. Date period picker for All/Completed only.
**File:** `28-hmw-active-vs-historical.html`

### HMW-29/30: Proof-centric jobs + rate-locked fees
**Decision:** Replace manual status with proof lifecycle. All fees from rate cards only. No free-text entry.
**Files:** `29-hmw-scalable-filtering.html`, `30-hmw-proof-centric-jobs.html`

### HMW-31 to 36: L1/L2 service hierarchy deep dive
**Decision:** Fixed unit per Cost ID. Expandable L1/L2 tree in master data. Zone-grouped rate sheet. All L2 fees auto-populate.
**Files:** `31-hmw-rates-module-redesign.html` through `36-hmw-services-master-data.html`

### HMW-37/39: FM Trucking FTL rate card
**Decision:** Separate FTL rate model — origin district → destination district × truck type. District-based using GB/T 2260 from Regions master data.
**Files:** `37-hmw-fm-trucking-rate-sheet.html`, `39-hmw-ftl-rate-management.html`

### HMW-40/41/42: FTL rate management evolution
**Decision:** Simple rate page — vendor dropdown, rate table, CSV upload/download, activity log. No version UI, no card grid.
**Files:** `40-hmw-ftl-csv-bulk-rates.html`, `41-hmw-ftl-rate-card-redesign.html`, `42-hmw-ftl-simple-rate-page.html`

### HMW-43: Vendor fee schedules — auto-populate, deselect exceptions
**Decision:** Vendor's own fee names per service+location. All fees auto-populate on job creation. Ops removes exceptions (subtractive). L2 Cost IDs become optional tags.
**File:** `43-hmw-vendor-fee-schedule.html`

### HMW-44: How might we give ops planners a job-level view for vendor coordination, proof chasing, and exception handling?
**Options:** A) Power Table (flat + filter bar), B) Smart Views (preset tabs: Dispatch/Chasing/Exceptions), C) Vendor Workboard (sidebar + table)
**Decision:** Power Table with Group By toggle — captures C's UX wins without its vendor-only limitation
**File:** `44-hmw-job-level-view.html`

### HMW-45: Refined Job View — Power Table with Group By toggle
**Options:** Group by Vendor (default), Group by None (flat), Group by Service, Group by Date
**Decision:** Superseded by HMW-46 — at 30 vendors, flat table with proof-first pills is better default than vendor grouping
**File:** `45-hmw-job-view-refined.html`

### HMW-46: Job View at 30-vendor scale — proof-first navigation
**Decision:** Superseded by HMW-48 — updated with unified status lifecycle
**File:** `46-hmw-job-view-at-scale.html`

### HMW-47: Unified job status lifecycle
**Decision:** Pending → In Progress → Completed (proof uploaded) → Verified (admin sign-off). Plus Rejected + Cancelled. "In Progress" not "In Transit". "Verified" not "Validated".
**File:** (conceptual — no mockup needed)

### HMW-48: Job View — Final Design (definitive)
**Decision:** Flat table + unified status pills (Active/Completed/Verified/All). Group by: Vendor as secondary lens. 5 status colors: gray (Pending), blue (In Progress), amber (Completed), green (Verified), red (Rejected). This is the implementation reference.
**File:** `48-hmw-job-view-final.html`

### HMW-49: Slide-out panel for unified status lifecycle
**Decision:** Status Action Bar at top of panel — colored bar showing current status + primary action. Adapts per stage: [Start Job] / hint "upload to complete" / [✓ Verify] / "ready for billing" / rejection reason + reassign. Fees/quantities editable until Verified. Proof upload auto-transitions to Completed.
**File:** `49-hmw-slideout-status-lifecycle.html`

### HMW-50: How might we minimize clicks when creating a shipment (80% same vendor)?
**Options:** A) Default Vendor dropdown + "All" button, B) Vendor + Multi-Select Services, C) Auto-fill from last vendor
**Decision:** Option A + "All" button — "Assign to" vendor dropdown above pills + "All" button to add all services at once. 3 clicks for 80% case (down from 12). Override per-job for mixed vendors.
**File:** `50-hmw-create-shipment-vendor-efficiency.html`

## Open (backlog)

### HMW-03: How might we make the "assign vendors to services" step feel natural instead of like filling a form?
**Options to explore:**
- A) Current flat form (vendor dropdown + service multi-select per job)
- B) Drag services from a pool onto vendor cards
- C) System pre-suggests vendor based on service type + route history

### HMW-05: How might we make proof-of-service uploads feel like a seamless part of the workflow rather than an extra chore?
**Options to explore:**
- A) Upload only from job detail page
- B) Upload from slide-out panel (within status change flow)
- C) Batch upload: drop multiple files, system matches to jobs by filename/metadata

### HMW-06: How might we present the activity log so it's useful for billing audits without cluttering daily operations?
**Options to explore:**
- A) Always visible in job detail
- B) Collapsible — hidden by default, expand when needed
- C) Separate "Audit Trail" view across all trips/jobs with search + filter

### HMW-08: How might we welcome a first-time user so they feel confident creating their first trip?
**Options to explore:**
- A) Empty state with "Create your first trip" CTA + illustration
- B) Interactive walkthrough/onboarding wizard
- C) Pre-loaded sample data with "Clear samples" option

### HMW-09: How might we surface rejected jobs so ops planners can reassign them within seconds, not minutes?
**Options to explore:**
- A) Notification bar at top of trip list with rejection count
- B) Red highlight on trip row + inline reassignment in slide-out panel
- C) Dedicated "Needs Attention" view combining all actionable items

### HMW-10: How might we structure navigation so it scales as the app grows (validation, master data, reports) without cluttering the daily trip management workflow?
**Options to explore:**
- A) Top nav (current — simple, max vertical workspace)
- B) Left sidebar (room to grow, standard for data-dense tools)
- C) Top nav + contextual sidebar (appears on detail pages)
