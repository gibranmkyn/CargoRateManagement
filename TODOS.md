# TODOS — Teleport OS

## Design Debt

### TODO-001: Add Rate Slide-Out Form Mockup
- **What:** Create HMW-24 HTML mockup for the Add Rate slide-out form
- **Why:** This is the most important new form in Phase 2. DESIGN.md has the spec but no visual mockup exists. All other HMW decisions have HTML source of truth — this one doesn't.
- **Pros:** Eliminates ambiguity for the implementer. Ensures the form matches the dense design system.
- **Cons:** ~10 min of CC time.
- **Context:** The Add Rate form uses the existing slide-out panel pattern (380px). Fields: vendor, service, rate type toggle, location/route dropdowns, rate amount + currency, unit, effective date. See DESIGN.md "Add Rate Form" section.
- **Depends on:** DESIGN.md Phase 2 section (completed)
