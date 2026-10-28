import { useState, useMemo, useEffect } from 'react';
import { currentStudent } from '../data/mockData';
import {
  LIBRARIES,
  getLibrarySeats,
  getBookableSeatsCount,
  generateSeats,
} from '../data/libraryData';
import {
  getEffectiveStatus,
  isBookingBlocking,
  getSeatState,
  countFreeSeats,
  isSeatBlocked,
  formatStandardDate,
  formatTimeHM,
  formatBookingTimeRange,
  formatBookingFullRange,
  getBookingLiveStatus,
  MIN_HOURS,
  MAX_HOURS,
} from '../lib/libraryLogic';

export default function LibraryBooking({
  bookings = [],
  onAddBooking,
  onCancelBooking,
  handleScan,
  libraryNow = () => Date.now(),
  demoOffsetMs = 0,
  setDemoOffsetMs = () => {},
}) {
  // Timer tick for live recalculations (30s interval for seat maps, 1s for active countdowns)
  const [tick, setTick] = useState(0);

  const libraryBookings = useMemo(() => {
    return bookings.filter((b) => b.type === 'library');
  }, [bookings]);

  // Current effective student active booking
  const nowMs = libraryNow();
  const myActiveBooking = useMemo(() => {
    return libraryBookings.find(
      (b) => b.ownerId === currentStudent.id && isBookingBlocking(b, nowMs)
    );
  }, [libraryBookings, nowMs]);

  // Set interval: 1s if an active booking exists, 30s otherwise
  useEffect(() => {
    const intervalMs = myActiveBooking ? 1000 : 30000;
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [myActiveBooking]);

  const [selectedLibId, setSelectedLibId] = useState('LRC');
  const [startOption, setStartOption] = useState('now'); // 'now' or epoch ms string
  const [durationHours, setDurationHours] = useState(2);
  const [selectedSeatId, setSelectedSeatId] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    window: false,
    power: false,
    silent: false,
  });

  const [confirmError, setConfirmError] = useState('');
  const [confirmSuccess, setConfirmSuccess] = useState('');
  const [scanResult, setScanResult] = useState(null);

  const currentNow = libraryNow();
  const selectedLib = useMemo(() => {
    return LIBRARIES.find((l) => l.id === selectedLibId) || LIBRARIES[0];
  }, [selectedLibId]);

  // Generate today's half-hour slots for Start Time dropdown
  const startTimeOptions = useMemo(() => {
    const nowDate = new Date(currentNow);
    const options = [{ value: 'now', label: `Start now (${formatTimeHM(currentNow)})` }];

    // Start from today 00:00 to 23:30
    const startOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0);

    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const slotDate = new Date(startOfToday.getTime() + (h * 60 + m) * 60 * 1000);
        const slotTs = slotDate.getTime();
        // Slot must not be in past (allow slots within current minute or later)
        if (slotTs > currentNow) {
          options.push({
            value: String(slotTs),
            label: formatTimeHM(slotTs),
          });
        }
      }
    }
    return options;
  }, [currentNow]);

  // Compute active start & end timestamps
  const computedStartTs = useMemo(() => {
    if (startOption === 'now') return currentNow;
    const parsed = Number(startOption);
    return isNaN(parsed) ? currentNow : parsed;
  }, [startOption, currentNow]);

  const computedEndTs = useMemo(() => {
    return computedStartTs + durationHours * 3600 * 1000;
  }, [computedStartTs, durationHours]);

  // Free seats for next hour [currentNow, currentNow + 1h] per library
  const aBlockFreeNextHour = useMemo(() => {
    return countFreeSeats('ABLOCK', currentNow, currentNow + 3600 * 1000, libraryBookings, currentNow);
  }, [libraryBookings, currentNow]);

  const lrcFreeNextHour = useMemo(() => {
    return countFreeSeats('LRC', currentNow, currentNow + 3600 * 1000, libraryBookings, currentNow);
  }, [libraryBookings, currentNow]);

  // Free seats for selected window in currently selected library
  const freeInSelectedWindow = useMemo(() => {
    return countFreeSeats(selectedLibId, computedStartTs, computedEndTs, libraryBookings, currentNow);
  }, [selectedLibId, computedStartTs, computedEndTs, libraryBookings, currentNow]);

  const bookableSeatsCount = useMemo(() => {
    return getBookableSeatsCount(selectedLibId);
  }, [selectedLibId]);

  // Seats for selected library
  const libSeats = useMemo(() => {
    return getLibrarySeats(selectedLibId);
  }, [selectedLibId]);

  // Selected seat details
  const selectedSeatObj = useMemo(() => {
    if (!selectedSeatId) return null;
    return libSeats.find((s) => s.seatId === selectedSeatId) || null;
  }, [selectedSeatId, libSeats]);

  // Clear selected seat when library changes
  const handleSelectLibrary = (libId) => {
    setSelectedLibId(libId);
    setSelectedSeatId(null);
    setConfirmError('');
    setConfirmSuccess('');
  };

  // Toggle filter chip
  const toggleFilter = (key) => {
    setActiveFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Seat tap handler
  const handleSeatClick = (seat) => {
    if (seat.walkInOnly) return;
    const state = getSeatState(seat, computedStartTs, computedEndTs, libraryBookings, currentNow, currentStudent.id);
    if (state !== 'Available' && state !== 'Yours') return;

    if (selectedSeatId === seat.seatId) {
      setSelectedSeatId(null);
    } else {
      setSelectedSeatId(seat.seatId);
      setConfirmError('');
      setConfirmSuccess('');
    }
  };

  // Confirm booking
  const handleConfirmBooking = () => {
    setConfirmError('');
    setConfirmSuccess('');

    if (!selectedSeatObj) {
      setConfirmError('Please select an available seat first.');
      return;
    }

    const latestNow = libraryNow();

    // 1. Duration check
    if (durationHours < MIN_HOURS || durationHours > MAX_HOURS) {
      setConfirmError(`Booking duration must be between ${MIN_HOURS} and ${MAX_HOURS} hours.`);
      return;
    }

    // 2. Start time check (must not be in the past)
    if (computedStartTs < latestNow - 60000) {
      setConfirmError('Selected start time is in the past. Please select "Start now" or an upcoming slot.');
      return;
    }

    // 3. Single active booking rule
    const hasActiveBooking = libraryBookings.some(
      (b) => b.ownerId === currentStudent.id && isBookingBlocking(b, latestNow)
    );
    if (hasActiveBooking) {
      setConfirmError('You already have an active library booking. Only one active reservation or check-in is allowed at a time.');
      return;
    }

    // 4. Overlap check against blocking bookings
    const isBlocked = isSeatBlocked(
      selectedLibId,
      selectedSeatObj.seatId,
      computedStartTs,
      computedEndTs,
      libraryBookings,
      latestNow
    );

    if (isBlocked) {
      setConfirmError(`Seat ${selectedSeatObj.seatId} was just reserved for this time window. Please select another seat.`);
      return;
    }

    const newBooking = {
      id: `lib-${Date.now()}`,
      type: 'library',
      ownerId: currentStudent.id,
      ownerName: currentStudent.name,
      libraryId: selectedLibId,
      libraryName: selectedLib.name,
      seatId: selectedSeatObj.seatId,
      startTs: computedStartTs,
      endTs: computedEndTs,
      status: 'Reserved',
    };

    onAddBooking(newBooking);
    setConfirmSuccess(`Seat ${selectedSeatObj.seatId} confirmed! Check in at the entrance scanner within 30 minutes of slot start.`);
    setSelectedSeatId(null);
  };

  // Handle Demo Scans
  const handleSimulateScan = (action) => {
    if (!myActiveBooking) {
      setScanResult({
        success: false,
        message: 'No active library booking found for your account to scan.',
      });
      return;
    }

    const res = handleScan(myActiveBooking.id, action);
    setScanResult(res);
  };

  // Organize seats into rows for layout
  const rowsList = useMemo(() => {
    const rows = [];
    for (let r = 0; r < selectedLib.rows; r++) {
      const rowSeats = libSeats.filter((s) => s.row === r).sort((a, b) => a.col - b.col);
      rows.push({ rowIndex: r, seats: rowSeats });
    }
    return rows;
  }, [selectedLib, libSeats]);

  // Demo Time offset minutes
  const offsetMinutes = Math.round(demoOffsetMs / (60 * 1000));

  return (
    <div className="library-booking-page">
      {/* 1. Header with Bennett Red Eyebrow */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="section-eyebrow">Study spaces</div>
        <h1 className="page-title">Library Seat Booking</h1>
        <p className="page-subtitle">
          Bennett University libraries are open 24/7. Reserve your study desk, check live seat density, and authenticate at the door scanner.
        </p>

        {/* Demo Time Amber Chip */}
        {demoOffsetMs !== 0 && (
          <div style={{ marginTop: '14px' }}>
            <span className="demo-time-chip">
              Demo time {formatTimeHM(currentNow)} ({offsetMinutes > 0 ? `+${offsetMinutes} min` : `${offsetMinutes} min`})
            </span>
          </div>
        )}
      </div>

      {/* Global Inline Alerts */}
      {confirmSuccess && (
        <div className="inline-success-banner" role="status">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{confirmSuccess}</span>
        </div>
      )}

      {confirmError && (
        <div className="inline-error-banner" role="alert">
          {confirmError}
        </div>
      )}

      {scanResult && (
        <div className={scanResult.success ? 'inline-success-banner' : 'inline-error-banner'} role="alert">
          <span>{scanResult.message}</span>
        </div>
      )}

      {/* 2. Two Library Cards (Selectable) */}
      <section className="library-cards-grid" aria-label="Select Bennett Library">
        {/* A Block Card */}
        <div
          className={`library-select-card ${selectedLibId === 'ABLOCK' ? 'active' : ''}`}
          onClick={() => handleSelectLibrary('ABLOCK')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleSelectLibrary('ABLOCK')}
          aria-pressed={selectedLibId === 'ABLOCK'}
        >
          <div className="library-select-card-header">
            <div>
              <h2 className="library-card-name">A Block Ground Floor</h2>
              <div className="library-card-meta">Quiet academic block reading room</div>
            </div>
            <span className="library-card-tag">Open 24 hours</span>
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--ink)', marginBottom: '8px' }}>
            <strong>21</strong> bookable study desks (7 walk-in)
          </div>
          <div className="library-card-free-stat">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--green-600)' }}></span>
            <span>{aBlockFreeNextHour} of 21 bookable seats free for the next hour</span>
          </div>
        </div>

        {/* LRC Card */}
        <div
          className={`library-select-card ${selectedLibId === 'LRC' ? 'active' : ''}`}
          onClick={() => handleSelectLibrary('LRC')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleSelectLibrary('LRC')}
          aria-pressed={selectedLibId === 'LRC'}
        >
          <div className="library-select-card-header">
            <div>
              <h2 className="library-card-name">LRC</h2>
              <div className="library-card-meta">Central Learning Resource Centre</div>
            </div>
            <span className="library-card-tag">Open 24 hours</span>
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--ink)', marginBottom: '8px' }}>
            <strong>36</strong> bookable study desks (12 walk-in)
          </div>
          <div className="library-card-free-stat">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--green-600)' }}></span>
            <span>{lrcFreeNextHour} of 36 bookable seats free for the next hour</span>
          </div>
        </div>
      </section>

      {/* 3. Slot & Duration Selection Bar */}
      <section className="time-selection-panel" aria-label="Select reservation window">
        <div className="time-selection-row">
          {/* Start Time Select */}
          <div className="time-field-group">
            <label htmlFor="library-start-time" className="form-label-custom">
              Start Time (Today)
            </label>
            <select
              id="library-start-time"
              className="input-field"
              value={startOption}
              onChange={(e) => {
                setStartOption(e.target.value);
                setConfirmError('');
              }}
              style={{ minWidth: '220px' }}
            >
              {startTimeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Chips (1h to 6h) */}
          <div className="time-field-group">
            <label className="form-label-custom">Duration</label>
            <div className="duration-chips-group" role="radiogroup" aria-label="Duration in hours">
              {[1, 2, 3, 4, 5, 6].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  className={`duration-chip-btn ${durationHours === hrs ? 'active' : ''}`}
                  onClick={() => {
                    setDurationHours(hrs);
                    setConfirmError('');
                  }}
                  role="radio"
                  aria-checked={durationHours === hrs}
                >
                  {hrs}h
                </button>
              ))}
            </div>
          </div>

          {/* Computed Window Pill */}
          <div className="time-field-group" style={{ alignSelf: 'flex-end', paddingBottom: '2px' }}>
            <span className="computed-range-pill" title="Calculated booking window">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>{formatBookingTimeRange(computedStartTs, computedEndTs)}</span>
            </span>
          </div>
        </div>
      </section>

      {/* 4. Seat Map Container */}
      <section className="seat-map-wrapper" aria-labelledby="seat-map-title">
        {/* Top Summary & Filter Chips */}
        <div className="seat-map-top-bar">
          <div>
            <h2 id="seat-map-title" className="seat-free-summary">
              {freeInSelectedWindow} of {bookableSeatsCount} bookable seats free for this window
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '2px' }}>
              {selectedLib.name} layout • Desks in collaborative paired pods
            </div>
          </div>

          {/* Filter Chips (Window, Power, Silent) */}
          <div className="seat-filter-chips" role="group" aria-label="Filter study seat amenities">
            <button
              type="button"
              className={`seat-filter-chip ${activeFilters.window ? 'active' : ''}`}
              onClick={() => toggleFilter('window')}
              aria-pressed={activeFilters.window}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <line x1="12" y1="3" x2="12" y2="21"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
              </svg>
              <span>Window</span>
            </button>

            <button
              type="button"
              className={`seat-filter-chip ${activeFilters.power ? 'active' : ''}`}
              onClick={() => toggleFilter('power')}
              aria-pressed={activeFilters.power}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              <span>Power socket</span>
            </button>

            <button
              type="button"
              className={`seat-filter-chip ${activeFilters.silent ? 'active' : ''}`}
              onClick={() => toggleFilter('silent')}
              aria-pressed={activeFilters.silent}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
              <span>Silent zone</span>
            </button>
          </div>
        </div>

        {/* React Grid Seat Map with Paired Pods & Aisle */}
        <div className="seat-map-scroll-area">
          {rowsList.map((rowObj) => {
            // Cluster seats into pairs:
            // LRC (8 cols): pair 0-1, pair 2-3, AISLE, pair 4-5, pair 6-7
            // A Block (7 cols): pair 0-1, pair 2-3, AISLE, pair 4-5, single 6
            const isLRC = selectedLib.id === 'LRC';
            const leftSeats = isLRC ? rowObj.seats.slice(0, 4) : rowObj.seats.slice(0, 4);
            const rightSeats = isLRC ? rowObj.seats.slice(4, 8) : rowObj.seats.slice(4, 7);

            const renderSeat = (seat) => {
              const state = getSeatState(seat, computedStartTs, computedEndTs, libraryBookings, currentNow, currentStudent.id);
              const isSelected = selectedSeatId === seat.seatId;

              // Check filter dimming
              const isDimmed =
                (activeFilters.window && !seat.window) ||
                (activeFilters.power && !seat.powerSocket) ||
                (activeFilters.silent && !seat.silentZone);

              let stateClass = 'available';
              let iconContent = null;

              if (seat.walkInOnly) {
                stateClass = 'walk-in';
              } else if (state === 'Yours') {
                stateClass = 'yours';
                iconContent = (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                );
              } else if (state === 'Occupied') {
                stateClass = 'occupied';
                iconContent = (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                );
              } else if (state === 'Reserved') {
                stateClass = 'reserved';
                iconContent = (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 15 15"></polyline>
                  </svg>
                );
              }

              const seatNumberStr = String(seat.seatNum).padStart(2, '0');

              return (
                <button
                  key={seat.seatId}
                  type="button"
                  id={`seat-${seat.seatId}`}
                  className={`seat-item-btn ${stateClass} ${isSelected ? 'selected' : ''} ${isDimmed ? 'dimmed' : ''}`}
                  onClick={() => handleSeatClick(seat)}
                  disabled={seat.walkInOnly || (state !== 'Available' && state !== 'Yours')}
                  title={`${seat.seatId} • ${seat.walkInOnly ? 'Walk-in Only' : state}${seat.powerSocket ? ' • Power' : ''}${seat.window ? ' • Window' : ''}${seat.silentZone ? ' • Silent Zone' : ''}`}
                  aria-label={`Seat ${seat.seatId}, ${seat.walkInOnly ? 'Walk-in Only' : state}`}
                >
                  <span style={{ lineHeight: 1 }}>{seatNumberStr}</span>
                  {iconContent && <span className="seat-icon-indicator">{iconContent}</span>}
                  {seat.walkInOnly && <span style={{ fontSize: '0.55rem', letterSpacing: '-0.02em', lineHeight: 1 }}>WALK</span>}
                </button>
              );
            };

            return (
              <div key={rowObj.rowIndex} className="seat-row-strip">
                {/* Left Cluster in pairs */}
                <div className="seat-pair-cluster">
                  {renderSeat(leftSeats[0])}
                  {leftSeats[1] && renderSeat(leftSeats[1])}
                </div>
                {leftSeats.length > 2 && (
                  <div className="seat-pair-cluster" style={{ marginLeft: '6px' }}>
                    {renderSeat(leftSeats[2])}
                    {leftSeats[3] && renderSeat(leftSeats[3])}
                  </div>
                )}

                {/* Central Aisle Gap */}
                <div className="seat-aisle-space">AISLE</div>

                {/* Right Cluster in pairs */}
                <div className="seat-pair-cluster">
                  {renderSeat(rightSeats[0])}
                  {rightSeats[1] && renderSeat(rightSeats[1])}
                </div>
                {rightSeats.length > 2 && (
                  <div className="seat-pair-cluster" style={{ marginLeft: '6px' }}>
                    {renderSeat(rightSeats[2])}
                    {rightSeats[3] && renderSeat(rightSeats[3])}
                  </div>
                )}
              </div>
            );
          })}

          {/* Entrance / i-card gate marker below map */}
          <div className="gate-entrance-marker">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            <span>Entrance / i-card gate</span>
          </div>
        </div>

        {/* Legend with All States */}
        <div className="seat-legend-row" aria-label="Seat state legend">
          <div className="legend-item">
            <div className="legend-sample" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-sample" style={{ backgroundColor: 'var(--blue-50)', borderColor: 'var(--blue-400)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <span>Occupied (Checked in)</span>
          </div>
          <div className="legend-item">
            <div className="legend-sample" style={{ backgroundColor: 'var(--amber-50)', borderColor: 'var(--amber-500)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8C5F00" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 15 15"></polyline>
              </svg>
            </div>
            <span>Reserved (Waiting scan)</span>
          </div>
          <div className="legend-item">
            <div className="legend-sample" style={{ backgroundColor: 'var(--red-600)', borderColor: 'var(--red-700)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span>Yours</span>
          </div>
          <div className="legend-item">
            <div
              className="legend-sample"
              style={{
                background: 'repeating-linear-gradient(45deg, #ECEFF5, #ECEFF5 3px, #F8FAFC 3px, #F8FAFC 6px)',
                borderColor: '#D3DBE8',
              }}
            ></div>
            <span>Walk-in only</span>
          </div>
          <div className="legend-item">
            <div className="legend-sample" style={{ border: '2px solid var(--blue-600)', boxShadow: '0 0 0 2px var(--blue-600)' }}></div>
            <span>Selected</span>
          </div>
        </div>
      </section>

      {/* 5. Sticky Confirm Bar */}
      {selectedSeatObj && (
        <div className="sticky-confirm-bar" role="region" aria-label="Confirm seat booking">
          <div className="confirm-bar-details">
            <div className="confirm-bar-seat">
              Seat {selectedSeatObj.seatId} ({selectedLib.name})
            </div>
            <div className="confirm-bar-time">
              {formatBookingFullRange(computedStartTs, computedEndTs)}
            </div>
            <div className="confirm-bar-badges">
              {selectedSeatObj.window && <span className="confirm-attr-tag">Window desk</span>}
              {selectedSeatObj.powerSocket && <span className="confirm-attr-tag">Power socket</span>}
              {selectedSeatObj.silentZone && <span className="confirm-attr-tag">Silent zone</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSelectedSeatId(null)}
              style={{ height: '48px', padding: '0 18px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-booking-button"
              className="btn-primary"
              onClick={handleConfirmBooking}
              style={{ minWidth: '180px' }}
            >
              Confirm booking
            </button>
          </div>
        </div>
      )}

      {/* 6. Demo Controls Card */}
      <section className="demo-controls-card" aria-labelledby="demo-controls-heading">
        <h2 id="demo-controls-heading" className="demo-controls-title">
          Demo controls (simulates the library i-card scanner)
        </h2>
        <p className="demo-controls-desc">
          Bennett University libraries log entries and exits via physical turnstile badge readers. Test simulated arrival times and badge scans below:
        </p>

        <div className="demo-buttons-row">
          <button
            type="button"
            className="demo-btn"
            onClick={() => setDemoOffsetMs((prev) => prev + 15 * 60 * 1000)}
          >
            +15 min
          </button>
          <button
            type="button"
            className="demo-btn"
            onClick={() => setDemoOffsetMs((prev) => prev + 30 * 60 * 1000)}
          >
            +30 min
          </button>
          <button
            type="button"
            className="demo-btn"
            onClick={() => setDemoOffsetMs((prev) => prev + 60 * 60 * 1000)}
          >
            +1 hour
          </button>
          <button
            type="button"
            className="demo-btn"
            onClick={() => setDemoOffsetMs(0)}
            style={{ color: 'var(--red-600)' }}
          >
            Reset time
          </button>

          {/* Student's active booking simulation */}
          {myActiveBooking && (
            <>
              <div style={{ width: '1px', height: '28px', backgroundColor: 'var(--border)', margin: '0 6px' }}></div>

              {myActiveBooking.status === 'Reserved' && (
                <button
                  type="button"
                  id="simulate-scan-in-btn"
                  className="demo-btn btn-scan-in"
                  onClick={() => handleSimulateScan('in')}
                  title={`Simulate scanner badge swipe for ${myActiveBooking.seatId}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  <span>Simulate scan-in ({myActiveBooking.seatId})</span>
                </button>
              )}

              {myActiveBooking.status === 'CheckedIn' && (
                <button
                  type="button"
                  id="simulate-scan-out-btn"
                  className="demo-btn btn-scan-out"
                  onClick={() => handleSimulateScan('out')}
                  title={`Simulate scanner exit badge swipe for ${myActiveBooking.seatId}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                  <span>Simulate scan-out ({myActiveBooking.seatId})</span>
                </button>
              )}
            </>
          )}
        </div>

        {myActiveBooking && (
          <div style={{ marginTop: '16px', fontSize: '0.88rem', color: 'var(--navy-900)' }}>
            <strong>Your active session:</strong> Seat {myActiveBooking.seatId} ({myActiveBooking.status}) • {formatBookingFullRange(myActiveBooking.startTs, myActiveBooking.endTs)}
          </div>
        )}
      </section>
    </div>
  );
}
