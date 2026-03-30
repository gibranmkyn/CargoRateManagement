import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship } from 'lucide-react';
import { vendors } from '../../../shared/mockData';
import { useVendorAuth } from '../context/VendorAuthContext';

export default function LoginPage() {
  const { login } = useVendorAuth();
  const navigate = useNavigate();

  const [selectedVendor, setSelectedVendor] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!selectedVendor) {
      setError('Please select your company');
      return;
    }

    // Prototype: accept any non-empty access code
    if (!accessCode.trim()) {
      setError('Please enter an access code');
      return;
    }

    login(selectedVendor);
    navigate('/jobs');
  }

  const font = "'Instrument Sans', -apple-system, system-ui, sans-serif";

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 360,
          background: '#fff',
          borderRadius: 6,
          border: '1px solid #e5e7eb',
          padding: 20,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              background: '#152CFF',
              borderRadius: 5,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ship size={10} strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '-0.3px',
              color: '#111827',
              fontFamily: font,
            }}
          >
            Teleport OS
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: '#9ca3af',
              fontFamily: font,
            }}
          >
            Vendor
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 11,
            color: '#9ca3af',
            textAlign: 'center',
            marginBottom: 24,
            fontFamily: font,
          }}
        >
          Sign in to view your jobs
        </p>

        {/* Vendor selector */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: 'block',
              fontSize: 9,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#9ca3af',
              marginBottom: 4,
              fontFamily: font,
            }}
          >
            Select your company
          </label>
          <select
            value={selectedVendor}
            onChange={(e) => {
              setSelectedVendor(e.target.value);
              if (error) setError('');
            }}
            style={{
              width: '100%',
              fontSize: 12,
              padding: '6px 8px',
              borderRadius: 4,
              border: '1px solid #e5e7eb',
              background: '#fff',
              color: selectedVendor ? '#111827' : '#9ca3af',
              fontFamily: font,
              outline: 'none',
              appearance: 'none',
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              paddingRight: 24,
            }}
          >
            <option value="" disabled>
              Choose a vendor...
            </option>
            {vendors.map((v) => (
              <option key={v.code} value={v.code}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Access code */}
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              display: 'block',
              fontSize: 9,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#9ca3af',
              marginBottom: 4,
              fontFamily: font,
            }}
          >
            Access code
          </label>
          <input
            type="password"
            placeholder="Access code"
            value={accessCode}
            onChange={(e) => {
              setAccessCode(e.target.value);
              if (error) setError('');
            }}
            style={{
              width: '100%',
              fontSize: 12,
              padding: '6px 8px',
              borderRadius: 4,
              border: '1px solid #e5e7eb',
              background: '#fff',
              color: '#111827',
              fontFamily: font,
              outline: 'none',
            }}
          />
        </div>

        {/* Error message */}
        {error && (
          <p
            style={{
              fontSize: 10,
              color: '#dc2626',
              marginBottom: 10,
              fontFamily: font,
            }}
          >
            {error}
          </p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          style={{
            width: '100%',
            background: '#152CFF',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            padding: '8px 0',
            cursor: 'pointer',
            fontFamily: font,
            transition: 'background 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1024d9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#152CFF';
          }}
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
