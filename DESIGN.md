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

## Color — Simplified 3-State System

**Principle:** Only use color when it demands attention. Most of the UI is neutral.

| State | Text | Background | Border | Dot | When |
|-------|------|-----------|--------|-----|------|
| **Completed** | `#059669` | `#f0fdf4` | `#a7f3d0` | `#059669` | Job done — vendor can be paid |
| **Rejected** | `#dc2626` | `#fef2f2` | `#fecaca` | `#dc2626` | Problem — needs action NOW |
| **Everything else** | `#6b7280` | `#fff` | `#e5e7eb` | `#9ca3af` | Pending, In Progress, Cancelled |

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
- Format: `5 orders | 6 in progress | 2 completed | 1 rejected`
- Only completed (green) and rejected (red) get color. Everything else is default ink.

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

### Proof Status Icons (sub-table)
- Green ✓ (#059669): at least 1 proof document uploaded
- Gray ○ (#9ca3af): no proofs yet
- Replaces "N docs" text — more scannable

### Expanded View — Sub-Table (NOT cards)
- Expanding a delivery order shows a **nested table** (not cards)
- Sub-table columns: Job, Vendor, Services, Route, Status, Proofs
- Sub-table headers: 9px/600 uppercase
- Sub-table rows: 6px 10px padding, indented 40px from left
- Job label (J01, J02): teal color, 600 weight
- Click any job row → opens slide-out panel
- Proofs column shows document count — billing visibility without expanding further

### Slide-Out Panel
- 380px width, white bg, slide from right
- Header: 10px 16px padding, 14px/700 title
- Content: 16px padding, compact sections

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

## Phase 2 — Rate Management & Billing

### Navigation (Phase 2)
- **Canonical nav:** `Delivery Orders | Rates | Billing | Master Data`
- "New Order" is a button on the Delivery Orders page, NOT a nav item
- **Rates** sub-tabs: `By Vendor | By Service`
- **Billing** sub-tabs: `Ready | Validation | Approved`
- **Master Data** sub-tabs: `Locations | Vendors | Customers | Services`
- Personas: ops planner uses Delivery Orders + create form. Billing admin uses Billing page. Both share Rates (read) and Master Data.

### Service Config
| Code | Name | Rate Type | Form Fields |
|------|------|-----------|-------------|
| FM | FM Trucking | route | Origin dropdown + Destination dropdown |
| EC | Export Customs | location | Single location dropdown |
| CS | Cargo Submission | location | Single location dropdown |
| CR | Cargo Reception | location | Single location dropdown |
| OH | Origin Handling | location | Single location dropdown |

### Currency
- Phase 2 supports MYR, CNY, USD
- Currency is per-rate (set in Add Rate form)
- Rate display: `CNY 3,200` or `RM 450` — currency prefix before amount, same weight
- Mixed-currency totals: `Order total: RM 1,050 + CNY 3,200` — separate line per currency
- Billing variance: calculated within same currency only. Cross-currency comparisons flagged as "Currency mismatch" in amber

### Sub-Table Columns (Persona-Specific)

**Ops view** (Delivery Orders page):
| Job | Vendor | Service | Route | Rate | Cost | Status | Proofs |

**Billing view** (Billing page):
| Job | Vendor | Service | Route | Agreed Cost | Invoice | Variance | Action |

Unit, Qty visible in slide-out panel detail, not in sub-table.

### Rate Badges
- **Rate found:** teal text `#0D9488`, no background. Format: `RM 450 /trip`
- **No rate on file:** amber text `#b45309`, `#fefce8` bg. "No rate"
- **Rate loading:** gray text `#9ca3af`, animated shimmer bg
- **Rate error:** red text `#dc2626`. "Rate error"

### Unit Badges
| Unit | Text | Background | Border |
|------|------|-----------|--------|
| Flat (per trip) | `#6b7280` | `#f3f4f6` | `#e5e7eb` |
| Per kg | `#2563eb` | `#eff6ff` | `#bfdbfe` |
| Per bag | `#7c3aed` | `#f5f3ff` | `#ddd6fe` |
| Per CBM | `#d97706` | `#fffbeb` | `#fde68a` |

### Variance Badges
| State | Text | Background | Border | When |
|-------|------|-----------|--------|------|
| Match | `#059669` | `#f0fdf4` | `#a7f3d0` | Invoice = agreed rate |
| Over | `#dc2626` | `#fef2f2` | `#fecaca` | Invoice > agreed rate |
| Under | `#2563eb` | `#eff6ff` | `#bfdbfe` | Invoice < agreed rate |
| No rate | `#b45309` | `#fefce8` | `#fde68a` | No agreed rate to compare |

### Add Rate Form
- Uses slide-out panel pattern (380px, same as job slide-out)
- Fields: Vendor dropdown, Service dropdown, Rate Type toggle (Route/Location), Origin+Destination OR single Location dropdown (based on rate type), Rate amount input with currency dropdown, Unit dropdown, Effective date picker
- Rate type toggle dynamically shows/hides Origin/Destination vs Location fields based on SERVICE_CONFIG
- Labels: 9px/600 uppercase (matches existing form pattern)
- Save → toast "Rate saved for [Vendor] [Service]: [Route/Location]"
- Error → inline red text below conflicting field

### Rate Versioning
- When a new rate is added for an existing vendor/service/route combination, the system auto-sets the previous rate's `effectiveTo` to the day before the new rate's `effectiveFrom`
- Rate lookup returns the rate with the latest `effectiveFrom` on or before the job's date
- Rates page shows rate history per vendor/service — current rate prominent, previous rates in muted text

### Location Dropdown (Create Form)
- Grouped by zone/city (Shenzhen, Guangzhou, Hong Kong, etc.), NOT by type
- Type shown as badge within each group: `[Warehouse]` `[Airport]` `[Port]`
- Fuzzy search filters across all zones
- "**+ Add new location**" at bottom of dropdown

### "Add New Location" Inline Form Behavior
1. Click "+ Add new location" → inline form expands below dropdown, dropdown closes, focus moves to Name input
2. Fill fields (Name, Zone, Type), click "Add" → location created, inline form collapses, dropdown re-opens with new location auto-selected, rate lookup fires with new location
3. Click "Cancel" → inline form collapses, dropdown re-opens with no selection
4. Creation error (duplicate name) → inline form stays open, red text below Name field: "A location named [X] already exists in [Zone]"

### Vendor Comparison Popover
- Max-width: 480px, responsive down to 360px
- Positioned: left-aligned to job row by default
- If popover exceeds right viewport edge → flip to right-aligned
- Below 1200px viewport width → full-width below job row
- **One popover at a time.** Opening a new popover closes the existing one
- Click outside → close. Escape → close. Select vendor → close and update dropdown
- If reliability data unavailable → show rates only, hide reliability columns, add "Reliability data unavailable" footnote

### Billing Validation Page
- Default sort: severity-first. Over-invoiced (red) → No rate (amber) → Under-invoiced (blue) → All match (green)
- Filter row: `All (N) | Flagged (N) | No rate (N)`
- **"Apply agreed rates as invoiced"** button per order — one click marks all matching jobs as invoiced at the agreed rate. Only discrepancies need manual entry
- Invoice input: number field with currency prefix. Red border + "Enter a valid amount" on blur if non-numeric
- Dispute/Accept buttons per variance → toast confirmation on action

### Phase 2 Interaction States

| Feature | Loading | Empty | Error | Success | Partial |
|---------|---------|-------|-------|---------|---------|
| Rate lookup | Gray shimmer in badge area | Amber "No rate" badge | Red "Rate error" | Teal rate badge with amount | "RM X *partial — N jobs missing rate" |
| Location dropdown | "Loading..." placeholder | "No locations — add one" | Red toast | Auto-select new location | N/A |
| Vendor comparison | Skeleton rows in popover | "No vendors for this service" | "Data unavailable" footnote | Full popover with rates | Some rates missing — show "—" |
| Rate CRUD | Save spinner on button | "No rates yet" + [+ Add Rate] CTA | Inline red text below field | Toast "Rate saved for..." | N/A |
| Invoice variance | N/A | "No invoice" in muted text | Red border "Invalid amount" | Variance badge (match/over/under) | "N/A" for jobs without rates |
| Billing validation | Page skeleton (table rows shimmer) | "No orders ready for billing" | Red banner at top | Toast "Order approved" | Mixed match/flagged within order |

### Dependency Banner
- When Rates page is opened with zero locations in the system:
- Amber banner: "Add locations first. Rate cards require managed locations for lookups to work. [Go to Locations]"
- Same style as rejection banner (amber variant): `#b45309` text, `#fefce8` bg, `#fde68a` border

### Keyboard Navigation (Desktop A11y)
- Location dropdown: Arrow keys navigate, Enter selects, Escape closes
- Vendor comparison popover: Tab between vendors, Enter selects, Escape closes
- Slide-out panel (Add Rate / Job): Focus trapped inside when open, Escape closes
- Add Rate form: Tab order top-to-bottom, Enter on Save
- Minimum viewport: 1200px

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
| 2026-03-25 | 3-color status system | Green (done), red (problem), gray (everything else). No rainbow. |
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
| 2026-03-25 | ~~Inline quick status~~ → Proof-centric | Replaced manual status with proof lifecycle: Awaiting → Uploaded (auto) → Validated → Disputed. (HMW-30) |
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
