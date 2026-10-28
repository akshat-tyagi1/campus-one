import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { currentStudent, facilities, notices } from '../data/mockData';
import { getFacilityStatus } from '../utils/facilityUtils';
import { formatStandardDate } from '../utils/bookingUtils';
import {
  getEffectiveStatus,
  isBookingBlocking,
  countFreeSeats,
  formatBookingTimeRange,
  HOLD_MIN,
  EARLY_ENTRY_MIN,
} from '../lib/libraryLogic';

const IMPORTANT_CONTACTS = [
  { name: 'Hostel Warden Office', ext: 'Ext: 2104', contact: 'warden.hostel@campus.edu' },
  { name: 'Library Help Desk', ext: 'Ext: 2410', contact: 'library.desk@campus.edu' },
  { name: 'Medical Room', ext: 'Ext: 2112', contact: 'firstaid@campus.edu' },
  { name: 'Student Affairs', ext: 'Ext: 2500', contact: 'dean.sa@campus.edu' },
  { name: 'IT Helpdesk', ext: 'Ext: 2999', contact: 'helpdesk@campus.edu' },
];

export default function Home({ bookings = [], libraryNow = () => Date.now(), demoOffsetMs = 0 }) {
  const [tick, setTick] = useState(0);

  const currentNow = libraryNow();
  const nowDate = new Date(currentNow);
  const hour = nowDate.getHours();

  // Filter student's own bookings
  const myBookings = useMemo(() => {
    return bookings.filter((b) => b.ownerId === currentStudent.id);
  }, [bookings]);

  // Student's reserved library booking for urgent banner
  const studentReservedLib = useMemo(() => {
    return myBookings.find(
      (b) => b.type === 'library' && getEffectiveStatus(b, currentNow) === 'Reserved'
    );
  }, [myBookings, currentNow]);

  // Urgent banner computation: within 30 min of entry window
  const urgentBannerInfo = useMemo(() => {
    if (!studentReservedLib) return null;
    const entryOpensAt = studentReservedLib.startTs - EARLY_ENTRY_MIN * 60 * 1000;
    const holdDeadline = studentReservedLib.startTs + HOLD_MIN * 60 * 1000;

    if (currentNow < entryOpensAt) {
      const msUntilEntry = entryOpensAt - currentNow;
      if (msUntilEntry <= 30 * 60 * 1000) {
        const mins = Math.max(1, Math.ceil(msUntilEntry / 60000));
        return {
          text: `Seat ${studentReservedLib.seatId} - entry opens in ${mins} min`,
          subText: 'Present your student i-card at the library door scanner once entry opens.',
        };
      }
    } else if (currentNow >= entryOpensAt && currentNow <= holdDeadline) {
      const remainingMs = Math.max(0, holdDeadline - currentNow);
      const totalSecs = Math.floor(remainingMs / 1000);
      const m = Math.floor(totalSecs / 60);
      const s = totalSecs % 60;
      const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      return {
        text: `Scan within ${timeStr} or your booking expires`,
        subText: `Your reserved seat (${studentReservedLib.seatId}) will be automatically released if you do not scan in.`,
      };
    }
    return null;
  }, [studentReservedLib, currentNow]);

  // Timer interval: 1 second if urgent banner is visible, 30 seconds otherwise
  useEffect(() => {
    const intervalMs = urgentBannerInfo ? 1000 : 30000;
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [urgentBannerInfo]);

  // Time-based greeting
  let timeGreeting = 'Good evening';
  if (hour < 12) {
    timeGreeting = 'Good morning';
  } else if (hour < 17) {
    timeGreeting = 'Good afternoon';
  }

  // Today's formatted date string
  const formattedToday = nowDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Active student bookings (for student chip count)
  const activeStudentBookingsCount = useMemo(() => {
    return myBookings.filter((b) => {
      if (b.type === 'library') {
        return isBookingBlocking(b, currentNow);
      }
      return true;
    }).length;
  }, [myBookings, currentNow]);

  // Next room booking
  const nextRoom = useMemo(() => {
    return myBookings
      .filter((b) => b.type === 'room')
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))[0];
  }, [myBookings]);

  // Next laundry booking
  const nextLaundry = useMemo(() => {
    return myBookings
      .filter((b) => b.type === 'laundry')
      .sort((a, b) => a.date.localeCompare(b.date) || (a.pickupTime || '').localeCompare(b.pickupTime || ''))[0];
  }, [myBookings]);

  // Next active/upcoming library booking
  const nextLibrary = useMemo(() => {
    return myBookings
      .filter((b) => b.type === 'library' && (isBookingBlocking(b, currentNow) || b.startTs >= currentNow))
      .sort((a, b) => a.startTs - b.startTs)[0];
  }, [myBookings, currentNow]);

  // Next 4 upcoming bookings (room, laundry, library)
  const upcomingFour = useMemo(() => {
    return myBookings
      .slice()
      .filter((b) => {
        if (b.type === 'library') {
          const eff = getEffectiveStatus(b, currentNow);
          return eff === 'Reserved' || eff === 'CheckedIn' || b.startTs >= currentNow;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = a.startTs ? a.startTs : new Date(`${a.date}T${a.startTime || a.pickupTime || '00:00'}`).getTime();
        const timeB = b.startTs ? b.startTs : new Date(`${b.date}T${b.startTime || b.pickupTime || '00:00'}`).getTime();
        return timeA - timeB;
      })
      .slice(0, 4);
  }, [myBookings, currentNow]);

  // Free seats for next hour [currentNow, currentNow + 1 hour]
  const aBlockFreeNextHour = useMemo(() => {
    return countFreeSeats('ABLOCK', currentNow, currentNow + 3600 * 1000, bookings, currentNow);
  }, [bookings, currentNow]);

  const lrcFreeNextHour = useMemo(() => {
    return countFreeSeats('LRC', currentNow, currentNow + 3600 * 1000, bookings, currentNow);
  }, [bookings, currentNow]);

  // Mini Calendar generation for current month
  const { currentMonthName, calendarDaysList } = useMemo(() => {
    const year = nowDate.getFullYear();
    const month = nowDate.getMonth();
    const monthName = nowDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const studentBookingDateMap = {};
    myBookings.forEach((b) => {
      let dateKey = b.date;
      if (!dateKey && b.startTs) {
        const d = new Date(b.startTs);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateKey = `${y}-${m}-${day}`;
      }
      if (dateKey) {
        if (!studentBookingDateMap[dateKey]) studentBookingDateMap[dateKey] = [];
        studentBookingDateMap[dateKey].push(b.type);
      }
    });

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: '', dateStr: '', isPadding: true });
    }
    for (let d = 1; d <= totalDays; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;
      const isToday = d === nowDate.getDate();
      const bookingTypes = studentBookingDateMap[dateStr] || [];

      days.push({
        dayNumber: d,
        dateStr,
        isToday,
        isPadding: false,
        hasRoom: bookingTypes.includes('room'),
        hasLaundry: bookingTypes.includes('laundry'),
        hasLibrary: bookingTypes.includes('library'),
      });
    }

    return { currentMonthName: monthName, calendarDaysList: days };
  }, [nowDate, myBookings]);

  // Facilities open right now
  const openFacilities = useMemo(() => {
    return facilities
      .map((f) => ({ ...f, status: getFacilityStatus(f, nowDate) }))
      .filter((f) => f.status.isOpen);
  }, [nowDate]);

  // Top 3 notices
  const latestNotices = useMemo(() => notices.slice(0, 3), []);

  return (
    <div className="home-dashboard">
      {/* Urgent Reserved Library Booking Banner */}
      {urgentBannerInfo && (
        <div className="home-urgent-banner" role="alert">
          <div className="home-urgent-left">
            <span className="home-urgent-pulse" aria-hidden="true"></span>
            <div>
              <div className="home-urgent-title">{urgentBannerInfo.text}</div>
              <div className="home-urgent-sub">{urgentBannerInfo.subText}</div>
            </div>
          </div>
          <Link to="/library" className="btn-primary" style={{ height: '38px', padding: '0 18px', fontSize: '0.85rem' }}>
            <span>View in Library</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}

      {/* 1. Greeting Row */}
      <section className="greeting-section" aria-label="Welcome banner">
        <div className="greeting-info">
          <div className="section-eyebrow">Student Dashboard</div>
          <h1>{timeGreeting}, {currentStudent.name.split(' ')[0]}</h1>
          <p className="greeting-date">{formattedToday}</p>
        </div>

        {/* Student Chip */}
        <div className="student-chip">
          <div className="student-avatar-initial" aria-hidden="true">
            {currentStudent.name.charAt(0)}
          </div>
          <div>
            <div className="student-chip-name">{currentStudent.name}</div>
            <div className="student-chip-sub">
              {currentStudent.id} • {activeStudentBookingsCount} active booking{activeStudentBookingsCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick-Link Pill Row */}
      <nav className="quick-pill-row" aria-label="Quick Navigation">
        <Link to="/laundry" className="quick-pill-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <circle cx="12" cy="12" r="4"></circle>
          </svg>
          <span>Laundry</span>
        </Link>
        <Link to="/rooms" className="quick-pill-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>Rooms</span>
        </Link>
        <Link to="/library" className="quick-pill-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          <span>Library</span>
        </Link>
        <Link to="/facilities" className="quick-pill-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span>Facilities</span>
        </Link>
        <Link to="/bookings" className="quick-pill-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <span>My Bookings</span>
        </Link>
        <Link to="/notices" className="quick-pill-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span>Notices</span>
        </Link>
      </nav>

      {/* 3. Bento Grid Below */}
      <div className="bento-hub-grid">
        {/* Left Column: Mini Calendar + Upcoming List */}
        <div className="bento-column">
          <section className="card-solid" aria-labelledby="cal-heading">
            <div className="mini-calendar-block">
              <div className="mini-cal-header">
                <h2 id="cal-heading" className="mini-cal-month">{currentMonthName}</h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 500 }}>
                  Today highlighted
                </span>
              </div>

              <div className="mini-cal-grid" role="grid" aria-label="Monthly Calendar">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <div key={idx} className="mini-cal-weekday">{day}</div>
                ))}
                {calendarDaysList.map((dayItem, idx) => {
                  if (dayItem.isPadding) {
                    return <div key={`pad-${idx}`} className="mini-cal-day other-month"></div>;
                  }
                  return (
                    <div
                      key={dayItem.dateStr}
                      className={`mini-cal-day ${dayItem.isToday ? 'today' : ''}`}
                      title={
                        dayItem.hasRoom || dayItem.hasLaundry || dayItem.hasLibrary
                          ? `Bookings on ${dayItem.dateStr}`
                          : dayItem.dateStr
                      }
                    >
                      <span>{dayItem.dayNumber}</span>
                      {dayItem.hasRoom && <span className="mini-cal-dot room-dot" aria-hidden="true"></span>}
                      {dayItem.hasLaundry && !dayItem.hasRoom && (
                        <span className="mini-cal-dot laundry-dot" aria-hidden="true"></span>
                      )}
                      {dayItem.hasLibrary && !dayItem.hasRoom && !dayItem.hasLaundry && (
                        <span className="mini-cal-dot room-dot" style={{ backgroundColor: 'var(--amber-500)' }} aria-hidden="true"></span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming List (next 4 student bookings) */}
            <div>
              <div className="bento-card-header" style={{ marginBottom: '12px' }}>
                <h3 className="bento-card-title" style={{ fontSize: '1.05rem' }}>Upcoming Schedule</h3>
                <Link to="/bookings" className="bento-card-link">
                  <span>View all</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              {upcomingFour.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', padding: '8px 0' }}>
                  No upcoming bookings. Reserve a room, library seat, or laundry pickup above.
                </div>
              ) : (
                <div className="upcoming-mini-list">
                  {upcomingFour.map((b) => (
                    <div key={b.id} className="upcoming-mini-item">
                      <span
                        className={`type-indicator-dot ${b.type === 'room' ? 'room' : b.type === 'laundry' ? 'laundry' : 'library'}`}
                        style={b.type === 'library' ? { backgroundColor: 'var(--amber-500)' } : undefined}
                        aria-hidden="true"
                      ></span>
                      <div className="upcoming-mini-info">
                        <div className="upcoming-mini-title">
                          {b.type === 'room'
                            ? (b.roomName || b.roomId)
                            : b.type === 'laundry'
                            ? `Laundry Slip #${b.slipNumber}`
                            : `Seat ${b.seatId} (${b.libraryName || b.libraryId})`}
                        </div>
                        <div className="upcoming-mini-date">
                          {formatStandardDate(b.date || b.startTs)} •{' '}
                          {b.type === 'room'
                            ? `${b.startTime}–${b.endTime}`
                            : b.type === 'laundry'
                            ? (b.timeWindow || b.pickupTime)
                            : formatBookingTimeRange(b.startTs, b.endTs)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Middle Column: Next Bookings + Library Seats + Open Right Now */}
        <div className="bento-column">
          {/* Middle Top: Your Next Bookings */}
          <section className="card-solid" aria-labelledby="next-bookings-heading">
            <div className="bento-card-header">
              <h2 id="next-bookings-heading" className="bento-card-title">Your Next Bookings</h2>
              <Link to="/bookings" className="bento-card-link">
                <span>View all</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="next-bookings-stack">
              {/* Next Room */}
              <div className="next-booking-row">
                <div className="next-booking-left">
                  <span className="booking-badge-tag room">Room</span>
                  <div>
                    <div className="next-booking-name">
                      {nextRoom ? (nextRoom.roomName || nextRoom.roomId) : 'No room booked'}
                    </div>
                    <div className="next-booking-time">
                      {nextRoom
                        ? `${formatStandardDate(nextRoom.date)} • ${nextRoom.startTime} – ${nextRoom.endTime}`
                        : 'Reserve collaborative study space'}
                    </div>
                  </div>
                </div>
                <Link to="/rooms" className="bento-card-link" aria-label="Book a room">
                  <span>{nextRoom ? 'Details' : 'Book'}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              {/* Next Library Seat */}
              <div className="next-booking-row">
                <div className="next-booking-left">
                  <span
                    className="booking-badge-tag library"
                    style={{ backgroundColor: 'var(--amber-50)', color: '#8C5F00', borderColor: 'var(--amber-500)' }}
                  >
                    Library
                  </span>
                  <div>
                    <div className="next-booking-name">
                      {nextLibrary
                        ? `Seat ${nextLibrary.seatId} (${nextLibrary.libraryName || nextLibrary.libraryId})`
                        : 'No seat reserved'}
                    </div>
                    <div className="next-booking-time">
                      {nextLibrary
                        ? `${formatStandardDate(nextLibrary.startTs)} • ${formatBookingTimeRange(nextLibrary.startTs, nextLibrary.endTs)}`
                        : '24/7 quiet study carrels & pods'}
                    </div>
                  </div>
                </div>
                <Link to="/library" className="bento-card-link" aria-label="Book a library seat">
                  <span>{nextLibrary ? 'Details' : 'Book'}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              {/* Next Laundry */}
              <div className="next-booking-row">
                <div className="next-booking-left">
                  <span className="booking-badge-tag laundry">Laundry</span>
                  <div>
                    <div className="next-booking-name">
                      {nextLaundry
                        ? `Pickup (Slip #${nextLaundry.slipNumber})`
                        : 'No pickup scheduled yet'}
                    </div>
                    <div className="next-booking-time">
                      {nextLaundry
                        ? `${formatStandardDate(nextLaundry.date)} • ${nextLaundry.timeWindow || nextLaundry.pickupTime}`
                        : 'Submit your laundry receipt token'}
                    </div>
                  </div>
                </div>
                <Link to="/laundry" className="bento-card-link" aria-label="Schedule laundry slot">
                  <span>{nextLaundry ? 'Pass' : 'Schedule'}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Middle Center: Library Seats (1 row per library + thin progress bar + Book a seat link) */}
          <section className="card-solid" aria-labelledby="library-seats-bento-title">
            <div className="bento-card-header">
              <h2 id="library-seats-bento-title" className="bento-card-title">Library Seats</h2>
              <Link to="/library" className="bento-card-link">
                <span>Book a seat</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* LRC Row */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                    LRC: {lrcFreeNextHour} of 36 bookable seats free
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--green-600)', fontWeight: 600 }}>24/7</span>
                </div>
                <div className="library-progress-bar">
                  <div
                    className="library-progress-fill"
                    style={{ width: `${Math.round((lrcFreeNextHour / 36) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* A Block Row */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                    A Block Ground Floor: {aBlockFreeNextHour} of 21 bookable seats free
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--green-600)', fontWeight: 600 }}>24/7</span>
                </div>
                <div className="library-progress-bar">
                  <div
                    className="library-progress-fill"
                    style={{ width: `${Math.round((aBlockFreeNextHour / 21) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </section>

          {/* Middle Bottom: Open Right Now */}
          <section className="card-solid" aria-labelledby="open-now-heading">
            <div className="bento-card-header">
              <h2 id="open-now-heading" className="bento-card-title">Open Right Now</h2>
              <Link to="/facilities" className="bento-card-link">
                <span>All facilities</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            {openFacilities.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
                All campus facilities are currently closed for the night.
              </div>
            ) : (
              <div className="open-facilities-list">
                {openFacilities.map((f) => (
                  <Link key={f.id} to="/facilities" className="open-facility-row">
                    <span className="open-facility-name">{f.name}</span>
                    <span className="open-status-text">
                      <span className="status-dot-open" aria-hidden="true"></span>
                      <span>{f.alwaysOpen ? 'Open 24 hours' : `Closes at ${f.hours.close}`}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Latest Notices + Important Contacts */}
        <div className="bento-column">
          <section className="card-solid" aria-labelledby="notices-heading">
            <div className="bento-card-header">
              <h2 id="notices-heading" className="bento-card-title">Latest Notices</h2>
              <Link to="/notices" className="bento-card-link">
                <span>All notices</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="notices-mini-stack">
              {latestNotices.map((n) => (
                <article key={n.id} className="notice-mini-card">
                  <div className="notice-mini-eyebrow">— {n.office}</div>
                  <h3 className="notice-mini-title">
                    <Link to="/notices">{n.title}</Link>
                  </h3>
                  <div className="notice-mini-date">{n.date} • {n.category}</div>
                </article>
              ))}
            </div>
          </section>

          <section className="card-solid" aria-labelledby="contacts-heading">
            <div className="bento-card-header">
              <h2 id="contacts-heading" className="bento-card-title">Important Contacts</h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                Sample data
              </span>
            </div>

            <div className="contacts-list">
              {IMPORTANT_CONTACTS.map((c) => (
                <div key={c.name} className="contact-row-item">
                  <div>
                    <div className="contact-name">{c.name}</div>
                    <div className="contact-ext">{c.ext}</div>
                  </div>
                  <span style={{ color: 'var(--blue-600)', fontSize: '0.9rem', fontWeight: 600 }}>
                    ›
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
