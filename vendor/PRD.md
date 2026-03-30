# Teleport OS Vendor

> **v1.0** | Counterpart to Teleport OS Admin — Shipment Management (admin/ops side)

## Overview
Teleport OS Vendor is a vendor-facing web app that gives 3PL vendors (trucking companies, customs agents, cargo handlers) visibility into the jobs assigned to them by Teleport's operations team. Its primary purpose is **job reconciliation** — ensuring both Teleport and the vendor agree on what was done, what it cost, and what proof exists — and **status updates** — allowing vendors to progress jobs through the lifecycle without WhatsApp/phone coordination.

This is the read-heavy, action-light counterpart to Teleport OS Admin. Vendors see their slice of the data. They don't create shipments, manage rates, or verify jobs.

## Users & Context

### Primary User: 3PL Vendor Operator
- Works at a trucking company, customs brokerage, or cargo handling firm
- Handles 5-30 jobs/day assigned by Teleport
- Currently receives job assignments via WhatsApp message or phone call
- Updates Teleport on status via WhatsApp photos + voice messages
- Reconciles invoices against Teleport's records manually (Excel vs Excel)
- Cares about: knowing what's assigned, updating status efficiently, and ensuring fees match their records before billing disputes arise

### Secondary User: Vendor Finance/Admin
- Reviews completed jobs at end of week/month
- Cross-checks Teleport's fee records against their own invoicing system
- Needs exportable data for reconciliation
- Cares about: fee accuracy, proof completeness, and identifying discrepancies early

### Current Pain Points (Why This Exists)
1. **No single source of truth.** Vendors track jobs in their own spreadsheets. Teleport tracks in theirs. Discrepancies surface only at invoicing — too late.
2. **Status updates are lossy.** WhatsApp photos get buried in group chats. Phone confirmations aren't recorded. Ops planners manually update status based on verbal cues.
3. **Cancellations cause confusion.** When Teleport cancels or reassigns a job, vendors sometimes don't know — they show up at the pickup point or submit invoices for cancelled work.
4. **Fee disputes are retroactive.** Vendors only see what Teleport recorded at invoice time. No way to flag "this fee is wrong" before it becomes a billing dispute.

## Relationship to Admin App

| Capability | Teleport OS Admin | Teleport OS Vendor |
|---|---|---|
| Create shipments | Yes | No |
| Assign vendors to jobs | Yes | No (view only) |
| See all jobs across all vendors | Yes | No (own jobs only) |
| Start job (Pending → In Progress) | Yes | Yes |
| Upload proof of service | Yes | Yes |
| Verify job (Completed → Verified) | Yes | No (admin-only gate) |
| Cancel job | Yes | No |
| Edit fees / quantities | Yes (until Verified) | No (view only, can flag) |
| View fee breakdown | Yes | Yes |
| View activity log | Yes | Yes |
| Manage rates | Yes | No |
| Manage master data | Yes | No |
| Manage fleet (drivers + vehicles) | No | Yes (vendor-scoped) |
| Assign driver + vehicle to FM jobs | No | Yes |
| Export job data | Yes | Yes (own jobs only) |

## Data Model (Vendor's View)

The vendor app reads from the same data model as the admin app. No new entities — just a filtered, read-constrained view.

### What the vendor sees per job:
- **Job ID** + parent Shipment reference (DO number, customer name, MAWB)
- **Service** — what type of work (FM Trucking, Export Customs, etc.)
- **Route** — origin → destination (or single location for non-FM services)
- **Pickup date** — when the work is expected
- **Status** — Pending / In Progress / Completed / Verified / Cancelled
- **Cancel reason** — if cancelled, why (visible to vendor)
- **Fees** — full fee breakdown: fee name, unit, rate, quantity, amount, active/inactive
- **Fee totals** — sum per currency
- **Proof documents** — uploaded files with timestamps
- **Activity log** — full history of status changes and uploads
- **Cargo details** — bags, weight (kg), volume (CBM) at job level
- **Associated bags** — bag package list from the shipment (bag number, weight, pickup date, origin/destination)

