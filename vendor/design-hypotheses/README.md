# Design Hypotheses — Teleport OS Vendor

## Open

### HMW-V14: How might we render FM pickup and delivery times as the primary visual anchor in the job timeline section?
**Options:** A) Current — location names primary, 9px date sub-line, time absent entirely, B) Time-first hero — 20px JetBrains Mono time as largest element, location name and date as secondary lines below, C) Two-row split — tinted times row (hero) + plain locations row (secondary)
**Leaning toward:** B) Time-first hero — the dispatcher's question is "when?" not "where?" Showing the pickup time at 20px answers urgency in <1 second. Option C is structurally sound but adds complexity for no gain over B. Option A (current) actively hides urgency by stripping time from the datetime.
**Open question:** When pickup time is within 2 hours from now, should the hero time color change to `#dc2626` (urgency red)? The admin app uses urgency coloring in its Pickup Date column at the same threshold. Aligning would close the urgency loop for dispatchers. Needs user input.
**File:** `14-hmw-fm-timeline-times.html`

### HMW-V13: How might we ensure vendors never miss a new job assignment or cancellation when they return to the app — without push notifications?
**Options:** A) Dismissible "What's Changed" strip above the filter bar (red tint for cancellations, amber for mixed; row-level NEW/CANCELLED inline badges), B) Nav badge count + enriched pill sub-counts ("+2 new" on Pending, "+1 new" on Cancelled), C) Conditional "Alerts" segment pill that appears when there are unread changes
**Leaning toward:** A) Inline strip — gives specific, actionable information (not just "something changed") and distinguishes cancellation urgency from new-assignment priority. Row-level badges close the loop without requiring the vendor to scan timestamps. Strip pattern is correct for transient session-specific information; a pill is a persistent navigational filter. Cancellations are the highest-urgency case; a red strip ensures they are never buried.
**Open question:** Should verified-since-last-visit also appear in the strip? Verification signals billing readiness — important but less urgent than cancellations. Suggest: muted gray text in the strip ("2 jobs verified"), not tinted. Needs user input on whether vendors care enough about verification notifications to warrant any signal at all.
**File:** `13-hmw-vendor-alerts.html`

### HMW-V12: How might we show the trip's bag package list on the vendor job detail page for cargo verification at pickup?
**Options:** A) Inline scrollable table below Cargo section (max-height: 200px, always visible), B) Collapsible accordion with count summary in the header (collapsed by default), C) Summary row + searchable bottom sheet triggered on tap
**Leaning toward:** A) Inline scrollable table — the bag list is a verification instrument (driver physically cross-references bags against the screen while loading); hiding it behind an accordion or modal adds friction to the most critical moment. The fixed max-height keeps page length predictable. Aggregate (24 bags · 1,247 kg) in the Cargo section above is preserved; the table is the detailed breakdown.
**Open question:** For the WeChat Mini Program (HMW-V09), should drivers see the same bag list for scan-as-you-load verification? This would close the verification loop: Teleport system → dispatcher briefs driver → driver scans at pickup. If yes, the data model already supports it (BagPackage.assignedTripId links bags to trips). Option C's search field becomes compelling primarily for WeChat, where 200+ bags require lookup by number.
**File:** `12-hmw-bag-package-list.html`

### HMW-V11: How might we help vendor dispatchers identify FM jobs that need a driver before pickup time passes?
**Options:** A) Urgency dot + countdown in Pickup column, B) Dispatch alert strip above the table (amber, dismissible), C) Enriched "No driver — in Xh Ym" amber sub-line in the Where column
**Leaning toward:** C) Enriched Where sub-line — zero structural change, urgency lives with the assignment state (semantically correct), no new layout regions, clears automatically when driver is assigned. Threshold: 2h (not 4h used in mockup). Option B introduces a conditional layout region that's harder to learn. Option A puts urgency in the wrong column.
**Open question:** Should the amber countdown also appear on the Job Detail page within the Dispatch Assignment section, or only in the list? List-only is cleaner (detail page already shows pickup time prominently), but consistency across contexts is a valid counter-argument.
**File:** `11-hmw-dispatch-urgency.html`

### HMW-V10: How might we surface driver-reported milestones in the vendor and admin job views?
**Options:** A) Named actor in activity log only ("Driver Zhang Wei"), B) FM milestone progress strip on job detail (3-step horizontal strip for full-page, vertical compact list for admin slide-out), C) Current milestone as sub-line in My Jobs "Where" column
**Leaning toward:** B) Milestone strip + named actor in log — the strip gives dispatchers glanceable execution state without scrolling to the log. Option A alone buries progress in a long log; Option C overloads the already-dense "Where" sub-line. Admin slide-out renders the strip as a vertical 3-row list to fit 380px width.
**Open question:** Should "Departed" be required before "Arrived Delivery" (enforced WeChat sequencing), or can milestones be skipped/reported out-of-order? If out-of-order, the strip must handle gaps gracefully (e.g., both Arrived Pickup and Arrived Delivery green with Departed still gray).
**File:** `10-hmw-driver-status-updates.html`

### HMW-V09: How might we design the driver's job execution experience as a WeChat Mini Program?
**Options:** A) Single-scroll card + sticky action bar, B) Step-by-step wizard (one action per screen), C) Tab-based navigation (Job / Progress / Photos)
**Leaning toward:** A) Single-scroll — sticky action bar always shows what to do next, all job context visible without navigation, proof upload handled naturally in the action bar. Wizard (B) breaks at photo upload step; tabs (C) add navigation overhead for a linear workflow.
**Open question:** Should the milestone buttons (Arrived at Pickup / Departed / Arrived at Delivery) live in the sticky action bar (enforced sequence) or inline within the Progress card (flexible)? Sticky bar is safer; inline gives flexibility for out-of-order warehouse scenarios.
**File:** `09-hmw-wechat-driver-app.html`

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

### ~~HMW-V05: FM route planning & leg management~~ SUPERSEDED
**Decision:** Leg model removed. FM job = one vendor, one pickup driver, one delivery. Vendor's internal multi-driver ops not modeled. See PRD rationale.
**File:** `05-hmw-fm-route-planning-experience.html` (historical)

### ~~HMW-V06: FM job detail full page layout~~ SUPERSEDED
**Decision:** Leg-based timeline replaced by simple driver assignment section. FM job detail is now much simpler.
**File:** `06-hmw-fm-job-detail-full-page.html` (historical)

### HMW-V07: FM Job Detail page — simplified (no legs)
**Decision:** Status Bar → Driver & Vehicle (dropdowns, confirmed state, reassign link) → Route (two points: Pickup → Delivery) → Cargo (one line) → Fees → Proofs → Activity Log. Same layout across all 4 states. No timeline.
**File:** `07-hmw-fm-job-detail-simplified.html`

### HMW-V08: Non-FM Job Detail (OH/EC/CS/CR)
**Decision:** Status Bar → Location (single facility) → [Hub Ops Progress for OH: Inbound/Processed/Outbound counters] → Cargo → Fees → Proofs → Log. EC/CS/CR identical layout, OH gets one extra section. No upload zone for OH (hub ops uploads via WeChat).
**File:** `08-hmw-non-fm-job-detail.html`
