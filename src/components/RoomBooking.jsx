import { useState, useMemo } from 'react';
import {
  currentStudent,
  discussionRooms,
  getRelativeDate,
} from '../data/mockData';
import {
  timeToMinutes,
  getAvailableEndTimes,
  findBookingClash,
  isPastTime,
  formatStandardDate,
} from '../utils/bookingUtils';

const CALENDAR_START_HOUR = 8;
const CALENDAR_END_HOUR = 22;
const HOUR_HEIGHT = 64;

const COMMON_PURPOSES = [
  'DSA study group',
  'Project meeting',
  'Mock interview prep',
  'Code review session',
  'Lab assignment prep',
];

export default function RoomBooking({ roomBookings = [], onAddBooking, onCancelBooking }) {
  const [selectedRoomId, setSelectedRoomId] = useState(discussionRooms[0].id);
  const [panelState, setPanelState] = useState({ isOpen: false, date: '', startTime: '' });
  const [pendingSlot, setPendingSlot] = useState(null); // dashed-outline pending block
  const [cancelTarget, setCancelTarget] = useState(null); // for confirmation modal
  const [formPurpose, setFormPurpose] = useState('DSA study group');
  const [formEndTime, setFormEndTime] = useState('');
  const [formError, setFormError] = useState('');

  const now = new Date();

  // 3-Day columns: Today, Tomorrow, Day After
  const calendarDays = useMemo(() => {
    return [0, 1, 2].map((offset) => {
      const dateStr = getRelativeDate(offset);
      const d = new Date();
      d.setDate(d.getDate() + offset);
      const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' });
      const dayNumber = d.getDate();
      const monthName = d.toLocaleDateString('en-GB', { month: 'short' });

      let relativeLabel = 'Today';
      if (offset === 1) relativeLabel = 'Tomorrow';
      if (offset === 2) relativeLabel = dayName;

      return {
        offset,
        date: dateStr,
        relativeLabel,
        formatted: `${dayName}, ${dayNumber} ${monthName}`,
        isToday: offset === 0,
      };
    });
  }, []);

  const selectedRoom = useMemo(() => {
    return discussionRooms.find((r) => r.id === selectedRoomId) || discussionRooms[0];
  }, [selectedRoomId]);

  // Bookings for selected room across 3 days
  const activeRoomBookings = useMemo(() => {
    const calendarDates = calendarDays.map((d) => d.date);
    return roomBookings.filter(
      (b) => b.type === 'room' && b.roomId === selectedRoomId && calendarDates.includes(b.date)
    );
  }, [roomBookings, selectedRoomId, calendarDays]);

  // Hourly rows 08:00 to 22:00
  const hourRows = useMemo(() => {
    const rows = [];
    for (let h = CALENDAR_START_HOUR; h <= CALENDAR_END_HOUR; h++) {
      rows.push({
        hour: h,
        timeStr: `${String(h).padStart(2, '0')}:00`,
      });
    }
    return rows;
  }, []);

  // Compute available end times for side panel
  const availableEndTimes = useMemo(() => {
    if (!panelState.isOpen || !panelState.date || !panelState.startTime) return [];
    return getAvailableEndTimes(selectedRoomId, panelState.date, panelState.startTime, roomBookings);
  }, [panelState, selectedRoomId, roomBookings]);

  // Handle clicking an empty cell
  const handleSlotClick = (dateStr, timeStr) => {
    // 6. Prevent selecting a start time at or before the current time today
    if (isPastTime(dateStr, timeStr, now)) return;

    // Check if slot itself is already occupied
    const slotMin = timeToMinutes(timeStr);
    const isOccupied = activeRoomBookings.some(
      (b) =>
        b.date === dateStr &&
        slotMin >= timeToMinutes(b.startTime) &&
        slotMin < timeToMinutes(b.endTime)
    );
    if (isOccupied) return;

    const endOptions = getAvailableEndTimes(selectedRoomId, dateStr, timeStr, roomBookings);
    const defaultEnd = endOptions.length > 0 ? endOptions[0].time : '';

    // Show dashed-outline "Booking..." pending block in that cell
    setPendingSlot({
      date: dateStr,
      startTime: timeStr,
      endTime: defaultEnd || `${String(parseInt(timeStr.slice(0, 2), 10) + 1).padStart(2, '0')}:00`,
    });

    setPanelState({
      isOpen: true,
      date: dateStr,
      startTime: timeStr,
    });
    setFormEndTime(defaultEnd);
    setFormPurpose('DSA study group');
    setFormError('');
  };

  const closeSidePanel = () => {
    setPanelState({ isOpen: false, date: '', startTime: '' });
    setPendingSlot(null);
    setFormError('');
  };

  // Submit booking
  const handleBookingSubmit = (e) => {
    e.preventDefault();

    if (!formEndTime) {
      setFormError('Please select a valid end time.');
      return;
    }

    if (!formPurpose.trim()) {
      setFormError('Please enter a purpose for this study reservation.');
      return;
    }

    const newBooking = {
      id: `bk-${Date.now()}`,
      type: 'room',
      ownerId: currentStudent.id,
      ownerName: currentStudent.name,
      roomId: selectedRoomId,
      roomName: selectedRoom.name,
      date: panelState.date,
      startTime: panelState.startTime,
      endTime: formEndTime,
      purpose: formPurpose.trim(),
      bookedAt: new Date().toISOString(),
    };

    // Re-check clash on confirm
    const clashCheck = findBookingClash(newBooking, roomBookings);
    if (clashCheck.clashes) {
      setFormError(clashCheck.reason || 'This slot conflicts with an existing booking.');
      return;
    }

    onAddBooking(newBooking);
    closeSidePanel();
  };

  // Confirm cancel
  const handleConfirmCancel = () => {
    if (cancelTarget) {
      onCancelBooking(cancelTarget.id);
      setCancelTarget(null);
    }
  };

  return (
    <div className="rooms-booking-page">
      {/* 1. Header with Eyebrow */}
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <div className="section-eyebrow">Academic Spaces</div>
        <h1 className="page-title">Discussion Room Booking</h1>
        <p className="page-subtitle">
          Select a collaborative group study room below to review availability on the live 3-day timeline.
        </p>
      </div>

      {/* 2. Horizontal Strip of Room Cards */}
      <section aria-label="Room selection list">
        <div className="room-selector-scroll">
          {discussionRooms.map((room) => {
            const isSelected = room.id === selectedRoomId;
            return (
              <button
                key={room.id}
                type="button"
                className={`room-card-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedRoomId(room.id);
                  setPendingSlot(null);
                }}
                aria-pressed={isSelected}
              >
                <div>
                  <div className="room-card-header-row">
                    <span className="room-card-id">{room.id}</span>
                    <span className="room-capacity-badge">{room.capacity} seats</span>
                  </div>
                  <div className="room-card-floor">{room.floor}</div>
                </div>

                <div className="room-card-amenities">
                  {room.amenities.map((amenity) => (
                    <span key={amenity} className="amenity-chip">
                      {amenity}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Below: Selected Room Details Card & Legend */}
      <section className="card-solid room-calendar-card" aria-label="Room Schedule Calendar">
        <div className="room-details-top-bar">
          <div>
            <div className="section-eyebrow" style={{ fontSize: '0.75rem' }}>Active Selection</div>
            <h2 style={{ fontSize: '1.45rem', color: 'var(--navy-900)', marginBottom: '4px' }}>
              {selectedRoom.name}
            </h2>
            <div style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
              {selectedRoom.floor} • Capacity: {selectedRoom.capacity} students • {selectedRoom.amenities.join(', ')}
            </div>
          </div>

          {/* Legend: Available, Booked, Your booking, Pending selection, Past */}
          <div className="room-legend-row" aria-label="Schedule Legend">
            <div className="legend-chip">
              <span className="legend-swatch available" aria-hidden="true"></span>
              <span>Available</span>
            </div>
            <div className="legend-chip">
              <span className="legend-swatch other-booked" aria-hidden="true"></span>
              <span>Booked</span>
            </div>
            <div className="legend-chip">
              <span className="legend-swatch my-booking" aria-hidden="true"></span>
              <span>Your booking</span>
            </div>
            <div className="legend-chip">
              <span className="legend-swatch pending-block" aria-hidden="true"></span>
              <span>Pending selection</span>
            </div>
            <div className="legend-chip">
              <span className="legend-swatch past-slot" aria-hidden="true"></span>
              <span>Past</span>
            </div>
          </div>
        </div>

        {/* 4. 3-Day Columns with Hourly Rows 08:00 - 22:00 */}
        <div className="calendar-grid-box">
          {/* Day Headers Row */}
          <div className="calendar-days-row">
            <div className="cal-time-col-head">Time</div>
            {calendarDays.map((day) => (
              <div key={day.date} className="cal-day-col-head">
                <div className="cal-day-title">{day.relativeLabel}</div>
                <div className="cal-day-subtitle">{day.formatted}</div>
              </div>
            ))}
          </div>

          {/* Calendar Body Track */}
          <div className="cal-body-scroll">
            {/* Hours Track */}
            <div className="cal-hours-track">
              {hourRows.map((row) => (
                <div key={row.timeStr} className="cal-hour-cell">
                  <span>{row.timeStr}</span>
                </div>
              ))}
            </div>

            {/* 3 Day Columns Grid */}
            <div className="cal-columns-container">
              {calendarDays.map((day) => {
                const dayBookings = activeRoomBookings.filter((b) => b.date === day.date);

                return (
                  <div key={day.date} className="cal-column">
                    {/* Hourly Clickable Cells */}
                    {hourRows.map((row) => {
                      if (row.hour === CALENDAR_END_HOUR) return null; // boundary line
                      const isPast = isPastTime(day.date, row.timeStr, now);

                      return (
                        <div
                          key={row.timeStr}
                          className={`cal-slot-row ${isPast ? 'past-slot' : ''}`}
                          onClick={() => !isPast && handleSlotClick(day.date, row.timeStr)}
                          title={isPast ? 'Slot in past' : `Reserve from ${row.timeStr}`}
                          role="button"
                          tabIndex={isPast ? -1 : 0}
                          aria-label={`Slot at ${row.timeStr} on ${day.relativeLabel}`}
                        ></div>
                      );
                    })}

                    {/* Pending Selection Block (Dashed Outline) */}
                    {pendingSlot && pendingSlot.date === day.date && (
                      <div
                        className="booking-block-pill pending"
                        style={{
                          top: `${((timeToMinutes(pendingSlot.startTime) - CALENDAR_START_HOUR * 60) / 60) * HOUR_HEIGHT}px`,
                          height: `${Math.max(
                            32,
                            ((timeToMinutes(formEndTime || pendingSlot.endTime) - timeToMinutes(pendingSlot.startTime)) / 60) * HOUR_HEIGHT
                          )}px`,
                        }}
                      >
                        <div className="block-text-label">Booking...</div>
                        <div className="block-text-time">
                          {pendingSlot.startTime} – {formEndTime || pendingSlot.endTime}
                        </div>
                      </div>
                    )}

                    {/* Actual Booked Blocks */}
                    {dayBookings.map((b) => {
                      const isMine = b.ownerId === currentStudent.id;
                      const startMin = timeToMinutes(b.startTime);
                      const endMin = timeToMinutes(b.endTime);
                      const top = ((startMin - CALENDAR_START_HOUR * 60) / 60) * HOUR_HEIGHT;
                      const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;

                      return (
                        <div
                          key={b.id}
                          className={`booking-block-pill ${isMine ? 'mine' : 'other'}`}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isMine) setCancelTarget(b);
                          }}
                          title={isMine ? 'Click to cancel your booking' : `Booked by ${b.ownerName || 'Student'}`}
                          tabIndex={isMine ? 0 : -1}
                        >
                          <div className="block-text-label">
                            {isMine ? 'Your booking (click to cancel)' : 'Booked'}
                          </div>
                          <div className="block-text-time">
                            {b.startTime} – {b.endTime}
                          </div>
                          {isMine && b.purpose && (
                            <div className="block-text-purpose">{b.purpose}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Side Panel for Booking */}
      {panelState.isOpen && (
        <div className="side-panel-overlay" onClick={closeSidePanel}>
          <aside
            className="side-panel-content"
            onClick={(e) => e.stopPropagation()}
            aria-labelledby="panel-booking-title"
          >
            <div className="side-panel-header">
              <div>
                <div className="section-eyebrow" style={{ fontSize: '0.75rem' }}>Reservation Form</div>
                <h2 id="panel-booking-title" style={{ fontSize: '1.35rem', color: 'var(--navy-900)' }}>
                  Book {selectedRoom.name}
                </h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '2px' }}>
                  {panelState.date} • Starting at {panelState.startTime}
                </div>
              </div>
              <button
                type="button"
                className="side-panel-close-btn"
                onClick={closeSidePanel}
                aria-label="Close booking side panel"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} noValidate>
              {/* Inline Clash Error Banner */}
              {formError && (
                <div className="inline-error-banner" role="alert">
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label className="form-label-custom">Room</label>
                  <input
                    type="text"
                    className="input-field"
                    value={`${selectedRoom.name} (${selectedRoom.floor})`}
                    readOnly
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label-custom">Date</label>
                    <div
                      style={{
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 18px',
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-btn)',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: 'var(--navy-900)',
                      }}
                    >
                      {formatStandardDate(panelState.date)}
                    </div>
                  </div>
                  <div>
                    <label className="form-label-custom">Start Time</label>
                    <input
                      type="text"
                      className="input-field"
                      value={panelState.startTime}
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="end-time-select" className="form-label-custom">
                    End Time (30-min steps, max 3 hrs)
                  </label>
                  {availableEndTimes.length > 0 ? (
                    <select
                      id="end-time-select"
                      className="input-field"
                      value={formEndTime}
                      onChange={(e) => {
                        setFormEndTime(e.target.value);
                        setPendingSlot((prev) => prev ? { ...prev, endTime: e.target.value } : prev);
                      }}
                      required
                    >
                      {availableEndTimes.map((opt) => (
                        <option key={opt.time} value={opt.time}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="inline-error-banner" style={{ marginTop: '4px' }}>
                      No available duration from this start time due to the next booked session.
                    </div>
                  )}
                  <span className="field-hint-text">
                    Back-to-back bookings are allowed. Maximum 3 hours.
                  </span>
                </div>

                <div>
                  <label htmlFor="purpose-input" className="form-label-custom">
                    Purpose of Meeting
                  </label>
                  <input
                    id="purpose-input"
                    type="text"
                    className="input-field"
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    placeholder="e.g. DSA study group"
                    required
                  />

                  {/* Purpose shortcuts */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {COMMON_PURPOSES.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className="amenity-chip"
                        style={{ cursor: 'pointer', background: formPurpose === p ? 'var(--blue-50)' : 'var(--surface)' }}
                        onClick={() => setFormPurpose(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label-custom">Reserved By</label>
                  <input
                    type="text"
                    className="input-field"
                    value={`${currentStudent.name} (${currentStudent.id})`}
                    readOnly
                  />
                </div>

                {/* Actions: Red Confirm Button + Cancel Link */}
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%' }}
                    disabled={availableEndTimes.length === 0}
                  >
                    Confirm Booking
                  </button>
                  <button
                    type="button"
                    onClick={closeSidePanel}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      padding: '8px',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </aside>
        </div>
      )}

      {/* Confirmation Dialog to Cancel Own Booking */}
      {cancelTarget && (
        <div className="confirm-dialog-overlay" onClick={() => setCancelTarget(null)}>
          <div
            className="confirm-dialog-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
          >
            <div className="section-eyebrow" style={{ fontSize: '0.72rem' }}>Release Reservation</div>
            <h2 id="cancel-title" style={{ fontSize: '1.35rem', color: 'var(--navy-900)', marginBottom: '10px' }}>
              Cancel this room booking?
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.92rem', marginBottom: '22px' }}>
              Release <strong>{cancelTarget.roomName}</strong> on <strong>{cancelTarget.date}</strong> ({cancelTarget.startTime} – {cancelTarget.endTime})?
              The slot will immediately reopen for other university students.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ height: '42px', padding: '0 18px', fontSize: '0.88rem' }}
                onClick={() => setCancelTarget(null)}
              >
                Keep Booking
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ height: '42px', padding: '0 18px', fontSize: '0.88rem' }}
                onClick={handleConfirmCancel}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
