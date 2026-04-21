# Design System — Teleport OS Vendor

> Inherits from `../admin/DESIGN.md` (Teleport OS Admin). This document covers **vendor-specific adaptations only.**
> For shared design tokens (colors, typography, spacing, status system), always refer to `../admin/DESIGN.md`.

## Product Context
- **What:** Vendor-facing job visibility, status updates, and fee reconciliation
- **Who:** 3PL vendor operators (5-30 jobs/day) + vendor finance admins
- **Posture:** Read-heavy, action-light. A checklist, not a cockpit.
- **Environment:** Often on-site at warehouses, cargo terminals. Tablet-width screens (768px+).

## Design Principle: Same System, Different Posture

The vendor app uses the exact same design tokens as the admin app. A vendor and an ops planner looking at the same job should see the same colors, the same status chip, the same typography. The difference is in what's shown and how it's laid out, not how it looks.

## What's Identical to Admin

| Token | Value | Reference |
|-------|-------|-----------|
| Nav height | 40px | `../admin/DESIGN.md` → Spacing |
| Nav background | `#111827` | `../admin/DESIGN.md` → Colors |
| Accent (Future Blue) | `#152CFF` — **interactive only** | `../admin/DESIGN.md` → Colors |
| Status/Verification cells | dot + label + timestamp subline, 11px, no filled chips | `../admin/DESIGN.md` → Color |
| Service tag styling | mono gray code, no pill chrome | see Color section below |
| Typography | Instrument Sans + JetBrains Mono | `../admin/DESIGN.md` → Typography |
| Type scale | Same sizes (9-16px range) | `../admin/DESIGN.md` → Typography |
| Table density | 8px 12px cells, 6px 12px headers | `../admin/DESIGN.md` → Spacing |
| Border radius | 4-6px sharp | `../admin/DESIGN.md` → Border Radius |
| Shadows | Minimal (border-only for most) | `../admin/DESIGN.md` → Shadows |
| Inputs | 1px border, 4px radius, 5px 8px pad | `../admin/DESIGN.md` → Global CSS |
| Toast notifications | Same styling and behavior | `../admin/DESIGN.md` → Toast |

## Color

### Accent — interactive only

`#152CFF` is used exclusively on: links, primary buttons, active nav, selected filter pills (service toggle), selected pagination buttons.

**Never on data chrome:** trip IDs, service tags, plate numbers, driver/assignment text, empty-state icons, status/verification chips.

### State colors (dot + text — no filled chips on data rows)

| Signal | Dot | Text | Weight |
|--------|-----|------|--------|
| Pending | `#d1d5db` | `#6b7280` | 400 |
| In Progress | `#152CFF` | `#111827` | 500 |
| Completed / To verify | `#a16207` | `#374151` | 500 |
| Verified | `#059669` | `#059669` | 600 |
| Rejected | `#dc2626` | `#dc2626` | 600 |
| Cancelled | `#dc2626` | `#dc2626` | 600 |

Pattern: 6px dot + label at 11px + `#9ca3af` timestamp subline at 10px mono. Optional muted reason subline for Cancelled/Rejected.

No row tints for cancelled or rejected rows. The Status/Verification cell's dot + text + reason subline carries the signal.

### Color budget per row

Maximum one accent color beyond ink/muted/faint:
- In Progress dot → blue
- Verified text → green
- Rejected / Cancelled text → red
- Everything else → `#111827 / #374151 / #6b7280 / #9ca3af`

### Tinted containers — slide-out / status action bar only

Tinted backgrounds (`#fefce8` amber, `#f0fdf4` green, `#fef2f2` red, `#f9fafb` gray) are reserved for the Status Action Bar on the Job Detail page. Not used on table rows.

## What's Different

### Navigation
- **Logo area:** "Teleport OS" + "Vendor" label (10px, rgba(255,255,255,0.35))
- **Nav items:** Single item: "My Jobs" (future: "My Jobs | Reconciliation")
- **Right side:** Vendor company name (11px/600, rgba(255,255,255,0.7)) + avatar initials (22x22, 4px radius, rgba(255,255,255,0.12) bg)
- **No admin controls** in nav (no rates, no master data)

### Job List (My Jobs)

Platform-aligned flat table. Two separate columns: **Status** and **Verification** (client spec — do NOT merge into a single State column).

