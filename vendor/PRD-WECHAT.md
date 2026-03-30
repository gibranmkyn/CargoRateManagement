# Teleport OS — WeChat Mini Program (Driver & Hub Ops)

> **v1.0 Prototype** | English only. Chinese localization deferred.
> Counterpart to Teleport OS Vendor (web) and Teleport OS Admin (web).

## Overview

The WeChat Mini Program is the third app in the Teleport OS platform. It's the execution layer — where drivers and warehouse operators physically handle cargo, scan bags, upload proof, and update status in real time.

The data flows in one direction: **Admin creates shipment + assigns vendor → Vendor assigns driver + vehicle → Driver/Hub Ops executes via WeChat → Status flows back to Vendor + Admin.**

This PRD covers both the **Driver role** (FM Trucking pickup/delivery) and the **Hub Ops role** (warehouse operations for OH/CS/CR services).

## Users & Context

### Primary User: 3PL Driver
- Drives trucks for vendors like HaleSun, Gonda, ThaiKee
- Handles 3-8 trips/day across Shenzhen/Dongguan/Guangzhou
- Uses a phone (not a computer) while on the road
- Currently receives job details via WeChat message from dispatcher
- Needs: where to go, what to pick up, how to confirm pickup/delivery
- Language: Chinese (English for prototype, Chinese localization in v2)

### Secondary User: Hub Ops (Warehouse Operator)
- Works at a warehouse/hub/cargo terminal (e.g., SZX Airport Cargo Terminal, Shenzhen Hub)
- Processes 50-200 handling units per shift
- Scans bags at inbound, processing, and outbound stages
- May handle exceptions (damaged, returned packages)
- Needs: which bags to scan, what stage they're at, how to flag problems

### How They Get Here
1. Vendor dispatcher adds driver in Teleport OS Vendor Fleet page (name, phone, WeChat ID, role: driver/hub ops)
2. Driver's phone number becomes WeChat Mini Program login credential
3. Driver opens WeChat, searches for "Teleport OS" mini program, logs in with phone + password
4. Driver sees their assigned trips. Hub Ops sees their assigned hub operations.

## Operational Model: Shipment → Job (no legs)

**Why no legs:** The first pickup is the handoff moment that Teleport cares about: cargo responsibility transfers from Teleport to the vendor. How the vendor moves cargo internally (intermediate hubs, multiple trucks, warehouse transfers) is the vendor's own operations, not modeled in the system. Teleport doesn't have hub codes for vendor's internal facilities.

```
Shipment: TikTok cargo → HK Airport

FM Job (HaleSun): Shenzhen → HK Airport
  ↓ Driver picks up at TikTok WH (bag scanning + proof)
  ↓ [vendor's internal ops — not in system]
  ↓ Driver delivers at HK Airport (proof)

EC Job (Gonda): Customs at Huanggang
OH Job (Gonda): Origin Handling at HK Airport Terminal
CS Job (Gonda): Cargo Submission at HK Airport
```

**Two layers:**
1. **Shipment** — Admin creates. Customer, MAWB, origin, destination, bags.
2. **Job** — Admin assigns to vendor. One service per job. FM = one vendor, one pickup driver, one delivery. OH/EC/CS = specific service at a specific facility.

**Status updates flow upstream:**
WeChat (driver scans bags) → Vendor app (sees job progress) → Admin (sees shipment progress) → Teleport → End Client (TikTok gets parcel-level tracking)

## Relationship to Other Apps

| Capability | Admin | Vendor (Web) | WeChat (Driver) | WeChat (Hub Ops) |
|---|---|---|---|---|
| Create shipments | Yes | No | No | No |
| Assign vendor to jobs | Yes | No | No | No |
| Assign pickup driver + vehicle (FM) | No | Yes | No | No |
| Manage fleet (drivers/vehicles) | No | Yes | No | No |
| Execute FM pickup (scan bags, proof) | No | No | Yes | No |
| Execute FM delivery (proof) | No | No | Yes | No |
| Scan bags for OH jobs (ARR/PAL/DEP) | No | No | No | Yes |
| Handle exceptions | No | No | No | Yes |
| Verify completed jobs | Yes | No | No | No |
| View fees (reconciliation) | Yes | Yes (read-only) | No | No |

## Data Model

### Status Lifecycle — Driver (FM Job)

Granular statuses that map to physical moments:

```
Assigned → Start Pickup → [Scan Bags] → Pickup Complete (proof) → Start Delivery → Delivered (proof)
```

