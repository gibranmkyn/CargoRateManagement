# Design System — Teleport OS (Delivery Order Management)

> Source of truth: `design-hypotheses/08-hmw-data-density.html` + `09-hmw-expanded-jobs.html`
> Aesthetic: **Smart spreadsheet with personality** — dense enough for Excel users, clear enough to prevent mistakes.

## Product Context
- **What:** Logistics operations platform for managing cross-border cargo delivery orders
- **Who:** Ops planners managing 10-50 orders/day, coming from Excel/spreadsheets
- **Space:** Internal B2B operations tool
- **Type:** Data-dense workspace — think "better Excel" not "modern SaaS dashboard"

## Aesthetic Direction
- **Direction:** Data-dense utilitarian — every pixel shows data, not decoration
- **Mood:** A smart spreadsheet. Compact, scannable, professional. Zero wasted space.
- **Anti-patterns:** No big dashboard cards. No bubbly border-radius. No rainbow status colors. No generous padding. No card-based layouts where tables work.

## Typography
- **Font:** Instrument Sans for everything (Google Fonts)
- **Monospace:** JetBrains Mono for MAWB numbers, trip IDs, timestamps, dates
- **Scale:**
  - Page title: 16px / 800 / -0.3px tracking
  - Table customer name: 13px / 600
  - Body / nav / buttons: 11-12px / 400-600
  - Table headers / labels: 9-10px / 600 / uppercase + 0.05-0.06em tracking
  - Chips / tags: 9-10px / 600
  - Monospace data: 10-11px

## Color — 5-State Status System

**Principle:** Only use color when it demands attention. Most of the UI is neutral.

| Status | Text | Background | Border | Dot | When |
|--------|------|-----------|--------|-----|------|
| **Pending** | `#9ca3af` | `#f9fafb` | `#e5e7eb` | `#9ca3af` | Assigned, work not started |
| **In Progress** | `#152CFF` | `rgba(21,44,255,0.04)` | `rgba(21,44,255,0.15)` | `#152CFF` | Work underway (truck moving, customs processing) |
| **Completed** | `#a16207` | `#fefce8` | `#fde68a` | `#a16207` | Proof uploaded, needs admin verification |
| **Verified** | `#059669` | `#f0fdf4` | `#a7f3d0` | `#059669` | Proof reviewed, ready for billing |
| **Rejected** | `#dc2626` | `#fef2f2` | `#fecaca` | `#dc2626` | Vendor can't fulfill — needs reassignment |

**Cancelled** uses the same styling as Pending (gray).

