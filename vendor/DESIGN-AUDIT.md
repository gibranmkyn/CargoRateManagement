# Vendor App Design Audit
_Last run: 2026-09-08 — autonomous design assessment_

Audit against `admin/DESIGN.md` + `vendor/DESIGN.md` for the vendor app at `vendor/src/`.

---

## Findings

### AUDIT-V01 · `JobDetailPage.tsx` — Local `StateCell` duplicates shared component
**File:** `vendor/src/pages/JobDetailPage.tsx` lines 49–68  
**Severity:** Medium (code consistency, not a visual violation)  
**Issue:** A local `StateCell` component is defined and used inside `JobDetailPage` for the Status Action Bar chip. It uses `getStateStyle` from `shared/statusStyles`, which is the old merged-state function (pre-2026-04-21 reversal). The global `StatusCell` component (`vendor/src/components/StatusCell.tsx`) exists for this purpose.  
**Why it matters:** The local `StateCell` conflates `status` + `verificationStatus` via `getStateStyle`, meaning the action bar chip may show "Verified" (a verification state) rather than the underlying job status. In practice the action bar *does* want to surface "Verified" as a user-facing state (it's the vendor's terminal state), but the implementation path is incorrect — it should derive its display label from explicit status/verificationStatus branching, not a deprecated merged helper.  
**Recommendation:** Replace `StateCell` + `getStateStyle` with explicit status labelling in the action bar (same approach as the `bar*` colors already use explicit branching on `job.status` and `job.verificationStatus`). Remove the local `StateCell` component.

---

### AUDIT-V02 · `JobDetailPage.tsx` — Proof upload zone not implemented per spec
**File:** `vendor/src/pages/JobDetailPage.tsx` `renderProofs()` function, ~line 186–203  
**Severity:** High (specified in `vendor/DESIGN.md` but not built)  
**Issue:** `vendor/DESIGN.md` specifies a full proof upload zone with:
- dashed border (`1.5px dashed rgba(21,44,255,0.25)`)
- "Drop files here or browse" text
- `📷 Take Photo` button with `capture="environment"` for tablet camera
- Drag-and-drop capability

The current implementation renders only an `+ Add` button that triggers `fileRef.current?.click()`. No zone, no camera button, no drag-and-drop.

**Impact:** Vendors on tablets at cargo terminals cannot take photos in one tap. They must tap a small button to open the file picker, then choose camera from the OS menu — adding friction at the moment of highest urgency.  
**Recommendation:** Implement per `HMW-V16` verdict (Option B: full zone on empty state, compact on filled state). Separate `<input capture="environment">` for camera; standard `<input multiple>` for browse.

---

### AUDIT-V03 · `JobDetailPage.tsx` — `capture="environment"` missing from file input
**File:** `vendor/src/pages/JobDetailPage.tsx` line 421  
**Severity:** Medium  
**Issue:** The file input is `<input ref={fileRef} type="file" accept="image/*,.pdf" multiple>` with no `capture` attribute. On tablet browsers (iPad Safari, Android Chrome), this triggers the file picker rather than the camera directly. `vendor/DESIGN.md` explicitly states "Camera button on tablet/mobile: uses `capture="environment"` for on-site photo capture".  
**Recommendation:** Add a separate `<input ref={cameraRef} type="file" accept="image/*" capture="environment">` for the Take Photo action. Keep the existing `fileRef` for Browse Files.

---

### AUDIT-V04 · `JobDetailPage.tsx` — `renderRoute` shows date without time for FM jobs
**File:** `vendor/src/pages/JobDetailPage.tsx` `renderRoute()`, lines 333–358  
**Severity:** Low (open design question, not a spec violation)  
**Issue:** The FM route section shows pickup location + short date (`fmtDateMono`: "29 Apr") but no time. The `vendor/DESIGN.md` FM layout specifies a "Pickup/Delivery Timeline — two-point layout: Origin (location + pickup datetime in big mono)" — `datetime`, not just date.  
**Context:** HMW-V14 is open on exactly this: whether the time should be rendered at hero size (20px mono) or as a sub-line. The function `fmtTime` is imported in JobDetailPage but not used in `renderRoute`.  
**Recommendation:** Once HMW-V14 is resolved, add pickup and delivery times to the route section. `fmtTime(job.origin.date)` and `fmtTime(job.destination.date)` are already available. Interim: add time as a mono sub-line without changing the font size.

