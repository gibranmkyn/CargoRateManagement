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
│   ├── design-hypotheses/   # Vendor HMW mockups (HMW-V01 responsive, HMW-V02 section order)
│   ├── design-preview.html  # Visual mockups of vendor screens
│   ├── src/                 # Vendor app source code
│   ├── package.json         # Vendor dependencies & scripts (npm run dev)
│   └── vite.config.ts, tsconfig, index.html, etc.
├── reference/               # Business context & research (not app code)
│   ├── client/              # Contracts, pitches, rate sheet data
│   ├── current-teleport-os/ # Screenshots of existing Teleport OS
│   └── lovable-prototype/   # Early Lovable prototype screenshots
```

## Key Artifacts
| Artifact | Path | Purpose |
|----------|------|---------|
| Platform guide | `CLAUDE.md` | This file. Entry point for every session. |
| Admin PRD | `admin/PRD.md` | User stories, use cases, iteration status |
| Admin design system | `admin/DESIGN.md` | Source of truth for all visual tokens (colors, type, spacing) |
| Admin TODOs | `admin/TODOS.md` | Implementation backlog |
| Admin HMW mockups | `admin/design-hypotheses/` | 50 resolved design decisions with HTML mockups |
| Vendor PRD | `vendor/PRD.md` | Vendor user stories, features, iteration plan |
| Vendor design | `vendor/DESIGN.md` | Vendor-specific adaptations (inherits from admin/DESIGN.md) |
| Vendor HMW mockups | `vendor/design-hypotheses/` | HMW-V01 (responsive table), HMW-V02 (fees-first layout) |
| Vendor design preview | `vendor/design-preview.html` | Visual mockups of all vendor screens |
| Shared types | `shared/types.ts` | All TypeScript types, interfaces, constants |
| Shared data | `shared/mockData.ts` | Seed data, vendor/customer lists, helpers |
| Shared state | `shared/TripContext.tsx` | React Context + useReducer, localStorage persistence |
| Reference docs | `reference/client/` | Contracts, pitches, rate sheets from client |

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
- **5-color status system** — gray (pending), blue (in progress), amber (completed), green (verified), red (cancelled). Colors carry meaning, not decoration.
- **Tables, not cards** — expanded jobs render as sub-table rows, not card grids. Avoid card-ifying data that belongs in rows.
- **Inline styles** — all components use inline styles matching the mockup CSS exactly. No Tailwind for visual properties.
- **Sharp radius** — 4-6px for containers, 4px for inputs/chips. No bubbly SaaS radius.
- **Color discipline** — Only status colors (5), accent (#152CFF), ink hierarchy (5 grays), and surfaces. No per-service colors, no decorative colors, no Tailwind color classes. Every color must carry semantic meaning.
- **No shadows** — borders are sufficient. Only Toast and slide-out panel have shadows.
- **No AI slop** — no purple gradients, no 3-column icon grids, no bubbly cards, no scale animations, no generic marketing copy in an ops tool.

## Design Hypotheses
- **Admin:** `admin/design-hypotheses/README.md` — 50 resolved HMW decisions
- **Vendor:** `vendor/design-hypotheses/README.md` — HMW-V01 (responsive table at 768px), HMW-V02 (fees-first section ordering)

## Architecture
- **State:** React Context + useReducer in `shared/TripContext.tsx`
- **Persistence:** localStorage. Key: `tripmanager_state`. Seeded from `shared/mockData.ts`
- **Admin routing:** React Router v7. Routes in `admin/src/App.tsx`
- **Vendor routing:** React Router v7. Routes in `vendor/src/App.tsx`
- **Vendor auth:** `vendor/src/context/VendorAuthContext.tsx` — vendor code stored in localStorage key `vendor_auth`
- **Fonts:** Instrument Sans (Google Fonts) for everything, JetBrains Mono (@fontsource) for data
- **Terminology:** "Shipment" in UI = `Trip` in code. "Job" = vendor assignment within a shipment.

## Data Model
- **Trip** → has many **Jobs**
- Each **Job** = 1 vendor + 1 service + origin/destination (1-service-per-job model)
- Same vendor can appear multiple times if handling multiple services
- Jobs are PARALLEL, not sequential
- Each Job has: `status` (unified lifecycle) + `activityLog[]` + `proofDocuments[]`
- **Unified job status:** `Pending → In Progress → Completed (proof uploaded) → Verified (admin sign-off)`
- Terminal state: `Cancelled` (admin cancels — 3PL can't reject)
- localStorage auto-migrates old multi-service format to seed data

## Admin Pages
- **Shipments** (`/trips`) — demand-side view grouped by client request. Expandable sub-table with jobs.
- **Jobs** (`/jobs`) — supply-side view. Flat power table with status pills, service filters, vendor dropdown, Group by toggle.
- **Rates** (`/rates`) — vendor rate card management (FTL + service fees)
- **Master Data** (`/master-data`) — Facilities, Regions, Vendors, Customers, Services

## Vendor Pages
- **Login** (`/`) — vendor code selector + access code (prototype: any code works)
- **My Jobs** (`/jobs`) — flat table filtered by vendor. Status pills, service pills, CSV export.
- **Job Detail** (`/jobs/:tripId/:jobId`) — full-page detail. Fees-first layout (HMW-V02). Status Action Bar with Start Job + Upload Proof.

## Admin Key Interaction Patterns
- **Slide-out panel:** Status Action Bar at top adapts per stage (HMW-49)
- **Proof upload:** In slide-out → auto-transitions to Completed (even from Pending, skipping In Progress)
- **Verification:** Admin clicks Verify → Completed → Verified, locks fees/quantities/proof
- **Cancellation:** Red row + reassignment in slide-out → resets to Pending (admin action only)
- **Editability:** Fees/quantities editable from Pending through Completed. Locked on Verified.
- **Feedback:** Toast notifications (green/red/gray)

## Vendor Key Interaction Patterns
- **Full-page job detail** (not slide-out — more room for fee reconciliation)
- **Fees-first layout:** Status Action Bar → Fee Breakdown → Route + Cargo → Proofs → Activity Log
- **Read-only fees/quantities** — vendor views for reconciliation, cannot edit
- **Vendor actions:** Start Job, Upload Proof only. No Verify, no Cancel, no fee toggles.
- **Responsive at 768px+** — condensed table (drop Route, stack Customer+Shipment) per HMW-V01
- **Activity log actor:** Vendor actions logged with vendor company name, admin actions with "Ops Admin"

## PRDs
- **Admin:** `admin/PRD.md` — user stories, use cases, iteration status
- **Vendor:** `vendor/PRD.md` — user stories, design direction, iteration plan
