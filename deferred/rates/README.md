# Deferred: Rate Management Module

Archived 2026-03-30. Client decided to defer rate management to a later stage.

## What's here
- `RateContext.tsx` — Full rate state management (FTL rates, vendor fees, rate CRUD, lookups)
- `pages/RatesPage.tsx` — Admin rates page (FTL trucking tab + service fee tabs, CSV upload/download)
- `components/AddRateSlideOut.tsx` — Add/edit rate slide-out panel

## What was kept in the active codebase
- `FeeLineItem` on jobs — fees still exist on jobs, just not managed via rate cards
- Fee auto-population on create shipment — uses static seed data (`seedVendorFees`, `seedFtlRates`)
- Location master data — extracted to `LocationContext`
- `SERVICE_HIERARCHY` / `L1Service` / `L2SubService` — service labels/structure still used

## Design hypotheses preserved
Admin HMW 31-43 in `admin/design-hypotheses/` cover the rate management design decisions.

## To restore
1. Create `RateContext` from archived `RateContext.tsx`
2. Add `RateProvider` to `App.tsx`
3. Restore `RatesPage` route and nav link
4. Wire up rate lookups in `CreateTripPage` to use context instead of static seed data
