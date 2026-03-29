import { NavLink } from 'react-router-dom';
import { Ship } from 'lucide-react';
import { useVendorAuth } from '../context/VendorAuthContext';

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Navbar() {
  const { vendorName, logout } = useVendorAuth();

  return (
    <nav
      style={{
        height: 40,
        padding: '0 16px',
        background: '#111827',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Logo */}
      <NavLink
        to="/jobs"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginRight: 24,
          textDecoration: 'none',
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
            color: '#ffffff',
            fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif",
          }}
        >
          Teleport OS
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.35)',
            fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif",
          }}
        >
          Vendor
        </span>
      </NavLink>

      {/* Nav items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <NavLink
          to="/jobs"
          style={({ isActive }) => ({
            fontSize: 12,
            padding: '4px 10px',
            borderRadius: 4,
            color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
            background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
            fontWeight: isActive ? 600 : 400,
            textDecoration: 'none',
            transition: 'color 150ms, background 150ms',
            fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif",
          })}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            if (!el.classList.contains('active')) {
              el.style.color = 'rgba(255,255,255,0.8)';
              el.style.background = 'rgba(255,255,255,0.06)';
            }
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            if (!el.classList.contains('active')) {
              el.style.color = 'rgba(255,255,255,0.5)';
              el.style.background = 'transparent';
            }
          }}
        >
          My Jobs
        </NavLink>
      </div>

      {/* Right side: vendor info + logout */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.7)',
            fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif",
          }}
        >
          {vendorName}
        </span>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.7)',
              fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif",
              lineHeight: 1,
            }}
          >
            {getInitials(vendorName)}
          </span>
        </div>
        <button
          onClick={logout}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.35)',
            fontSize: 10,
            fontWeight: 500,
            cursor: 'pointer',
            padding: '2px 4px',
            fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif",
            transition: 'color 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
          }}
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
