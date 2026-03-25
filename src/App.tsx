import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TripProvider } from './context/TripContext';
import { RateProvider } from './context/RateContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/layout/Navbar';
import TripsPage from './pages/TripsPage';
import CreateTripPage from './pages/CreateTripPage';
import JobDetailPage from './pages/JobDetailPage';
import RatesPage from './pages/RatesPage';
import BillingPage from './pages/BillingPage';
import MasterDataPage from './pages/MasterDataPage';

export default function App() {
  return (
    <BrowserRouter>
      <TripProvider>
        <RateProvider>
          <ToastProvider>
            <div className="min-h-screen bg-[var(--color-surface-page)]">
              <Navbar />
              <Routes>
                <Route path="/trips" element={<TripsPage />} />
                <Route path="/create-trip" element={<CreateTripPage />} />
                <Route path="/trips/:tripId/jobs/:jobId" element={<JobDetailPage />} />
                <Route path="/rates" element={<RatesPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/master-data" element={<MasterDataPage />} />
                <Route path="*" element={<Navigate to="/trips" replace />} />
              </Routes>
            </div>
          </ToastProvider>
        </RateProvider>
      </TripProvider>
    </BrowserRouter>
  );
}
