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
| Accent (Future Blue) | `#152CFF` | `../admin/DESIGN.md` → Colors |
| 5-color status system | gray/blue/amber/green/red | `../admin/DESIGN.md` → Color |
| Status chip styling | dot + label, 2px 8px, 4px radius | `../admin/DESIGN.md` → Status Chips |
| Service tag styling | code + label pill, 99px radius | `../admin/DESIGN.md` → Service Tag |
| Typography | Instrument Sans + JetBrains Mono | `../admin/DESIGN.md` → Typography |
| Type scale | Same sizes (9-16px range) | `../admin/DESIGN.md` → Typography |
| Table density | 8px 12px cells, 6px 12px headers | `../admin/DESIGN.md` → Spacing |
| Border radius | 4-6px sharp | `../admin/DESIGN.md` → Border Radius |
| Shadows | Minimal (border-only for most) | `../admin/DESIGN.md` → Shadows |
| Inputs | 1px border, 4px radius, 5px 8px pad | `../admin/DESIGN.md` → Global CSS |
| Toast notifications | Same styling and behavior | `../admin/DESIGN.md` → Toast |

## What's Different

### Navigation
- **Logo area:** "Teleport OS" + "Vendor" label (10px, rgba(255,255,255,0.35))
- **Nav items:** Single item: "My Jobs" (future: "My Jobs | Reconciliation")
- **Right side:** Vendor company name (11px/600, rgba(255,255,255,0.7)) + avatar initials (22x22, 4px radius, rgba(255,255,255,0.12) bg)
- **No admin controls** in nav (no rates, no master data)

### Job List (My Jobs)
- **Same flat table** as admin Jobs page
- **No vendor column** — data is pre-filtered to logged-in vendor
- **No Group By toggle** — no need to group by vendor when you're one vendor
- **No vendor filter dropdown**
- **Columns:** Shipment (DO #) 10% | Customer 13% | Service 7% | Where 35% | Pickup 10% | Status 11% | Cost 10%
- **"Where" column** (renamed from "Route"): shows service-contextual content with sub-lines (HMW-V04):
  - FM: origin → destination + driver/vehicle sub-line (HMW-V03)
  - EC/CS: location + MAWB sub-line
  - OH: location + bag count + weight sub-line
  - CR: location + bag count sub-line
- **Status pills:** Active | Completed | Verified | Cancelled | All (note: Cancelled gets its own pill, not grouped into Active like admin)
- **Export CSV button** in filter bar (right-aligned)
- **Stats bar:** Same pattern, vendor-scoped counts

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
- Columns: Name | Phone | WeChat ID | Default Vehicle | Status (Active/Inactive)
- Dense CRUD table matching admin master data style (8px 12px cells, 6px 12px headers)
- "+ Add Driver" button (blue, bottom-right)
- Default vehicle shows plate + truck type badge

**Vehicles table:**
- Columns: Plate Number | Truck Type | Capacity | Status (Active/Inactive)
- Truck type shown as badge (same styling as service tags)
- "+ Add Vehicle" button

**Stats bar:** `5 drivers · 8 vehicles` (same pattern as My Jobs stats bar)

### Responsive Breakpoints
Unlike the admin app (desktop-only, min 1200px), the vendor app targets 768px+.

| Breakpoint | Job List | Job Detail |
|------------|----------|------------|
| ≥1024px | Full 7-column table (Shipment, Customer, Service, Route, Pickup, Status, Cost) | Fees full-width, Route + Cargo side-by-side, Proofs + Log below |
| 768-1023px | Condensed 5-column table: drop Route, stack Customer+Shipment into one cell (HMW-V01) | All sections stack to single column. Fees still first. |
| <768px | Out of scope for v1. Future: card-based job list on mobile |

### Authentication Screen
- Centered card (max-width 360px) on page background
- Teleport OS logo + "Vendor" label at top
- Vendor selector dropdown (same styling as admin dropdowns)
- Access code input field
- `[Sign In]` button (blue, full-width)
- Simple, minimal. No hero images, no marketing copy.

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
| 2026-03-29 | Condensed table at 768px (HMW-V01) | Drop Route column, stack Customer+Shipment into one cell. Status and Cost always visible. Route available in detail page. |
| 2026-03-29 | Fees-first section ordering (HMW-V02) | App exists for reconciliation — lead with the money. Vendor already knows the route. Order: Fees → Route + Cargo → Proofs → Activity Log. |
| 2026-03-30 | FM assignment above fees (design review) | For FM jobs only, Driver & Vehicle Assignment section sits between Status Action Bar and Fee Breakdown. Dispatcher's first question is "who's driving?" not "are the fees right?" Non-FM services skip this section. |
| 2026-03-30 | Assignment ≠ Start Job (design review) | Assigning a driver is dispatch-time (morning). Starting the job is execution-time (driver arrives at pickup). Separate actions, separate moments. |
| 2026-03-30 | Driver sub-line under Route (HMW-V03) | Driver name + vehicle plate shown as sub-line under route text in job list. Blue for assigned, faint gray "No driver assigned" for unassigned FM jobs. Non-FM shows nothing. Route column has most width (35%) and strongest semantic link. |
| 2026-03-30 | Rename "Route" → "Where" + service sub-lines (HMW-V04) | Same 7-column table, rename column. Sub-lines per service: FM=driver+vehicle, EC/CS=MAWB, OH/CR=bags+weight. Option C (compact two-line rows) rejected as overcomplicating the smart spreadsheet. |
| 2026-03-30 | Service-adaptive job detail | Same skeleton (header → status → [adaptive] → fees → proofs → log), but middle section changes per service. FM gets Dispatch + Timeline. Non-FM gets single Location. One generic layout serves neither well. |
| 2026-03-30 | Multi-file proof upload | `<input multiple>` + drag-and-drop + camera button for tablet. Batch activity log entry. Simple file rows, not card boxes. |
| 2026-03-30 | Fleet page (My Jobs &#124; Fleet) | Drivers + Vehicles as vendor-scoped master data. Dense CRUD tables. Separate page, not crammed into job detail. |
| 2026-03-30 | Pickup/Delivery Timeline for FM | Two-point layout with big mono times. The single most important data for FM dispatchers. Non-FM services show single Location row instead. |

## Preview
Open `vendor/design-preview.html` in a browser to see the proposed screens.
Also see `/tmp/vendor-ux-preview.html` for the service-adaptive UX mockup (FM vs generic comparison).
