import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { Trip, Job, JobStatus, TripTemplate, ActivityLogEntry, ProofDocument, Currency, FeeLineItem } from './types';
// ProofStatus import removed — unified status lifecycle (TODO-020)
import { seedTrips, seedTemplates, calcFeeAmount } from './mockData';

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
  | { type: 'BULK_APPLY_AGREED_RATES'; payload: { tripId: string } }
  | { type: 'ADD_FEE'; payload: { tripId: string; jobId: string; fee: FeeLineItem } }
  | { type: 'REMOVE_FEE'; payload: { tripId: string; jobId: string; feeId: string } }
  | { type: 'UPDATE_FEE_QTY'; payload: { tripId: string; jobId: string; feeId: string; quantity: number } }
  | { type: 'UPDATE_JOB_QTY'; payload: { tripId: string; jobId: string; jobBags?: number; jobWeight?: number; jobVolume?: number } }
  | { type: 'TOGGLE_FEE'; payload: { tripId: string; jobId: string; feeId: string } }
  | { type: 'START_JOB'; payload: { tripId: string; jobId: string } }
  | { type: 'VERIFY_JOB'; payload: { tripId: string; jobId: string } }
  | { type: 'CANCEL_JOB'; payload: { tripId: string; jobId: string; cancelReason: string } }
  | { type: 'CANCEL_AND_REPLACE'; payload: { tripId: string; jobId: string; cancelReason: string; newJob: Job } }
  | { type: 'CREATE_FOLLOWUP'; payload: { tripId: string; jobId: string; newJob: Job } }
  | { type: 'SET_COMPLETION_REMARK'; payload: { tripId: string; jobId: string; remark: string } };

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
                    ? {
                        ...j,
                        proofDocuments: [...j.proofDocuments, action.payload.doc],
                        // Auto-transition to Completed when proof is uploaded (even from Pending, skipping In Progress)
                        status: (j.status === 'Pending' || j.status === 'In Progress') ? 'Completed' as const : j.status,
                      }
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

    case 'ADD_FEE':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId
            ? { ...t, jobs: t.jobs.map((j) => j.id === action.payload.jobId ? { ...j, fees: [...(j.fees ?? []), action.payload.fee] } : j) }
            : t
        ),
      };

    case 'REMOVE_FEE':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId
            ? { ...t, jobs: t.jobs.map((j) => j.id === action.payload.jobId ? { ...j, fees: (j.fees ?? []).filter((f) => f.id !== action.payload.feeId) } : j) }
            : t
        ),
      };

    case 'UPDATE_FEE_QTY': {
      const { tripId, jobId, feeId, quantity } = action.payload;
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === tripId
            ? { ...t, jobs: t.jobs.map((j) => j.id === jobId ? {
                ...j,
                fees: (j.fees ?? []).map((f) => f.id === feeId ? { ...f, quantity, amount: calcFeeAmount(f.rate, f.unit, quantity) } : f),
              } : j) }
            : t
        ),
      };
    }

    case 'UPDATE_JOB_QTY': {
      const { tripId, jobId, ...qtys } = action.payload;
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === tripId
            ? { ...t, jobs: t.jobs.map((j) => j.id === jobId ? { ...j, ...qtys } : j) }
            : t
        ),
      };
    }

    case 'TOGGLE_FEE': {
      const { tripId, jobId, feeId } = action.payload;
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === tripId
            ? { ...t, jobs: t.jobs.map((j) => j.id === jobId ? {
                ...j,
                fees: (j.fees ?? []).map((f) => f.id === feeId ? { ...f, active: !f.active } : f),
              } : j) }
            : t
        ),
      };
    }

    case 'START_JOB':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId
            ? { ...t, jobs: t.jobs.map((j) => j.id === action.payload.jobId && j.status === 'Pending' ? { ...j, status: 'In Progress' as const } : j) }
            : t
        ),
      };

    case 'VERIFY_JOB':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId
            ? { ...t, jobs: t.jobs.map((j) => j.id === action.payload.jobId ? { ...j, status: 'Verified' as const } : j) }
            : t
        ),
      };

    case 'CANCEL_JOB': {
      const { tripId, jobId, cancelReason } = action.payload;
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === tripId
            ? { ...t, jobs: t.jobs.map((j) => j.id === jobId ? {
                ...j,
                status: 'Cancelled' as const,
                cancelReason,
                activityLog: [...j.activityLog, { id: `log-${Date.now()}`, timestamp: now, action: `Cancelled`, user: 'Ops Admin', details: cancelReason }],
              } : j) }
            : t
        ),
      };
    }

    case 'CANCEL_AND_REPLACE': {
      const { tripId, jobId, cancelReason, newJob } = action.payload;
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === tripId
            ? {
                ...t,
                jobs: [
                  ...t.jobs.map((j) => j.id === jobId ? {
                    ...j,
                    status: 'Cancelled' as const,
                    cancelReason,
                    replacedByJobId: newJob.id,
                    activityLog: [...j.activityLog, { id: `log-${Date.now()}`, timestamp: now, action: `Cancelled — replaced by ${newJob.id} (${newJob.vendor.name})`, user: 'Ops Admin', details: cancelReason }],
                  } : j),
                  newJob,
                ],
              }
            : t
        ),
      };
    }

    case 'CREATE_FOLLOWUP': {
      const { tripId, jobId, newJob } = action.payload;
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === tripId
            ? {
                ...t,
                jobs: [
                  ...t.jobs.map((j) => j.id === jobId ? {
                    ...j,
                    replacedByJobId: newJob.id,
                    activityLog: [...j.activityLog, { id: `log-${Date.now()}`, timestamp: now, action: `Follow-up created — ${newJob.id}`, user: 'Ops Admin' }],
                  } : j),
                  newJob,
                ],
              }
            : t
        ),
      };
    }

    case 'SET_COMPLETION_REMARK': {
      const { tripId, jobId, remark } = action.payload;
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === tripId
            ? { ...t, jobs: t.jobs.map((j) => j.id === jobId ? { ...j, completionRemark: remark } : j) }
            : t
        ),
      };
    }

    default:
      return state;
  }
}

