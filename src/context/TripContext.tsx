import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { Trip, Job, JobStatus, TripTemplate, ActivityLogEntry, ProofDocument, Currency } from '../data/mockData';
import { seedTrips, seedTemplates } from '../data/mockData';

// --- State ---

interface TripState {
  trips: Trip[];
  templates: TripTemplate[];
  isLoaded: boolean;
}

const initialState: TripState = {
  trips: [],
  templates: [],
  isLoaded: false,
};

// --- Actions ---

type TripAction =
  | { type: 'LOAD_STATE'; payload: { trips: Trip[]; templates: TripTemplate[] } }
  | { type: 'ADD_TRIP'; payload: Trip }
  | { type: 'UPDATE_TRIP'; payload: { tripId: string; updates: Partial<Omit<Trip, 'id' | 'jobs'>> } }
  | { type: 'DELETE_TRIP'; payload: { tripId: string } }
  | { type: 'ADD_JOB'; payload: { tripId: string; job: Job } }
  | { type: 'UPDATE_JOB'; payload: { tripId: string; jobId: string; updates: Partial<Job> } }
  | { type: 'DELETE_JOB'; payload: { tripId: string; jobId: string } }
  | { type: 'UPDATE_JOB_STATUS'; payload: { tripId: string; jobId: string; status: JobStatus } }
  | { type: 'ADD_ACTIVITY_LOG'; payload: { tripId: string; jobId: string; entry: ActivityLogEntry } }
  | { type: 'ADD_PROOF_DOCUMENT'; payload: { tripId: string; jobId: string; doc: ProofDocument } }
  | { type: 'REMOVE_PROOF_DOCUMENT'; payload: { tripId: string; jobId: string; docId: string } }
  | { type: 'SAVE_TEMPLATE'; payload: TripTemplate }
  | { type: 'DELETE_TEMPLATE'; payload: { templateId: string } }
  | { type: 'SET_JOB_INVOICE'; payload: { tripId: string; jobId: string; invoiceAmount: { currency: Currency; amount: number } } }
  | { type: 'BULK_APPLY_AGREED_RATES'; payload: { tripId: string } };

// --- Reducer ---

function tripReducer(state: TripState, action: TripAction): TripState {
  switch (action.type) {
    case 'LOAD_STATE':
      return { trips: action.payload.trips, templates: action.payload.templates, isLoaded: true };

    case 'ADD_TRIP':
      return { ...state, trips: [action.payload, ...state.trips] };

    case 'UPDATE_TRIP':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId ? { ...t, ...action.payload.updates } : t
        ),
      };

    case 'DELETE_TRIP':
      return { ...state, trips: state.trips.filter((t) => t.id !== action.payload.tripId) };

    case 'ADD_JOB':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId ? { ...t, jobs: [...t.jobs, action.payload.job] } : t
        ),
      };

    case 'UPDATE_JOB':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId
            ? {
                ...t,
                jobs: t.jobs.map((j) =>
                  j.id === action.payload.jobId ? { ...j, ...action.payload.updates } : j
                ),
              }
            : t
        ),
      };

    case 'DELETE_JOB':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId
            ? { ...t, jobs: t.jobs.filter((j) => j.id !== action.payload.jobId) }
            : t
        ),
      };

    case 'UPDATE_JOB_STATUS':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId
            ? {
                ...t,
                jobs: t.jobs.map((j) =>
                  j.id === action.payload.jobId ? { ...j, status: action.payload.status } : j
                ),
              }
            : t
        ),
      };

    case 'ADD_ACTIVITY_LOG':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId
            ? {
                ...t,
                jobs: t.jobs.map((j) =>
                  j.id === action.payload.jobId
                    ? { ...j, activityLog: [...j.activityLog, action.payload.entry] }
                    : j
                ),
              }
            : t
        ),
      };

    case 'ADD_PROOF_DOCUMENT':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId
            ? {
                ...t,
                jobs: t.jobs.map((j) =>
                  j.id === action.payload.jobId
                    ? { ...j, proofDocuments: [...j.proofDocuments, action.payload.doc] }
                    : j
                ),
              }
            : t
        ),
      };

    case 'REMOVE_PROOF_DOCUMENT':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId
            ? {
                ...t,
                jobs: t.jobs.map((j) =>
                  j.id === action.payload.jobId
                    ? { ...j, proofDocuments: j.proofDocuments.filter((d) => d.id !== action.payload.docId) }
                    : j
                ),
              }
            : t
        ),
      };

    case 'SAVE_TEMPLATE':
      return { ...state, templates: [...state.templates, action.payload] };

    case 'DELETE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter((t) => t.id !== action.payload.templateId),
      };

    case 'SET_JOB_INVOICE':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId
            ? {
                ...t,
                jobs: t.jobs.map((j) =>
                  j.id === action.payload.jobId ? { ...j, invoiceAmount: action.payload.invoiceAmount } : j
                ),
              }
            : t
        ),
      };

    case 'BULK_APPLY_AGREED_RATES':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId
            ? {
                ...t,
                jobs: t.jobs.map((j) =>
                  j.agreedCost && !j.invoiceAmount ? { ...j, invoiceAmount: { ...j.agreedCost } } : j
                ),
              }
            : t
        ),
      };

    default:
      return state;
  }
}

// --- ID Generation ---

export function generateTripId(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return `TRIP${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(Math.floor(Math.random() * 1000), 3)}`;
}

