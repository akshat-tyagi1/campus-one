import { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { getSeedBookings, currentStudent } from './data/mockData';
import { getSeedLibraryBookings } from './data/libraryData';
import { getEffectiveStatus, EARLY_ENTRY_MIN, formatTimeHM } from './lib/libraryLogic';
import Navbar from './components/Navbar';
import Home from './components/Home';
import LaundryScheduler from './components/LaundryScheduler';
import RoomBooking from './components/RoomBooking';
import FacilityDirectory from './components/FacilityDirectory';
import MyBookings from './components/MyBookings';
import LibraryBooking from './components/LibraryBooking';
import Notices from './components/Notices';

const ROOM_LAUNDRY_STORAGE_KEY = 'campusone_bookings_v3';
const USER_LIBRARY_STORAGE_KEY = 'campusone_user_library_bookings';

function loadInitialBookings() {
  let baseBookings = [];
  try {
    const raw = localStorage.getItem(ROOM_LAUNDRY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        baseBookings = parsed.filter((b) => b.type !== 'library');
      }
    }
  } catch (err) {
    console.error('Failed to load room/laundry bookings from storage:', err);
  }

  if (baseBookings.length === 0) {
    baseBookings = getSeedBookings();
  }

  // Load user's persisted library bookings
  let userLibBookings = [];
  try {
    const libRaw = localStorage.getItem(USER_LIBRARY_STORAGE_KEY);
    if (libRaw) {
      const parsedLib = JSON.parse(libRaw);
      if (Array.isArray(parsedLib)) {
        userLibBookings = parsedLib.filter((b) => b.ownerId === currentStudent.id);
      }
    }
  } catch (err) {
    console.error('Failed to load user library bookings from storage:', err);
  }

  // Generate fresh seed library bookings relative to Date.now()
  const freshSeeds = getSeedLibraryBookings(Date.now());

  return [...baseBookings, ...userLibBookings, ...freshSeeds];
}

export default function App() {
  // App-level demo clock: libraryNow() = Date.now() + demoOffsetMs (in-memory only, resets on reload)
  const [demoOffsetMs, setDemoOffsetMs] = useState(0);

  const libraryNow = useCallback(() => {
    return Date.now() + demoOffsetMs;
  }, [demoOffsetMs]);

  // App owns all booking state and passes it down
  const [bookings, setBookings] = useState(loadInitialBookings);

  // Persist bookings to localStorage
  useEffect(() => {
    try {
      // Save room and laundry bookings
      const nonLib = bookings.filter((b) => b.type !== 'library');
      localStorage.setItem(ROOM_LAUNDRY_STORAGE_KEY, JSON.stringify(nonLib));

      // Persist ONLY the logged-in student's own library bookings
      const userLib = bookings.filter(
        (b) => b.type === 'library' && b.ownerId === currentStudent.id
      );
      localStorage.setItem(USER_LIBRARY_STORAGE_KEY, JSON.stringify(userLib));
    } catch (err) {
      console.error('Failed to save bookings to storage:', err);
    }
  }, [bookings]);

  // Add booking handler
  const handleAddBooking = useCallback((newBooking) => {
    setBookings((prev) => [newBooking, ...prev]);
  }, []);

  // Cancel booking handler
  const handleCancelBooking = useCallback((bookingId) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  }, []);

  /**
   * Single entry point for physical i-card door scanner simulation.
   * handleScan(bookingId, "in" | "out")
   */
  const handleScan = useCallback(
    (bookingId, action) => {
      const now = Date.now() + demoOffsetMs;
      const target = bookings.find((b) => b.id === bookingId && b.type === 'library');
      if (!target) {
        return { success: false, message: 'Booking not found.' };
      }

      if (action === 'in') {
        const effective = getEffectiveStatus(target, now);
        if (effective === 'Expired') {
          return { success: false, message: 'Booking expired. The seat has been released.' };
        }
        if (target.status !== 'Reserved') {
          return { success: false, message: `Cannot scan in: booking status is ${target.status}.` };
        }

        const entryOpensAt = target.startTs - EARLY_ENTRY_MIN * 60 * 1000;
        if (now < entryOpensAt) {
          return {
            success: false,
            message: `Entry opens at ${formatTimeHM(entryOpensAt)}`,
          };
        }

        // Check if another CheckedIn (effective) booking is currently on the same seat
        const seatOccupied = bookings.some(
          (b) =>
            b.type === 'library' &&
            b.id !== target.id &&
            b.libraryId === target.libraryId &&
            b.seatId === target.seatId &&
            getEffectiveStatus(b, now) === 'CheckedIn'
        );
        if (seatOccupied) {
          return {
            success: false,
            message: 'Seat still in use. Entry opens when the previous student scans out.',
          };
        }

        // Successfully Checked In
        setBookings((prev) =>
          prev.map((b) =>
            b.id === target.id
              ? { ...b, status: 'CheckedIn', checkedInAt: now }
              : b
          )
        );
        return {
          success: true,
          message: `Checked in successfully to Seat ${target.seatId}! Turnstile unlocked.`,
        };
      }

      if (action === 'out') {
        const effective = getEffectiveStatus(target, now);
        if (target.status !== 'CheckedIn' && effective !== 'CheckedIn') {
          return {
            success: false,
            message: 'Cannot scan out: booking is not currently checked in.',
          };
        }

        // Successfully Checked Out
        setBookings((prev) =>
          prev.map((b) =>
            b.id === target.id
              ? { ...b, status: 'Completed', completedAt: now }
              : b
          )
        );
        return {
          success: true,
          message: `Checked out successfully from Seat ${target.seatId}. Seat is now released.`,
        };
      }

      return { success: false, message: 'Invalid scanner action requested.' };
    },
    [bookings, demoOffsetMs]
  );

  // Memoized sub-arrays for component consumers
  const roomBookings = useMemo(() => {
    return bookings.filter((b) => b.type === 'room');
  }, [bookings]);

  const laundryBookings = useMemo(() => {
    return bookings.filter((b) => b.type === 'laundry');
  }, [bookings]);

  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />

        <main className="content-wrapper">
          <Routes>
            <Route
              path="/"
              element={<Home bookings={bookings} libraryNow={libraryNow} demoOffsetMs={demoOffsetMs} />}
            />
            <Route
              path="/laundry"
              element={
                <LaundryScheduler
                  laundryBookings={laundryBookings}
                  onAddBooking={handleAddBooking}
                />
              }
            />
            <Route
              path="/rooms"
              element={
                <RoomBooking
                  roomBookings={roomBookings}
                  onAddBooking={handleAddBooking}
                  onCancelBooking={handleCancelBooking}
                />
              }
            />
            <Route
              path="/library"
              element={
                <LibraryBooking
                  bookings={bookings}
                  onAddBooking={handleAddBooking}
                  onCancelBooking={handleCancelBooking}
                  handleScan={handleScan}
                  libraryNow={libraryNow}
                  demoOffsetMs={demoOffsetMs}
                  setDemoOffsetMs={setDemoOffsetMs}
                />
              }
            />
            <Route
              path="/facilities"
              element={<FacilityDirectory bookings={bookings} libraryNow={libraryNow} />}
            />
            <Route
              path="/bookings"
              element={
                <MyBookings
                  bookings={bookings}
                  onCancelBooking={handleCancelBooking}
                  handleScan={handleScan}
                  libraryNow={libraryNow}
                />
              }
            />
            <Route path="/notices" element={<Notices />} />
            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="site-footer">
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
            <strong>CampusOne</strong> • University Student Services Portal (CSI Chapter Application) • Mock Environment
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
