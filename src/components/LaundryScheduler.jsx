import { useState } from 'react';
import {
  currentStudent,
  calculateLaundryAssignment,
  getNextMonSatDays,
  LAUNDRY_DAILY_SLOTS,
} from '../data/mockData';

export default function LaundryScheduler({ laundryBookings = [], onAddBooking }) {
  const [studentId, setStudentId] = useState(currentStudent.id);
  const [slipNumber, setSlipNumber] = useState('');
  const [bagNumber, setBagNumber] = useState('');
  const [errors, setErrors] = useState({});
  const [assignment, setAssignment] = useState(null);

  const operationalDays = getNextMonSatDays(6);

  const validate = () => {
    const errs = {};
    if (!studentId.trim()) {
      errs.studentId = 'Student ID is required.';
    }

    const trimmedSlip = slipNumber.toString().trim();
    if (!trimmedSlip) {
      errs.slipNumber = 'Laundry receipt slip number is required.';
    } else {
      const num = Number(trimmedSlip);
      if (!Number.isInteger(num) || num <= 0) {
        errs.slipNumber = 'Slip number must be a positive whole number (e.g. 14, 45, 102).';
      }
    }

    if (!bagNumber.toString().trim()) {
      errs.bagNumber = 'Hostel laundry bag number is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const calculated = calculateLaundryAssignment(slipNumber);
    if (calculated) {
      setAssignment(calculated);
      setErrors({});
    }
  };

  // Check if current assigned slip is already saved
  const isAlreadySaved = assignment
    ? laundryBookings.some(
        (b) =>
          b.type === 'laundry' &&
          b.ownerId === currentStudent.id &&
          Number(b.slipNumber) === Number(assignment.slip)
      )
    : false;

  const handleSaveToBookings = () => {
    if (!assignment || isAlreadySaved) return;

    const newBooking = {
      id: `lnd-${Date.now()}`,
      type: 'laundry',
      ownerId: currentStudent.id,
      ownerName: currentStudent.name,
      studentId: studentId.trim(),
      slipNumber: assignment.slip,
      bagNumber: bagNumber.trim(),
      date: assignment.date,
      dayName: assignment.dayName,
      formattedDate: assignment.formattedDate,
      pickupTime: assignment.pickupTime,
      timeWindow: assignment.timeWindow,
      bookedAt: new Date().toISOString(),
      status: 'Scheduled',
    };

    onAddBooking(newBooking);
  };

  return (
    <div className="laundry-scheduler-page">
      {/* Header with Bennett-style red eyebrow */}
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div className="section-eyebrow">Hostel Services</div>
        <h1 className="page-title">Laundry Slot Scheduler</h1>
        <p className="page-subtitle">
          Submit your physical token slip to obtain your auto-assigned pickup window. Slots are allocated deterministically to eliminate queues.
        </p>
      </div>

      {/* Main Grid: Form on Left, Ticket Pass Card on Right */}
      <div className="laundry-grid-container">
        {/* Left Form Card */}
        <section className="card-solid" aria-labelledby="laundry-form-heading">
          <h2 id="laundry-form-heading" style={{ fontSize: '1.45rem', color: 'var(--navy-900)', marginBottom: '6px' }}>
            Enter Drop-Off Details
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            No date or time picker needed. Your 30-minute window is assigned algorithmically from your receipt number.
          </p>

          <form onSubmit={handleCalculate} noValidate>
            <div className="form-stack">
              <div>
                <label htmlFor="student-id" className="form-label-custom">
                  Student Registration ID
                </label>
                <input
                  id="student-id"
                  type="text"
                  className="input-field"
                  value={studentId}
                  readOnly
                  aria-readonly="true"
                />
              </div>

              <div>
                <label htmlFor="slip-number" className="form-label-custom">
                  Laundry Receipt Slip Number
                </label>
                <input
                  id="slip-number"
                  type="number"
                  min="1"
                  step="1"
                  className={`input-field ${errors.slipNumber ? 'input-error' : ''}`}
                  value={slipNumber}
                  onChange={(e) => setSlipNumber(e.target.value)}
                  placeholder="e.g. 14"
                  required
                />
                {errors.slipNumber && (
                  <span className="field-error-text" role="alert">{errors.slipNumber}</span>
                )}
                <span className="field-hint-text">
                  Printed receipt number issued at the central laundry drop counter.
                </span>
              </div>

              <div>
                <label htmlFor="bag-number" className="form-label-custom">
                  Hostel Bag Number
                </label>
                <input
                  id="bag-number"
                  type="text"
                  className={`input-field ${errors.bagNumber ? 'input-error' : ''}`}
                  value={bagNumber}
                  onChange={(e) => setBagNumber(e.target.value)}
                  placeholder="e.g. B-204"
                  required
                />
                {errors.bagNumber && (
                  <span className="field-error-text" role="alert">{errors.bagNumber}</span>
                )}
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '8px', width: '100%' }}>
                <span>Get my pickup time</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </form>
        </section>

        {/* Right Ticket Pass Card */}
        <section aria-labelledby="pickup-pass-heading">
          {assignment ? (
            <div className="ticket-pass-card">
              <div className="ticket-top-banner">
                <div>
                  <span className="ticket-badge-pill">Collection Pass</span>
                  <h2 id="pickup-pass-heading" style={{ fontSize: '1.45rem', color: 'var(--navy-900)', marginTop: '6px' }}>
                    Hostel Laundry Token
                  </h2>
                </div>
                <div className="ticket-slip-tag">
                  Slip #{assignment.slip}
                </div>
              </div>

              {/* Large Date + Time Window Banner */}
              <div className="ticket-date-time-box">
                <div className="ticket-window-label">Designated Pickup Window</div>
                <div className="ticket-window-time">{assignment.timeWindow}</div>
                <div className="ticket-date-str">{assignment.formattedDate}</div>
              </div>

              {/* Dashed Ticket Divider */}
              <div className="ticket-dashed-divider" aria-hidden="true"></div>

              {/* Metadata */}
              <div className="ticket-meta-row">
                <div>
                  <div className="ticket-meta-label">Student ID</div>
                  <div className="ticket-meta-val">{studentId}</div>
                </div>
                <div>
                  <div className="ticket-meta-label">Bag Number</div>
                  <div className="ticket-meta-val">{bagNumber || 'Not specified'}</div>
                </div>
                <div>
                  <div className="ticket-meta-label">Student Name</div>
                  <div className="ticket-meta-val">{currentStudent.name}</div>
                </div>
                <div>
                  <div className="ticket-meta-label">Hostel Wing</div>
                  <div className="ticket-meta-val">{currentStudent.hostel}</div>
                </div>
              </div>

              {/* Save to My Bookings Button */}
              <button
                type="button"
                className={isAlreadySaved ? 'btn-secondary' : 'btn-primary'}
                style={{ width: '100%', height: '46px' }}
                onClick={handleSaveToBookings}
                disabled={isAlreadySaved}
              >
                {isAlreadySaved ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Saved to My Bookings</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <span>Save to My Bookings</span>
                  </>
                )}
              </button>

              <p className="ticket-instructions-note">
                Present your ID card and slip at the laundry depot.
              </p>
            </div>
          ) : (
            <div className="card-solid" style={{ minHeight: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--muted)', marginBottom: '14px' }}>
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <circle cx="12" cy="12" r="4"></circle>
              </svg>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--navy-900)', marginBottom: '6px' }}>
                Ticket will appear here
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', maxWidth: '340px' }}>
                Enter your slip and bag numbers on the left and submit to view your auto-allocated collection pass.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Weekly Operational Roster */}
      <section className="section-spacer" aria-label="Weekly Laundry Roster">
        <div className="section-eyebrow">Operating Schedule</div>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--navy-900)', marginBottom: '6px' }}>
          Weekly Roster & Assigned Times
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '20px' }}>
          Staggered collection cycles active for this academic week (Sundays closed for depot processing).
        </p>

        {/* Days Strip: Assigned day in blue-600 */}
        <div className="roster-days-strip">
          {operationalDays.map((opDay) => {
            const isAssignedDay = assignment && assignment.date === opDay.date;
            return (
              <div
                key={opDay.date}
                className={`roster-day-card ${isAssignedDay ? 'assigned-day' : ''}`}
              >
                <div className="roster-day-name">{opDay.dayName}</div>
                <div className="roster-day-date">{opDay.displayShort.split(' ')[1]}</div>
                <div style={{ fontSize: '0.72rem', color: isAssignedDay ? 'rgba(255,255,255,0.9)' : 'var(--muted)' }}>
                  {isAssignedDay ? 'Your Date' : opDay.displayShort.split(' ')[2]}
                </div>
              </div>
            );
          })}
        </div>

        {/* 20 Slots Grid: Assigned slot in blue-600 */}
        <div className="card-solid" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--navy-900)' }}>
              Standard Daily 30-Minute Windows
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Morning: 08:00 – 12:00 • Afternoon: 14:00 – 20:00
            </span>
          </div>

          <div className="roster-slots-grid">
            {LAUNDRY_DAILY_SLOTS.map((slot, sIdx) => {
              const isAssignedSlot = assignment && assignment.slotIndex === sIdx;
              return (
                <div
                  key={slot.time}
                  className={`roster-slot-pill ${isAssignedSlot ? 'assigned-slot' : ''}`}
                >
                  {slot.time}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