### What the vendor CANNOT see:
- Jobs assigned to other vendors
- Internal ops notes/remarks on the shipment
- Rate card / rate management data
- Other vendors on the same shipment (only their own jobs)
- Admin-side verification workflow details

## Core Functionality

### F1: Job List (My Jobs)
The vendor's primary view. A flat table of all jobs assigned to them, similar to the admin Jobs page but scoped to one vendor.

**Filters:**
- **Status pills:** Active (Pending + In Progress) | Completed | Verified | Cancelled | All
  - Default: **Active** — vendor needs to see what requires action
- **Service pills:** FM | EC | CS | CR | OH
- **Date range picker:** for Completed/Verified/Cancelled/All views

**Columns:**
- DO # (shipment reference)
- Customer
- Service
- Route (origin → destination)
- Pickup Date
- Status
- Cost (total fees)

**Sort (within Active):** Pending first (needs action), then In Progress (in flight). Cancelled jobs shown in Cancelled tab, not mixed into Active.

**Key behaviors:**
- Click row → opens job detail view
- Status chip uses same 5-color system as admin app
- Cancelled jobs show cancel reason inline or on hover

### F2: Job Detail View
Full detail for a single job. Read-heavy with limited actions.

**Sections:**
1. **Header** — Job ID, service, status chip, DO reference, customer, MAWB
2. **Status Action Bar** — adapts per status (see F3)
3. **Route** — origin and destination with addresses, dates
4. **Cargo** — bags, weight, volume (read-only for vendor)
5. **Associated Bags** — list of bag packages assigned to this job's shipment
   - Columns: Bag Number | MAWB | Weight (kg) | Pickup Date | Origin | Destination
   - Read-only — vendor sees what bags are in the shipment for verification
   - Helps vendor confirm they have the right cargo at pickup/delivery
6. **Fees** — full fee breakdown table
   - Columns: Fee Name | Unit | Rate | Qty | Amount | Status (active/removed)
   - Vendor sees all fees including removed ones (grayed out)
   - Totals per currency at bottom
   - Read-only — vendor cannot edit fees
6. **Proof of Service** — uploaded documents with thumbnails/names, upload timestamps
   - Upload button available when status is Pending or In Progress
7. **Activity Log** — chronological list of all events (status changes, uploads, fee changes)

### F7: Fleet Management (Drivers & Vehicles)
Vendors manage their own fleet data for FM Trucking dispatch.

**Drivers:**
- Name, phone number, WeChat ID, default vehicle (optional), active/inactive
- CRUD table on Fleet page (new nav item)

**Vehicles:**
- Plate number, truck type (1.5T/3T/5T/8T/10T/12T/40HQ/45HQ), capacity specs, active/inactive
- CRUD table on Fleet page

### F8: Driver & Vehicle Assignment (FM Trucking Jobs)
For FM Trucking jobs, the vendor assigns ONE pickup driver and vehicle. This is the operational handoff: Teleport → Vendor.

**Why one driver, not multiple legs:**
The first pickup is the moment that matters to Teleport. It proves the vendor has taken responsibility for the cargo. How the vendor moves cargo between their own hubs (intermediate trucks, warehouse transfers) is the vendor's internal operations, not modeled in the system. The vendor coordinates multi-driver handoffs via WeChat and their own dispatch, same as today.

