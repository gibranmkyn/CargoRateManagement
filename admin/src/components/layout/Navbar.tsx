import { NavLink } from 'react-router-dom';
import { Ship } from 'lucide-react';

const navItems = [
  { to: '/trips', label: 'Trips' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/master-data', label: 'Master Data' },
];

export default function Navbar() {
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
          Admin
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
            {label}
          </NavLink>
        ))}
      </div>

      {/* Right side spacer */}
      <div style={{ marginLeft: 'auto' }} />
    </nav>
  );
}
