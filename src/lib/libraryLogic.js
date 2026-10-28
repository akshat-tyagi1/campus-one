// CampusOne — Library Business Logic & Booking Validation
// Pure, deterministic computations for 24/7 seat reservations and scan gates.

import {
  HOLD_MIN,
  EARLY_ENTRY_MIN,
  MIN_HOURS,
  MAX_HOURS,
  getLibrarySeats,
  getBookableSeatsCount,
} from '../data/libraryData';

export { HOLD_MIN, EARLY_ENTRY_MIN, MIN_HOURS, MAX_HOURS };

/**
 * Derives the effective status of a booking at nowMs.
 * Expiry is DERIVED at render/evaluation, NEVER stored.
 *
 * Rules:
 * - Cancelled / Completed stay as is.
 * - CheckedIn becomes Completed when nowMs >= booking.endTs.
 * - Reserved becomes Expired when nowMs > booking.startTs + HOLD_MIN (30m) or nowMs >= booking.endTs.
 */
export function getEffectiveStatus(booking, nowMs = Date.now()) {
  if (!booking) return 'Unknown';
  if (booking.status === 'Cancelled' || booking.status === 'Completed') {
    return booking.status;
  }

  if (booking.status === 'CheckedIn') {
    if (nowMs >= booking.endTs) {
      return 'Completed';
    }
    return 'CheckedIn';
  }

  if (booking.status === 'Reserved') {
    const holdDeadline = booking.startTs + HOLD_MIN * 60 * 1000;
    if (nowMs > holdDeadline || nowMs >= booking.endTs) {
      return 'Expired';
    }
    return 'Reserved';
  }

  return booking.status || 'Unknown';
}

/**
 * A booking BLOCKS a seat only when its effective status is Reserved or CheckedIn.
 * Expired, Cancelled, and Completed never block.
 */
export function isBookingBlocking(booking, nowMs = Date.now()) {
  const effective = getEffectiveStatus(booking, nowMs);
  return effective === 'Reserved' || effective === 'CheckedIn';
}

/**
 * Strict overlap rule (epoch-ms):
 * newStart < existingEnd && newEnd > existingStart
 */
export function hasEpochOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

/**
 * Checks if a specific seat has any blocking booking overlapping [startTs, endTs].
 */
export function isSeatBlocked(libraryId, seatId, startTs, endTs, allLibraryBookings = [], nowMs = Date.now(), ignoreBookingId = null) {
  const seatBookings = allLibraryBookings.filter(
    (b) =>
      b.libraryId === libraryId &&
      b.seatId === seatId &&
      b.id !== ignoreBookingId &&
      isBookingBlocking(b, nowMs)
  );

  return seatBookings.some((b) => hasEpochOverlap(startTs, endTs, b.startTs, b.endTs));
}

/**
 * Computes seat state for a given time window:
 * - 'WalkInOnly'
 * - 'Yours' (current user has a blocking booking on this seat)
 * - 'Occupied' (another user is CheckedIn)
 * - 'Reserved' (another user is Reserved)
 * - 'Available'
 */
export function getSeatState(seat, startTs, endTs, allLibraryBookings = [], nowMs = Date.now(), currentUserId = 'CSE2024031') {
  if (seat.walkInOnly) return 'WalkInOnly';

  const overlappingBookings = allLibraryBookings.filter(
    (b) =>
      b.libraryId === seat.libraryId &&
      b.seatId === seat.seatId &&
      isBookingBlocking(b, nowMs) &&
      hasEpochOverlap(startTs, endTs, b.startTs, b.endTs)
  );

  if (overlappingBookings.length === 0) {
    return 'Available';
  }

  const userBooking = overlappingBookings.find((b) => b.ownerId === currentUserId);
  if (userBooking) {
    return 'Yours';
  }

  const hasCheckedIn = overlappingBookings.some(
    (b) => getEffectiveStatus(b, nowMs) === 'CheckedIn'
  );
  if (hasCheckedIn) {
    return 'Occupied';
  }

  return 'Reserved';
}