- **No vendor column** — pre-filtered to logged-in vendor
- **No Group By toggle**
- **No stats bar** — segment pills carry counts
- **No search** — no search input currently (future iteration)
- **Columns:** Trip 10% | Customer 12% | Service 7% | Where 29% | Pickup 9% | Status 14% | Verification 11%
- **Status cell:** `StatusCell` component — dot + label + relative timestamp subline + optional cancel reason subline
- **Verification cell:** `VerificationCell` component — dot + label + timestamp subline + optional rejection reason subline
- **"Where" column** (renamed from "Route"): service-contextual content with sub-lines (HMW-V04):
  - FM: origin → destination + driver/vehicle sub-line (HMW-V03)
  - EC/CS: location + MAWB sub-line
  - OH/CR: location + bags + weight sub-line
- **Trip ID:** ink mono (`#111827`, 10px JetBrains Mono) — no chip, no blue
- **Service tag:** mono gray (`#6b7280`, 10px JetBrains Mono) — no pill, no blue
- **Segment pills:** `All · Pending · In Progress · To verify · Verified · Cancelled`
  - `To verify` = `status === 'Completed' && verificationStatus !== 'Verified'`
  - `Verified` = `verificationStatus === 'Verified'`
  - Active pill: dark fill (`#111827` bg, white text) for neutral segments; state-colored border+bg for To verify / Verified / Cancelled
- **Export CSV button** in page header (right-aligned)
- **Empty state:** plain muted text + `clear filters` link — no decorative icon, no tinted box

### Job Detail — Full Page (NOT Slide-Out)
The admin uses a 380px slide-out panel because ops planners rapidly scan a table and peek at jobs. Vendors open one job, review everything, take action, move on. Full page gives more room for the fee reconciliation table.

**Layout — Service-Adaptive:**
- **Header:** Back link ("← My Jobs") + Job ID badge + service name + service tag + DO ref + customer + MAWB
- **Status Action Bar:** Full-width colored bar below header. Same 5-color treatment as admin slide-out bar.
- **Body:** Same skeleton, adaptive middle section per service type:

**FM Trucking layout:**
  1. **Status Action Bar** (existing)
  2. **Dispatch Assignment** — driver dropdown + vehicle dropdown + truck type badge. FM-only. Locked after Completed. See Fleet Management below.
  3. **Pickup/Delivery Timeline** — two-point layout: Origin (location + pickup datetime in big mono) → arrow → Destination (location + delivery datetime). Times are the most important data for FM.
  4. **Cargo** — compact inline row: `24 bags · 1,280 kg · 8.4 CBM`
  5. **Fee Breakdown** — full-width table (read-only)
  6. **Proof of Service** — multi-file upload zone + file list rows
  7. **Activity Log** — reverse chronological

**EC / CS / CR / OH layout:**
  1. **Status Action Bar** (existing)
  2. **Location** — single facility name + zone (these are single-location services, no origin→destination)
  3. **Cargo** — compact inline row
  4. **Fee Breakdown** — full-width table (read-only)
  5. **Proof of Service** — multi-file upload zone + file list rows
  6. **Activity Log** — reverse chronological

No dispatch assignment (not applicable to non-FM). No origin→destination (single location).

**Status Action Bar (vendor-adapted):**

| Status | Bar Color | Left Content | Right Content |
|--------|-----------|-------------|---------------|
| Pending | Gray (`#f9fafb`) | Status chip + "Start this job when you begin work" | `[Start Job →]` button (blue) |
| In Progress | Blue (`rgba(21,44,255,0.04)`) | Status chip + "Upload proof of service to mark complete" | `[↑ Upload Proof]` button (blue) |
| Completed | Amber (`#fefce8`) | Status chip + "Waiting for Teleport verification" | Completion timestamp |
| Verified | Green (`#f0fdf4`) | Status chip + "Verified by Teleport — ready for billing" | Verification timestamp + checkmark |
| Cancelled | Red (`#fef2f2`) | Status chip + "Cancelled by Teleport — [reason]" | (no action) |

**Fee Breakdown Table:**
- Full-width section with table
- Columns: Fee | Unit | Rate | Qty | Amount
- Inactive/removed fees: entire row at 40% opacity + line-through
- Footer: total per currency (bold, 2px top border)
- Explanatory text below: struck-through fees note
- **Read-only** — vendor cannot toggle or edit

