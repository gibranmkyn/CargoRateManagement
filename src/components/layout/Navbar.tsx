import { NavLink } from 'react-router-dom';
import { Ship } from 'lucide-react';

const navItems = [
  { to: '/trips', label: 'Delivery Orders' },
  { to: '/rates', label: 'Rates' },
  { to: '/billing', label: 'Billing' },
  { to: '/master-data', label: 'Master Data' },
];

export default function Navbar() {
  return (
    <nav
      style={{
        height: 40,
        padding: '0 16px',
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Logo */}
      <NavLink
        to="/trips"
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
            background: '#0D9488',
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
            fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif",
          }}
        >
          Teleport OS
        </span>
      </NavLink>

      {/* Nav items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 4,
              color: isActive ? '#0D9488' : '#9ca3af',
              background: isActive ? 'rgba(13,148,136,0.06)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              textDecoration: 'none',
              transition: 'color 150ms, background 150ms',
              fontFamily: "'Instrument Sans', -apple-system, system-ui, sans-serif",
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              if (!el.classList.contains('active')) {
                el.style.color = '#374151';
                el.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              if (!el.classList.contains('active')) {
                el.style.color = '#9ca3af';
                el.style.background = 'transparent';
              }
            }}
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* Right side spacer */}
      <div style={{ marginLeft: 'auto' }} />
    </nav>
  );
}