// --- ID Generation ---

export function generateTripId(): string {
  const seq = Math.floor(Math.random() * 90000) + 10000; // 10000-99999 to avoid seed collisions
  return `T${String(seq).padStart(5, '0')}`;
}

export function generateJobId(tripId: string, existingJobs: { id: string }[]): string {
  const num = existingJobs.length + 1;
  return `${tripId}-${String(num).padStart(2, '0')}`;
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
  addFee: (tripId: string, jobId: string, fee: FeeLineItem) => void;
  removeFee: (tripId: string, jobId: string, feeId: string) => void;
  updateFeeQty: (tripId: string, jobId: string, feeId: string, quantity: number) => void;
  toggleFee: (tripId: string, jobId: string, feeId: string) => void;
  updateJobQty: (tripId: string, jobId: string, qtys: { jobBags?: number; jobWeight?: number; jobVolume?: number }) => void;
  startJob: (tripId: string, jobId: string) => void;
  verifyJob: (tripId: string, jobId: string) => void;
  cancelJob: (tripId: string, jobId: string, cancelReason: string) => void;
  cancelAndReplace: (tripId: string, jobId: string, cancelReason: string, newJob: Job) => void;
  createFollowup: (tripId: string, jobId: string, newJob: Job) => void;
  setCompletionRemark: (tripId: string, jobId: string, remark: string) => void;
}

const TripContext = createContext<TripContextValue | null>(null);

const STORAGE_KEY = 'tripmanager_state';

// --- Provider ---

export function TripProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tripReducer, initialState);

  // Hydrate from localStorage on mount
  // Version key: bump this to force reseed when seed data changes
  const SEED_VERSION = 'v14-expanded-seed-data';

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedVersion = localStorage.getItem(STORAGE_KEY + '_version');
      if (stored && storedVersion === SEED_VERSION) {
        const parsed = JSON.parse(stored);
        dispatch({ type: 'LOAD_STATE', payload: { trips: parsed.trips ?? [], templates: parsed.templates ?? [] } });
      } else {
        // First load or version mismatch — reseed
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY + '_version', SEED_VERSION);
        dispatch({ type: 'LOAD_STATE', payload: { trips: seedTrips, templates: seedTemplates } });
      }
    } catch {
      localStorage.setItem(STORAGE_KEY + '_version', SEED_VERSION);
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
  const addFee = useCallback((tripId: string, jobId: string, fee: FeeLineItem) => dispatch({ type: 'ADD_FEE', payload: { tripId, jobId, fee } }), []);
  const removeFee = useCallback((tripId: string, jobId: string, feeId: string) => dispatch({ type: 'REMOVE_FEE', payload: { tripId, jobId, feeId } }), []);
  const updateFeeQty = useCallback((tripId: string, jobId: string, feeId: string, quantity: number) => dispatch({ type: 'UPDATE_FEE_QTY', payload: { tripId, jobId, feeId, quantity } }), []);
  const toggleFee = useCallback((tripId: string, jobId: string, feeId: string) => dispatch({ type: 'TOGGLE_FEE', payload: { tripId, jobId, feeId } }), []);
  const updateJobQty = useCallback((tripId: string, jobId: string, qtys: { jobBags?: number; jobWeight?: number; jobVolume?: number }) => dispatch({ type: 'UPDATE_JOB_QTY', payload: { tripId, jobId, ...qtys } }), []);
  const startJob = useCallback((tripId: string, jobId: string) => dispatch({ type: 'START_JOB', payload: { tripId, jobId } }), []);
  const verifyJob = useCallback((tripId: string, jobId: string) => dispatch({ type: 'VERIFY_JOB', payload: { tripId, jobId } }), []);
  const cancelJob = useCallback((tripId: string, jobId: string, cancelReason: string) => dispatch({ type: 'CANCEL_JOB', payload: { tripId, jobId, cancelReason } }), []);
  const cancelAndReplace = useCallback((tripId: string, jobId: string, cancelReason: string, newJob: Job) => dispatch({ type: 'CANCEL_AND_REPLACE', payload: { tripId, jobId, cancelReason, newJob } }), []);
  const createFollowup = useCallback((tripId: string, jobId: string, newJob: Job) => dispatch({ type: 'CREATE_FOLLOWUP', payload: { tripId, jobId, newJob } }), []);
  const setCompletionRemark = useCallback((tripId: string, jobId: string, remark: string) => dispatch({ type: 'SET_COMPLETION_REMARK', payload: { tripId, jobId, remark } }), []);

  const value: TripContextValue = {
    trips: state.trips,
    templates: state.templates,
    isLoaded: state.isLoaded,
    addTrip, updateTrip, deleteTrip,
    addJob, updateJob, deleteJob, updateJobStatus,
    addActivityLog, addProofDocument, removeProofDocument,
    saveTemplate, deleteTemplate,
    setJobInvoice, bulkApplyAgreedRates,
    addFee, removeFee, updateFeeQty, toggleFee, updateJobQty,
    startJob, verifyJob,
    cancelJob, cancelAndReplace, createFollowup, setCompletionRemark,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

// --- Hook ---

export function useTrips(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrips must be used within TripProvider');
  return ctx;
}
