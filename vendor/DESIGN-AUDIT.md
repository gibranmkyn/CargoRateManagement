# Vendor App — Design Audit

> Audited against `admin/DESIGN.md` and `vendor/DESIGN.md`.
> Date: 2026-08-18

## Summary

The vendor app implementation is largely compliant with the design system. No major color, shadow, or radius violations were found. Three minor issues and one open structural question are documented below.

---

## Findings

### MINOR-01 — Dead `borderTop` declaration in `renderDriverVehicle`

**File:** `vendor/src/pages/JobDetailPage.tsx`, line 267  
**Severity:** Minor (no visual impact)

```jsx
// Current — borderTop is silently overridden by the border shorthand
style={{ padding: '14px 16px', borderTop: '1px solid #f3f4f6', background: '...', border: '1px solid rgba(21,44,255,0.1)', ... }}
```

In a React inline style object, `border` (shorthand) applied after `borderTop` overrides it. The `borderTop: '1px solid #f3f4f6'` declaration has no effect. The visual result is correct (all four sides use `rgba(21,44,255,0.1)`), but the dead property is confusing.

**Fix:** Remove `borderTop: '1px solid #f3f4f6'` from `renderDriverVehicle`'s div style.

---

### MINOR-02 — Activity log count badge uses `borderRadius: 99` (reserved for service pills)

**File:** `vendor/src/pages/JobDetailPage.tsx`, line 210  
**Severity:** Minor

```jsx
// Current
<span style={{ ..., borderRadius: 99 }}>{log.length}</span>
```

The design system reserves `borderRadius: 99px` for service type pills only (the only fully-round elements). A log count badge at 6px radius would be more consistent.

**Fix:** Change to `borderRadius: 6` for the activity log count chip.

---

### MINOR-03 — `JobDetailPage` uses local `StateCell` + `getStateStyle` instead of shared `StatusCell`

**File:** `vendor/src/pages/JobDetailPage.tsx`, lines 49–68  
**Severity:** Minor / maintenance

`JobDetailPage` defines its own inline `StateCell` component using the `getStateStyle` helper (the pre-refactor combined-state API). `MyJobsPage` correctly uses the shared `StatusCell` + `VerificationCell` components. The Status Action Bar intentionally shows a single combined state (Verification takes priority over Status when Verified/Rejected), so the local component is functionally correct — but diverges from the shared component that will receive future updates.

The local `StateCell` is used only in the Status Action Bar (which shows a single priority state, not two columns). This is contextually correct — the action bar is not a data table cell. However, if the shared `StatusCell` API changes, `JobDetailPage` would need a separate update.

**Recommendation:** Accept as-is for now (the action bar pattern requires a single priority state). Document the intent: "Status Action Bar collapses both signals into a single priority state for the action context. This is intentional and distinct from the two-column Status+Verification pattern in the job list."

---

### OPEN — Old HMW mockups (V01) show service tags as blue pills

**Files:** `vendor/design-hypotheses/01-hmw-responsive-job-table.html`, CSS line 60  
**Severity:** Documentation inconsistency (no live code impact)

The V01 mockup defines `.svc` as a blue pill (`background: rgba(21,44,255,0.06); border: 1px solid rgba(21,44,255,0.1); color: #152CFF`). The current design system decision (2026-04-21 slop-reduction alignment) mandates mono gray for service tags: `#6b7280, 10px JetBrains Mono, no pill, no blue`. The live implementation is correct. The mockup is historical.

**Recommendation:** Mockup files are historical records; do not update them. The live implementation and DESIGN.md are the source of truth. No action required.

---

## Compliant Areas (checked)

| Area | Status |
|------|--------|
| Status/Verification dot+label+timestamp pattern | ✓ Correct |
| No row tints for status (Cancelled/Rejected) | ✓ Correct (only Status Action Bar uses tints) |
| Service tags: mono gray, no blue, no pill | ✓ Correct (MyJobsPage, JobDetailPage) |
| Segment pills: 4px radius, correct state-colored variants | ✓ Correct |
| Service filter pills: 99px radius, mono font | ✓ Correct |
| Table: border-only, no shadows | ✓ Correct |
| Nav: 40px height, #111827 bg, 4px radius links | ✓ Correct |
| Avatar: 22x22, 4px radius, rgba bg | ✓ Correct |
| Accent #152CFF: interactive-only (buttons, links, active nav, active pills) | ✓ Correct |
| No decorative colors beyond ink/status/surfaces palette | ✓ Correct |
| No shadows on table, cards, or filter bar | ✓ Correct |
| Status Action Bar: per-state tinted bg (gray/blue/amber/green/red) | ✓ Correct |
| Proof list: flat rows, not cards | ✓ Correct |
| Dispatch Assignment section: subtle blue bg + border, 6px radius | ✓ Correct per DESIGN.md |
| Typography: Instrument Sans + JetBrains Mono, correct scale | ✓ Correct |
| Empty state: muted text + "clear filters" link, no decorative icon | ✓ Correct |
