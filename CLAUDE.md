# Teleport OS — Shipment Management Platform

## Project
Logistics operations platform with two apps sharing the same design system:
- **Teleport OS Admin** (`admin/`) — ops planner tool for managing shipments, jobs, rates, master data
- **Teleport OS Vendor** (`vendor/`) — vendor-facing app for job visibility, status updates, fee reconciliation

Both are React + TypeScript + Vite + Tailwind CSS v4. Same design tokens, different interaction posture.

## Folder Structure
```
CargoRateManagement/
├── CLAUDE.md                # You are here. Platform-level guide.
├── shared/                  # Shared code (both apps import from here)
│   ├── types.ts             # All type definitions (Trip, Job, FeeLineItem, etc.)
│   ├── mockData.ts          # Seed data, vendors, customers, helpers
│   ├── TripContext.tsx       # State management (localStorage key: tripmanager_state)
│   └── Toast.tsx            # Toast notification component
├── admin/                   # Teleport OS Admin (port 5173)
│   ├── PRD.md               # Admin user stories, iterations
│   ├── DESIGN.md            # Admin design system (source of truth for shared tokens)
│   ├── TODOS.md             # Admin implementation TODOs
│   ├── design-hypotheses/   # 50 HMW mockups (HTML)
│   ├── src/                 # Admin app source code
│   ├── package.json         # Admin dependencies & scripts (npm run dev)
│   └── vite.config.ts, tsconfig, index.html, etc.
├── vendor/                  # Teleport OS Vendor (port 5174)
│   ├── PRD.md               # Vendor user stories, iterations
│   ├── DESIGN.md            # Vendor design adaptations (inherits from admin/DESIGN.md)
│   ├── design-hypotheses/   # Vendor HMW mockups
│   ├── design-preview.html  # Visual mockups of vendor screens
│   ├── src/                 # Vendor app source code
│   ├── package.json         # Vendor dependencies & scripts (npm run dev)
│   └── vite.config.ts, tsconfig, index.html, etc.
├── reference/               # Business context & research (not app code)
│   ├── client/              # Contracts, pitches, rate sheet data
│   ├── current-teleport-os/ # Screenshots of existing Teleport OS
│   └── lovable-prototype/   # Early Lovable prototype screenshots
```

## Running Both Apps
```bash
# Terminal 1 — Admin
cd admin && npm run dev      # → http://localhost:5173

# Terminal 2 — Vendor
cd vendor && npm run dev     # → http://localhost:5174
```
Both read/write the same localStorage key (`tripmanager_state`). Changes in one appear in the other on refresh.

## Design System
**Always read `admin/DESIGN.md` before making any visual or UI decisions.**

Key principles:
- **Dense data design** — ops planners come from Excel. Every pixel shows data, not decoration.
- **5-color status system** — gray (pending), blue (in progress), amber (completed), green (verified), red (cancelled).
- **Tables, not cards** — expanded jobs render as sub-table rows, not card grids.
- **Inline styles** — all components use inline styles matching the mockup CSS exactly. No Tailwind for visual properties.
- **Sharp radius** — 4-6px for containers, 4px for inputs/chips. No bubbly SaaS radius.

## Design Hypotheses
Read `admin/design-hypotheses/README.md` for all resolved and open design decisions.
Each HMW question has an HTML mockup — these are the source of truth for design intent.

## Architecture (Admin App)
- **State:** React Context + useReducer in `admin/src/context/TripContext.tsx`
- **Persistence:** localStorage. Key: `tripmanager_state`. Seeded from `admin/src/data/mockData.ts`
- **Routing:** React Router v7. Routes in `admin/src/App.tsx`
- **Fonts:** Instrument Sans (Google Fonts) for everything, JetBrains Mono (@fontsource) for data
- **Terminology:** "Shipment" in UI = `Trip` in code. "Job" = vendor assignment within a shipment.

## Data Model
- **Trip** → has many **Jobs**
- Each **Job** = 1 vendor + 1 service + origin/destination (1-service-per-job model)
- Same vendor can appear multiple times if handling multiple services
- Jobs are PARALLEL, not sequential
- Each Job has: `status` (unified lifecycle) + `activityLog[]` + `proofDocuments[]`
- **Unified job status:** `Pending → In Progress → Completed (proof uploaded) → Verified (admin sign-off)`
- Terminal state: `Cancelled` (admin cancels — 3PL can't reject, no vendor portal yet)
- Replaces old dual `status` + `proofStatus` fields — single `status` field now
- localStorage auto-migrates old multi-service format to seed data

## Admin Pages
- **Shipments** (`/trips`) — demand-side view grouped by client request. Expandable sub-table with jobs.
- **Jobs** (`/jobs`) — supply-side view. Flat power table with status pills, service filters, vendor dropdown, Group by toggle.
- **Rates** (`/rates`) — vendor rate card management (FTL + service fees)
- **Master Data** (`/master-data`) — Facilities, Regions, Vendors, Customers, Services

## Admin Key Interaction Patterns
- **Slide-out panel:** Status Action Bar at top adapts per stage (HMW-49). See `admin/design-hypotheses/49-hmw-slideout-status-lifecycle.html`
  - Pending: `[Start Job →]` button
  - In Progress: hint "Upload proof to complete →"
  - Completed: `[✓ Verify]` button
  - Verified: read-only, everything locked
  - Cancelled: cancel reason + reassign vendor dropdown
- **Proof upload:** In slide-out → auto-transitions to Completed (even from Pending, skipping In Progress)
- **Verification:** Admin clicks Verify → Completed → Verified, locks fees/quantities/proof
- **Cancellation:** Red row + reassignment in slide-out → resets to Pending (admin action only)
- **Editability:** Fees/quantities editable from Pending through Completed. Locked on Verified.
- **Feedback:** Toast notifications (green/red/gray)

## Teleport OS Vendor
Vendor-facing counterpart. Read-heavy, action-light. Key differences from Admin:
- **1 page:** My Jobs (flat table, vendor-scoped)
- **Full-page job detail** (not slide-out — more room for fee reconciliation)
- **Responsive from day 1** (768px+ — vendors are on-site at warehouses/terminals)
- **Read-only fees/quantities** — vendor views for reconciliation, cannot edit
- **Vendor actions:** Start Job, Upload Proof only. No Verify, no Cancel, no fee toggles.
- **Nav:** "Teleport OS Vendor" label + vendor company name on right side
- See `vendor/PRD.md` and `vendor/DESIGN.md` for full specs.

## PRDs
- **Admin:** `admin/PRD.md` — user stories, use cases, iteration status
- **Vendor:** `vendor/PRD.md` — user stories, design direction, iteration plan
