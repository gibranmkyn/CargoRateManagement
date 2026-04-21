# DESIGN.md — proposed edits

Edits to propagate into your existing `uploads/fe-context/DESIGN.md`. Copy the blocks below into the relevant sections.

---

## Replace: "Color — 5-State Status System" section

```md
## Color — State Lifecycle (HMW-SLOP)

**Principle:** Verified replaces Completed — they are not parallel axes.
State is a SINGLE signal per row. Color is a scarce asset.

### Lifecycle (linear, terminal states in bold)
`Pending → In Progress → Awaiting Verify → **Verified**`
                                       ↘ **Rejected** (loops back after fix)
`* → **Cancelled**` (terminal)

### Row-level state style

| State | Text | Dot | Weight | Use |
|---|---|---|---|---|
| Pending | `#6b7280` | `#d1d5db` | 400 | Assigned, not started |
| In Progress | `#111827` | `#152CFF` | 500 | Work underway — dot provides color cue |
| Awaiting Verify | `#374151` | `#a16207` | 500 | Completed, needs admin review (no tint) |
| Verified | `#059669` | `#059669` | 600 | Terminal success |
| Rejected | `#dc2626` | `#dc2626` | 600 | Needs fix + inline reason |
| Cancelled | `#dc2626` | `#dc2626` | 600 | Terminal cancel + reason |

**No filled chips on data rows.** Use `dot + text` at 11px.

**Containers** (tinted backgrounds) are reserved for the slide-out's single
active action. `Awaiting Verify` in the slide-out = chip + Verify button, not
a tinted amber box.
```

---

## Replace: "Accent (Future Blue)" bullet

```md
- **Accent (Future Blue):** `#152CFF` — **interactive only**: primary buttons,
  links, active nav, the In-Progress state dot. NOT used on: trip IDs, service
  tags, proof-doc icons, empty-state squares, completed-chip background.
```

---

## Add: new "Color budget" subsection (under Color)

```md
### Color budget (enforce in code review)

Per data row, maximum one accent color beyond Ink/Muted/Faint:
- the state dot for In Progress rows → blue
- the state text for Verified → green
- the state text for Rejected / Cancelled → red
- everything else on that row is `#111827 / #374151 / #6b7280 / #9ca3af`.

If you find yourself reaching for a second accent, you're duplicating a signal.
```

---

## Delete / revise: "Stats Bar" in Layout section

```md
### ~~Stats Bar~~ Removed — segment pills carry counts

The stats bar (`82 jobs · 15 pending · …`) is removed from Jobs and Trips.
Segment pills above the table carry the counts. Exception markers (Cancelled,
Rejected counts > 0) render as a muted inline alert right-aligned with the pills.
```

---

## Revise: Filter Bar

```md
### Filter Bar

- Single search input — covers trip ID, job ID, customer, vendor, MAWB
- Service select
- Date range popover
- Group-by select
- **No Verification filter** — the State column + segment pills cover it.
```

---

## Append to "Change log"

```md
| 2026-04-21 | Slop reduction (4-phase) | (1) stats bar removed, search unified. (2) Status + Verification collapsed into `State` column via `getStateStyle`. (3) JobSlideOut flattened — single action row, no stacked colored containers, flat proof list. (4) Blue reserved for interactive only; trip IDs and service tags lose blue chrome. |
```
