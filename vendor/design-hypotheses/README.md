# Design Hypotheses — Teleport OS Vendor

## Open

### HMW-V19: How might we surface Status and Verification as two independent signals in the vendor's job detail action bar — without conflating them into a single merged label?
**Root cause:** `JobDetailPage.tsx` uses a local `StateCell` calling `getStateStyle()` (merged state getter). For a Completed+Rejected job, the bar shows "Verify rejected" instead of the correct "Completed" status chip. Verified by reading `shared/statusStyles.ts:40–41`.
**Options:** A) Two-row action bar (status row + verification row, second row hidden when Pending), B) Admin-style labeled pair above the action bar (cleanest separation, most vertical space), C) Fix component swap only — replace `StateCell` with `StatusCell` + add a small inline verification badge for Rejected state
**Leaning toward:** C) StatusCell swap + Rejected badge — smallest change, fixes the conflation bug, no layout impact. The bar background color continues to encode combined urgency; the chip now correctly shows only the operational status; the badge makes Rejected explicit without competing with the action button. Option B is architecturally cleaner but adds ~50px to an already-long full-page layout; appropriate if vendor app adds more signals in future.
**Open question:** Should the verification badge also appear for the Verified state (green badge alongside Completed chip), or is the all-green bar + "Ready for billing" text sufficient? Leaning toward: omit the Verified badge (bar color is sufficient signal); show badge only for Rejected (unexpected, needs action). Needs user input.
**File:** `19-hmw-status-verification-action-bar.html`

### HMW-V18: How might we help FM dispatchers know which drivers and vehicles are free — without leaving the Fleet page to check active jobs?
**Options:** A) Current — pure CRUD table with Active/Inactive status only, B) Dispatch-aware availability column showing "On job · J04" vs "Available" derived from TripContext, C) Visual dispatch board panel above CRUD table (card grid — rejected: violates tables-not-cards rule)
**Leaning toward:** B) Dispatch-aware availability column — answers the dispatcher's "who's free?" in one screen using only existing color tokens (green = available, blue dot = on-job, mirrors job status system), derived from shared TripContext with no new data model. Option C rejected as AI slop (card grid breaks 768px, duplicates the CRUD table, violates design system). Option A is already shipped.
**Open question:** Should "Dispatched (Pending job)" and "On job (In Progress job)" be two distinct states in the Availability column, or collapsed to a single "Busy" state? Distinct states preserve semantic consistency with the job status model but add complexity. Needs user input.
**Prerequisite:** Fix `JobDetailPage.tsx` data plumbing — currently loads `seedDrivers`/`seedVehicles` instead of Fleet page's localStorage fleet data. Drivers added via Fleet don't appear in job assignment dropdowns. Must be resolved before Availability column is meaningful.
**File:** `18-hmw-fleet-dispatch-availability.html`

### HMW-V17: How might we let vendor operators quickly locate specific jobs by trip ID, customer, or MAWB without breaking the dense-table design?
**Options:** A) Inline text search input in filter bar (real-time, searches Trip ID + Customer + MAWB), B) Customer quick-filter pills derived from vendor's job history (no freetext), C) Search with autocomplete suggestions (customer names, trip IDs)
**Leaning toward:** A) Inline text search — mirrors admin filter bar pattern exactly, handles all three query types (trip ID, customer name, MAWB), no structural change to the 2-row filter bar, chainable with existing service + date filters. Option B is a valid v1.1 complement for vendors serving a small customer set. Option C is overengineered for current scale (<50 active jobs).
**Open questions:** (1) Should matched text be highlighted inline in table rows, or is the filtered result set sufficient? (2) Should MAWB be in scope for search? (3) Should customer pills (Option B) ship as a simultaneous enhancement alongside Option A, or defer to v1.1?
**File:** `17-hmw-vendor-job-search.html`

### HMW-V16: How might we design the proof upload experience for vendors capturing photo evidence on tablets at cargo terminals?
**Options:** A) Full dashed zone always visible when upload is allowed — zone + files coexist, B) Smart collapse — full zone on empty state, compact "+ Add files" button in section header when files exist; zone collapses, C) Camera-first action strip — no zone, just a persistent [📷 Camera] [📄 Files] strip at bottom of the section
**Leaning toward:** B) Smart collapse — full affordance when needed (first upload = zone front-and-center), density-appropriate after upload (files are the content, not the zone), Activity Log stays above fold after upload. Option A wastes 92px of vertical space when files exist at 768px. Option C lacks an empty-state affordance (first-time upload not obvious) and sacrifices drag-and-drop for laptop users.
**Open question:** The Status Action Bar on the In Progress state shows an "Upload Proof" button in the top bar. Should clicking this button (a) scroll to the Proof section + expand the zone inline, or (b) trigger the file input directly from the status bar without scrolling? Direct-trigger is one tap fewer but bypasses the file list context. Scroll-to-expand preserves context. Needs user input.
**File:** `16-hmw-proof-upload-zone.html`

### HMW-V15: How might we let vendor operators flag cargo quantity discrepancies without write access to Teleport's records?
**Options:** A) Parallel vendor measurement inputs — "Your count" field beside each Teleport quantity; inline match/mismatch badges; single atomic submit, B) Per-quantity flag buttons — small "Flag" button per field; expands inline micro-form with vendor's value + note, C) General dispute note — single "Report discrepancy" button; freetext textarea; unstructured
**Leaning toward:** A) Parallel fields — produces field-specific, diff-trackable records for admin without interpretation; mirrors how a vendor would compare numbers in Excel; scales to a bulk "disputed quantities" filter in v1.2 reconciliation view. Option B is correct for a more mature product (v2+). Option C is inadequate for structured reconciliation.
**Open question:** Should vendors be able to submit a discrepancy after admin has already verified the job? Recommend allowing post-verification flags (creates a flag record, doesn't reopen the job), but needs user input.
**File:** `15-hmw-quantity-reconciliation.html`

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
