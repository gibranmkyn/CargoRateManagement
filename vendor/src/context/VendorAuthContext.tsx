import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { vendors } from '../../../shared/mockData';

const STORAGE_KEY = 'vendor_auth';

interface VendorAuthContextValue {
  vendorCode: string | null;
  vendorName: string;
  login: (vendorCode: string) => void;
  logout: () => void;
}

const VendorAuthContext = createContext<VendorAuthContextValue | null>(null);

export function VendorAuthProvider({ children }: { children: ReactNode }) {
  const [vendorCode, setVendorCode] = useState<string | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      // Validate that the stored code still exists in our vendor list
      const exists = vendors.some((v) => v.code === stored);
      if (exists) setVendorCode(stored);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const vendorName =
    vendors.find((v) => v.code === vendorCode)?.name ?? '';

  function login(code: string) {
    localStorage.setItem(STORAGE_KEY, code);
    setVendorCode(code);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setVendorCode(null);
  }

  return (
    <VendorAuthContext.Provider value={{ vendorCode, vendorName, login, logout }}>
      {children}
    </VendorAuthContext.Provider>
  );
}

export function useVendorAuth(): VendorAuthContextValue {
  const ctx = useContext(VendorAuthContext);
  if (!ctx) throw new Error('useVendorAuth must be used within VendorAuthProvider');
  return ctx;
}
