# Teleport OS — Trip Management Platform

## Apps
Two React + TypeScript + Vite + Tailwind CSS v4 apps sharing a design system:
- **Teleport OS Admin** (`admin/`, port 5173) — ops planner: trips, jobs, master data
- **Teleport OS Vendor** (`vendor/`, port 5174) — vendor-facing: job visibility, status updates, fee reconciliation

## Key Files
| Path | Purpose |
|------|---------|
| `CLAUDE.md` | This file. Platform entry point. |
| `shared/types.ts` | All TypeScript types (Trip, Job, FeeLineItem, etc.) |
| `shared/mockData.ts` | Seed data + helpers (vendors, customers, fees) |
| `shared/TripContext.tsx` | React Context + useReducer. localStorage key: `tripmanager_state` |
| `admin/DESIGN.md` | Design system source of truth — **read before all UI work** |
| `admin/PRD.md` | Admin user stories + iteration status |
| `admin/TODOS.md` | Implementation backlog |
| `admin/design-hypotheses/` | 50+ resolved HMW design decisions (HTML mockups) |
| `vendor/DESIGN.md` | Vendor design adaptations (inherits admin tokens) |
| `vendor/PRD.md` | Vendor user stories + iteration plan |
| `vendor/design-hypotheses/` | HMW-V01–08 (responsive table, section order, driver visibility) |
| `reference/client/` | Contracts, pitches, rate sheets |
| `deferred/` | Archived rates module (deferred 2026-03-30) |

## Running
```bash
cd admin && npm run dev   # → http://localhost:5173
cd vendor && npm run dev  # → http://localhost:5174
```
Both share localStorage key `tripmanager_state`. Seeded from `shared/mockData.ts`.

## Design System
**Always read `admin/DESIGN.md` before any UI/visual work.**
- **Dense data** — ops planners use Excel. Every pixel shows data, not decoration.
- **5-color status** — gray (pending), blue (in progress), amber (completed), green (verified), red (cancelled). Colors carry meaning.
- **Tables not cards** — expanded jobs are sub-table rows, not card grids.
- **Inline styles** — match mockup CSS exactly. No Tailwind for visual properties.
- **Sharp radius** — 4-6px containers, 4px inputs/chips.
- **Color discipline** — status colors + accent #152CFF + 5 ink grays + surfaces only. No decorative colors, no Tailwind color classes.
- **No shadows** — borders only. Exception: Toast + slide-out panel.
- **No AI slop** — no gradients, icon grids, bubbly cards, scale animations.

## Architecture
- **State:** React Context + useReducer (`shared/TripContext.tsx`)
- **Persistence:** localStorage key `tripmanager_state`
- **Admin routing:** React Router v7 — `admin/src/App.tsx`
- **Vendor routing:** React Router v7 — `vendor/src/App.tsx`
- **Vendor auth:** `vendor/src/context/VendorAuthContext.tsx` (localStorage key: `vendor_auth`)
- **Fonts:** Instrument Sans (UI), JetBrains Mono (data)
- **Terminology:** "Trip" in both UI and code. "Job" = vendor assignment within a trip.

## Data Model
- **Trip** → many **Jobs**. Each Job = 1 vendor + 1 service + origin/destination.
- **FM job:** one vendor, one pickup, one delivery. Vendor assigns ONE pickup driver. Everything between (intermediate hubs, truck changes) is vendor's internal ops — not modeled.
- **OH/EC/CS jobs:** standalone admin-created jobs at specific facilities.
- **Status lifecycle:** `Pending → In Progress → Completed → Verified`. Terminal: `Cancelled` (admin only).
- Proof upload → auto-transitions to Completed (even from Pending). Admin Verify → locks fees/quantities/proofs.
- localStorage auto-migrates old multi-service format to seed data.

## Admin Pages & Interactions
- **Trips** (`/trips`) — client/demand view. Expandable sub-table with jobs.
- **Jobs** (`/jobs`) — vendor/execution view. Flat table, status pills, service filters, vendor dropdown, Group by toggle.
- **Master Data** (`/master-data`) — Facilities, Regions, Vendors, Customers, Services

Key patterns:
- **Slide-out:** Status Action Bar adapts per stage (HMW-49)
- **Editability:** fees/quantities editable Pending→Completed, locked on Verified
- **Cancellation:** admin-only → red row + reassignment resets to Pending
- **Feedback:** Toast (green/red/gray)

## Vendor Pages & Interactions
- **Login** (`/`) — vendor code + access code (prototype: any code works)
- **My Jobs** (`/jobs`) — filtered by vendor. Status/service pills, CSV export.
- **Job Detail** (`/jobs/:tripId/:jobId`) — FM: Assignment → Fees → Route+Cargo → Proofs → Log. Non-FM: Fees → Route+Cargo → Proofs → Log.
- **Fleet** (`/fleet`) — Drivers + Vehicles CRUD (vendor-scoped)

Key patterns:
- **Full-page detail** (not slide-out — room for fee reconciliation)
- **Driver assignment ≠ Start Job** — assignment at dispatch, Start Job at execution
- **Read-only fees** — reconciliation only, vendors cannot edit
- **Vendor actions:** Start Job, Upload Proof, Assign Driver/Vehicle (FM only). No Verify, no Cancel.
- **Responsive at 768px+** per HMW-V01
- **Activity log:** vendor actions = vendor company name, admin actions = "Ops Admin"
