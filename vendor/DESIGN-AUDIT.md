# Design Audit — Teleport OS Vendor
> Audited: 2026-08-10 · Against: admin/DESIGN.md + vendor/DESIGN.md

## Summary
The vendor app is largely compliant with the design system. Service tags use mono gray (no pill, no blue), status cells use the dot+label+timestamp pattern, no shadow violations found, border radii are within spec, and accent blue is restricted to interactive elements. Two issues found.

---

## Issues

### AUDIT-V01 — FM Route section: datetime displayed at wrong size, time field missing

**File:** `vendor/src/pages/JobDetailPage.tsx` · function `renderRoute()` (line ~333)

**Violation:** The `admin/DESIGN.md` spec for the FM Trucking detail page says: _"Pickup/Delivery Timeline — two-point layout: Origin (location + pickup datetime in big mono) → arrow → Destination (location + delivery datetime). Times are the most important data for FM."_ `vendor/DESIGN.md` confirms: _"Times are the most important data for FM dispatchers."_

The current implementation shows only the **date** at `fontSize: 9, color: '#374151'`:
```tsx
// renderRoute() — current
<div style={{ ...mono, fontSize: 9, color: '#374151', marginTop: 2 }}>
  {job.origin.date ? fmtDateMono(job.origin.date) : trip.pickupDate}
</div>
```
`fmtDateMono` uses `toLocaleDateString(..., { day: '2-digit', month: 'short' })` — it discards the time component. For a pickup at `2026-08-10 09:00`, only `10 Aug` is shown, not `09:00`.

**Expected:** Time should be shown in JetBrains Mono at a readable size (minimum 11px) alongside the date. The design spec says "big mono" — this implies the times should be visually prominent, not 9px faint.

**Fix:** Use `fmtDateTime` (already imported from `statusStyles`) and split into date + time lines, or create a small helper that formats `"2026-08-10 09:00"` as two lines: `10 Aug` (10px) and `09:00` (13px/600 mono). Use `color: '#111827'` for the time, not `'#374151'`.

**Severity:** Medium — dispatchers cannot see pickup time at a glance. They must navigate to the My Jobs table pickup column to find it.

---

### AUDIT-V02 — Hub Ops Progress section: hardcoded placeholder data with no backing model

**File:** `vendor/src/pages/JobDetailPage.tsx` · function `renderHubOpsProgress()` (line ~372)

**Violation:** The section renders hardcoded `0/24` for Inbound, Processed, and Outbound counters:
```tsx
<div style={{ ...mono, fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>0/24</div>
```
These values are not derived from any field on the `Trip` or `Job` types. The `Job` type has no `hubOpsInbound`, `hubOpsProcessed`, or `hubOpsOutbound` fields. The `24` is hardcoded — it happens to match `trip.bags` in seed data but would be wrong if this section renders for an OH job on a different trip.

**Context:** `vendor/DESIGN.md` (HMW-V08 decision) specified _"OH gets one extra section [Hub Ops Progress: Inbound/Processed/Outbound counters]"_, but the data model to back these counters was never designed. The section is stubbed with placeholder output.

**Impact:** Any vendor logging into an OH job sees `0/24` for all counters — this looks like a real (broken) feature rather than an unimplemented placeholder. It could confuse OH vendors into thinking no cargo has been processed even if it has.

**Fix options:**
1. **Remove** the Hub Ops Progress section entirely until a data model is designed (cleanest for v1 — the DESIGN.md already notes this is stub territory)
2. **Add** `hubOpsInbound`, `hubOpsProcessed`, `hubOpsOutbound` as optional fields on `Job`, derive the denominator from `trip.bags`, and render `—/—` instead of `0/24` when unset
3. **Replace** with a simple note: _"Hub ops tracked via WeChat — status appears in the activity log"_

**Severity:** Medium — renders misleading data to OH vendors.

---

## Non-Issues (verified clean)

| Check | Status | Notes |
|-------|--------|-------|
| Service code tags in My Jobs table | ✅ | Mono gray `#6b7280`, 10px, no pill chrome, no blue |
| Trip ID in My Jobs table | ✅ | Ink mono `#111827`, 10px, no chip, no blue |
| Status/Verification cells | ✅ | `StatusCell` + `VerificationCell` — dot + label + timestamp subline |
| Accent blue restricted to interactive elements | ✅ | Buttons, links, active nav, selected service pills, active pagination page |
| Segment pill border-radius | ✅ | `borderRadius: 4` (segments), `borderRadius: 99` (service codes = full round pills) |
| Table container radius | ✅ | `borderRadius: 6` on table containers |
| No shadows on nav, filter bar, or table | ✅ | Borders only throughout |
| Dispatch Assignment section styling | ✅ | `rgba(21,44,255,0.02)` bg, `rgba(21,44,255,0.1)` border, `borderRadius: 6` — matches spec |
| Fleet page driver/vehicle status | ✅ | Flat dot+text, green `#059669` for active, ghost `#d1d5db` for inactive — no filled badge |
| Fleet page truck type display | ✅ | Mono gray `#6b7280` — no blue pill |
| Fleet page "+ Add" button | ✅ | `color: #152CFF` border + text — interactive element, correct |
| No row tints for cancelled/rejected rows | ✅ | Status cell carries the signal; row background unchanged |
| Cancel/rejection reason display | ✅ | Inline text beneath status bar, no tinted box |
| Empty state design | ✅ | Muted text + "clear filters" link — no decorative icon, no tinted box |
| Pagination active page | ✅ | `rgba(21,44,255,0.06)` bg + `#152CFF` border/text — interactive element, correct |