**Assignment flow:**
- FM Job Detail page shows a "Driver & Vehicle" section (above fee breakdown)
- Driver dropdown (from vendor's fleet list) + Vehicle dropdown (filtered by truck type)
- Assigning a driver does NOT auto-start the job. Assignment is dispatch-time, Start Job is execution-time (driver arrives at pickup via WeChat).
- Can reassign driver/vehicle while job is Pending or In Progress
- Locked after Completed/Verified/Cancelled
- Activity log records: "Assigned Driver Zhang Wei + 粤B·12345"

**FM job status (what Teleport sees):**
```
Pending → Picked Up (driver scanned bags at origin) → Delivered (proof at destination) → Completed → Verified
```

**FM Dispatcher Journey:**

| Step | Dispatcher Does | Feels | Design Supports With |
|------|----------------|-------|---------------------|
| 1 | Opens My Jobs, sees new Pending FM job | "What's new today?" | Active tab, Pending jobs sorted first |
| 2 | Clicks into FM job detail | "Who should I send?" | Assignment section is first thing after status bar |
| 3 | Picks driver from dropdown | "Zhang Wei is free, he knows this route" | Dropdown shows name + phone + default vehicle |
| 4 | Picks vehicle (or auto-filled from driver default) | "Done, dispatched" | Toast: "Assigned Zhang Wei + 粤B·12345" |
| 5 | Moves on to next job | "What else?" | Back to My Jobs. Job still Pending but has driver indicator |
| 6 | Later: driver picks up via WeChat | Driver scans bags at origin | Job → Picked Up. Activity log: "Driver Zhang Wei — Pickup complete. 24/24 bags scanned." |
| 7 | Later: driver delivers | Driver uploads proof at destination | Job → Delivered → Completed. |
| 8 | Reconciles fees | "Do the numbers match?" | Fee table below assignment, read-only |

### F3: Status Updates (Vendor Actions)
Vendors can progress jobs forward through the lifecycle. They cannot go backward or skip ahead (except proof upload skipping In Progress).

**Allowed transitions:**

| Current Status | Vendor Action | New Status |
|---|---|---|
| Pending | Click "Start Job" | In Progress |
| Pending | Upload proof | Completed (skips In Progress) |
| In Progress | Upload proof | Completed |
| Completed | — | No action (waiting for admin verification) |
| Verified | — | No action (locked) |
| Cancelled | — | No action (read-only) |

**Status Action Bar (mirrors admin slide-out, adapted for vendor context):**
- **Pending:** "Start this job when you begin work" + `[Start Job →]` button. Or upload proof directly.
- **In Progress:** "Upload proof of service to mark complete" + `[Upload Proof]` button.
- **Completed:** "Waiting for Teleport verification" — no action available. Shows when it was completed.
- **Verified:** "Verified by Teleport — ready for billing" — read-only confirmation.
- **Cancelled:** "This job was cancelled by Teleport" + cancel reason. Read-only.

### F4: Proof Upload
Vendors upload proof-of-service documents (photos, PDFs) to demonstrate job completion.

- Available in Pending and In Progress states
- Upload triggers automatic transition to Completed
- Multiple files per upload
- Shows existing proofs with upload timestamp and uploader name
- Accepted formats: JPEG, PNG, PDF
- Vendor can see proofs uploaded by admin (ops planner) as well

### F5: Fee Reconciliation View
The core reconciliation feature. Vendors can review the fee breakdown Teleport has on record for each job.

**Per job:**
- Full fee table with rate × quantity = amount
- Active vs removed fees clearly distinguished
- Total cost per currency
- Job-level quantities (bags, weight, volume) — what Teleport has on record

**Reconciliation workflow (v1 — passive):**
- Vendor reviews fees in job detail
- If something looks wrong, vendor contacts ops via existing channels (WhatsApp/phone)
- No in-app dispute mechanism in v1 — this is about **visibility**, not workflow

**Future (v2):**
- Flag fee discrepancy button → creates a note visible to admin
- Batch reconciliation view: list of jobs with fee totals for a date range, exportable

### F6: Export (CSV)
Vendors can export their job data for reconciliation with their own systems.

- Export filtered job list as CSV
- Columns: DO #, Customer, Service, Route, Pickup Date, Status, Fee Total, Currency
- Detailed export option: one row per fee line item (for invoice matching)
- Date range scoped

## Authentication & Access Control

### V1: Vendor Code Login
- Simple login: vendor selects their company from a dropdown + enters a shared access code
- No individual user accounts in v1
- Session persists via localStorage token
- Each vendor sees only their own jobs

### Future:
- Individual user accounts with email/password
- Role-based access (operator vs finance)
- Multi-vendor organization support (e.g., HaleSun-SZ and HaleSun-GZ under one login)

## User Stories

### Job Visibility
- **VUS-001:** As a vendor operator, I want to see all jobs assigned to my company in a single list, so I know what work I need to do today.
- **VUS-002:** As a vendor operator, I want to filter jobs by status (Active/Completed/Verified/Cancelled), so I can focus on what needs attention.
- **VUS-003:** As a vendor operator, I want to filter jobs by service type, so I can batch similar work together.
- **VUS-004:** As a vendor operator, I want to see cancelled jobs with the cancellation reason, so I know not to execute that work and understand why it was pulled.
- **VUS-005:** As a vendor operator, I want to see the customer name and MAWB for each job, so I can cross-reference with my own records.

### Job Detail
- **VUS-010:** As a vendor operator, I want to view full job details including route, dates, cargo, and fees, so I have all the information I need to execute the job.
- **VUS-011:** As a vendor operator, I want to see the complete activity log for a job, so I know the full history of what happened.
- **VUS-012:** As a vendor operator, I want to see all proof documents uploaded for a job (including ones uploaded by Teleport), so I have a complete record.
- **VUS-013:** As a vendor operator, I want to see the list of bag packages associated with a job's shipment (bag number, weight, origin, destination), so I can verify I have the right cargo at pickup and confirm bag counts match.

### Status Updates
- **VUS-020:** As a vendor operator, I want to click "Start Job" to move a Pending job to In Progress, so Teleport knows I've begun work.
- **VUS-021:** As a vendor operator, I want to upload proof of service (photos/PDFs) to mark a job as Completed, so Teleport can verify my work.
- **VUS-022:** As a vendor operator, I want proof upload to automatically mark the job as Completed (even from Pending), so I don't have to manually change status after uploading.
- **VUS-023:** As a vendor operator, I want to see that a job has been Verified by Teleport, so I know it's approved for billing.

### Fee Reconciliation
- **VUS-030:** As a vendor finance admin, I want to see the full fee breakdown for each job (fee name, rate, quantity, amount), so I can compare against our internal records.
- **VUS-031:** As a vendor finance admin, I want to see which fees Teleport has marked as active vs removed, so I know what will appear on the final settlement.
- **VUS-032:** As a vendor finance admin, I want to export my jobs with fee details as CSV, so I can import into our accounting system for reconciliation.
- **VUS-033:** As a vendor finance admin, I want to see job-level quantities (bags, weight, volume) that Teleport has on record, so I can verify they match our measurements.

### Fleet Management
- **VUS-050:** As a vendor dispatcher, I want to manage a list of my company's drivers (name, phone, WeChat ID, default vehicle), so I can quickly assign them to FM jobs.
- **VUS-051:** As a vendor dispatcher, I want to manage a list of my company's vehicles (plate number, truck type, capacity), so I can match the right vehicle to each job's requirements.
- **VUS-052:** As a vendor dispatcher, I want to deactivate drivers and vehicles without deleting them, so historical job records still reference the correct driver/vehicle.

### Driver & Vehicle Assignment (FM Trucking)
- **VUS-060:** As a vendor dispatcher, I want to assign a driver and vehicle to an FM Trucking job from my fleet master data, so I can dispatch the right person and truck.
- **VUS-061:** As a vendor dispatcher, I want the vehicle dropdown filtered by compatible truck type, so I don't accidentally assign a 1.5T truck to an 8T job.
- **VUS-062:** As a vendor dispatcher, I want to see the assigned driver name + vehicle plate under the route in the job list, so I can scan which FM jobs still need a driver without opening each one. (HMW-V03 — sub-line under Route column)
- **VUS-063:** As a vendor dispatcher, I want to reassign a different driver/vehicle while the job is Pending or In Progress, so I can handle schedule changes.
- **VUS-064:** As a vendor dispatcher, I want driver/vehicle assignment locked after the job is Completed, so the billing record is immutable.
- **VUS-065:** As a vendor dispatcher, I want assigning a driver to be separate from starting the job, so I can dispatch in the morning and the driver starts when they arrive at pickup.

### Notifications (Future — v2)
- **VUS-040:** As a vendor operator, I want to be notified when a new job is assigned to me, so I don't have to constantly check the app.
- **VUS-041:** As a vendor operator, I want to be notified when a job is cancelled, so I can stop work immediately.
- **VUS-042:** As a vendor operator, I want to be notified when a job is verified, so I know it's approved for billing.

## Pages & Navigation

### Navigation
`My Jobs | Fleet` — two nav items.

Future: `My Jobs | Fleet | Reconciliation | Settings`

### Page: My Jobs (`/jobs`)
- Flat table with filters (status pills, service pills, date range)
- Click row → navigates to job detail page
- Stats bar at top: `12 jobs | 3 pending | 5 in progress | 2 completed | 2 verified`
- FM jobs show driver + vehicle sub-line under Route column (HMW-V03)
- Export CSV button in header

### Page: Job Detail (`/jobs/:tripId/:jobId`)
- Full job detail with sections: header, status action bar, [driver assignment for FM], fees, route + cargo, proofs, activity log
- For FM jobs: Driver & Vehicle Assignment section between Status Action Bar and Fee Breakdown
- Back navigation to job list
- Status action bar with contextual actions (Start Job / Upload Proof / read-only states)

### Page: Fleet (`/fleet`)
- Two tabs: Drivers | Vehicles
- **Drivers tab:** CRUD table with Name, Phone, WeChat ID, Default Vehicle, Status (active/inactive). Stats bar. [+ Add Driver] button.
- **Vehicles tab:** CRUD table with Plate, Truck Type, Capacity, Assigned Driver, Status (active/inactive). Stats bar. [+ Add Vehicle] button.

## Design Direction

See `DESIGN.md` (this folder) for the full design spec. Key adaptations from Teleport OS Admin:
- **Same design tokens** — colors, typography, spacing, status system. One platform, two perspectives.
- **Two nav items** — My Jobs + Fleet. Vendor identity on the right. No rates, admin master data, or shipments view.
- **Full-page job detail** (not slide-out) — more room for fee reconciliation table + proof uploads.
- **Responsive from day 1** (768px+) — vendors are on-site at warehouses/terminals.
- **Read-only fees/quantities** — view for reconciliation, cannot edit.
- **"Teleport OS Vendor" label** — next to logo, matching "Teleport OS Admin" on the admin side.

See `design-preview.html` (this folder) for visual mockups of all screens.

## Technical Considerations

### V1: Separate Folder, Shared localStorage (Demo/Prototype)
- Vendor app lives in `vendor/` folder with its own Vite entry point
- Reads from same localStorage key (`tripmanager_state`) as admin app
- Vendor login selects a vendor code, filters all data by that code
- Mutations (status changes, proof uploads) update the same localStorage state
- Admin and vendor can run in the same browser and see each other's changes instantly
- Good for demo/validation. Not for production.

### Future: Separate Deployment
- Standalone app or separate build target
- API-backed: vendor authenticates, receives only their data
- Write operations (status update, proof upload) go through API with vendor auth
- Real-time updates via WebSocket or polling

### Data Sync Implications
- Status changes by vendor must be visible to admin immediately (and vice versa)
- Proof uploads by vendor appear in admin's slide-out panel
- Activity log entries include the actor: "HaleSun Logistics" vs "Ops Planner"
- Fee changes by admin (toggle active/inactive, edit quantities) must be visible to vendor

## Success Metrics

### Adoption
- % of active vendors logging in weekly
- % of status updates coming through app vs WhatsApp

### Efficiency
- Reduction in WhatsApp messages between ops and vendors for status updates
- Time from job completion to proof upload (target: same day)

### Reconciliation
- % of fee discrepancies caught before invoicing (vs discovered at invoice time)
- Reduction in billing disputes per month

## Iteration Plan

### v1.0 — Visibility + Status Updates (this PRD)
- [ ] Vendor login (vendor code selection)
- [ ] My Jobs page with status/service filters
- [ ] Job detail view with all sections
- [ ] Start Job action (Pending → In Progress)
- [ ] Proof upload with auto-transition to Completed
- [ ] Fee breakdown (read-only)
- [ ] Activity log (read-only)
- [ ] Cancelled job visibility with reason
- [ ] CSV export

### v1.1 — FM Dispatch (Driver & Vehicle Assignment)
- [ ] Fleet page with Drivers and Vehicles tabs (CRUD)
- [ ] Driver master data: name, phone, WeChat ID, default vehicle, active/inactive
- [ ] Vehicle master data: plate number, truck type, capacity, active/inactive
- [ ] Driver & Vehicle Assignment section on FM job detail (between Status Action Bar and Fees)
- [ ] Driver + vehicle sub-line under Route in job list (HMW-V03)
- [ ] Assignment locked after Completed
- [ ] Activity log: "Assigned Driver Zhang Wei + 粤B·12345"
- [ ] "Fleet" nav item added to vendor navbar

### v1.2 — Reconciliation
- [ ] Fee discrepancy flagging (vendor can mark "doesn't match our records")
- [ ] Batch reconciliation view (date range, fee totals, exportable)
- [ ] Notification badges (new jobs, cancellations, verifications)

### v2.0 — WeChat Mini Program (Driver Access)
- [ ] WeChat Mini Program for drivers assigned to FM jobs
- [ ] Driver sees: pickup/delivery locations, pickup time, cargo details, customer name
- [ ] Driver status updates: arrived at pickup, departed, arrived at delivery
- [ ] Driver proof photo upload from phone camera
- [ ] Status updates flow back to vendor app + admin app
- [ ] Activity log entries with driver name as actor

### v2.1 — Mobile + Notifications
- [ ] Responsive/mobile layout for vendor web app
- [ ] Push notifications (new assignment, cancellation, verification)
- [ ] Offline support for proof photos (upload when back online)

### v3.0 — Full Portal
- [ ] Individual vendor user accounts
- [ ] Vendor-side rate card viewing (see what rates Teleport has on file)
- [ ] Job acceptance/rejection (if business process changes)
- [ ] Invoice generation from verified jobs
- [ ] Multi-language support (Chinese + English + Malay)

## Open Questions

1. **Should vendors see other vendors on the same DO?** Current design says no — vendor only sees their own jobs. But for coordinating handoffs (e.g., FM trucker needs to know customs agent status), some cross-visibility might help. Decision: **No for v1.** Teleport ops coordinates handoffs.

2. **Should vendors be able to edit quantities?** Currently read-only. But vendors might have more accurate weight/bag counts from on-site measurement. Decision: **No for v1.** Vendor flags discrepancy via existing channels. Consider for v1.1.

3. **Should the vendor app be a separate codebase or same repo?** For v1 (localStorage demo), same repo with route-based separation. For production, likely a separate deployment with shared component library.

4. **What about vendors who handle multiple service types?** E.g., HaleSun does both FM Trucking and Origin Handling. The job list handles this naturally — they see all their jobs regardless of service type. Service filter lets them focus.

5. **Real-time sync priority?** If vendor starts a job at the warehouse, how quickly must the admin see it? For v1 (shared localStorage), it's instant. For production API, near-real-time (< 30s) is likely sufficient.
