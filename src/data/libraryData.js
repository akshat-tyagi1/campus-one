// CampusOne — Library Data & Seat Definitions
// Deterministic seat models and dynamic seed generator for 24/7 Bennett libraries.

export const HOLD_MIN = 30; // Minutes from slot start until reserved booking expires
export const EARLY_ENTRY_MIN = 10; // Minutes before slot start when entry opens
export const MIN_HOURS = 1;
export const MAX_HOURS = 6;

export const LIBRARIES = [
  {
    id: 'ABLOCK',
    name: 'A Block Ground Floor',
    shortName: 'A Block',
    rows: 4,
    cols: 7,
    totalSeats: 28,
  },
  {
    id: 'LRC',
    name: 'LRC',
    shortName: 'LRC',
    rows: 6,
    cols: 8,
    totalSeats: 48,
  },
];

/**
 * Deterministically generates seats for a library.
 * Seat numbering: row by row, 1 to totalSeats.
 * Attributes:
 * - walkInOnly: seatNum % 4 === 0 (unbookable)
 * - powerSocket: seatNum % 2 !== 0 (odd seat numbers)
 * - silentZone: first 2 rows for LRC (row 0 & 1), first row for A Block (row 0)
 * - window: first or last column of a row (col 0 or col cols - 1)
 */
export function generateSeats(libraryId) {
  const lib = LIBRARIES.find((l) => l.id === libraryId) || LIBRARIES[0];
  const prefix = lib.id === 'ABLOCK' ? 'A' : 'L';
  const seats = [];

  for (let r = 0; r < lib.rows; r++) {
    for (let c = 0; c < lib.cols; c++) {
      const seatNum = r * lib.cols + c + 1;
      const seatId = `${prefix}-${String(seatNum).padStart(2, '0')}`;

      const walkInOnly = seatNum % 4 === 0;
      const powerSocket = seatNum % 2 !== 0;
      const silentZone = lib.id === 'LRC' ? r < 2 : r === 0;
      const window = c === 0 || c === lib.cols - 1;

      seats.push({
        seatId,
        seatNum,
        row: r,
        col: c,
        libraryId: lib.id,
        walkInOnly,
        powerSocket,
        silentZone,
        window,
      });
    }
  }

  return seats;
}

// Pre-computed seat maps
export const ABLOCK_SEATS = generateSeats('ABLOCK');
export const LRC_SEATS = generateSeats('LRC');

export function getLibrarySeats(libraryId) {
  return libraryId === 'ABLOCK' ? ABLOCK_SEATS : LRC_SEATS;
}

export function getBookableSeatsCount(libraryId) {
  const seats = getLibrarySeats(libraryId);
  return seats.filter((s) => !s.walkInOnly).length;
}

/**
 * Regenerates seeded bookings relative to nowMs.
 * None owned by CSE2024031, all on non-walk-in seats.
 */
