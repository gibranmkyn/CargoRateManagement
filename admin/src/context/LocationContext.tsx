import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { Location } from '@shared/mockData';
import { seedLocations } from '@shared/mockData';

// --- State ---

interface LocationState {
  locations: Location[];
  isLoaded: boolean;
}

const initialState: LocationState = {
  locations: [],
  isLoaded: false,
};

// --- Actions ---

type LocationAction =
  | { type: 'LOAD_STATE'; payload: Location[] }
  | { type: 'ADD_LOCATION'; payload: Location }
  | { type: 'UPDATE_LOCATION'; payload: { locationId: string; updates: Partial<Omit<Location, 'id'>> } }
  | { type: 'DELETE_LOCATION'; payload: { locationId: string } };

// --- Reducer ---

function locationReducer(state: LocationState, action: LocationAction): LocationState {
  switch (action.type) {
    case 'LOAD_STATE':
      return { locations: action.payload, isLoaded: true };
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
    default:
      return state;
  }
}

// --- ID Generation ---

export function generateLocationId(): string {
  return `LOC-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

// --- Context ---

interface LocationContextValue {
  locations: Location[];
  isLoaded: boolean;
  addLocation: (location: Location) => void;
  updateLocation: (locationId: string, updates: Partial<Omit<Location, 'id'>>) => void;
  deleteLocation: (locationId: string) => void;
  getLocationsGroupedByZone: () => Map<string, Location[]>;
  getLocationById: (id: string) => Location | undefined;
  getLocationByName: (name: string) => Location | undefined;
}

const LocationContext = createContext<LocationContextValue | null>(null);

const STORAGE_KEY = 'tripmanager_locations';
const SEED_VERSION = 'v1';

// --- Provider ---

export function LocationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(locationReducer, initialState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedVersion = localStorage.getItem(STORAGE_KEY + '_version');
      if (stored && storedVersion === SEED_VERSION) {
        dispatch({ type: 'LOAD_STATE', payload: JSON.parse(stored) });
      } else {
        // Migrate: try reading locations from old tripmanager_rates key
        const oldRates = localStorage.getItem('tripmanager_rates');
        if (oldRates) {
          try {
            const parsed = JSON.parse(oldRates);
            if (Array.isArray(parsed.locations) && parsed.locations.length > 0) {
              localStorage.setItem(STORAGE_KEY + '_version', SEED_VERSION);
              dispatch({ type: 'LOAD_STATE', payload: parsed.locations });
              return;
            }
          } catch { /* fall through to seed */ }
        }
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY + '_version', SEED_VERSION);
        dispatch({ type: 'LOAD_STATE', payload: seedLocations });
      }
    } catch {
      localStorage.setItem(STORAGE_KEY + '_version', SEED_VERSION);
      dispatch({ type: 'LOAD_STATE', payload: seedLocations });
    }
  }, []);

  // Persist to localStorage on state change
  useEffect(() => {
    if (state.isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.locations));
    }
  }, [state.locations, state.isLoaded]);

  const addLocation = useCallback((location: Location) => dispatch({ type: 'ADD_LOCATION', payload: location }), []);
  const updateLocation = useCallback((locationId: string, updates: Partial<Omit<Location, 'id'>>) => dispatch({ type: 'UPDATE_LOCATION', payload: { locationId, updates } }), []);
  const deleteLocation = useCallback((locationId: string) => dispatch({ type: 'DELETE_LOCATION', payload: { locationId } }), []);

  const getLocationsGroupedByZone = useCallback((): Map<string, Location[]> => {
    const map = new Map<string, Location[]>();
    for (const loc of state.locations) {
      const group = map.get(loc.zone) ?? [];
      group.push(loc);
      map.set(loc.zone, group);
    }
    return map;
  }, [state.locations]);

  const getLocationById = useCallback((id: string): Location | undefined => {
    return state.locations.find((l) => l.id === id);
  }, [state.locations]);

  const getLocationByName = useCallback((name: string): Location | undefined => {
    return state.locations.find((l) => l.name === name);
  }, [state.locations]);

  const value: LocationContextValue = {
    locations: state.locations,
    isLoaded: state.isLoaded,
    addLocation, updateLocation, deleteLocation,
    getLocationsGroupedByZone, getLocationById, getLocationByName,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

// --- Hook ---

export function useLocations(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocations must be used within LocationProvider');
  return ctx;
}