---

### AUDIT-V05 · `FleetPage.tsx` — Missing `fontFamily` on form inputs
**File:** `vendor/src/pages/FleetPage.tsx` `inputStyle` and `selectStyle` definitions, ~lines 286–300  
**Severity:** Low  
**Issue:** The `inputStyle` object does not include `fontFamily: 'inherit'`. Without it, browser defaults (system-ui or Times New Roman on some Android webviews) will render input text in a different font than Instrument Sans.  
**Recommendation:** Add `fontFamily: 'inherit'` to `inputStyle` to match the global CSS rule in `admin/DESIGN.md`.

---

### AUDIT-V06 · `MyJobsPage.tsx` — Filter bar background inconsistency
**File:** `vendor/src/pages/MyJobsPage.tsx` lines 396–463  
**Severity:** Low  
**Issue:** The filter bar div has `background: '#fff'` and `borderBottom: '1px solid #e5e7eb'` but no top border. The page background is `#f3f4f6`. Without a top border or shadow, the filter bar floats visually between the white header and the gray page background — a subtle seam. The admin app uses `borderTop: '1px solid #e5e7eb'` on its filter bar to resolve this.  
**Recommendation:** Add `borderTop: '1px solid #e5e7eb'` to the filter bar container, or set the page header div to also be `background: '#fff'` with a shared bottom border.

---

### AUDIT-V07 · `JobDetailPage.tsx` — OH jobs show upload zone (per HMW-V08 spec, they should not)
**File:** `vendor/src/pages/JobDetailPage.tsx` `renderProofs()`, line 186–203  
**Severity:** Medium (spec conflict)  
**Issue:** `HMW-V08` decision (resolved): "No upload zone for OH (hub ops uploads via WeChat)." The current `renderProofs()` is used for all service types including OH, and `canUpload` is only gated on `job.status` (Pending/In Progress), not on service type. OH vendors therefore see the upload affordance.  
**Recommendation:** Add `const canUpload = (job.status === 'Pending' || job.status === 'In Progress') && job.service.code !== 'OH'` (or equivalent). OH proofs arrive via WeChat driver app (TODO-050). Show a read-only note for OH: "Proof is uploaded by the hub driver via WeChat" or display driver-uploaded proofs as read-only rows.

---

### AUDIT-V08 · `FleetPage.tsx` — Activity log count badge has `borderRadius: 6` (one pixel over)
**File:** `vendor/src/pages/JobDetailPage.tsx` line 210  
**Severity:** Negligible  
**Issue:** `borderRadius: 6` on the activity log count badge. The design system says 4-6px for containers. `6` is at the maximum — technically in-spec but worth noting in the context of a strict audit. Inputs and chips use 4px.  
**Recommendation:** Consider `4px` for consistency with chips and inputs. Non-blocking.

---

## What Is Correct ✓

- Navbar: 40px, `#111827`, vendor identity pattern correct (company name + avatar initials)
- Status/Verification cells: dot + label + timestamp, no filled chips — correct
- Service tags in table: `#6b7280` mono — correct (not blue)
- Trip ID in table: ink mono `#111827` — correct (no chip, no blue)
- Segment pills: neutral dark fill for All/Pending/In Progress; state-colored for To verify/Verified/Cancelled — correct
- Fleet table density: 8px 12px cells, 6px 12px headers — matches spec
- Driver/vehicle status: flat dot + text (green/ghost), no filled badges — correct
- Truck type display: mono gray, no blue pills — correct
- No stats bar on My Jobs or Fleet — correct (slop reduction applied)
- Color budget per row: maximum one accent — correct throughout
- No row tints for any status — correct (vendor/DESIGN.md: "No row tints for cancelled or rejected rows")
- Dispatch Assignment section background: `rgba(21,44,255,0.02)` with blue border — matches spec
- Status Action Bar: tinted backgrounds per status state — correct
- Shadows: none on table, nav, filter bar — correct (border-only)
- Border radius: 4-6px throughout, 99px on service filter pills — correct
- Empty state text: muted + clear filters link, no decorative icon or tinted box — correct
