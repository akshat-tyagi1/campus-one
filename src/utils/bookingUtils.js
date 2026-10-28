// Time and booking conflict utilities

/**
 * Converts "HH:MM" (24-hour) string to minutes since midnight.
 */
export function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Converts minutes since midnight to "HH:MM".
 */
export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Strict overlap check:
 * Clash occurs ONLY if: newStart < existingEnd AND newEnd > existingStart.
 * Back-to-back bookings (e.g. 14:00-16:00 and 16:00-17:00) do NOT clash.
 */
export function hasOverlap(start1, end1, start2, end2) {
  const s1 = typeof start1 === 'string' ? timeToMinutes(start1) : start1;
  const e1 = typeof end1 === 'string' ? timeToMinutes(end1) : end1;
  const s2 = typeof start2 === 'string' ? timeToMinutes(start2) : start2;
  const e2 = typeof end2 === 'string' ? timeToMinutes(end2) : end2;

  return s1 < e2 && e1 > s2;
}

/**
 * Checks if a proposed room booking clashes with any existing booking for the same room and date.
 */
export function findBookingClash(newBooking, allBookings, ignoreBookingId = null) {
  const newStart = timeToMinutes(newBooking.startTime);
  const newEnd = timeToMinutes(newBooking.endTime);

  // Validate end > start
  if (newEnd <= newStart) {
    return { clashes: true, reason: 'End time must be after start time' };
  }

  const roomBookings = allBookings.filter(
    (b) =>
      b.type === 'room' &&
      b.roomId === newBooking.roomId &&
      b.date === newBooking.date &&
      b.id !== ignoreBookingId
  );

  for (const existing of roomBookings) {
    const existStart = timeToMinutes(existing.startTime);
    const existEnd = timeToMinutes(existing.endTime);

    if (hasOverlap(newStart, newEnd, existStart, existEnd)) {
      return {
        clashes: true,
        reason: `Slot overlaps with existing booking (${existing.startTime} – ${existing.endTime})`,
        conflict: existing,
      };
    }
  }

  return { clashes: false };
}

/**
 * Returns available end times (30-min steps, max 3 hrs)
 * that DO NOT run into the next existing booking.
 */
export function getAvailableEndTimes(roomId, date, startTimeStr, allBookings) {
  const startMin = timeToMinutes(startTimeStr);
  const maxBookingLimitMin = startMin + 180; // max 3 hours
  const calendarCloseMin = 22 * 60; // 22:00 closing time

  // Find all existing bookings in this room on this date that start after or at startMin
  const futureBookings = allBookings
    .filter(
      (b) =>
        b.type === 'room' &&
        b.roomId === roomId &&
        b.date === date &&
        timeToMinutes(b.startTime) >= startMin
    )
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // The next booking sets the ceiling
  let ceilingMin = Math.min(maxBookingLimitMin, calendarCloseMin);
  if (futureBookings.length > 0) {
    const nextBookingStart = timeToMinutes(futureBookings[0].startTime);
    ceilingMin = Math.min(ceilingMin, nextBookingStart);
  }

  const options = [];
  for (let t = startMin + 30; t <= ceilingMin; t += 30) {
    const timeStr = minutesToTime(t);
    const durationMins = t - startMin;
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    const durationLabel =
      hours > 0 && mins > 0
        ? `${hours}h ${mins}m`
        : hours > 0
        ? `${hours} hour${hours > 1 ? 's' : ''}`
        : `${mins} mins`;

    options.push({
      time: timeStr,
      minutes: t,
      label: `${timeStr} (${durationLabel})`,
    });
  }

  return options;
}

/**
 * Checks if a given slot on a given date is in the past compared to real system time.
 */
export function isPastTime(dateStr, timeStr, now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  // Same day: compare minutes (slots at or before current time are not selectable)
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const slotMinutes = timeToMinutes(timeStr);
  return slotMinutes <= currentMinutes;
}

/**
 * Formats a date string (YYYY-MM-DD), Date object, or epoch timestamp to "Fri, 16 Oct 2026".
 */
export function formatStandardDate(dateInput) {
  if (!dateInput) return '';
  let d;
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
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

