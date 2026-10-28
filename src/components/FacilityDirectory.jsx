import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { facilities } from '../data/mockData';
import { getFacilityStatus } from '../utils/facilityUtils';
import { countFreeSeats } from '../lib/libraryLogic';
import { getBookableSeatsCount } from '../data/libraryData';

const WEEK_DAYS = [
  { label: 'M', name: 'Monday', dayIndex: 1 },
  { label: 'T', name: 'Tuesday', dayIndex: 2 },
  { label: 'W', name: 'Wednesday', dayIndex: 3 },
  { label: 'T', name: 'Thursday', dayIndex: 4 },
  { label: 'F', name: 'Friday', dayIndex: 5 },
  { label: 'S', name: 'Saturday', dayIndex: 6 },
  { label: 'S', name: 'Sunday', dayIndex: 0 },
];

export default function FacilityDirectory({ bookings = [], libraryNow = () => Date.now() }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'OPEN' | 'CLOSED'

  const currentNow = libraryNow();
  const now = new Date(currentNow);

  // Compute status for all facilities
  const facilitiesWithStatus = useMemo(() => {
    return facilities.map((f) => {
      const status = getFacilityStatus(f, now);
      return { ...f, status };
    });
  }, [now]);

  // Filter facilities
  const filteredFacilities = useMemo(() => {
    return facilitiesWithStatus.filter((facility) => {
      if (filterMode === 'OPEN' && !facility.status.isOpen) return false;
      if (filterMode === 'CLOSED' && facility.status.isOpen) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        facility.name.toLowerCase().includes(q) ||
        facility.location.toLowerCase().includes(q) ||
        facility.description.toLowerCase().includes(q)
      );
    });
  }, [facilitiesWithStatus, filterMode, searchQuery]);

  return (
    <div className="facilities-directory-page">
      {/* Header with Bennett-style red eyebrow */}
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div className="section-eyebrow">Campus Life</div>
        <h1 className="page-title">Campus Facilities & Timings</h1>
        <p className="page-subtitle">
          Operating schedules, real-time access status, and weekly amenities across campus.
        </p>
      </div>

      {/* Search and Filter Chips (Pills with Navy active fill) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '36px' }}>
        <div className="search-input-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="search"
            className="search-input"
            placeholder="Search by facility name, complex, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search campus facilities"
          />
        </div>

        <div className="filter-chips-row" role="radiogroup" aria-label="Filter facilities by status">
          <button
            type="button"
            className={`filter-chip ${filterMode === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterMode('ALL')}
            aria-checked={filterMode === 'ALL'}
            role="radio"
          >
            All Facilities ({facilitiesWithStatus.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${filterMode === 'OPEN' ? 'active' : ''}`}
            onClick={() => setFilterMode('OPEN')}
            aria-checked={filterMode === 'OPEN'}
            role="radio"
          >
            Open now ({facilitiesWithStatus.filter((f) => f.status.isOpen).length})
          </button>
          <button
            type="button"
            className={`filter-chip ${filterMode === 'CLOSED' ? 'active' : ''}`}
            onClick={() => setFilterMode('CLOSED')}
            aria-checked={filterMode === 'CLOSED'}
            role="radio"
          >
            Closed ({facilitiesWithStatus.filter((f) => !f.status.isOpen).length})
          </button>
        </div>
      </div>

      {/* Facilities Cards Grid */}
      {filteredFacilities.length === 0 ? (
        <div className="empty-state-clean">
          <h3>No facilities found</h3>
          <p>No campus facilities matched your current search query.</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSearchQuery('');
              setFilterMode('ALL');
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="facilities-grid">
          {filteredFacilities.map((facility, idx) => {
            const { status } = facility;
            const themeClass = `theme-${idx % 5}`; // Rotates navy-700, blue-500, red-700, maroon-900, blue-400

            // Live free seats calculation for libraries
            const freeSeatsText = facility.libraryId
              ? `${countFreeSeats(facility.libraryId, currentNow, currentNow + 3600 * 1000, bookings, currentNow)} of ${getBookableSeatsCount(facility.libraryId)} seats free`
              : null;

            return (
              <article key={facility.id} className="facility-card-item">
                {/* Coloured Header Band */}
                <div className={`facility-header-band ${themeClass}`}>
                  <h2 className="facility-band-name">{facility.name}</h2>
                  <div className="facility-band-hours">
                    {facility.alwaysOpen
                      ? 'Open 24 hours'
                      : `${facility.hours.open} – ${facility.hours.close} (${facility.daysDisplay})`}
                  </div>
                </div>

                {/* White Card Body */}
                <div className="facility-body">
                  <div>
                    <div className="facility-location-tag">{facility.location}</div>
                    <p className="facility-desc-text">{facility.description}</p>
                  </div>

                  <div>
                    {/* Status Strip: Open/Closed badge + "Open 24 hours" / "Closes at" / "Opens tomorrow at" */}
                    <div className="facility-status-strip">
                      <span className={`facility-status-badge ${status.isOpen ? 'open' : 'closed'}`}>
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: status.isOpen ? 'var(--green-600)' : 'var(--red-600)',
                            display: 'inline-block',
                          }}
                        ></span>
                        {status.badge}
                      </span>
                      <span className="facility-status-headline">{status.statusLine}</span>
                    </div>

                    {/* 7 Day Dots: open days blue-600, closed days grey, today ringed in red */}
                    <div className="seven-days-row" aria-label="Operating days">
                      {WEEK_DAYS.map((day) => {
                        const isOpen = facility.alwaysOpen || facility.openDays.includes(day.dayIndex);
                        const isToday = day.dayIndex === status.todayDayIndex;

                        return (
                          <div
                            key={day.name}
                            className={`day-circle-dot ${isOpen ? 'open' : 'closed'} ${isToday ? 'today-ring' : ''}`}
                            title={`${day.name}: ${isOpen ? 'Open' : 'Closed'}${isToday ? ' (Today)' : ''}`}
                          >
                            {day.label}
                          </div>
                        );
                      })}
                    </div>

                    {/* Library Card "Book a seat" button and live "X of Y seats free" line */}
                    {facility.libraryId && (
                      <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--blue-600)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--green-600)' }}></span>
                          <span>{freeSeatsText}</span>
                        </div>
                        <Link
                          to="/library"
                          className="btn-primary"
                          style={{ height: '38px', padding: '0 16px', fontSize: '0.85rem', width: '100%' }}
                        >
                          Book a seat
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
