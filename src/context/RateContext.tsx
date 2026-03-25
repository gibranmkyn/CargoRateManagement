import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { Location, VendorRate } from '../data/mockData';
import { seedLocations, seedRates } from '../data/mockData';

// --- State ---

interface RateState {
  locations: Location[];
  rates: VendorRate[];
  isLoaded: boolean;
}

const initialState: RateState = {
  locations: [],
  rates: [],
  isLoaded: false,
};

// --- Actions ---

type RateAction =
  | { type: 'LOAD_STATE'; payload: { locations: Location[]; rates: VendorRate[] } }
  | { type: 'ADD_LOCATION'; payload: Location }
  | { type: 'UPDATE_LOCATION'; payload: { locationId: string; updates: Partial<Omit<Location, 'id'>> } }
  | { type: 'DELETE_LOCATION'; payload: { locationId: string } }
  | { type: 'ADD_RATE'; payload: VendorRate }
  | { type: 'UPDATE_RATE'; payload: { rateId: string; updates: Partial<Omit<VendorRate, 'id'>> } }
  | { type: 'DEACTIVATE_RATE'; payload: { rateId: string } }
  | { type: 'AUTO_END_RATE'; payload: { rateId: string; effectiveTo: string } };

// --- Reducer ---

function rateReducer(state: RateState, action: RateAction): RateState {
  switch (action.type) {
    case 'LOAD_STATE':
      return { locations: action.payload.locations, rates: action.payload.rates, isLoaded: true };

    case 'ADD_LOCATION':
      return { ...state, locations: [...state.locations, action.payload] };

    case 'UPDATE_LOCATION':
      return {
        ...state,
        locations: state.locations.map((l) =>
          l.id === action.payload.locationId ? { ...l, ...action.payload.updates } : l
        ),
      };

    case 'DELETE_LOCATION':
      return { ...state, locations: state.locations.filter((l) => l.id !== action.payload.locationId) };

    case 'ADD_RATE':
      return { ...state, rates: [...state.rates, action.payload] };

    case 'UPDATE_RATE':
      return {
        ...state,
        rates: state.rates.map((r) =>
          r.id === action.payload.rateId ? { ...r, ...action.payload.updates } : r
        ),
      };

    case 'DEACTIVATE_RATE':
      return {
        ...state,
        rates: state.rates.map((r) =>
          r.id === action.payload.rateId ? { ...r, isActive: false } : r
        ),
      };

    case 'AUTO_END_RATE':
      return {
        ...state,
        rates: state.rates.map((r) =>
          r.id === action.payload.rateId
            ? { ...r, effectiveTo: action.payload.effectiveTo, isActive: false }
            : r
        ),
      };

    default:
      return state;
  }
}

// --- ID Generation ---

