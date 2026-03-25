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
- **Accent (teal):** `#0D9488` — interactive elements ONLY (buttons, links, active nav, job labels)
- **Accent hover:** `#0F766E`
- **Accent soft:** `rgba(13,148,136,0.06)` — active nav bg, service pill bg
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

## Global CSS Rules
1. Body font: Instrument Sans via `--font-sans` CSS variable
2. All input/select: 1px border #e5e7eb, 4px radius, 5px 8px padding, 12px font
3. Focus: teal border + 2px teal-soft shadow
4. Select has custom chevron SVG
5. Inline styles on all components — no Tailwind classes for visual properties

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-24 | Teal accent | Every logistics TMS uses blue. Teal differentiates. |
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
| 2026-03-25 | Priority tag on orders | Amber "PRIORITY" tag next to customer name. Non-priority stays clean. |
| 2026-03-25 | Color-coded pickup urgency | Red for <2h, default for today, muted for >24h. Table sorted soonest-first. |
| 2026-03-25 | Duplicate order button | Copy icon on row hover → pre-fills create form with same pattern. |
| 2026-03-25 | Vendor filter dropdown | Added to filter bar alongside MAWB and Customer. Filters orders by vendor. |
| 2026-03-25 | Proof status icon | Green ✓ = proof uploaded, gray ○ = missing. Replaces "N docs" text in sub-table. |
| 2026-03-25 | Location master data | Dropdown + "Add new" replaces free-text locations. Prerequisite for rate lookups. |
| 2026-03-25 | Rate + unit pricing | Each rate has a unit (flat/per-kg/per-bag/per-CBM). Cost = rate × quantity. |
| 2026-03-25 | Vendor comparison popover | During order creation, compare vendors by rate + reliability before assigning. |
| 2026-03-25 | Invoice variance detection | "Invoice Amount" field per job, auto-compared to agreed rate. Red flag for discrepancies. |
| 2026-03-25 | Quick-add service bar in create form | Horizontal [+FM] [+EC] [+CS] etc. bar. Click = add job with service pre-filled. Service-first thinking restored. |
| 2026-03-25 | Empty state: inline CTA | Teal icon + message + [+ New Order] button in empty table body. No hand-holding. |
| 2026-03-25 | Reactive slide-out panel | Panel stores tripId+jobId, derives data from context. Always fresh after mutations. |
