import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { Zone } from './types';
import { seedZones } from './mockData';

// --- State ---

interface ZoneState {
  zones: Zone[];
  isLoaded: boolean;
}

const initialState: ZoneState = {
  zones: [],
  isLoaded: false,
};

// --- Actions ---

type ZoneAction =
  | { type: 'LOAD_STATE'; payload: Zone[] }
  | { type: 'ADD_ZONE'; payload: Zone }
  | { type: 'UPDATE_ZONE'; payload: { zoneId: string; updates: Partial<Omit<Zone, 'id'>> } }
  | { type: 'DELETE_ZONE'; payload: { zoneId: string } };

// --- Reducer ---

function zoneReducer(state: ZoneState, action: ZoneAction): ZoneState {
  switch (action.type) {
    case 'LOAD_STATE':
      return { zones: action.payload, isLoaded: true };
    case 'ADD_ZONE':
      return { ...state, zones: [...state.zones, action.payload] };
    case 'UPDATE_ZONE':
      return {
        ...state,
        zones: state.zones.map((z) =>
          z.id === action.payload.zoneId ? { ...z, ...action.payload.updates } : z
        ),
      };
    case 'DELETE_ZONE':
      return { ...state, zones: state.zones.filter((z) => z.id !== action.payload.zoneId) };
    default:
      return state;
  }
}

// --- ID Generation ---

export function generateZoneId(): string {
  return `ZON-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

// --- Context ---

interface ZoneContextValue {
  zones: Zone[];
  isLoaded: boolean;
  addZone: (zone: Zone) => void;
  updateZone: (zoneId: string, updates: Partial<Omit<Zone, 'id'>>) => void;
  deleteZone: (zoneId: string) => void;
  getZoneById: (id: string) => Zone | undefined;
  getAllZones: () => Zone[];
}

const ZoneContext = createContext<ZoneContextValue | null>(null);

const STORAGE_KEY = 'tripmanager_zones';
const SEED_VERSION = 'v1';
const VERSION_KEY = 'tripmanager_zones_version';

// --- Provider ---

export function ZoneProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(zoneReducer, initialState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedVersion = localStorage.getItem(VERSION_KEY);
      if (stored && storedVersion === SEED_VERSION) {
        dispatch({ type: 'LOAD_STATE', payload: JSON.parse(stored) });
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(VERSION_KEY, SEED_VERSION);
        dispatch({ type: 'LOAD_STATE', payload: seedZones });
      }
    } catch {
      localStorage.setItem(VERSION_KEY, SEED_VERSION);
      dispatch({ type: 'LOAD_STATE', payload: seedZones });
    }
  }, []);

  // Persist to localStorage on state change
  useEffect(() => {
    if (state.isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.zones));
    }
  }, [state.zones, state.isLoaded]);

  const addZone = useCallback((zone: Zone) => dispatch({ type: 'ADD_ZONE', payload: zone }), []);
  const updateZone = useCallback((zoneId: string, updates: Partial<Omit<Zone, 'id'>>) => dispatch({ type: 'UPDATE_ZONE', payload: { zoneId, updates } }), []);
  const deleteZone = useCallback((zoneId: string) => dispatch({ type: 'DELETE_ZONE', payload: { zoneId } }), []);

  const getZoneById = useCallback((id: string): Zone | undefined => {
    return state.zones.find((z) => z.id === id);
  }, [state.zones]);

  const getAllZones = useCallback((): Zone[] => {
    return state.zones;
  }, [state.zones]);

  const value: ZoneContextValue = {
    zones: state.zones,
    isLoaded: state.isLoaded,
    addZone, updateZone, deleteZone,
    getZoneById, getAllZones,
  };

  return <ZoneContext.Provider value={value}>{children}</ZoneContext.Provider>;
}

// --- Hook ---

export function useZones(): ZoneContextValue {
  const ctx = useContext(ZoneContext);
  if (!ctx) throw new Error('useZones must be used within ZoneProvider');
  return ctx;
}
