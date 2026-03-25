import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TripProvider } from './context/TripContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/layout/Navbar';
import TripsPage from './pages/TripsPage';
import CreateTripPage from './pages/CreateTripPage';
import JobDetailPage from './pages/JobDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <TripProvider>
        <ToastProvider>
          <div className="min-h-screen bg-[var(--color-surface-page)]">
            <Navbar />
            <Routes>
              <Route path="/trips" element={<TripsPage />} />
              <Route path="/create-trip" element={<CreateTripPage />} />
              <Route path="/create-trip-kim" element={<CreateTripPage />} />
              <Route path="/trips/:tripId/jobs/:jobId" element={<JobDetailPage />} />
              <Route path="*" element={<Navigate to="/trips" replace />} />
            </Routes>
          </div>
        </ToastProvider>
      </TripProvider>
    </BrowserRouter>
  );
}