| WeChat Status | What Happened | What Admin/Teleport Sees |
|---|---|---|
| Assigned | Vendor assigned pickup driver | Pending |
| Start Pickup | Driver arrived at origin | In Progress |
| Pickup Complete | Bags scanned, proof uploaded. Cargo handed off to vendor. | In Progress |
| Start Delivery | Driver departed for destination | In Progress |
| Delivered | Proof of delivery uploaded | Completed |

The first pickup is the critical moment: Teleport → Vendor handoff. The delivery is the completion.

### Status Lifecycle — Hub Ops (OH Jobs)

OH jobs are admin-created jobs at specific facilities. Hub ops uses the scanning UX (ARR/PAL/DEP) on the job:

| Hub Stage | Code | What Happened |
|---|---|---|
| Inbound | ARR | Bags scanned into facility |
| Processing | PAL | Bags processed (weighed, palletized, x-rayed, labeled) |
| Outbound | DEP | Bags scanned out of facility |

### Status Lifecycle — EC/CS Jobs

Standard job lifecycle:

| Job Status | What Happened |
|---|---|
| Pending | Admin created job, assigned to vendor |
| In Progress | Work started |
| Completed | Proof uploaded, work done |
| Verified | Admin verified, ready for billing |

### Bag-Level Scanning
| Outbound from Hub | DEP | Bags scanned out, ready for next leg |
| Exception | RTS/EXC | Bag has issue (damaged, wrong destination, return to shipper) |

### Bag-Level Scanning

Both Driver and Hub Ops scan at the **bag (handling unit) level**, not job level.

- Each shipment has associated bags (`BagPackage` in shared/types.ts)
- Each bag has a unique barcode (`bagNumber` field)
- Scanning verifies: right bags, right count, right shipment
- Manifest review: scanned count vs expected count (e.g., "8/10 bags scanned, 2 missing")

## Core Functionality — Driver

### D1: Login
- Phone number + password login
- Phone number matches the driver record in vendor Fleet page
- WeChat can auto-fill phone number via authorization
- Role selection if user has both Driver and Hub Ops access
- Account page: switch role, language settings (future), logout

### D2: Trip List
- Bottom navigation: **Trips | Trip History | Notifications | Account**
- Trips tab shows assigned and active trips (not completed)
- Status tabs at top: Assigned | Start Pickup | Pickup Complete | Start Delivery
- Each trip card shows:
  - Trip/Job ID
  - Pickup date + time
  - Vehicle info (plate, truck type)
  - Origin location
  - Destination location
- Click trip → Trip Detail page

### D3: Trip Detail
- Trip ID + status badge
- **Trip Details:** vehicle plate, truck type, weight
- **Pickup Details:** date/time, location name, address, postal code
  - `[Navigate]` button → opens map app (Amap/Baidu Maps/Apple Maps)
  - `[Call]` button → dials pickup contact number
- **Delivery Details:** location name, address, postal code
  - Same Navigate + Call buttons
- **Timestamps:** shows status progression with timestamps
  - Start Pickup: —
  - Pickup Complete: —
  - Start Delivery: —
  - Trip Complete: —
- **CTA button** at bottom: always shows the NEXT action
  - Assigned → `[Start Pickup]`
  - Start Pickup → `[Scan Bags]` or `[Complete Pickup]`
  - Pickup Complete → `[Start Delivery]`
  - Start Delivery → `[Complete Trip]`

### D4: Start Pickup Flow
1. Driver taps `[Start Pickup]` → confirmation dialog ("Are you sure?")
2. If confirmed → status updates to "Start Pickup", timestamp recorded
3. If trip requires bag scanning (configurable by dispatcher):
   - Scanning module appears
   - Driver scans bag barcodes via camera or manual entry
   - Green flash + beep for valid scan, red flash + triple beep for invalid
   - Auto-scan mode: camera stays active, scans continuously
   - Manual entry: type bag number + tap "+"
   - Scanned count vs expected displayed (e.g., "8/10 bags scanned")
4. Review Manifest: shows scanned vs missing bags
   - All scanned: "You've scanned 10/10 bags"
   - Missing: "8/10 scanned. 2 bags missing." + list of missing bag numbers with copy button
5. Complete Scan → Upload proof of pickup (camera or gallery, max 5 photos, JPEG/PNG, <1MB each)
6. Upload → status updates to "Pickup Complete" + "On Shipment"

