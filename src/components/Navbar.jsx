import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { currentStudent } from '../data/mockData';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/laundry', label: 'Laundry' },
    { to: '/rooms', label: 'Rooms' },
    { to: '/library', label: 'Library' },
    { to: '/facilities', label: 'Facilities' },
    { to: '/bookings', label: 'My Bookings' },
    { to: '/notices', label: 'Notices' },
  ];

  return (
    <header className="site-navbar">
      <div className="navbar-inner">
        {/* Left: Wordmark "CampusOne" with small "Student project" badge */}
        <Link to="/" className="brand-link" onClick={closeMenu}>
          <span className="brand-wordmark">CampusOne</span>
          <span className="brand-student-badge">Student project</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav aria-label="Primary Navigation">
          <ul className="desktop-nav-menu">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `nav-item-link ${isActive ? 'active' : ''}`
                  }
                  end={link.to === '/'}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right CTA Button: Red pill linking to /rooms */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/rooms" className="navbar-cta-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Book a Room</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}
        onClick={closeMenu}
      >
        <div
          className="mobile-nav-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mobile-nav-header">
            <div>
              <span className="brand-wordmark">CampusOne</span>
              <div style={{ marginTop: '4px' }}>
                <span className="brand-student-badge">Student project</span>
              </div>
            </div>
            <button
              type="button"
              className="mobile-nav-close"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <ul className="mobile-nav-links">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `nav-item-link ${isActive ? 'active' : ''}`
                  }
                  end={link.to === '/'}
                  onClick={closeMenu}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--navy-900)' }}>
              {currentStudent.name}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              {currentStudent.id} • {currentStudent.hostel}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