**Proof of Service (multi-file):**
- `<input multiple>` + drag-and-drop zone. Select/drop multiple files in one action.
- Each file = separate ProofDocument entry
- File list: simple rows (icon + name + timestamp), not cards
- Activity log: one entry per upload batch ("Uploaded 3 files: pod-front.jpg, pod-back.jpg, stamp.pdf")
- Camera button on tablet/mobile: uses `capture="environment"` for on-site photo capture
- Upload zone: dashed border (1.5px dashed rgba(21,44,255,0.25)), "Drop files here or browse", "📷 Take Photo" button
- Upload available in Pending and In Progress only
- Hidden/disabled in Completed, Verified, Cancelled

**Activity Log:**
- Same format as admin: timestamp (mono 9px) + action + user
- Shows both vendor and admin actions
- Reverse chronological
- Timeline rail only when log > 10 entries

**Regression guard — do not reintroduce:**
- Single bordered action row in Status Action Bar (no stacked tinted containers)
- Inline reason text for cancelled/rejected (no tinted reason boxes)
- Flat proof list with mono-gray icons (no card grids)
- Tinted action bar backgrounds are per the Status Action Bar table above — one at a time, never stacked

### Dispatch Assignment (FM Trucking only)
Appears on Job Detail page between Status Action Bar and Pickup/Delivery Timeline. Only for FM service type.

- **Driver dropdown:** from vendor's driver list (name + phone). Filterable.
- **Vehicle dropdown:** from vendor's vehicle list, filtered by compatible truck type. Shows plate + type.
- **Truck type badge:** auto-displayed from the job's truck type.
- Assigning a driver does NOT auto-start the job. Assignment = dispatch-time, Start Job = execution-time.
- Can reassign while Pending or In Progress. Locked after Completed/Verified/Cancelled.
- Activity log: "Assigned Driver Zhang Wei + 粤B·12345"
- Background: `rgba(21,44,255,0.02)` with `rgba(21,44,255,0.1)` border. 6px radius.

### Fleet Management Page
New nav item. Nav becomes: **My Jobs | Fleet**

**Two tabs:** Drivers | Vehicles

**Drivers table:**
- Columns: Name | Phone | WeChat ID | Default Vehicle | Status | Actions
- Dense CRUD table (8px 12px cells, 6px 12px headers)
- "+ Add Driver" button in page header (blue outline, `#152CFF` text — interactive context)
- Default vehicle: plate in ink mono + truck type code in mono gray (no blue pill)
- Status (Active/Inactive): flat dot + text — green dot `#059669` for Active, ghost dot `#d1d5db` for Inactive. No filled badge.

**Vehicles table:**
- Columns: Plate | Truck Type | Capacity | Status | Actions
- Plate number: ink mono (`var(--font-mono)`) — no blue
- Truck type: mono gray (`#6b7280`, `var(--font-mono)`) — no blue pill
- Status: same flat dot + text pattern as Drivers

**No stats bar.** No `5 drivers · 8 vehicles` chrome above the table.

### Responsive Breakpoints
Unlike the admin app (desktop-only, min 1200px), the vendor app targets 768px+.

| Breakpoint | Job List | Job Detail |
|------------|----------|------------|
| ≥1024px | Full 7-column table (Trip, Customer, Service, Route, Pickup, Status, Cost) | Fees full-width, Route + Cargo side-by-side, Proofs + Log below |
| 768-1023px | Condensed 5-column table: drop Route, stack Customer+Trip into one cell (HMW-V01) | All sections stack to single column. Fees still first. |
| <768px | Out of scope for v1. Future: card-based job list on mobile |

### Authentication Screen
- Centered card (max-width 360px) on page background
- Teleport OS logo + "Vendor" label at top
- Vendor selector dropdown (same styling as admin dropdowns)
- Access code input field
- `[Sign In]` button (blue, full-width)
- Simple, minimal. No hero images, no marketing copy.

## Status + Verification Model (2026-04-21, updated)

The vendor app **surfaces both Status and Verification as separate columns** in the My Jobs table — mirroring the admin app. This is intentional: vendors benefit from knowing whether their completed jobs have been verified (billing gate). Verification is read-only for vendors; they cannot trigger it.

