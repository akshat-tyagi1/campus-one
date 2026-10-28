import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { currentStudent } from '../data/mockData';
import { formatStandardDate } from '../utils/bookingUtils';
import {
  getEffectiveStatus,
  isBookingBlocking,
  formatBookingTimeRange,
  getBookingLiveStatus,
} from '../lib/libraryLogic';

export default function MyBookings({
  bookings = [],
  onCancelBooking,
  handleScan = () => {},
  libraryNow = () => Date.now(),
}) {
  const [cancelTarget, setCancelTarget] = useState(null);
  const [scanMessage, setScanMessage] = useState(null);
  const [tick, setTick] = useState(0);

  const currentNow = libraryNow();

  // Filter ONLY the student's own bookings
  const myRooms = useMemo(() => {
    return bookings.filter(
      (b) => b.type === 'room' && b.ownerId === currentStudent.id
    );
  }, [bookings]);

  const myLaundry = useMemo(() => {
    return bookings.filter(
      (b) => b.type === 'laundry' && b.ownerId === currentStudent.id
    );
  }, [bookings]);

  const myLibrary = useMemo(() => {
    const libBookings = bookings.filter(
      (b) => b.type === 'library' && b.ownerId === currentStudent.id
    );

    // Active sessions first (Reserved or CheckedIn), then past ones (Completed, Expired, Cancelled)
    return libBookings.slice().sort((a, b) => {
      const activeA = isBookingBlocking(a, currentNow);
      const activeB = isBookingBlocking(b, currentNow);

      if (activeA && !activeB) return -1;
      if (!activeA && activeB) return 1;

      if (activeA && activeB) {
        return a.startTs - b.startTs;
      }
      return b.endTs - a.endTs;
    });
  }, [bookings, currentNow]);

  // Check if any active library booking exists to tick every 1s, otherwise tick every 30s
  const hasActiveLibrary = useMemo(() => {
    return myLibrary.some((b) => isBookingBlocking(b, currentNow));
  }, [myLibrary, currentNow]);

  useEffect(() => {
    const intervalMs = hasActiveLibrary ? 1000 : 30000;
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [hasActiveLibrary]);

  const handleConfirmCancel = () => {
    if (cancelTarget) {
      onCancelBooking(cancelTarget.id);
      setCancelTarget(null);
    }
  };

  const handleTriggerScan = (bookingId, action) => {
    const res = handleScan(bookingId, action);
    setScanMessage(res);
  };

  return (
    <div className="my-bookings-page">
      {/* Header with Bennett-style red eyebrow */}
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div className="section-eyebrow">Your Schedule</div>
        <h1 className="page-title">My Campus Bookings</h1>
        <p className="page-subtitle">
          Manage your confirmed discussion room reservations, scheduled laundry tokens, and 24/7 library seats.
        </p>
      </div>

      {scanMessage && (
        <div
          className={scanMessage.success ? 'inline-success-banner' : 'inline-error-banner'}
          role="alert"
          style={{ marginBottom: '24px' }}
        >
          <span>{scanMessage.message}</span>
        </div>
      )}

      {/* Section 1: Discussion Rooms */}
      <section className="bookings-section" aria-labelledby="rooms-heading">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="section-eyebrow" style={{ fontSize: '0.72rem' }}>Academic Bookings</div>
            <h2 id="rooms-heading" style={{ fontSize: '1.45rem', color: 'var(--navy-900)' }}>
              Discussion Rooms ({myRooms.length})
            </h2>
          </div>
          <Link to="/rooms" className="btn-secondary" style={{ height: '40px', padding: '0 16px', fontSize: '0.85rem' }}>
            <span>Book another room</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {myRooms.length === 0 ? (
          <div className="empty-state-clean">
            <h3>No room reservations found</h3>
            <p>You currently have no active discussion room bookings on your schedule.</p>
            <Link to="/rooms" className="btn-primary">
              Book a Discussion Room
            </Link>
          </div>
        ) : (
          <div>
            {myRooms.map((room) => (
              <article key={room.id} className="booking-white-card">
                <div className="booking-left-group">
                  <span className="booking-badge-tag room">Room</span>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--navy-900)', marginBottom: '4px' }}>
                      {room.roomName || room.roomId}
                    </h3>
                    <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '6px' }}>
                      {formatStandardDate(room.date)} • {room.startTime} – {room.endTime}
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>
                      <strong>Purpose:</strong> {room.purpose}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-cancel-red-outline"
                  onClick={() => setCancelTarget(room)}
                  aria-label={`Cancel reservation for ${room.roomName || room.roomId}`}
                >
                  Cancel Booking
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Library Seats */}
      <section className="bookings-section section-spacer" aria-labelledby="library-heading">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="section-eyebrow" style={{ fontSize: '0.72rem' }}>Study spaces</div>
            <h2 id="library-heading" style={{ fontSize: '1.45rem', color: 'var(--navy-900)' }}>
              Library Seats ({myLibrary.length})
            </h2>
          </div>
          <Link to="/library" className="btn-secondary" style={{ height: '40px', padding: '0 16px', fontSize: '0.85rem' }}>
            <span>Book a seat</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {myLibrary.length === 0 ? (
          <div className="empty-state-clean">
            <h3>No library seats reserved</h3>
            <p>You currently have no library desk reservations. Bennett libraries are open 24/7 with turnstile scanner entry.</p>
            <Link to="/library" className="btn-primary">
              Book a Library Seat
            </Link>
          </div>
        ) : (
          <div>
            {myLibrary.map((b) => {
              const effective = getEffectiveStatus(b, currentNow);
              const isBlocking = isBookingBlocking(b, currentNow);
              const liveStatus = getBookingLiveStatus(b, currentNow);

              let badgeClass = 'badge-status-completed';
              let badgeLabel = 'Completed';
              if (effective === 'Reserved') {
                badgeClass = 'badge-status-reserved';
                badgeLabel = 'Reserved';
              } else if (effective === 'CheckedIn') {
                badgeClass = 'badge-status-checkedin';
                badgeLabel = 'Checked in';
              } else if (effective === 'Expired') {
                badgeClass = 'badge-status-expired';
                badgeLabel = 'Expired';
              } else if (effective === 'Cancelled') {
                badgeClass = 'badge-status-cancelled';
                badgeLabel = 'Cancelled';
              }

              return (
                <article
                  key={b.id}
                  className="booking-white-card"
                  style={!isBlocking ? { opacity: 0.72 } : undefined}
                >
                  <div className="booking-left-group">
                    <span
                      className="booking-badge-tag library"
                      style={{ backgroundColor: 'var(--amber-50)', color: '#8C5F00', borderColor: 'var(--amber-500)' }}
                    >
                      Library
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--navy-900)', margin: 0 }}>
                          Seat {b.seatId} • {b.libraryName || (b.libraryId === 'ABLOCK' ? 'A Block Ground Floor' : 'LRC')}
                        </h3>
                        <span className={`facility-status-badge ${badgeClass}`} style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                          {badgeLabel}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '6px' }}>
                        {formatStandardDate(b.startTs)} • {formatBookingTimeRange(b.startTs, b.endTs)}
                      </div>

                      {/* Live status line */}
                      <div style={{ fontSize: '0.86rem', color: isBlocking ? 'var(--blue-600)' : 'var(--muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isBlocking && (
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: effective === 'CheckedIn' ? 'var(--green-600)' : 'var(--amber-500)',
                            }}
                          ></span>
                        )}
                        <span>{liveStatus.text}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this booking */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {/* Reserved session: Simulate Scan-in + Cancel Booking */}
                    {effective === 'Reserved' && (
                      <>
                        <button
                          type="button"
                          className="demo-btn btn-scan-in"
                          onClick={() => handleTriggerScan(b.id, 'in')}
                          title="Simulate scanning in at the door badge turnstile"
                          style={{ height: '40px', padding: '0 14px', fontSize: '0.82rem' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                          </svg>
                          <span>Simulate scan-in</span>
                        </button>
                        <button
                          type="button"
                          className="btn-cancel-red-outline"
                          onClick={() => setCancelTarget(b)}
                          aria-label={`Cancel reservation for seat ${b.seatId}`}
                        >
                          Cancel Booking
                        </button>
                      </>
                    )}

                    {/* CheckedIn session: Leave early (scan-out) */}
                    {effective === 'CheckedIn' && (
                      <button
                        type="button"
                        className="btn-cancel-red-outline"
                        onClick={() => handleTriggerScan(b.id, 'out')}
                        title="Scan exit badge to release seat immediately"
                      >
                        Leave early
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3: Laundry Pickups */}
      <section className="bookings-section section-spacer" aria-labelledby="laundry-heading">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="section-eyebrow" style={{ fontSize: '0.72rem' }}>Hostel Utilities</div>
            <h2 id="laundry-heading" style={{ fontSize: '1.45rem', color: 'var(--navy-900)' }}>
              Laundry Pickups ({myLaundry.length})
            </h2>
          </div>
          <Link to="/laundry" className="btn-secondary" style={{ height: '40px', padding: '0 16px', fontSize: '0.85rem' }}>
            <span>Schedule new slip</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {myLaundry.length === 0 ? (
          <div className="empty-state-clean">
            <h3>No laundry pickups scheduled</h3>
            <p>You have not registered any laundry slips for collection this week.</p>
            <Link to="/laundry" className="btn-primary">
              Schedule Laundry Pickup
            </Link>
          </div>
        ) : (
          <div>
            {myLaundry.map((laundry) => (
              <article key={laundry.id} className="booking-white-card">
                <div className="booking-left-group">
                  <span className="booking-badge-tag laundry">Laundry</span>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--navy-900)', marginBottom: '4px' }}>
                      Slip #{laundry.slipNumber} • Bag {laundry.bagNumber}
                    </h3>
                    <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '6px' }}>
                      {laundry.formattedDate || formatStandardDate(laundry.date)} • {laundry.timeWindow || laundry.pickupTime}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                      Present your student ID card and drop slip at the central laundry counter.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-cancel-red-outline"
                  onClick={() => setCancelTarget(laundry)}
                  aria-label={`Cancel laundry pickup for Slip #${laundry.slipNumber}`}
                >
                  Cancel Pickup
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Confirmation Dialog Modal */}
      {cancelTarget && (
        <div className="confirm-dialog-overlay" onClick={() => setCancelTarget(null)}>
          <div
            className="confirm-dialog-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-cancel-title"
          >
            <div className="section-eyebrow" style={{ fontSize: '0.72rem' }}>Confirm Action</div>
            <h2 id="confirm-cancel-title" style={{ fontSize: '1.35rem', color: 'var(--navy-900)', marginBottom: '8px' }}>
              Cancel this {cancelTarget.type === 'room' ? 'room booking' : cancelTarget.type === 'library' ? 'library seat reservation' : 'laundry pickup'}?
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '22px' }}>
              Are you sure you want to cancel{' '}
              <strong>
                {cancelTarget.type === 'room'
                  ? `${cancelTarget.roomName || cancelTarget.roomId} on ${formatStandardDate(cancelTarget.date)}`
                  : cancelTarget.type === 'library'
                  ? `Seat ${cancelTarget.seatId} (${cancelTarget.libraryName || cancelTarget.libraryId}) on ${formatStandardDate(cancelTarget.startTs)}`
                  : `Slip #${cancelTarget.slipNumber} scheduled on ${cancelTarget.formattedDate || formatStandardDate(cancelTarget.date)}`}
              </strong>?
              This action cannot be undone.
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
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