export function generateLocationId(): string {
  return `LOC-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

export function generateRateId(): string {
  return `RT-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

// --- Helpers ---

function dayBefore(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function rateMatchesKey(r: VendorRate, vendorCode: string, serviceCode: string, locationId?: string, originLocationId?: string, destinationLocationId?: string): boolean {
  if (r.vendorCode !== vendorCode || r.serviceCode !== serviceCode) return false;
  if (r.rateType === 'location') return r.locationId === locationId;
  return r.originLocationId === originLocationId && r.destinationLocationId === destinationLocationId;
}

// --- Context ---

interface RateContextValue {
  locations: Location[];
  rates: VendorRate[];
  isLoaded: boolean;
  addLocation: (location: Location) => void;
  updateLocation: (locationId: string, updates: Partial<Omit<Location, 'id'>>) => void;
  deleteLocation: (locationId: string) => void;
  addRate: (rate: VendorRate) => void;
  updateRate: (rateId: string, updates: Partial<Omit<VendorRate, 'id'>>) => void;
  deactivateRate: (rateId: string) => void;
  getLocationsGroupedByZone: () => Map<string, Location[]>;
  getRatesForVendor: (vendorCode: string) => VendorRate[];
  getRatesForService: (serviceCode: string) => VendorRate[];
  lookupRate: (vendorCode: string, serviceCode: string, locationId?: string, originLocationId?: string, destinationLocationId?: string, jobDate?: string) => VendorRate | null;
  getLocationById: (id: string) => Location | undefined;
  getLocationByName: (name: string) => Location | undefined;
}

const RateContext = createContext<RateContextValue | null>(null);

const STORAGE_KEY = 'tripmanager_rates';

// --- Provider ---

export function RateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(rateReducer, initialState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        dispatch({ type: 'LOAD_STATE', payload: { locations: parsed.locations ?? [], rates: parsed.rates ?? [] } });
      } else {
        dispatch({ type: 'LOAD_STATE', payload: { locations: seedLocations, rates: seedRates } });
      }
    } catch {
      dispatch({ type: 'LOAD_STATE', payload: { locations: seedLocations, rates: seedRates } });
    }
  }, []);

  // Persist to localStorage on state change
  useEffect(() => {
    if (state.isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ locations: state.locations, rates: state.rates }));
    }
  }, [state.locations, state.rates, state.isLoaded]);

  const addLocation = useCallback((location: Location) => dispatch({ type: 'ADD_LOCATION', payload: location }), []);
  const updateLocation = useCallback((locationId: string, updates: Partial<Omit<Location, 'id'>>) => dispatch({ type: 'UPDATE_LOCATION', payload: { locationId, updates } }), []);
  const deleteLocation = useCallback((locationId: string) => dispatch({ type: 'DELETE_LOCATION', payload: { locationId } }), []);

  const addRate = useCallback((rate: VendorRate) => {
    // Auto-end any existing active rate for the same vendor/service/route
    const existing = state.rates.find((r) =>
      r.isActive &&
      !r.effectiveTo &&
      rateMatchesKey(r, rate.vendorCode, rate.serviceCode, rate.locationId, rate.originLocationId, rate.destinationLocationId)
    );
    if (existing) {
      dispatch({ type: 'AUTO_END_RATE', payload: { rateId: existing.id, effectiveTo: dayBefore(rate.effectiveFrom) } });
    }
    dispatch({ type: 'ADD_RATE', payload: rate });
  }, [state.rates]);

  const updateRate = useCallback((rateId: string, updates: Partial<Omit<VendorRate, 'id'>>) => dispatch({ type: 'UPDATE_RATE', payload: { rateId, updates } }), []);
  const deactivateRate = useCallback((rateId: string) => dispatch({ type: 'DEACTIVATE_RATE', payload: { rateId } }), []);

  const getLocationsGroupedByZone = useCallback((): Map<string, Location[]> => {
    const map = new Map<string, Location[]>();
    for (const loc of state.locations) {
      const group = map.get(loc.zone) ?? [];
      group.push(loc);
      map.set(loc.zone, group);
    }
    return map;
  }, [state.locations]);

  const getRatesForVendor = useCallback((vendorCode: string): VendorRate[] => {
    return state.rates.filter((r) => r.vendorCode === vendorCode);
  }, [state.rates]);

  const getRatesForService = useCallback((serviceCode: string): VendorRate[] => {
    return state.rates.filter((r) => r.serviceCode === serviceCode);
  }, [state.rates]);

  const lookupRate = useCallback((
    vendorCode: string,
    serviceCode: string,
    locationId?: string,
    originLocationId?: string,
    destinationLocationId?: string,
    jobDate?: string,
  ): VendorRate | null => {
    const refDate = jobDate ?? new Date().toISOString().split('T')[0];
    const candidates = state.rates.filter((r) => {
      if (!rateMatchesKey(r, vendorCode, serviceCode, locationId, originLocationId, destinationLocationId)) return false;
      if (r.effectiveFrom > refDate) return false;
      if (r.effectiveTo && r.effectiveTo < refDate) return false;
      return true;
    });
    if (candidates.length === 0) return null;
    // Return the rate with the latest effectiveFrom
    return candidates.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
  }, [state.rates]);

  const getLocationById = useCallback((id: string): Location | undefined => {
    return state.locations.find((l) => l.id === id);
  }, [state.locations]);

  const getLocationByName = useCallback((name: string): Location | undefined => {
    return state.locations.find((l) => l.name === name);
  }, [state.locations]);

  const value: RateContextValue = {
    locations: state.locations,
    rates: state.rates,
    isLoaded: state.isLoaded,
    addLocation, updateLocation, deleteLocation,
    addRate, updateRate, deactivateRate,
    getLocationsGroupedByZone, getRatesForVendor, getRatesForService, lookupRate,
    getLocationById, getLocationByName,
  };

  return <RateContext.Provider value={value}>{children}</RateContext.Provider>;
}

// --- Hook ---

export function useRates(): RateContextValue {
  const ctx = useContext(RateContext);
  if (!ctx) throw new Error('useRates must be used within RateProvider');
  return ctx;
}
