# Plan: Export Columns + Facility District Linking (HMW-56)

## Context

Two related gaps:

1. **CSV export** — Currently exports single `City` and `District` columns for **origin only**. Missing: facility code, and all destination location data. User wants full geographic context for both origin and destination.

2. **Facility master data** — The `Location` type has `city`, `district`, `districtCode` fields but the add/edit form only captures name, code, zone, type. Users can't set the administrative hierarchy when creating facilities. Design decision (HMW-56): **District Search Dropdown** — single type-ahead field, auto-fills city + districtCode. See mockup: `admin/design-hypotheses/56-hmw-facility-district-linking.html`.

---

## Part 1: CSV Export Enhancement

### Files to modify
- `admin/src/pages/JobsPage.tsx` — lines 67-95 (`locationCityDistrict` map + `exportJobsCSV`)
- `vendor/src/pages/MyJobsPage.tsx` — lines 61-87 (`locationCityDistrict` map + `exportCSV`)

### Changes

**1a. Extend the lookup map** (both files):

Current: `Map<name, { city, district }>` from `seedLocations` only.
New: `Map<name, { code, city, district }>` — also source from `LocationContext` so user-created locations resolve.

Both files import `seedLocations` from mockData. Admin JobsPage already has `useTrips` but not `useLocations` — need to add that import. Vendor MyJobsPage needs the vendor's location context equivalent (check if vendor app has LocationContext or if it reads from shared state).

**1b. Update CSV columns**

Admin (`exportJobsCSV`):
```
Trip ID, MAWB, Customer, Vendor, Service,
Origin Code, Origin, Origin District, Origin City,
Dest Code, Destination, Dest District, Dest City,
Pickup, Status
```

Vendor (`exportCSV`):
```
Trip, Customer, Service,
Origin Code, Origin, Origin District, Origin City,
Dest Code, Destination, Dest District, Dest City,
Pickup, Status
```

**1c. Row building**: Look up both `j.origin.location` and `j.destination.location` from the map.

---

## Part 2: Facility District Linking (HMW-56 — Option A)

### Design decision
District Search Dropdown — single type-ahead field in the Facilities add/edit form. Searches 3,056 GB/T 2260 districts by Chinese + English name, grouped by Province · City. Auto-fills district, city, districtCode. City column is read-only. Decision recorded in `admin/DESIGN.md` and `admin/design-hypotheses/README.md`.

### New component: DistrictSearchDropdown

Create `admin/src/components/shared/DistrictSearchDropdown.tsx`:
- Type-ahead input searching `ALL_DISTRICTS` from `admin/src/data/chinaRegions.ts`
- Search matches both Chinese name (宝安区) and the Location seed data's English `district` field (Bao'an District)
- Results grouped by Province · City header
- Each result row: Chinese name + English name + GB/T code (mono)
- On select → returns `{ district: string, districtCode: string, city: string }`
- City resolved via `getCityForDistrict(districtCode)` from chinaRegions.ts
- Province resolved via `getProvinceByCityCode(city.code)` for grouping headers
- Keyboard nav: arrow keys, Enter to select, Escape to close
- Style: same as existing LocationDropdown overlay — see `admin/src/components/shared/LocationDropdown.tsx` lines 160-205 for reference

### Files to modify

**`admin/src/components/master-data/LocationsTab.tsx`**:
- Add state: `newDistrict`, `newDistrictCode`, `newCity` (add form) + `editDistrict`, `editDistrictCode`, `editCity` (edit form)
- Add 2 table columns: **District** (~150px) and **City** (~100px) — between Type and Jobs
- District column in add row: render `<DistrictSearchDropdown>`. City column: read-only auto-resolved text.
- District column in edit row: same search dropdown, pre-populated with current value.
- District column in display rows: `{district}` + `districtCode` in mono.
- Update `handleAdd()` to pass `city`, `district`, `districtCode` to `addLocation()`.
- Update `handleSaveEdit()` to pass `city`, `district`, `districtCode` to `updateLocation()`.
- District is **required** on add (validation alongside name/zone).

**`admin/src/context/LocationContext.tsx`**:
- Update `addLocation` action payload to accept `city`, `district`, `districtCode` fields
- Update `updateLocation` action payload to accept these fields
- Ensure these fields persist to localStorage

**`admin/src/components/shared/LocationDropdown.tsx`**:
- Add district search field to the inline "Add new location" form (lines 140-157)
- Same `<DistrictSearchDropdown>` component
- Pass city/district/districtCode through `addLocation()` call (line 102)

---

## Implementation Order

1. Create `DistrictSearchDropdown` component
2. Update `LocationContext` to handle city/district/districtCode in add/update actions
3. Update `LocationsTab` — table columns + add/edit forms
4. Update `LocationDropdown` inline add form
5. Update CSV export in both `JobsPage.tsx` and `MyJobsPage.tsx`

---

## Verification

1. **Master Data > Facilities**: Add a new location. Type a district name in the search field. Confirm dropdown shows grouped results with Chinese + English names. Select one — verify city auto-fills, districtCode shown in table.
2. **Edit existing**: Click edit on a seed location. Confirm district field pre-populates. Change it — verify city updates.
3. **LocationDropdown**: In Create Trip form, click "Add new location" in origin dropdown. Confirm district search appears. Add a location — verify it appears with correct district/city.
4. **Admin CSV export**: Go to Jobs page, click Export CSV. Open file. Confirm columns: Origin Code, Origin, Origin District, Origin City, Dest Code, Destination, Dest District, Dest City. Verify values for seed data locations.
5. **Vendor CSV export**: Log into vendor app, go to My Jobs, export CSV. Same column verification.

---

## Key references
- Location type: `shared/types.ts:225-234`
- Seed locations: `shared/mockData.ts:486-517`
- China regions data + helpers: `admin/src/data/chinaRegions.ts:3966-3991`
- LocationContext: `admin/src/context/LocationContext.tsx`
- LocationsTab: `admin/src/components/master-data/LocationsTab.tsx`
- LocationDropdown: `admin/src/components/shared/LocationDropdown.tsx`
- Admin export: `admin/src/pages/JobsPage.tsx:67-95`
- Vendor export: `vendor/src/pages/MyJobsPage.tsx:61-87`
- Design mockup: `admin/design-hypotheses/56-hmw-facility-district-linking.html`