### D5: Delivery Flow
1. Driver taps `[Start Delivery]` → confirmation dialog
2. Status updates to "Start Delivery"
3. Driver taps `[Complete Trip]` → Upload proof of delivery screen
4. Upload proof (same photo requirements as pickup)
5. Upload → status updates to "Trip Complete"
6. Redirect to trip list

### D6: Trip History
- List of completed trips, most recent first
- Filter by pickup date range
- Each entry shows: trip ID, pickup date, origin, destination, status
- Tap → shows full trip detail with all timestamps and proof photos

### D7: Notifications
- Two types: in-app notifications + WeChat service notifications (subscription-based)
- New trip assignment notification → tap to open trip detail
- Notification list shows past notifications with order details
- WeChat service notifications require user to subscribe on first login

## Core Functionality — Hub Ops

### H1: Hub Selection
- On login (or if assigned to multiple hubs), user selects which hub they're working at
- Single hub assigned → skip selection, go directly to hub menu
- Hub name displayed at top of all hub screens

### H2: Hub Main Menu
Four operations:
1. **Inbound to Hub** — receive bags from drivers, scan into warehouse
2. **Processing at Hub** — internal warehouse processing (weighing, palletizing, security x-ray)
3. **Outbound from Hub** — scan bags out for next delivery leg
4. **Handling Unit Exceptions** — flag damaged/returned/problem bags

### H3: Inbound (ARR — Arrived at Facility)
1. Shows list of trips with destination = current hub
   - Trip ID, pickup date, driver name, origin, destination
   - Scanned count vs expected (e.g., "0/12 scanned")
   - Filter by date range (default: last 3 days)
2. Tap trip → scanning module
3. Scan bags (same UX as driver scanning: camera, manual entry, auto-scan mode)
4. Review manifest → Complete Scan
5. Status update: bags marked as ARR (Arrived at Facility)

### H4: Processing (PAL — Processed at Location)
1. Select processing type from dropdown (e.g., "Processed at Location", "Security Inspection")
2. Scan bags → no manifest review needed (any bag can be processed)
3. Complete Scan → bags marked as PAL

### H5: Outbound (DEP — Depart from Facility)
1. Shows list of trips from current hub
   - Same layout as inbound, with "Scan Outbound" CTA
2. Scan bags → Review Manifest → Complete Scan
3. Status update: bags marked as DEP (Depart from Facility)

### H6: Exceptions
1. Select exception reason from list (e.g., "Return to Shipper", "Damaged", "Wrong Destination")
2. Optional remarks text field
3. Scan bag → immediately prompted to upload proof photo of exception
4. Each scanned bag gets individual proof photo
5. Complete Scan → bags marked with exception status + reason + proof

## Scanning UX (Shared by Driver and Hub Ops)

The scanning module is the most critical interaction in the WeChat Mini Program. Both Driver (pickup) and Hub Ops (inbound/processing/outbound) use the same scanning UX.

### Scanning Module Layout
- Trip/Job ID + status at top
- Large tap area: "Tap Here to Scan Handling Unit" with camera icon
- Manual entry: text input + "+" button (single entry)
- Scanned count: "Package Scanned: 8/10"
- Scanned list: timestamp + bag number for each scan
- CTA: "Review Manifest"

### Scan Feedback
| Result | Visual | Audio | Haptic |
|--------|--------|-------|--------|
| Valid scan | Green flash on tap area, bag number highlighted | Short beep | Phone vibrates |
| Duplicate scan | Orange flash on tap area | Double beep | Phone vibrates |
| Invalid scan | Red flash on tap area, error message | Triple beep | Phone vibrates, auto-scan turns off |

### Auto-Scan Mode
- Toggle on: camera stays active, scans continuously without tapping
- After extracting barcode, returns to list for verification
- On valid: adds to list, camera restarts automatically
- On invalid: shows error, turns off auto-scan mode (user must acknowledge)
- Manual "Back" to exit auto-scan

### Review Manifest
- Shows scanned bags vs expected bags
- All scanned: positive message "You've scanned 10/10 bags"
- Missing: warning "8/10 scanned. 2 bags missing." + list of missing bag numbers
- Copy button: copies missing bag numbers to clipboard (for WeChat messaging to dispatcher)
- CTA: "Complete Scan" (proceeds even with missing bags, with confirmation dialog)

## User Stories

