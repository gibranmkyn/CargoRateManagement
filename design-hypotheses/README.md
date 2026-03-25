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
