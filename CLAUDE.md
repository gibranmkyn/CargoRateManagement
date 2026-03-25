# Teleport OS — Delivery Order Management

## Project
Logistics operations tool for managing cross-border cargo delivery orders. React + TypeScript + Vite + Tailwind CSS v4.

## Design System
**Always read `DESIGN.md` before making any visual or UI decisions.**

Key principles:
- **Dense data design** — ops planners come from Excel. Every pixel shows data, not decoration.
- **3-color status system** — green (completed), red (rejected), gray (everything else). No rainbow.
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
- Each Job has: `activityLog[]` + `proofDocuments[]`
- localStorage auto-migrates old multi-service format to seed data

## Key Interaction Patterns
- **Status changes:** Slide-out panel (click job chip or job row)
- **Proof upload:** In slide-out panel or job detail page
- **Rejections:** Alert banner + red row + reassignment in slide-out
- **Feedback:** Toast notifications (green/red/gray)

## PRD
Read `PRD.md` for user stories, use cases, and iteration status.