export function generateJobId(tripId: string, existingJobs: { id: string }[]): string {
  const num = existingJobs.length + 1;
  return `${tripId}-J${String(num).padStart(2, '0')}`;
}

// --- Context ---

interface TripContextValue {
  trips: Trip[];
  templates: TripTemplate[];
  isLoaded: boolean;
  addTrip: (trip: Trip) => void;
  updateTrip: (tripId: string, updates: Partial<Omit<Trip, 'id' | 'jobs'>>) => void;
  deleteTrip: (tripId: string) => void;
  addJob: (tripId: string, job: Job) => void;
  updateJob: (tripId: string, jobId: string, updates: Partial<Job>) => void;
  deleteJob: (tripId: string, jobId: string) => void;
  updateJobStatus: (tripId: string, jobId: string, status: JobStatus) => void;
  addActivityLog: (tripId: string, jobId: string, entry: ActivityLogEntry) => void;
  addProofDocument: (tripId: string, jobId: string, doc: ProofDocument) => void;
  removeProofDocument: (tripId: string, jobId: string, docId: string) => void;
  saveTemplate: (template: TripTemplate) => void;
  deleteTemplate: (templateId: string) => void;
  setJobInvoice: (tripId: string, jobId: string, invoiceAmount: { currency: Currency; amount: number }) => void;
  bulkApplyAgreedRates: (tripId: string) => void;
}

const TripContext = createContext<TripContextValue | null>(null);

const STORAGE_KEY = 'tripmanager_state';

// --- Provider ---

export function TripProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tripReducer, initialState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migration: if old data has `services` (array) instead of `service` (singular), reset to seed
        const hasOldFormat = parsed.trips?.some((t: any) => t.jobs?.some((j: any) => Array.isArray(j.services)));
        if (hasOldFormat) {
          localStorage.removeItem(STORAGE_KEY);
          dispatch({ type: 'LOAD_STATE', payload: { trips: seedTrips, templates: seedTemplates } });
        } else {
          dispatch({ type: 'LOAD_STATE', payload: { trips: parsed.trips ?? [], templates: parsed.templates ?? [] } });
        }
      } else {
        dispatch({ type: 'LOAD_STATE', payload: { trips: seedTrips, templates: seedTemplates } });
      }
    } catch {
      dispatch({ type: 'LOAD_STATE', payload: { trips: seedTrips, templates: seedTemplates } });
    }
  }, []);

  // Persist to localStorage on state change
  useEffect(() => {
    if (state.isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ trips: state.trips, templates: state.templates }));
    }
  }, [state.trips, state.templates, state.isLoaded]);

  const addTrip = useCallback((trip: Trip) => dispatch({ type: 'ADD_TRIP', payload: trip }), []);
  const updateTrip = useCallback((tripId: string, updates: Partial<Omit<Trip, 'id' | 'jobs'>>) => dispatch({ type: 'UPDATE_TRIP', payload: { tripId, updates } }), []);
  const deleteTrip = useCallback((tripId: string) => dispatch({ type: 'DELETE_TRIP', payload: { tripId } }), []);
  const addJob = useCallback((tripId: string, job: Job) => dispatch({ type: 'ADD_JOB', payload: { tripId, job } }), []);
  const updateJob = useCallback((tripId: string, jobId: string, updates: Partial<Job>) => dispatch({ type: 'UPDATE_JOB', payload: { tripId, jobId, updates } }), []);
  const deleteJob = useCallback((tripId: string, jobId: string) => dispatch({ type: 'DELETE_JOB', payload: { tripId, jobId } }), []);
  const updateJobStatus = useCallback((tripId: string, jobId: string, status: JobStatus) => dispatch({ type: 'UPDATE_JOB_STATUS', payload: { tripId, jobId, status } }), []);
  const addActivityLog = useCallback((tripId: string, jobId: string, entry: ActivityLogEntry) => dispatch({ type: 'ADD_ACTIVITY_LOG', payload: { tripId, jobId, entry } }), []);
  const addProofDocument = useCallback((tripId: string, jobId: string, doc: ProofDocument) => dispatch({ type: 'ADD_PROOF_DOCUMENT', payload: { tripId, jobId, doc } }), []);
  const removeProofDocument = useCallback((tripId: string, jobId: string, docId: string) => dispatch({ type: 'REMOVE_PROOF_DOCUMENT', payload: { tripId, jobId, docId } }), []);
  const saveTemplate = useCallback((template: TripTemplate) => dispatch({ type: 'SAVE_TEMPLATE', payload: template }), []);
  const deleteTemplate = useCallback((templateId: string) => dispatch({ type: 'DELETE_TEMPLATE', payload: { templateId } }), []);
  const setJobInvoice = useCallback((tripId: string, jobId: string, invoiceAmount: { currency: Currency; amount: number }) => dispatch({ type: 'SET_JOB_INVOICE', payload: { tripId, jobId, invoiceAmount } }), []);
  const bulkApplyAgreedRates = useCallback((tripId: string) => dispatch({ type: 'BULK_APPLY_AGREED_RATES', payload: { tripId } }), []);

  const value: TripContextValue = {
    trips: state.trips,
    templates: state.templates,
    isLoaded: state.isLoaded,
    addTrip, updateTrip, deleteTrip,
    addJob, updateJob, deleteJob, updateJobStatus,
    addActivityLog, addProofDocument, removeProofDocument,
    saveTemplate, deleteTemplate,
    setJobInvoice, bulkApplyAgreedRates,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

// --- Hook ---

export function useTrips(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrips must be used within TripProvider');
  return ctx;
}