Both columns use `StatusCell` and `VerificationCell` (shared components, same pattern as admin): dot + label + timestamp subline + optional reason subline. No filled chips. No row tints.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-29 | Full-page job detail (not slide-out) | Vendor workflow is "open, review, act, move on" not "scan table, peek at jobs." More room for fee table + proofs. |
| 2026-03-29 | Responsive from day 1 (768px+) | Vendors work on-site at warehouses/terminals. Tablet-width support is not a nice-to-have. |
| 2026-03-29 | Cancelled as separate status pill | Admin groups Cancelled into Active. Vendor needs Cancelled as its own tab — cancelled jobs are a different concern (stop work, don't invoice). |
| 2026-03-29 | Read-only fees | Vendor views fees for reconciliation only. No toggles, no edits. Discrepancies flagged via existing channels (v1), in-app flagging (v2). |
| 2026-03-29 | Vendor identity in nav | Company name + avatar initials on right side. Makes it clear whose data this is. |
| 2026-03-29 | "Teleport OS Vendor" label | Subtle label next to logo text. Same pattern as "Teleport OS Admin" on the admin side. |
| 2026-03-29 | Same design tokens, different layout | Coherent platform feel. Vendor and admin discussing the same job see the same visual language. |
| 2026-03-29 | Condensed table at 768px (HMW-V01) | Drop Route column, stack Customer+Trip into one cell. Status and Cost always visible. Route available in detail page. |
| 2026-03-29 | Fees-first section ordering (HMW-V02) | App exists for reconciliation — lead with the money. Vendor already knows the route. Order: Fees → Route + Cargo → Proofs → Activity Log. |
| 2026-03-30 | FM assignment above fees (design review) | For FM jobs only, Driver & Vehicle Assignment section sits between Status Action Bar and Fee Breakdown. Dispatcher's first question is "who's driving?" not "are the fees right?" Non-FM services skip this section. |
| 2026-03-30 | Assignment ≠ Start Job (design review) | Assigning a driver is dispatch-time (morning). Starting the job is execution-time (driver arrives at pickup). Separate actions, separate moments. |
| 2026-03-30 | Driver sub-line under Route (HMW-V03) | Driver name + vehicle plate shown as sub-line under route text in job list. Muted gray (`#6b7280`) for assigned, ghost gray (`#d1d5db`) "No driver assigned" for unassigned FM jobs. Non-FM shows nothing. Route column has most width and strongest semantic link. |
| 2026-03-30 | Rename "Route" → "Where" + service sub-lines (HMW-V04) | Same 7-column table, rename column. Sub-lines per service: FM=driver+vehicle, EC/CS=MAWB, OH/CR=bags+weight. Option C (compact two-line rows) rejected as overcomplicating the smart spreadsheet. |
| 2026-03-30 | Service-adaptive job detail | Same skeleton (header → status → [adaptive] → fees → proofs → log), but middle section changes per service. FM gets Dispatch + Timeline. Non-FM gets single Location. One generic layout serves neither well. |
| 2026-03-30 | Multi-file proof upload | `<input multiple>` + drag-and-drop + camera button for tablet. Batch activity log entry. Simple file rows, not card boxes. |
| 2026-03-30 | Fleet page (My Jobs &#124; Fleet) | Drivers + Vehicles as vendor-scoped master data. Dense CRUD tables. Separate page, not crammed into job detail. |
| 2026-03-30 | Pickup/Delivery Timeline for FM | Two-point layout with big mono times. The single most important data for FM dispatchers. Non-FM services show single Location row instead. |
| 2026-03-30 | Vertical timeline for FM route planning (HMW-V05) | Nodes for stops (origin, hubs, destination), leg cards between nodes with driver/vehicle/status, hub ops badges (ARR/PAL/DEP) inline on hub nodes. Three states: empty (add stops), planned (assign drivers), execution (live progress with opacity fade for future legs). |
| 2026-03-30 | No unnecessary complexity | Don't add labels, badges, or classifications that aren't prompted by user needs (e.g., no "cross-border" tags). A leg is a leg. Keep it simple. |
| 2026-04-21 | Vendor slop-reduction alignment | Stats bar removed from My Jobs + Fleet; ServiceTag mono-gray (`#6b7280`, no pill); Trip ID ink mono (no chip, no blue); status/verification chips replaced by flat dot+text cells (`StatusCell` + `VerificationCell` mirroring admin); segment pills unified to `All · Pending · In Progress · To verify · Verified · Cancelled`; row tints removed; empty state simplified to muted text + `clear filters` link. Client-spec override retained: Status + Verification stay in two columns, not merged. Fleet: no stats bar; driver/vehicle Active status is flat dot+text, not filled badge; truck type code and plate numbers are ink/mono-gray, not blue. |

## Preview
Open `vendor/design-preview.html` in a browser to see the proposed screens.
Also see `/tmp/vendor-ux-preview.html` for the service-adaptive UX mockup (FM vs generic comparison).
