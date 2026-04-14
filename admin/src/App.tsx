import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TripProvider } from '@shared/TripContext';
import { LocationProvider } from './context/LocationContext';
import { ToastProvider } from '@shared/Toast';
import Navbar from './components/layout/Navbar';
import TripsPage from './pages/TripsPage';
import CreateTripPage from './pages/CreateTripPage';
import JobDetailPage from './pages/JobDetailPage';
import MasterDataPage from './pages/MasterDataPage';
import JobsPage from './pages/JobsPage';
import EditTripPage from './pages/EditTripPage';

export default function App() {
  return (
    <BrowserRouter>
      <TripProvider>
        <LocationProvider>
          <ToastProvider>
            <div className="min-h-screen bg-[var(--color-surface-page)]">
              <Navbar />
              <Routes>
                <Route path="/trips" element={<TripsPage />} />
                <Route path="/create-trip" element={<CreateTripPage />} />
                <Route path="/trips/:tripId/edit" element={<EditTripPage />} />
                <Route path="/trips/:tripId/jobs/:jobId" element={<JobDetailPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/master-data" element={<MasterDataPage />} />
                <Route path="*" element={<Navigate to="/trips" replace />} />
              </Routes>
            </div>
          </ToastProvider>
        </LocationProvider>
      </TripProvider>
    </BrowserRouter>
  );
}
