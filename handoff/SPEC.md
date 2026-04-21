# Implementation Spec

## Phase 1 — Page chrome simplification

### JobsPage.tsx

**DELETE:** stats bar at the top (`82 jobs · 15 pending · …`).
**CHANGE:** segment pills from `Active · Completed · All` to `All · Pending · In Progress · Awaiting Verify · Verified`.
**CHANGE:** two search inputs → one. Backend already ORs trip/job/customer — add `vendor` and `mawb` to that OR.
**DELETE:** `VerificationFilter` select. The new segment pills cover the three meaningful states.
**KEEP:** `Service` select, `DateRangePopover`, `Group by` select.
**ADD:** if `counts.cancelled > 0`, render inline muted alert at top-right: `⚠ N cancelled · view`.

```diff
- <div className="stats-bar">…</div>
-
- <Pills tabs={['Active','Completed','All']} … />
- <input placeholder="Search trip…" /><input placeholder="Search vendor…" />
- <Select value={verif} …>Verification…</Select>
+ <Pills tabs={['All','Pending','In Progress','Awaiting Verify','Verified']} counts={counts} />
+ <input placeholder="Search by trip, customer, vendor, or MAWB…" />
```

**Empty state:** remove the 42×42 blue tinted square + ship icon. Replace with:
```tsx
<div style={{ textAlign: 'center', padding: '40px 16px', color: '#6b7280', fontSize: 12 }}>
  No jobs match · <button onClick={clearFilters} style={linkStyle}>clear filters</button>
</div>
```

### TripsPage.tsx

Same stats-bar delete and search merge. Pills become: `All · Pending · In Progress · Completed · Verified · + N Cancelled if any`.

---

## Phase 2 — Single `State` column

### `@shared/statusStyles.ts`

Add `getStateStyle(job)` that consumes `{ status, verificationStatus, cancelReason, rejectionReason }` and returns:

```ts
type StateStyle = {
  label: string;        // 'In progress' | 'Awaiting verify' | 'Verified' | 'Rejected' | 'Cancelled' | 'Pending'
  dot: string;          // hex
  color: string;        // text color (hex)
  fontWeight: 500 | 600;
  tone: 'neutral' | 'attention' | 'success' | 'danger';
  subline?: string;     // rejectionReason or cancelReason
};
```

Keep `getStatusChipStyle` and `getVerificationChipStyle` around for `MyJobsPage` (vendor side still wants the 2-chip view until we audit the vendor UI).

### `StateCell.tsx` (new)

Drop-in component. Replaces `{renderStatusChip(j.status)}` + `{renderVerifChip(j.verificationStatus)}` in both `JobsPage.tsx` and `TripsPage.tsx` child job rows.

### Admin-side changes

In `JobsPage.tsx` `renderJobRow`: delete the Status + Verification `<td>`s, replace with a single `<td><StateCell job={j} /></td>`. Update column header from `Status / Verification` to `State`. Update CSV export to include `State` as a computed column (use `getStateStyle(j).label`).

### TripsPage.tsx

For the trip-level row, keep the `{verified}/{total} verified` progress fraction as the primary state (already implemented per HMW-54). For child-job sub-table, use `<StateCell>`.

---

## Phase 3 — Slide-out flattening

### JobSlideOut.tsx → replace with JobSlideOut.new.tsx

Key deltas:

1. **Delete Status Action Bar container.** The amber/blue tinted box with "Ready for Verification →" hint goes away.
2. **Delete standalone Verification Row.** Fold Reject/Verify buttons into the top action row (flush, no tint).
3. **Combine header + state + action** into a single block bounded by one bottom border:
   ```
   [J02 · 04]  Hub Ops · Huanggang              [Edit] [×]
   Shopee · T-0420 · SevenSeas
   ─────────────────────────────────
   ● Awaiting verify · completed 08:15 by Zhang W.     [Reject] [Verify]
   ```
4. **Details section** becomes plain key/value grid. No colored chips. If there's something that needs attention (missing seal photo, route diff > threshold), render one `⚠` line in amber text — no container.
5. **Proof docs:** flat list with inline lucide icon in `#6b7280` (not blue-tinted 24×24 square). Filename in ink, size in `#9ca3af`, `Open` link in blue.
6. **Activity log:** plain 2-column rows (`action · user` ↔ `timestamp`). Timeline rails only when `log.length > 10`.
7. **Cancellation / replacement / remark forms:** same logic, but only the active one is a container. The others collapse into buttons: `[+ Add remark]  [Cancel job]`.

### JobDetailPage.tsx

Apply the same action-row pattern at the top of the detail page. Delete the duplicate "Verification Action Bar" block. Proof cards and activity log get the same flat treatment.

---

## Phase 4 — Color budget

### ServiceTag.tsx

```diff
- style={{ background: 'rgba(21,44,255,0.06)', color: '#152CFF', padding: '1px 8px', borderRadius: 99, fontSize: 9, fontWeight: 700 }}
+ style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 600, color: '#6b7280', letterSpacing: '0.02em' }}
```
Service code renders as `FM` (mono, gray) — no pill, no tint. If the L1 label matters in context, add ` Trucking` in `#9ca3af` next to it.

### Trip-ID chip in JobsPage renderJobRow

```diff
- <span style={{ fontFamily: mono, color: '#152CFF', background: 'rgba(21,44,255,0.06)', padding: '1px 5px', border: '1px solid rgba(21,44,255,0.1)', borderRadius: 3 }}>
-   {j.id}
- </span>
+ <span style={{ fontFamily: mono, color: '#111827', fontWeight: 500 }}>{j.id}</span>
```
The row is already clickable — no visual chrome needed to signal that.

### In Progress chip (controversial)

Option A (safer): keep the blue-tinted chip — but it's now the ONLY blue on a data row, so it legitimately draws the eye.

Option B (purist): drop the tint, use `<span style={{ color: '#111827', fontWeight: 500 }}><dot color="#152CFF"/> In progress</span>`. Leaves blue 100% reserved for interactive affordances.

Recommend **Option A** for rollout, re-evaluate once the rest of the blue surfaces are gone.

### FleetPage.tsx

Plate numbers become ink (mono), not blue. `Trip` link cell keeps the blue link style — that's interactive. `On trip` / `Idle` / `Maintenance` statuses use the state color palette from `getStateStyle`-equivalent, not independent Fleet chips.

### Global CSS / DESIGN.md

Update the design doc's color table: move "In Progress" out of the rainbow by noting `#152CFF` is primarily an **interactive** token; the chip tint is the only data-row exception. See `DESIGN-DIFF.md`.

---

## Acceptance checklist per page

**JobsPage**
- [ ] No stats bar
- [ ] One search input
- [ ] No Verification select
- [ ] Column header reads `State` (not Status + Verification)
- [ ] Trip-ID is ink mono, not blue chip
- [ ] ServiceTag is mono-gray, not blue pill
- [ ] Row tint removed for Cancelled/Rejected
- [ ] Empty state has no decorative icon

**TripsPage** — same deltas + progress-fraction is the primary state, child rows use `<StateCell>`.

**JobSlideOut** — one bordered action row up top, one colored container max elsewhere, flat proof list, plain activity log.

**JobDetailPage** — same action-row pattern; no duplicate Verification Action Bar.

**FleetPage / MasterDataPage** — plate numbers ink, status via shared `getStateStyle`, no independent chip palettes.