### Authentication
- **WUS-001:** As a driver/hub ops, I want to login with my phone number and password so I can access my assigned work.
- **WUS-002:** As a user with both driver and hub ops roles, I want to switch roles so I can access different functionalities.
- **WUS-003:** As a hub ops assigned to multiple hubs, I want to switch between hubs so I can work at different locations.

### Driver — Trip Management
- **WUS-010:** As a driver, I want to see my assigned trips with pickup date, vehicle, origin, and destination so I know my schedule.
- **WUS-011:** As a driver, I want to view trip details with Navigate and Call buttons so I can find the pickup/delivery location and contact the right person.
- **WUS-012:** As a driver, I want to see my trip history filtered by date so I can review past work.

### Driver — Pickup Flow
- **WUS-020:** As a driver, I want to tap "Start Pickup" to update my status so the dispatcher knows I've arrived.
- **WUS-021:** As a driver, I want to scan bag barcodes at pickup so I can verify I have the right cargo.
- **WUS-022:** As a driver, I want auto-scan mode so I can scan multiple bags quickly without tapping each time.
- **WUS-023:** As a driver, I want to review the manifest (scanned vs expected) so I can flag missing bags before leaving.
- **WUS-024:** As a driver, I want to upload proof of pickup photos so the client has documentation.

### Driver — Delivery Flow
- **WUS-030:** As a driver, I want to tap "Start Delivery" so the system knows I'm en route.
- **WUS-031:** As a driver, I want to upload proof of delivery to complete the trip.

### Driver — Notifications
- **WUS-040:** As a driver, I want to receive a WeChat notification when a new trip is assigned to me.
- **WUS-041:** As a driver, I want to tap the notification to go directly to the trip detail.

### Hub Ops — Inbound
- **WUS-050:** As hub ops, I want to see a list of trips arriving at my hub so I know what to expect.
- **WUS-051:** As hub ops, I want to scan incoming bags to record arrival at facility (ARR status).
- **WUS-052:** As hub ops, I want to review the manifest to check for missing bags from the driver.

### Hub Ops — Processing
- **WUS-060:** As hub ops, I want to select a processing type and scan bags so I can record warehouse processing (PAL status).

### Hub Ops — Outbound
- **WUS-070:** As hub ops, I want to scan bags leaving my hub so I can record departure (DEP status).
- **WUS-071:** As hub ops, I want to review the outbound manifest to verify all bags are accounted for.

### Hub Ops — Exceptions
- **WUS-080:** As hub ops, I want to select an exception reason and scan a bag so I can flag problems.
- **WUS-081:** As hub ops, I want to upload proof of exception (photo) for each flagged bag.

## Pages & Navigation

### Driver Navigation (Bottom Tab Bar)
`Trips | Trip History | Notifications | Account`

### Hub Ops Navigation (Bottom Tab Bar)
`Hub | Account`

### Driver Pages
| Page | Route | Purpose |
|------|-------|---------|
| Trip List | `/trips` | Assigned + active trips with status tabs |
| Trip Detail | `/trips/:tripId` | Full detail with Navigate/Call + CTA button |
| Scan Pickup | `/trips/:tripId/scan-pickup` | Bag scanning at pickup |
| Upload Proof (Pickup) | `/trips/:tripId/proof-pickup` | Photo upload for pickup proof |
| Upload Proof (Delivery) | `/trips/:tripId/proof-delivery` | Photo upload for delivery proof |
| Trip History | `/history` | Completed trips list |
| Notifications | `/notifications` | Assignment notifications |
| Account | `/account` | Profile, switch role, logout |

### Hub Ops Pages
| Page | Route | Purpose |
|------|-------|---------|
| Hub Menu | `/hub` | Four operations: Inbound, Processing, Outbound, Exceptions |
| Inbound Trip List | `/hub/inbound` | Trips arriving at this hub |
| Scan Inbound | `/hub/inbound/:tripId/scan` | Bag scanning for ARR status |
| Processing | `/hub/processing` | Select type + scan for PAL status |
| Outbound Trip List | `/hub/outbound` | Trips departing from this hub |
| Scan Outbound | `/hub/outbound/:tripId/scan` | Bag scanning for DEP status |
| Exceptions | `/hub/exceptions` | Select reason + scan + photo proof |
| Account | `/account` | Profile, switch role/hub, logout |

## Technical Considerations

