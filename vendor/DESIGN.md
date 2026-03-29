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
- **Columns:** Shipment (DO #) 10% | Customer 13% | Service 7% | Route 35% | Pickup 10% | Status 11% | Cost 10%
- **Status pills:** Active | Completed | Verified | Cancelled | All (note: Cancelled gets its own pill, not grouped into Active like admin)
- **Export CSV button** in filter bar (right-aligned)
- **Stats bar:** Same pattern, vendor-scoped counts

### Job Detail — Full Page (NOT Slide-Out)
The admin uses a 380px slide-out panel because ops planners rapidly scan a table and peek at jobs. Vendors open one job, review everything, take action, move on. Full page gives more room for the fee reconciliation table.

**Layout:**
- **Header:** Back link ("← My Jobs") + Job ID badge + service name + service tag + DO ref + customer + MAWB
- **Status Action Bar:** Full-width colored bar below header. Same 5-color treatment as admin slide-out bar.
- **Body:** 2-column grid (on desktop), stacking to single column on tablet
  - Left: Route card (origin/destination with dates) + Cargo grid (bags/weight/volume)
  - Right: Proof of Service (file list + upload zone) + Activity Log
  - Full width: Fee Breakdown table

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

**Proof of Service:**
- File list with icon (doc/image), name, upload timestamp
- Upload zone: dashed border (2px dashed `#e5e7eb`), "Drop files here or browse"
- Upload available in Pending and In Progress only
- Hidden/disabled in Completed, Verified, Cancelled

**Activity Log:**
- Same format as admin: timestamp (mono 9px) + action + user
- Shows both vendor and admin actions
- Reverse chronological

### Responsive Breakpoints
Unlike the admin app (desktop-only, min 1200px), the vendor app targets 768px+.

| Breakpoint | Layout |
|------------|--------|
| ≥1024px | Full layout: 2-column detail grid, full table columns |
| 768-1023px | Detail grid stacks to single column. Table: hide Route column, truncate others |
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

## Preview
Open `vendor/design-preview.html` in a browser to see the proposed screens:
1. My Jobs page (flat table with filters)
2. Job Detail (full page with all sections)
3. Status Action Bar in all 5 states
4. Admin vs Vendor comparison
