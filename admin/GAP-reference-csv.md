# Gap Analysis: Reference CSV vs Current Data Model

Captured 2026-04-14. Based on sample CSV shared by client showing their existing ops system format.

## Where We Left Off

Client shared a sample export from their existing ops system. We did a full gap analysis and identified 7 gaps — some cosmetic, some structural. We did **not** start implementing anything. The open question before implementing is whether this CSV represents data we need to **import**, **reconcile against**, or **replicate as an export format** — that changes which gaps are actually load-bearing.

## Action Items for Tomorrow

### Discuss first (decisions before code)
- [ ] **What is this CSV for?** — Is it an import format (migrating their data in), a reconciliation format (matching invoices), or an export format we need to produce? This determines which gaps matter.
- [ ] **Dual status model** — Do we split Job status into `operationalStatus` + `validationStatus`, or keep unified and map on export? This is the most structural decision and blocks everything else.
- [ ] **New services (IC, LM, DH, AF)** — Are these in scope for this platform? IC (import) and DH (destination handling) suggest a different operational flow from what we've modelled. Clarify before adding.
- [ ] **Truck type naming** — Do we adopt their descriptive names (Container 20ft, Flatbed) or keep our weight-based types? Or maintain a mapping between both?

### Implement after decisions
- [ ] Add missing customers to seed data (DHgate)
- [ ] Add missing location to seed data (Liantang Checkpoint, code `LTC`, Luohu district)
- [ ] Add zone codes to Location master data (more granular than current city-level `zone` field)
- [ ] Update export to embed location code + zone per job row (look up from master data)
- [ ] If dual status is approved: update `Job` type, `TripContext` reducer, UI status flows, and seed data
- [ ] If new services approved: add to `SERVICE_HIERARCHY` in `types.ts` with L2 sub-services

## Reference CSV Columns

```
Sub-Trip ID | Trip ID | Customer | MAWB | Truck Type | Weight (KG) |
Service Code | Service Name | Sub-Service Code | Sub-Service Name |
Vendor | Pickup Location | Pickup Code | Pickup Zone | Pickup Time |
Dropoff Location | Dropoff Code | Dropoff Zone | Dropoff Time |
Trip Status | Validation Status
```

## Gaps

### 1. Truck Type on Job (structural)
Their truck type is a job-level field — `Container 20ft`, `Flatbed`, `Container 40ft`, `Open Body`. Descriptive container/vehicle types, not weight-based.

Ours: weight-based (`1.5T`, `3T`, `40HQ`, etc.) and only attached via fleet vehicle assignment — FM-only, optional. Their truck type appears on all service types (blank for non-FM), so it's a job attribute, not fleet-linked.

**Decision needed:** adopt their naming convention or keep ours? Map between them?

---

### 2. Dual Status Model (structural — most important)
They have two orthogonal statuses:

| Status | Values | Meaning |
|--------|--------|---------|
| Trip Status | `Pending`, `In Progress`, `Completed`, `Rejected` | Operational execution |
| Validation Status | `Draft`, `Completed` | Billing/reconciliation sign-off |

Our single status (`Pending → In Progress → Completed → Verified`) conflates both. Their model allows a trip to be operationally `Completed` but still `Draft` on validation — which is the exact reconciliation gap we model implicitly today. This also means `Verified` in our system ≈ their `Validation Status: Completed`.

**Decision needed:** split our status into two fields, or keep unified but map on export?

---

### 3. Export is One Row Per Sub-Service, Not Per Job
`PTRIP20260308001-01` appears twice in their export — once for FM002 (Pickup Fee) and once for FM003 (Handling). Their export flattens the fee/sub-service dimension into rows.

Our current export: one row per job. To match their format we'd need to expand each job's fees into separate rows.

---

### 4. Location Codes + Zone Codes on Jobs
They embed short location codes (`SHK`, `SZBA`, `QHFTZ`) and zone codes (`SZX03`, `Nanshan`, `Futian`, `Luohu`) directly on each job row. We only have these on Location master data — not on the job itself.

Their zones are more granular than our city-level zones (e.g., `SZX01`, `SZX03` as sub-zones within Shenzhen vs our single `Shenzhen`).

---

### 5. Missing Service Codes

| Code | Label | Notes |
|------|-------|-------|
| `IC` | Import Custom Clearance | We have `EC` (export). Import is a different flow. |
| `LM` | Last Mile Trucking | Different from FM? Possibly domestic delivery leg. |
| `DH` | Destination Handling | Mirror of our `OH` (Origin Handling) at destination. |
| `AF` | Air Freight | No sub-services filled in the sample — may be nascent. |

IC, LM, DH, AF all had blank sub-service codes in the sample data, suggesting they're less defined in their system.

---

### 6. Missing Master Data

**Customers:**
- DHgate

**Locations:**
- Liantang Checkpoint (code `LTC`, zone `Luohu`)

---

### 7. ID Format (cosmetic)
Theirs encodes date: `PTRIP20260308001` (PTRIP + YYYYMMDD + sequence).
Ours is sequential: `T00001`.

No functional impact — just a display/import mapping concern.

---

## What This Likely Means

This CSV comes from an existing operations system they want to migrate from or reconcile against. Priority order for addressing gaps:

1. **Dual status** — most structural, affects reconciliation design
2. **Missing services** (IC, LM, DH, AF) — scope expansion
3. **Truck type on job** — data model change + naming alignment
4. **Sub-service-per-row export** — export format change
5. **Location codes/zones on jobs** — look up from master data or store directly
6. **Master data additions** (DHgate, Liantang) — small, additive
