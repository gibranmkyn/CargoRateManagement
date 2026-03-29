# Teleport OS — Delivery Order Management

## Project
Logistics operations tool for managing cross-border cargo delivery orders. React + TypeScript + Vite + Tailwind CSS v4.

## Design System
**Always read `DESIGN.md` before making any visual or UI decisions.**

Key principles:
- **Dense data design** — ops planners come from Excel. Every pixel shows data, not decoration.
- **5-color status system** — gray (pending), blue (in progress), amber (completed), green (verified), red (cancelled).
- **Tables, not cards** — expanded jobs render as sub-table rows, not card grids.
- **Inline styles** — all components use inline styles matching the mockup CSS exactly. No Tailwind for visual properties.
- **Sharp radius** — 4-6px for containers, 4px for inputs/chips. No bubbly SaaS radius.

## Design Hypotheses
Read `design-hypotheses/README.md` for all resolved and open design decisions.
Each HMW question has an HTML mockup — these are the source of truth for design intent.

## Architecture
- **State:** React Context + useReducer in `src/context/TripContext.tsx`
- **Persistence:** localStorage. Key: `tripmanager_state`. Seeded from `src/data/mockData.ts`
- **Routing:** React Router v7. Routes in `src/App.tsx`
- **Fonts:** Instrument Sans (Google Fonts) for everything, JetBrains Mono (@fontsource) for data
- **Terminology:** "Delivery Order" in UI = `Trip` in code. "Job" = vendor assignment within an order.

## Data Model
- **Trip** → has many **Jobs**
- Each **Job** = 1 vendor + 1 service + origin/destination (1-service-per-job model)
- Same vendor can appear multiple times if handling multiple services
- Jobs are PARALLEL, not sequential
- Each Job has: `status` (unified lifecycle) + `activityLog[]` + `proofDocuments[]`
- **Unified job status:** `Pending → In Progress → Completed (proof uploaded) → Verified (admin sign-off)`
- Terminal state: `Cancelled` (admin cancels — 3PL can't reject, no vendor portal)
- Replaces old dual `status` + `proofStatus` fields — single `status` field now
- localStorage auto-migrates old multi-service format to seed data

## Pages
- **Delivery Orders** (`/trips`) — demand-side view grouped by client request. Expandable sub-table with jobs.
- **Jobs** (`/jobs`) — supply-side view. Flat power table with status pills (Active/Completed/Verified/All), service filters, vendor dropdown with search, Group by toggle (None/Vendor/Service/Date). See HMW-48 mockup.
- **Rates** (`/rates`) — vendor rate card management (FTL + service fees)
- **Master Data** (`/master-data`) — Facilities, Regions, Vendors, Customers, Services

## Key Interaction Patterns
- **Slide-out panel:** Status Action Bar at top adapts per stage (HMW-49). See `design-hypotheses/49-hmw-slideout-status-lifecycle.html`
  - Pending: `[Start Job →]` button
  - In Progress: hint "Upload proof to complete →"
  - Completed: `[✓ Verify]` button
  - Verified: read-only, everything locked
  - Cancelled: cancel reason + reassign vendor dropdown
- **Proof upload:** In slide-out → auto-transitions to Completed (even from Pending, skipping In Progress)
- **Verification:** Admin clicks Verify → Completed → Verified, locks fees/quantities/proof
- **Cancellation:** Red row + reassignment in slide-out → resets to Pending (admin action only, no vendor portal)
- **Editability:** Fees/quantities editable from Pending through Completed. Locked on Verified.
- **Feedback:** Toast notifications (green/red/gray)

## PRD
Read `PRD.md` for user stories, use cases, and iteration status.
