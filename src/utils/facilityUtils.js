// Utility for facility open/closed calculations based on real system time and weekday

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Computes status object for a facility:
 * {
 *   isOpen: boolean,
 *   badge: 'OPEN' | 'CLOSED',
 *   statusLine: string, // e.g. "Closes at 22:00" or "Opens tomorrow at 07:00"
 *   todayDayIndex: number, // 0=Sun .. 6=Sat
 * }
 */
export function getFacilityStatus(facility, now = new Date()) {
  const dayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  if (facility.alwaysOpen) {
    return {
      isOpen: true,
      badge: 'OPEN',
      statusLine: 'Open 24 hours',
      todayDayIndex: dayIndex,
    };
  }

  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHours}:${currentMinutes}`;

  const isOpenToday = facility.openDays.includes(dayIndex);
  const openTime = facility.hours.open;
  const closeTime = facility.hours.close;

  // Function to find next opening day & format
  const getNextOpenPhrase = () => {
    for (let offset = 1; offset <= 7; offset++) {
      const nextDay = (dayIndex + offset) % 7;
      if (facility.openDays.includes(nextDay)) {
        if (offset === 1) {
          return `Opens tomorrow at ${openTime}`;
        }
        return `Opens ${DAY_NAMES[nextDay]} at ${openTime}`;
      }
    }
    return `Opens at ${openTime}`;
  };

  if (isOpenToday) {
    if (currentTime >= openTime && currentTime < closeTime) {
      return {
        isOpen: true,
        badge: 'OPEN',
        statusLine: `Closes at ${closeTime}`,
        todayDayIndex: dayIndex,
      };
    } else if (currentTime < openTime) {
      return {
        isOpen: false,
        badge: 'CLOSED',
        statusLine: `Opens today at ${openTime}`,
        todayDayIndex: dayIndex,
      };
    } else {
      // Past closing time today
      return {
        isOpen: false,
        badge: 'CLOSED',
        statusLine: getNextOpenPhrase(),
        todayDayIndex: dayIndex,
      };
    }
  } else {
    // Today is a designated closed day
    return {
      isOpen: false,
      badge: 'CLOSED',
      statusLine: getNextOpenPhrase(),
      todayDayIndex: dayIndex,
    };
  }
}
