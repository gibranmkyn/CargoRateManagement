# Design Hypotheses — Teleport OS Vendor

## Open

(none)

## Resolved

### HMW-V01: How might we adapt the vendor's job list table to work on 768px tablet screens?
**Options:** A) Horizontal scroll table, B) Condensed table (drop Route, stack Customer/Shipment), C) Card list
**Decision:** B) Condensed table — drop Route column (available in detail), stack Customer+Shipment into one cell. Status and Cost always visible. Still a table.
**File:** `01-hmw-responsive-job-table.html`

### HMW-V02: How might we order sections on the vendor's job detail page for reconciliation-first workflow?
**Options:** A) Operations first (Route → Cargo → Fees), B) Fees first (Fees → Route + Cargo), C) Split view (Fees left, context right)
**Decision:** B) Fees first — lead with reconciliation data. Vendor already knows the route. Status Action Bar → Fees → Route + Cargo → Proofs → Activity Log.
**File:** `02-hmw-job-detail-section-order.html`

### HMW-V03: How might we show the dispatcher which FM jobs have a driver assigned in the job list?
**Options:** A) Dedicated "Driver" column, B) Small icon indicator next to status chip, C) Driver name as sub-line under Customer, D) Driver + vehicle as sub-line under Route
**Decision:** D) Driver + vehicle as sub-line under Route — semantic fit (driver executes the route), uses widest column (35%), no new column, works on tablets, "No driver assigned" in faint gray for unassigned FM jobs.
**File:** `03-hmw-driver-assignment-visibility.html`

### HMW-V04: How might we redesign the vendor job list so each service type shows the info that matters most?
**Options:** A) Service-aware "Where" column with contextual sub-lines, B) Columns change per service filter, C) Compact two-line rows with 5 columns
**Decision:** A) Rename "Route" to "Where". Same 7-column table. Sub-lines per service: FM shows driver+vehicle, EC/CS shows MAWB, OH/CR shows bag count+weight. Simplest change, respects the smart spreadsheet principle.
**File:** `04-hmw-vendor-job-list-redesign.html`