### V1: Prototype (Shared localStorage)
- NOT a real WeChat Mini Program in v1. Built as a mobile-width web app for demo.
- Runs on a third port (e.g., `:5175`) alongside Admin (`:5173`) and Vendor (`:5174`)
- Reads/writes same localStorage key (`tripmanager_state`)
- Driver login: select driver from fleet list (matching phone number pattern from vendor Fleet page)
- Status updates from WeChat app visible in Vendor and Admin on refresh
- Activity log entries use driver name as actor (e.g., "Driver Zhang Wei — Start Pickup")

### Future: Real WeChat Mini Program
- Built with WeChat Mini Program SDK (WXML/WXSS/JS or Taro/uni-app framework)
- WeChat-native camera API for barcode scanning
- WeChat login via phone number authorization
- Push notifications via WeChat subscription messages
- Offline support: cache scanned data, sync when back online
- GPS: auto-capture location on status updates

### Data Sync
- Driver scans bags at pickup → bags marked as picked up → visible in vendor + admin
- Hub Ops scans inbound → bags marked ARR → visible in vendor + admin
- All status changes create activity log entries with actor name
- Proof photos uploaded by driver/hub ops appear in job's proof documents

## Design Direction

### Mobile-First (375px)
- This is a phone app, not a desktop tool
- Large tap targets (44px minimum)
- One primary action per screen
- Bottom tab bar navigation (WeChat convention)
- Status updates via big CTA buttons at bottom of screen

### Scanning UX is Critical
- The scanning module is used dozens of times per day
- Must be fast: auto-scan mode, instant feedback (green/red flash, beep, vibrate)
- Must be forgiving: manual entry fallback, copy missing bag numbers
- Must be clear: scanned count prominent, review manifest before submitting

### Bilingual Support (Deferred)
- English only for prototype
- Chinese localization in v2 (all UI text, error messages, notifications)
- UI should be designed with i18n in mind (no hardcoded widths for text)

### Visual Identity
- Same Teleport OS brand: logo, Future Blue accent (#152CFF)
- But adapted for mobile: larger text, more padding, touch-friendly
- Follow WeChat Mini Program conventions (bottom tab bar, top nav bar with back button)
- Status colors: same 5-color system as admin/vendor apps

## Iteration Plan

### v1.0 — Prototype (Web App for Demo)
- [ ] Driver login (select from fleet list)
- [ ] Driver trip list with status tabs
- [ ] Driver trip detail with Navigate/Call buttons
- [ ] Start Pickup + bag scanning module
- [ ] Upload proof of pickup
- [ ] Start Delivery + Complete Trip + proof of delivery
- [ ] Hub Ops login with hub selection
- [ ] Hub main menu (4 operations)
- [ ] Inbound scanning (ARR)
- [ ] Processing scanning (PAL)
- [ ] Outbound scanning (DEP)
- [ ] Exception scanning with proof photo
- [ ] Activity log entries flow to vendor + admin

### v1.1 — Notifications + History
- [ ] Trip assignment notifications (in-app)
- [ ] Trip history with date filter
- [ ] Notification list

### v2.0 — Real WeChat Mini Program
- [ ] WeChat Mini Program SDK build
- [ ] Chinese localization (bilingual English/中文)
- [ ] WeChat native camera for barcode scanning
- [ ] WeChat login via phone authorization
- [ ] WeChat subscription message notifications
- [ ] GPS location capture on status updates
- [ ] Offline scanning with sync

### v3.0 — Advanced
- [ ] Auto-scan mode optimization
- [ ] Lot label / shipping label printing integration
- [ ] Customs clearance status updates (B7 from existing PRD)
- [ ] Exception workflow with return-to-shipper flow

## Open Questions

1. **Should the prototype simulate barcode scanning?** Real scanning needs a camera. For a web demo, we could use a text input that accepts bag numbers. Or we could use the device camera via a web barcode scanning library (e.g., `html5-qrcode`).

2. **How do trips map to our Job model?** In the existing system, a "trip" is a driver assignment with multiple handling units. In our model, a "job" is one vendor + one service. For FM, one job = one trip. For Hub Ops, they process bags across multiple jobs. The hub ops view is hub-centric, not job-centric.

3. **Should the driver see fee information?** Currently no — drivers don't do reconciliation. But some vendors have drivers who also do basic cost tracking. Decision: **No for v1.** Fee reconciliation stays in the vendor web app.

4. **Manifest review tolerance:** When a driver has scanned 8/10 bags, can they proceed? The existing system allows it with a warning. Keep this behavior — sometimes bags are legitimately missing (customer shorted the count).
