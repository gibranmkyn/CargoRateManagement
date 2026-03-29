import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TripProvider } from '../../shared/TripContext';
import { ToastProvider } from '../../shared/Toast';
import { VendorAuthProvider, useVendorAuth } from './context/VendorAuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import MyJobsPage from './pages/MyJobsPage';
import JobDetailPage from './pages/JobDetailPage';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { vendorCode } = useVendorAuth();

  if (!vendorCode) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

function AppShell() {
  return (
    <div className="min-h-screen" style={{ background: '#f3f4f6' }}>
      <Navbar />
      <Routes>
        <Route path="/jobs" element={<MyJobsPage />} />
        <Route path="/jobs/:tripId/:jobId" element={<JobDetailPage />} />
        <Route path="*" element={<Navigate to="/jobs" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <VendorAuthProvider>
        <TripProvider>
          <ToastProvider>
            <AuthGate>
              <AppShell />
            </AuthGate>
          </ToastProvider>
        </TripProvider>
      </VendorAuthProvider>
    </BrowserRouter>
  );
}