**Status lifecycle:** `Pending → In Progress → Completed → Verified` (+ Rejected, Cancelled as terminal states)
- "In Progress" not "In Transit" — works for all service types (customs isn't "in transit")
- "Completed" not "Delivered" — works for all service types (customs isn't "delivered")
- Proof upload triggers Completed → Verified is admin sign-off (billing gate)

### Other colors
- **Accent (Future Blue):** `#152CFF` — interactive elements ONLY (buttons, links, active nav, job labels). From Teleport.it brand guidelines.
- **Accent hover:** `#1024CC`
- **Accent soft:** `rgba(21,44,255,0.06)` — active nav bg, service pill bg
- **Ink:** `#111827` (primary), `#374151` (secondary), `#6b7280` (muted), `#9ca3af` (faint), `#d1d5db` (ghost/placeholder)
- **Surfaces:** `#f3f4f6` (page), `#ffffff` (cards/table), `#f9fafb` (raised/headers/expanded)
- **Borders:** `#e5e7eb` (default), `#f3f4f6` (subtle row dividers)

## Spacing — Compact
- Navbar height: **40px**
- Table header padding: **6px 12px**
- Table cell padding: **8px 12px**
- Filter bar padding: **6px 16px**
- Stats bar padding: **8px 16px**
- Expanded sub-table padding: **10px 12px** (indented 40px left)
- Form card padding: **16px**
- Page max padding: **16px** horizontal

## Border Radius — Sharp
- Table container: **6px**
- Buttons: **6px**
- Inputs (global CSS): **4px**
- Job chips: **4px**
- Nav links / step badges: **4-5px**
- Service pills: **99px** (full round — the only round element)
- Logo icon: **5px**

## Shadows — Minimal
- Table: none (border only)
- Toast: `0 4px 20px rgba(0,0,0,0.12)`
- Slide-out panel: `-4px 0 24px rgba(0,0,0,0.1)`
- **No shadows on cards, nav, or filter bar.** Borders are sufficient.

## Layout

### Navbar
- 40px height, white bg, 1px border-bottom
- Logo: 20x20 teal square (radius 5) + "Teleport OS" at 13px/700
- Nav links: 12px, padding 4px 10px, radius 4px

### Stats Bar (replaces dashboard cards)
- Single line, #f9fafb bg, 1px border-bottom
- **Delivery Orders page:** `5 orders | 6 in progress | 2 completed | 1 rejected`
- **Jobs page:** `82 jobs | 15 pending | 18 in progress | 9 completed | 37 verified | 2 rejected`
- Each status count uses its status color (gray/blue/amber/green/red)

### Page Header
- Title: 16px/800
- Subtitle: 11px #9ca3af
- Buttons: 5px 12px padding, 6px radius, 11px/600 font

### Filter Bar
- Inline horizontal, 6px 16px padding, border-bottom
- Labels: 11px #9ca3af inline with inputs
- Inputs: 4px 8px padding, 4px radius, 11px font

### Delivery Order Table
- Actual `<table>` element, border-collapse: collapse
- Columns: (chevron) | Customer | MAWB | **Pickup Date** | Route | Cargo | Jobs
- Headers: 9-10px/600 uppercase, #9ca3af, #f9fafb bg
- Rows: 8px 12px padding, hover #f9fafb, rejected rows #fefafa
- Customer: 13px/600 + order ID chip (mono 10px) below
- **Pickup Date: mono 11px, date on line 1, time on line 2 in #9ca3af** — earliest job origin date
- Job chips: 1px 7px padding, 4px radius, 10px/600, 1px border, 5px dot

### Priority Tag
- Shown next to customer name for orders with priority remarks
- Style: padding 1px 6px, radius 3px, font 9px/700
- Color: #b45309 text, #fefce8 bg, #fde68a border
- Non-priority orders show nothing

### Pickup Date Column (urgency-colored)
- Shows earliest job origin date
- < 2 hours from now: red text (#dc2626)
- Same day (2-24h): default text (#374151)
- Future (>24h): muted text (#9ca3af)
- Table default-sorted by soonest pickup

### Vendor Filter
- Dropdown in filter bar: "Vendor" → filters orders that have jobs with selected vendor
- Same style as Customer dropdown

### Duplicate Button
- Copy icon appears on row hover, rightmost cell
- Click → navigates to create form pre-filled with same customer, jobs, routes, vendors
- MAWB and dates left blank for the new order

### Status Chips (sub-table & Jobs page)
- Chip format: colored dot + status label, 2px 8px padding, 4px radius
- Uses the 5-state color system above
- Replaces old proof status icons (✓/○)

### Expanded View — Sub-Table (NOT cards)
- Expanding a delivery order shows a **nested table** (not cards)
- Sub-table columns: Job, Vendor, Services, Route, Status, Total Cost
- Sub-table headers: 9px/600 uppercase
- Sub-table rows: 6px 10px padding, indented 40px from left
- Job label (J01, J02): Future Blue color, 600 weight
- Status column: uses 5-color status chips (same as Jobs page)
- Click any job row → opens slide-out panel

### Slide-Out Panel (HMW-49)
- 380px width, white bg, slide from right
- Header: 10px 16px padding, 14px/700 title
- Content: 16px padding, compact sections
- **Status Action Bar:** Colored bar at top showing current status chip + primary action
  - **Pending:** Gray bar + `[Start Job →]` button (blue)
  - **In Progress:** Blue bar + hint text "Upload proof to complete →"
  - **Completed:** Amber bar + `[✓ Verify]` button (green)
  - **Verified:** Green bar + "Ready for billing" text. Everything read-only.
  - **Rejected:** Red bar + rejection reason text. Reassign vendor dropdown below.
- **Sections below bar:** Route, Proof of Service, Quantities, Fees, Activity Log
- **Editability rules:**
  - Pending through Completed: fees toggleable, quantities editable, proof upload available
  - Verified: everything locked — no toggles, no inputs, no upload, no proof removal
- **Auto-transitions:**
  - Proof upload while Pending or In Progress → auto-transitions to Completed
  - Clicking Verify → transitions to Verified, locks everything
  - Reassign rejected job → resets to Pending with new vendor

### Create Delivery Order Form
- 2-step flow: ① Order Details → ② Assign Vendors
- Cards: 6px radius, 16px padding, white bg, 1px border
- Step badges: 22x22, radius 5, teal bg
- Step titles: 13px/700
- Labels: 9px/600 uppercase
- Each job row: vendor dropdown + service dropdown + origin → destination + dates
- 1 job = 1 service (no multi-select)
- Buttons: 5px 12px, 6px radius, 11px/600

### Job Detail Page
- Max-width: 1000px
- Cards: 6px radius, 16px padding
- Section titles: 9px/700 uppercase
- Location boxes: 10px padding, 6px radius
- Status buttons: 6px 10px, 4px radius
- Timeline dots: 8px

## Current Architecture

### Navigation
`Delivery Orders | Jobs | Rates | Master Data`

### Delivery Orders (demand-side — client requests)
- **Active/All/Completed** filter chips (default: Active)
- **Date period picker** for All/Completed: Today / This week / This month / Last month / All time
- **Pagination** at 50/page for historical views
- **Sub-table columns:** Job | Vendor | Service | Route | Status | Total Cost
- **Slide-out panel:** Upload proof → Verify → Fee breakdown → Quantities → Activity log
- **Fee model (subtractive):** All fees auto-populate from vendor schedule, ops removes exceptions (HMW-43)
- **Lock on verify:** fees, quantities, proof uploads all read-only after job Verified (billing gate)

### Jobs (supply-side — vendor execution) (HMW-48)
- **Status pills:** Active (Pending + In Progress + Rejected) | Completed | Verified | All
- **Service pills:** FM | EC | CS | CR | OH
- **Vendor dropdown** with search (supports 30+ vendors)
- **Group by toggle:** None (default) | Vendor | Service | Date
- **Columns:** Order · Customer | Vendor | Service | Route | Pickup | Status | Cost
- **Group by: Vendor** — collapsed headers sorted by most outstanding, status badges per vendor
- **Default sort within Active:** Rejected → In Progress → Pending (fires first)
- Click job row → same slide-out panel. Click DO link → Delivery Orders view.

### Unified Job Status Lifecycle
Replaces old dual `status` + `proofStatus` model with single field:
- **Pending** → In Progress → **Completed** (proof uploaded) → **Verified** (admin sign-off)
- **Rejected** = vendor can't fulfill (reassignment resets to Pending)
- **Cancelled** = job cancelled (terminal)

### Rate Management (Rates page)
- **Single vendor dropdown** at top — shared across all service tabs
- **Service tabs:** FM Trucking | Export Customs | Cargo Submission | Cargo Retrieval | Origin Handling

**FM Trucking tab:**
- FTL rate table: origin district → destination district × truck types (1.5T/3T/5T/8T/10T/12T/40HQ/45HQ)
- Routes grouped by city, collapsible
- CSV upload/download (accepts Chinese district names, no codes needed)
- Activity log tracks CSV uploads

**Other service tabs (EC, CS, CR, OH):**
- Vendor fee schedules: vendor's own fee names per service + location
- Fees listed vertically per location (scrolls down, not right)
- Shows: fee name (Chinese + English), unit, rate, min charge
- CSV upload/download for fee schedules

### Master Data
- **Facilities** — operational locations (warehouses, airports, ports) with CRUD
- **Regions** — China city/district hierarchy (GB/T 2260, 33 provinces, 344 cities, 3,077 districts)
- **Services** — L1/L2 tree (5 L1 → 20 L2 with Cost IDs, informational not structural)
- **Vendors** — coming soon
- **Customers** — coming soon

### Data Model (current)
- `Job.status` — unified lifecycle: `'Pending' | 'In Progress' | 'Completed' | 'Verified' | 'Rejected' | 'Cancelled'`
- `FtlRate` — district × truck type for FM trucking
- `VendorFee` — vendor's own fee schedule per service + location (replaces old VendorRate)
- `FeeLineItem` — job-level fee with `active` boolean for subtractive model
- `FtlRateLog` / `VendorFeeLog` — activity tracking for rate changes

### Currency
- MYR, CNY, USD supported
- Currency per-rate (per FTL route, per vendor fee)
- Display: `CNY 3,200` or `RM 450` — prefix before amount in JetBrains Mono

### Remaining Implementation
- **Jobs page:** flat table with status pills, Group by toggle, slide-out integration (HMW-48)
- **Unified status refactor:** replace dual `status`+`proofStatus` with single `status` field
- **Status color refactor:** update all status-related components to 5-state system

## Global CSS Rules
1. Body font: Instrument Sans via `--font-sans` CSS variable
2. All input/select: 1px border #e5e7eb, 4px radius, 5px 8px padding, 12px font
3. Focus: teal border + 2px teal-soft shadow
4. Select has custom chevron SVG
5. Inline styles on all components — no Tailwind classes for visual properties

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-24 | ~~Teal accent~~ → Future Blue `#152CFF` | Updated to match Teleport.it brand identity. Electric blue accent across all interactive elements. |
| 2026-03-24 | Instrument Sans | Clean, good weight range, works at small sizes. |
| 2026-03-24 | JetBrains Mono for data | Slashed zero, clear 1/l/I for MAWB numbers. |
| 2026-03-24 | Service-first creation | Ops thinks "what needs to happen" before "who does it." |
| 2026-03-25 | Hybrid table + expand | Table for scanning, expand for detail. |
| 2026-03-25 | Slide-out panel | Fast status change + proof upload without navigation. |
| 2026-03-25 | "Delivery Order" not "Trip" | Matches business language. |
| 2026-03-25 | Inline styles over Tailwind | Exact pixel matching, eliminates mockup-vs-live gap. |
| 2026-03-25 | Dense design (40px nav, 8px cells) | Ops lives in Excel. UI must feel like a smart spreadsheet. |
| 2026-03-25 | ~~3-color status system~~ → 5-color status system | Gray (pending), blue (in progress), amber (completed/needs verification), green (verified), red (rejected). (HMW-48) |
| 2026-03-25 | Sub-table for expanded jobs | Not cards. Tables speak the same language as the parent view. |
| 2026-03-25 | No dashboard cards | Stats bar is 32px. Cards were 120px. Density wins. |
| 2026-03-25 | 4-6px border radius | Sharp and professional, not bubbly SaaS. |
| 2026-03-25 | 1 job = 1 service | Billing unambiguous, per-service status/proof tracking. Same vendor can repeat. |
| 2026-03-25 | 2-step create form | Removed service checklist step. Each job row has vendor + service dropdown. Simpler. |
| 2026-03-25 | Auto-migrate localStorage | Old multi-service data auto-resets to seed. No manual clearing needed. |
| 2026-03-25 | Pickup Date column | Added to main table — earliest job origin date. Critical for ops scheduling. |
| 2026-03-25 | Realistic seed data | 10 orders with real vendors (HaleSun, SevenSeas, Gonda, ThaiKee, The Lorry) and real customers (TikTok, Shopee, Shein, AliExpress, Temu). |
| 2026-03-25 | ~~Priority tag~~ | Removed — overdesign. (HMW-27) |
| 2026-03-25 | ~~Pickup urgency coloring~~ | Removed — visual noise without clear value. |
| 2026-03-25 | Duplicate order button | Copy icon on row hover → pre-fills create form with same pattern. |
| 2026-03-25 | Vendor filter dropdown | Added to filter bar alongside MAWB and Customer. Filters orders by vendor. |
| 2026-03-25 | Proof status icon | Green ✓ = proof uploaded, gray ○ = missing. Replaces "N docs" text in sub-table. |
| 2026-03-25 | Location master data | Dropdown + "Add new" replaces free-text locations. Prerequisite for rate lookups. |
| 2026-03-25 | Rate + unit pricing | Each rate has a unit (flat/per-kg/per-bag/per-CBM). Cost = rate × quantity. |
| 2026-03-25 | Vendor comparison popover | During order creation, compare vendors by rate + reliability before assigning. |
| 2026-03-25 | ~~Invoice variance detection~~ | Removed — billing module dropped. Proof-centric model replaces billing validation. |
| 2026-03-25 | Quick-add service bar in create form | Horizontal [+FM] [+EC] [+CS] etc. bar. Click = add job with service pre-filled. Service-first thinking restored. |
| 2026-03-25 | Empty state: inline CTA | Teal icon + message + [+ New Order] button in empty table body. No hand-holding. |
| 2026-03-25 | Reactive slide-out panel | Panel stores tripId+jobId, derives data from context. Always fresh after mutations. |
| 2026-03-25 | ~~Persona-split navigation~~ → Simplified nav | Delivery Orders / Rates / Master Data. Billing dropped (redundant with proof-centric). |
| 2026-03-25 | ~~Persona-specific sub-table columns~~ → Flat sub-table | Job/Vendor/Service/Route/Total Cost/Proof. Click row → slide-out for details. (HMW-27) |
| 2026-03-25 | Service config: FM=route, rest=location | FM Trucking uses origin+destination. EC/CS/CR/OH use single location. Determines form layout per job. |
| 2026-03-25 | Multi-currency (MYR/CNY/USD) | Currency is per-rate. Display: "CNY 3,200". Mixed totals show separate line per currency. |
| 2026-03-25 | ~~Add Rate slide-out~~ → CSV upload | Rate management via CSV upload/download, not one-by-one forms. (HMW-42) |
| 2026-03-25 | ~~Billing severity sort~~ | Removed — billing module dropped. |
| 2026-03-25 | ~~Bulk match for billing~~ | Removed — billing module dropped. |
| 2026-03-25 | Location dropdown by zone | Grouped by zone/city (Shenzhen, Guangzhou, HK), not by type. Type shown as badge within group. |
| 2026-03-25 | Add Location inline form behavior | Focus management: expand form → focus Name → on save auto-select + fire rate lookup → on error stay in form. |
| 2026-03-25 | One popover at a time | Vendor comparison: opening new closes existing. Click outside/Escape/select vendor all close. |
| 2026-03-25 | Full interaction state table | Loading/Empty/Error/Success/Partial specified for all Phase 2 features. |
| 2026-03-25 | Desktop a11y + keyboard nav | Arrow keys for dropdowns, tab for popovers, focus trapping in slide-outs, Escape to close. Min viewport 1200px. |
| 2026-03-25 | Multi-fee jobs (HMW-25) | Each job has N fee line items (L2). Fee = locked rate × editable quantity = calculated amount. Sub-table shows Total Cost (sum of fees). |
| 2026-03-25 | ~~Inline quick status~~ → ~~Proof-centric~~ → Unified status | Originally proof-centric, now unified lifecycle: Pending → In Progress → Completed → Verified. (HMW-30 → HMW-47) |
| 2026-03-25 | Per-job quantities (HMW-26) | Bags/weight/volume live at job level, default from order. Editable until validated. |
| 2026-03-25 | ~~Fee catalog (free-text)~~ → Rate-locked fees | All fees from rate cards only. No free-text entry. "Fees are configured in Rates →" link. (HMW-30) |
| 2026-03-25 | Lock on validate | When job proofStatus = validated, all fees and quantities become read-only. |
| 2026-03-25 | Flat sub-table (HMW-27) | No inline fee expansion. Fee details in slide-out only. Sub-table scans, slide-out acts. |
| 2026-03-25 | Smart default filter (HMW-28) | Active/All/Completed chips. Active = any job NOT validated. Default on page load. |
| 2026-03-25 | Date period picker (HMW-29) | Today/This week/This month/Last month/All time. Only for All/Completed views. Active has no date constraint. |
| 2026-03-25 | ~~Billing module~~ dropped | Redundant with proof-centric delivery orders. Validated = ready for payment. |
| 2026-03-25 | Teleport Future Blue `#152CFF` | Brand color from teleport.it. Dark nav `#111827`. |
| 2026-03-25 | L1/L2 service hierarchy | 5 L1 services → 20 L2 sub-services with Cost IDs from CR Trip Management reference. |
| 2026-03-25 | Unit type fixed per Cost ID (HMW-35) | /trip, /kg, /bag defined once in master data. All rates for that Cost ID use the same unit. |
| 2026-03-25 | Fee auto-population (HMW-34) | All L2 fees with rates auto-populate on job creation. Rate in the sheet = fee on the job. |
| 2026-03-25 | China regions master data | GB/T 2260 standard. 33 provinces, 344 cities, 3,077 districts. For FTL district-to-district pricing. |
| 2026-03-25 | Facilities vs Regions | Facilities = operational locations (warehouses, airports). Regions = standardized admin divisions. Separate master data tabs. |
| 2026-03-25 | FTL trucking rates (HMW-37/39) | Origin district → Destination district × truck type. 8 types: 1.5T/3T/5T/8T/10T/12T/40HQ/45HQ. |
| 2026-03-25 | CSV as primary rate editing (HMW-42) | CSV upload/download for bulk rate management. Grid is read-only dashboard. Accepts district names, not codes. |
| 2026-03-25 | Rate activity log | Every CSV upload tracked: timestamp, user, filename, summary (new/updated/unchanged). |
| 2026-03-25 | Unified vendor selector on Rates page | Single dropdown at top, shared across all service tabs. Not separate pills per tab. |
| 2026-03-25 | Service-based rate tabs | FM Trucking / Export Customs / Cargo Submission / Cargo Retrieval / Origin Handling. Each service has its own rate structure. |
| 2026-03-25 | Services rates: vertical by location | Each location as a card with fees listed vertically underneath. Scrolls down, not right. |
| 2026-03-29 | Jobs page (HMW-44→48) | Separate Jobs nav item for vendor/execution-focused view. Flat power table with status pills + Group by toggle. Complementary to DO view (demand-side vs supply-side). |
| 2026-03-29 | ~~Proof-centric lifecycle~~ → Unified status (HMW-47) | Replace dual status+proofStatus with single field: Pending → In Progress → Completed (proof uploaded) → Verified (admin sign-off). Researched Flexport, project44, Uber Freight, TAI TMS. |
| 2026-03-29 | "In Progress" not "In Transit" | Works for all 5 service types — customs clearance is "in progress" not "in transit". |
| 2026-03-29 | "Verified" not "Validated" | Distinct billing gate. Implies proof review without implying payment authorization. |
| 2026-03-29 | Proof upload triggers Completed | No separate proofStatus field. Upload = status transition to Completed. Verified = admin sign-off. |
| 2026-03-29 | Status pills as primary Job view nav | Active/Completed/Verified/All. Scales to 30+ vendors (always 3-4 urgency tiers). |
| 2026-03-29 | Group by: Vendor as secondary lens | Not the default — toggled for proof chasing. Collapsed headers sorted by most outstanding. |
| 2026-03-29 | 5-color status system | Extends 3-color: gray (pending), blue (in progress), amber (completed), green (verified), red (rejected). |
| 2026-03-29 | Slide-out Status Action Bar (HMW-49) | Colored bar at top of slide-out showing status + primary action. Adapts per stage: Start Job / upload hint / Verify / read-only / rejection+reassign. One component, five states. |
| 2026-03-29 | Proof upload auto-transitions | Uploading proof triggers Completed (even from Pending, skipping In Progress). No manual "mark complete" button needed. |
| 2026-03-29 | Editable until Verified | Fees toggleable, quantities editable, proof uploadable from Pending through Completed. Everything locks on Verified (billing gate). |
| 2026-03-29 | ~~Lock on validate~~ → Lock on verify | Renamed from "validate" to "verify" per unified status terminology. Same behavior: all fields read-only after verification. |