export function getSeedLibraryBookings(nowMs = Date.now()) {
  const m = 60 * 1000;
  const h = 60 * m;

  return [
    // --- LRC SEEDS ---
    {
      id: 'lib-seed-lrc-1',
      type: 'library',
      ownerId: 'ECE2023014',
      ownerName: 'Rohan Mehta',
      libraryId: 'LRC',
      seatId: 'L-05',
      startTs: nowMs - 90 * m,
      endTs: nowMs - 90 * m + 3 * h,
      status: 'CheckedIn',
      checkedInAt: nowMs - 90 * m,
    },
    {
      id: 'lib-seed-lrc-2',
      type: 'library',
      ownerId: 'ME2024088',
      ownerName: 'Pooja Verma',
      libraryId: 'LRC',
      seatId: 'L-10',
      startTs: nowMs - 40 * m,
      endTs: nowMs - 40 * m + 2 * h,
      status: 'CheckedIn',
      checkedInAt: nowMs - 40 * m,
    },
    {
      id: 'lib-seed-lrc-3',
      type: 'library',
      ownerId: 'CSE2023055',
      ownerName: 'Karan Sharma',
      libraryId: 'LRC',
      seatId: 'L-18',
      startTs: nowMs + 20 * m,
      endTs: nowMs + 20 * m + 2 * h,
      status: 'Reserved',
    },
    {
      id: 'lib-seed-lrc-4',
      type: 'library',
      ownerId: 'EE2024012',
      ownerName: 'Sneha Patel',
      libraryId: 'LRC',
      seatId: 'L-23',
      startTs: nowMs - 10 * m,
      endTs: nowMs - 10 * m + 2 * h,
      status: 'Reserved',
    },
    {
      id: 'lib-seed-lrc-5',
      type: 'library',
      ownerId: 'IT2023041',
      ownerName: 'Devansh Nair',
      libraryId: 'LRC',
      seatId: 'L-27',
      startTs: nowMs - 75 * m,
      endTs: nowMs - 75 * m + 2 * h,
      status: 'Reserved', // Expired at render (> 30m hold window past start)
    },
    {
      id: 'lib-seed-lrc-6',
      type: 'library',
      ownerId: 'CH2024019',
      ownerName: 'Ananya Iyer',
      libraryId: 'LRC',
      seatId: 'L-31',
      startTs: nowMs + 3 * h,
      endTs: nowMs + 3 * h + 4 * h,
      status: 'Reserved', // Overnight
    },
    {
      id: 'lib-seed-lrc-7',
      type: 'library',
      ownerId: 'ECE2023014',
      ownerName: 'Rohan Mehta',
      libraryId: 'LRC',
      seatId: 'L-35',
      startTs: nowMs - 5 * h,
      endTs: nowMs - 5 * h + 6 * h,
      status: 'CheckedIn',
      checkedInAt: nowMs - 5 * h,
    },
    {
      id: 'lib-seed-lrc-8',
      type: 'library',
      ownerId: 'ME2024088',
      ownerName: 'Pooja Verma',
      libraryId: 'LRC',
      seatId: 'L-41',
      startTs: nowMs - 4 * h,
      endTs: nowMs - 4 * h + 2 * h,
      status: 'Completed',
      checkedInAt: nowMs - 4 * h,
      completedAt: nowMs - 2 * h,
    },
    {
      id: 'lib-seed-lrc-9',
      type: 'library',
      ownerId: 'CSE2023055',
      ownerName: 'Karan Sharma',
      libraryId: 'LRC',
      seatId: 'L-46',
      startTs: nowMs + 90 * m,
      endTs: nowMs + 90 * m + 3 * h,
      status: 'Reserved',
    },

    // --- A BLOCK SEEDS ---
    {
      id: 'lib-seed-ablock-1',
      type: 'library',
      ownerId: 'EE2024012',
      ownerName: 'Sneha Patel',
      libraryId: 'ABLOCK',
      seatId: 'A-03',
      startTs: nowMs - 60 * m,
      endTs: nowMs - 60 * m + 2 * h,
      status: 'CheckedIn',
      checkedInAt: nowMs - 60 * m,
    },
    {
      id: 'lib-seed-ablock-2',
      type: 'library',
      ownerId: 'IT2023041',
      ownerName: 'Devansh Nair',
      libraryId: 'ABLOCK',
      seatId: 'A-07',
      startTs: nowMs + 30 * m,
      endTs: nowMs + 30 * m + 2 * h,
      status: 'Reserved',
    },
    {
      id: 'lib-seed-ablock-3',
      type: 'library',
      ownerId: 'CH2024019',
      ownerName: 'Ananya Iyer',
      libraryId: 'ABLOCK',
      seatId: 'A-10',
      startTs: nowMs - 3 * h,
      endTs: nowMs - 3 * h + 5 * h,
      status: 'CheckedIn',
      checkedInAt: nowMs - 3 * h,
    },
    {
      id: 'lib-seed-ablock-4',
      type: 'library',
      ownerId: 'ECE2023014',
      ownerName: 'Rohan Mehta',
      libraryId: 'ABLOCK',
      seatId: 'A-15',
      startTs: nowMs - 20 * m,
      endTs: nowMs - 20 * m + 2 * h,
      status: 'Reserved',
    },
    {
      id: 'lib-seed-ablock-5',
      type: 'library',
      ownerId: 'ME2024088',
      ownerName: 'Pooja Verma',
      libraryId: 'ABLOCK',
      seatId: 'A-19',
      startTs: nowMs - 2 * h,
      endTs: nowMs,
      status: 'Reserved', // Expired
    },
    {
      id: 'lib-seed-ablock-6',
      type: 'library',
      ownerId: 'CSE2023055',
      ownerName: 'Karan Sharma',
      libraryId: 'ABLOCK',
      seatId: 'A-22',
      startTs: nowMs + 2 * h,
      endTs: nowMs + 2 * h + 2 * h,
      status: 'Reserved',
    },
  ];
}