/**
 * Counts how many bookable seats in a library are free for [startTs, endTs].
 */
export function countFreeSeats(libraryId, startTs, endTs, allLibraryBookings = [], nowMs = Date.now()) {
  const seats = getLibrarySeats(libraryId);
  let freeCount = 0;

  for (const seat of seats) {
    if (seat.walkInOnly) continue;
    const blocked = isSeatBlocked(libraryId, seat.seatId, startTs, endTs, allLibraryBookings, nowMs);
    if (!blocked) {
      freeCount++;
    }
  }

  return freeCount;
}

/**
 * Global single date formatter: "Fri, 16 Oct 2026"
 */
export function formatStandardDate(dateInput) {
  if (!dateInput) return '';
  let d;
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    // Avoid timezone shifting on ISO YYYY-MM-DD
    const [y, m, day] = dateInput.split('-').map(Number);
    d = new Date(y, m - 1, day, 12, 0, 0);
  } else {
    d = new Date(dateInput);
  }

  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats timestamp to "HH:MM" (24h)
 */
export function formatTimeHM(ts) {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Formats time range, showing end date if differing from start date:
 * e.g. "22:00 – 02:00 (Fri, 16 Oct)" or "14:00 – 16:00"
 */
export function formatBookingTimeRange(startTs, endTs) {
  const start = new Date(startTs);
  const end = new Date(endTs);

  const timeStart = formatTimeHM(startTs);
  const timeEnd = formatTimeHM(endTs);

  const startDay = start.toDateString();
  const endDay = end.toDateString();

  if (startDay === endDay) {
    return `${timeStart} – ${timeEnd}`;
  }

  const endDayLabel = end.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return `${timeStart} – ${timeEnd} (${endDayLabel})`;
}

/**
 * Formats complete booking range with date:
 * e.g. "Thu, 15 Oct 2026 • 22:00 – 02:00 (Fri, 16 Oct)"
 */
export function formatBookingFullRange(startTs, endTs) {
  const dateStr = formatStandardDate(startTs);
  const timeRange = formatBookingTimeRange(startTs, endTs);
  return `${dateStr} • ${timeRange}`;
}

/**
 * Live countdown and status line for My Bookings:
 * - before entry window: "Entry opens at HH:MM"
 * - inside entry window while Reserved: "Scan within mm:ss"
 * - Checked in: "Ends in h:mm"
 */
export function getBookingLiveStatus(booking, nowMs = Date.now()) {
  const effective = getEffectiveStatus(booking, nowMs);

  if (effective === 'Completed') {
    return { text: 'Completed', type: 'completed' };
  }
  if (effective === 'Cancelled') {
    return { text: 'Cancelled', type: 'cancelled' };
  }
  if (effective === 'Expired') {
    return { text: 'Expired', type: 'expired' };
  }

  if (effective === 'CheckedIn') {
    const diffMs = Math.max(0, booking.endTs - nowMs);
    const totalMinutes = Math.floor(diffMs / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return {
      text: `Ends in ${hours}:${String(mins).padStart(2, '0')}`,
      type: 'checkedin',
      remainingMs: diffMs,
    };
  }

  if (effective === 'Reserved') {
    const entryOpensAt = booking.startTs - EARLY_ENTRY_MIN * 60 * 1000;
    if (nowMs < entryOpensAt) {
      return {
        text: `Entry opens at ${formatTimeHM(entryOpensAt)}`,
        type: 'reserved-early',
        remainingMs: entryOpensAt - nowMs,
      };
    }

    // Inside entry window up to hold deadline (startTs + 30m)
    const holdDeadline = booking.startTs + HOLD_MIN * 60 * 1000;
    const diffMs = Math.max(0, holdDeadline - nowMs);
    const totalSeconds = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return {
      text: `Scan within ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      type: 'reserved-urgent',
      remainingMs: diffMs,
    };
  }

  return { text: effective, type: 'neutral' };
}
