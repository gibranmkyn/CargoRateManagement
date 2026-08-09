# Design Audit — Teleport OS Vendor

> Audited against `vendor/DESIGN.md` + `admin/DESIGN.md`.
> First audit: 2026-05-22 | Fixed: 2026-08-09

---

## ✅ FIXED — [HIGH] JobDetailPage.tsx — Status Action Bar missing per-state tinted backgrounds

**File:** `vendor/src/pages/JobDetailPage.tsx` line 425 (original)
**Spec** (`vendor/DESIGN.md` → Status Action Bar table):

| Status | Bar Background | Border |
|--------|----------------|--------|
| Pending | `#f9fafb` | `#e5e7eb` |
| In Progress | `rgba(21,44,255,0.04)` | `rgba(21,44,255,0.12)` |
| Completed | `#fefce8` | `#fde68a` |
| Verified | `#f0fdf4` | `#a7f3d0` |
| Cancelled | `#fef2f2` | `#fecaca` |

**Violation:** The action row used a flat `border: 1px solid #e5e7eb` with no background tint and no hint text. Every status state looked identical except for the button.

**Fix (2026-08-09):** Status Action Bar now derives background + border from `job.status` / `job.verificationStatus`. Verified takes precedence over status (e.g., Completed + Verified → green). Contextual hint text added between status chip and action button ("Start this job when you begin work", "Upload proof of service to mark complete", etc.). Completion timestamp and verification timestamp displayed on the right side.

---

## ✅ FIXED — [HIGH] FleetPage.tsx — Non-standard blue-tinted surface `#fafbff`

**File:** `vendor/src/pages/FleetPage.tsx` lines 430, 490, 636, 688
**Approved surfaces:** `#ffffff` (cards/table), `#f9fafb` (raised/headers/expanded), `#f3f4f6` (page). No blue-tinted surface.
**Violation:** Add/edit-form table rows used `background: '#fafbff'`.
**Fix (2026-08-09):** Replaced all 4 occurrences with `#f9fafb`.

---

## ✅ FIXED — [MEDIUM] FleetPage.tsx — Blue icon container on empty states

**File:** `vendor/src/pages/FleetPage.tsx` lines 607, 792
**Rule** (`admin/DESIGN.md`): `#152CFF` is **interactive only**. Vendor DESIGN.md: "Empty state: plain muted text + `clear filters` link — no decorative icon, no tinted box."
**Violation:** Empty states used a `40×40 rgba(21,44,255,0.08)` box with a `Truck` icon in `#152CFF`, plus a 13px/700 title — decorative chrome.
**Fix (2026-08-09):** Replaced with a single muted text line at 12px. Truck import removed.

---

## ✅ FIXED — [LOW] JobDetailPage.tsx — Lucide Truck icon embedded in section title

**File:** `vendor/src/pages/JobDetailPage.tsx` line 269 (original)
**Rule:** Section titles are `9px/700 uppercase` plain text — no icon components.
**Fix (2026-08-09):** Removed `<Truck />` from section title. Label "DRIVER & VEHICLE" at 9px uppercase is unambiguous without it. Also: Dispatch Assignment section now gets the distinct blue-tint container per spec (`background: rgba(21,44,255,0.02)`, `border: 1px solid rgba(21,44,255,0.1)`, `borderRadius: 6`).

---

## ✅ FIXED — [LOW] JobDetailPage.tsx — Proof upload `+ Add` button visible in Completed state

**File:** `vendor/src/pages/JobDetailPage.tsx` line 100
**Spec** (`vendor/DESIGN.md` → Proof of Service): "Upload available in Pending and In Progress only."
**Fix (2026-08-09):** `canUpload = status === 'Pending' || status === 'In Progress'`. Re-upload for Rejected verification is handled separately in the action bar.

---

## ✅ FIXED — [LOW] MyJobsPage.tsx — Service label shown alongside service code

**File:** `vendor/src/pages/MyJobsPage.tsx` lines 319–323
**Violation:** Service column showed both `job.service.code` (FM) and `job.service.label` (FM Trucking) side by side.
**Fix (2026-08-09):** Removed the `{job.service.label && ...}` span. Code alone (FM / EC / CS / CR / OH) is sufficient in the compact table; full label is visible in the job detail header.

---

## ✅ FIXED — [LOW] JobDetailPage.tsx — Section sub-labels use 8px font (below 9px minimum)

**File:** `vendor/src/pages/JobDetailPage.tsx` lines 175, 179, 339, 351
**Rule** (`admin/DESIGN.md` → Typography): "Table headers / labels: 9-10px / 600 / uppercase + 0.05-0.06em tracking."
**Fix (2026-08-09):** Changed all `fontSize: 8` → `fontSize: 9` on Cargo sub-labels (Bags, Weight) and Route sub-labels (Pickup, Delivery).

---

## ✅ FIXED — [LOW] FleetPage.tsx — "+ Add" button font size below spec

**File:** `vendor/src/pages/FleetPage.tsx` line 388
**Rule** (`admin/DESIGN.md` → Page Header): "Buttons: 5px 12px padding, 6px radius, 11px/600 font."
**Fix (2026-08-09):** `fontSize: 9` → `fontSize: 11`. Removed `textTransform: 'uppercase'` and `letterSpacing: '0.04em'` as redundant for a page-header button.

---

## Non-Issues (confirmed correct)

- **No shadow usage** — all three pages use borders only. ✓
- **Segment pill border-radius: 4px** — correct per spec. ✓
- **Service filter pills: 99px border-radius** — correct (the only full-round exception). ✓
- **Status/Verification cells** — `StatusCell` + `VerificationCell` correctly implement dot + label + timestamp + optional reason subline. ✓
- **No row tinting** — no background colors on table rows for status states. ✓
- **Export button border-radius: 6px** — correct for buttons. ✓
- **Fleet table border-radius: 6px** — correct for table containers. ✓
- **Segment pill active states** — To verify/Verified/Cancelled use state-colored borders/backgrounds; All/Pending/In Progress use dark fill. ✓
- **Old mockup CSS (`.svc` blue pill)** — Historical artefact in `01-hmw-responsive-job-table.html`. Live code renders service tags correctly as mono gray `#6b7280`. No action needed.

---

## Open — Minor: withSubline prop removed from StatusAction Bar StateCell

**File:** `vendor/src/pages/JobDetailPage.tsx`
**Context:** The `StateCell` in the status action bar was changed from `withSubline={true}` to `withSubline={false}` because the bar now shows its own contextual hint text. The cancel/rejection/completion reason sublines are shown as separate inline text below the bar (existing code). This is intentional — the design guard says "do not reintroduce: Inline reason text for cancelled/rejected (no tinted reason boxes)". These sublines remain inline; only the hint text is now in the bar itself.
