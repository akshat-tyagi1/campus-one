// CampusOne — Campus Services Mock Dataset
// All data is mock-only for student demonstration purposes.

export const currentStudent = {
  id: 'CSE2024031',
  name: 'Akshat Tyagi',
  branch: 'Computer Science & Engineering',
  hostel: 'Block B, Room 314',
  email: 'akshat.cse2024@campus.edu',
};

export const discussionRooms = [
  {
    id: 'DR-101',
    name: 'Discussion Room 101',
    capacity: 6,
    floor: '1st Floor',
    amenities: ['Whiteboard', 'TV Screen'],
  },
  {
    id: 'DR-102',
    name: 'Discussion Room 102',
    capacity: 4,
    floor: '1st Floor',
    amenities: ['Whiteboard'],
  },
  {
    id: 'DR-201',
    name: 'Discussion Room 201',
    capacity: 8,
    floor: '2nd Floor',
    amenities: ['Whiteboard', 'Projector', 'TV Screen'],
  },
  {
    id: 'DR-202',
    name: 'Discussion Room 202',
    capacity: 6,
    floor: '2nd Floor',
    amenities: ['Whiteboard', 'TV Screen'],
  },
  {
    id: 'DR-301',
    name: 'Discussion Room 301',
    capacity: 10,
    floor: '3rd Floor',
    amenities: ['Whiteboard', 'Projector', 'Video Conferencing'],
  },
];

export const facilities = [
  {
    id: 'gym',
    name: 'Fitness Centre',
    location: 'Block A, Ground Floor',
    description: 'Strength training floor, free weights area, and cardiovascular workout zone.',
    hours: { open: '06:00', close: '22:00' },
    daysDisplay: 'Mon – Sat',
    openDays: [1, 2, 3, 4, 5, 6],
  },
  {
    id: 'pool',
    name: 'Swimming Pool',
    location: 'Sports Complex, West Wing',
    description: 'Eight-lane 50m Olympic pool with certified lifeguards and heated evening sessions.',
    hours: { open: '07:00', close: '20:00' },
    daysDisplay: 'Mon – Fri',
    openDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'library-ablock',
    name: 'Library - A Block Ground Floor',
    libraryId: 'ABLOCK',
    location: 'Block A, Ground Floor',
    description: 'Quiet study zones, collaborative reading spaces, and individual carrels open round-the-clock.',
    hours: { open: '00:00', close: '24:00' },
    daysDisplay: 'Mon – Sun',
    openDays: [0, 1, 2, 3, 4, 5, 6],
    alwaysOpen: true,
  },
  {
    id: 'library-lrc',
    name: 'Library - LRC',
    libraryId: 'LRC',
    location: 'Learning Resource Centre, Ground & 1st Floor',
    description: 'State-of-the-art reference collections, silent study hall, and 24/7 digital resource pods.',
    hours: { open: '00:00', close: '24:00' },
    daysDisplay: 'Mon – Sun',
    openDays: [0, 1, 2, 3, 4, 5, 6],
    alwaysOpen: true,
  },
  {
    id: 'mess',
    name: 'Dining Hall',
    location: 'Central Campus Complex, Block C',
    description: 'Four-meal student dining service providing breakfast, lunch, high tea, and dinner.',
    hours: { open: '07:00', close: '22:00' },
    daysDisplay: 'Mon – Sun',
    openDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'medical',
    name: 'Medical Room',
    location: 'Admin Block, Room 101',
    description: 'Resident medical officer on duty, outpatient consultation, and emergency first response.',
    hours: { open: '09:00', close: '17:00' },
    daysDisplay: 'Mon – Fri',
    openDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'sports',
    name: 'Sports Courts',
    location: 'Sports Complex, East Wing',
    description: 'Synthetic indoor badminton, outdoor basketball, volleyball, and synthetic turf tennis courts.',
    hours: { open: '06:00', close: '21:00' },
    daysDisplay: 'Mon – Sun',
    openDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'games',
    name: 'Games Room',
    location: 'Student Activity Centre, 1st Floor',
    description: 'Table tennis tables, billiards, carrom boards, chess tables, and console stations.',
    hours: { open: '10:00', close: '22:00' },
    daysDisplay: 'Mon – Sun',
    openDays: [0, 1, 2, 3, 4, 5, 6],
  },
];

export const notices = [
  {
    id: 'n1',
    title: 'Mid-Semester Examination Timetable and Seating Plan — Autumn 2026',
    office: 'Office of the Dean (Academic Affairs)',
    date: '14 Oct 2026',
    category: 'Academic',
    isImportant: true,
    body: 'The schedule and hall allocations for the upcoming mid-semester examinations have been finalized. Students must carry their valid institute identity cards to their designated examination rooms. Electronic gadgets are strictly prohibited.',
  },
  {
    id: 'n2',
    title: 'Hostel Laundry Service Timings and Collection Roster Revision',
    office: 'Council of Wardens',
    date: '13 Oct 2026',
    category: 'Hostel',
    isImportant: true,
    body: 'To reduce crowding at the central laundry depot, staggered 30-minute pickup windows are now strictly enforced by student roll number. Please check your assigned time slot on CampusOne prior to dropping off laundry bundles.',
  },
  {
    id: 'n3',
    title: 'Swimming Pool Scheduled Closure for Maintenance & Deep Cleaning',
    office: 'Department of Physical Education',
    date: '12 Oct 2026',
    category: 'Facilities',
    isImportant: false,
    body: 'The Olympic swimming pool will remain closed on Saturday, 18 October 2026 for scheduled filtration overhaul and water chlorination. Regular operational hours will resume on Monday at 07:00.',
  },
  {
    id: 'n4',
    title: 'Extended Night Library Hours for Examination Period',
    office: 'Central Library Administration',
    date: '11 Oct 2026',
    category: 'Facilities',
    isImportant: false,
    body: 'In view of student requests for the examination season, the 2nd floor reading hall of the Central Library will remain open until 01:00 AM daily through 5 November. Institute security checks will be active after 23:00.',
  },
  {
    id: 'n5',
    title: 'Special Festival Dinner and Mess Timings Notice',
    office: 'Central Mess Committee',
    date: '10 Oct 2026',
    category: 'Hostel',
    isImportant: false,
    body: 'A festive dinner buffet will be served across all hostel dining halls on Friday evening from 19:30 to 22:30. Packed meal coupons are available for students attending evening lab practicals upon prior requisition.',
  },
  {
    id: 'n6',
    title: 'Fitness Centre Cardiovascular Equipment Servicing',
    office: 'Campus Facilities & Estates',
    date: '09 Oct 2026',
    category: 'Facilities',
    isImportant: false,
    body: 'Routine preventative maintenance of treadmills and elliptical cross-trainers is scheduled for this Sunday. Resistance machines and free weights will continue to be accessible during normal morning sessions.',
  },
  {
    id: 'n7',
    title: 'Scheduled Water Supply Interruption in Hostel Block B',
    office: 'Estate & Civil Works Division',
    date: '08 Oct 2026',
    category: 'Hostel',
    isImportant: false,
    body: 'Emergency valve replacement work will be carried out on Thursday between 10:00 and 14:00. Residents of Block B are advised to store sufficient water in advance. Backup tankers will be stationed outside the wing.',
  },
  {
    id: 'n8',
    title: 'CSI Student Chapter Annual Orientation & Technical Induction',
    office: 'Computer Society of India — Student Chapter',
    date: '07 Oct 2026',
    category: 'Events',
    isImportant: false,
    body: 'The Computer Society of India university chapter invites first- and second-year undergraduates to our annual orientation session in Auditorium 2 at 17:30. Learn about open-source tracks, competitive programming, and the upcoming 24-hour hackathon.',
  },
];

// Helper to generate ISO Date strings relative to today: YYYY-MM-DD
export function getRelativeDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 20 half-hour daily slots: 08:00 - 11:30 (8 morning slots) and 14:00 - 19:30 (12 afternoon/evening slots)
export const LAUNDRY_DAILY_SLOTS = [
  { time: '08:00', window: '08:00 – 08:30' },
  { time: '08:30', window: '08:30 – 09:00' },
  { time: '09:00', window: '09:00 – 09:30' },
  { time: '09:30', window: '09:30 – 10:00' },
  { time: '10:00', window: '10:00 – 10:30' },
  { time: '10:30', window: '10:30 – 11:00' },
  { time: '11:00', window: '11:00 – 11:30' },
  { time: '11:30', window: '11:30 – 12:00' },
  { time: '14:00', window: '14:00 – 14:30' },
  { time: '14:30', window: '14:30 – 15:00' },
  { time: '15:00', window: '15:00 – 15:30' },
  { time: '15:30', window: '15:30 – 16:00' },
  { time: '16:00', window: '16:00 – 16:30' },
  { time: '16:30', window: '16:30 – 17:00' },
  { time: '17:00', window: '17:00 – 17:30' },
  { time: '17:30', window: '17:30 – 18:00' },
  { time: '18:00', window: '18:00 – 18:30' },
  { time: '18:30', window: '18:30 – 19:00' },
  { time: '19:00', window: '19:00 – 19:30' },
  { time: '19:30', window: '19:30 – 20:00' },
];

/**
 * Returns the next 6 Mon-Sat operational days starting tomorrow (skipping Sundays).
 */
export function getNextMonSatDays(count = 6) {
  const days = [];
  const d = new Date();
  d.setDate(d.getDate() + 1); // Start tomorrow

  while (days.length < count) {
    if (d.getDay() !== 0) { // Skip Sunday (0)
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' });
      const formatted = d.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      days.push({
        date: dateStr,
        dayName,
        formatted,
        displayShort: `${dayName} ${day} ${d.toLocaleDateString('en-GB', { month: 'short' })}`,
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/**
 * Deterministic laundry pickup assignment:
 * slotIndex = (slip - 1) % 20
 * dayIndex = floor((slip - 1) / 20) % 6
 * Mapped to next 6 Mon-Sat days starting tomorrow.
 */
export function calculateLaundryAssignment(slipNumber) {
  const slip = parseInt(slipNumber, 10);
  if (isNaN(slip) || slip <= 0) return null;

  const slotIndex = (slip - 1) % 20;
  const dayIndex = Math.floor((slip - 1) / 20) % 6;
  const operationalDays = getNextMonSatDays(6);
  const assignedDay = operationalDays[dayIndex];
  const assignedSlot = LAUNDRY_DAILY_SLOTS[slotIndex];

  return {
    slip,
    slotIndex,
    dayIndex,
    date: assignedDay.date,
    dayName: assignedDay.dayName,
    formattedDate: assignedDay.formatted,
    displayShort: assignedDay.displayShort,
    pickupTime: assignedSlot.time,
    timeWindow: assignedSlot.window,
  };
}

/**
 * Generate initial seeded bookings relative to today (today, tomorrow, day after).
 * Other students' bookings have different ownerId and plain names.
 * Akshat Tyagi's bookings have ownerId: "CSE2024031".
 */
export function getSeedBookings() {
  const today = getRelativeDate(0);
  const tomorrow = getRelativeDate(1);
  const dayAfter = getRelativeDate(2);

  // Seeded Laundry for Akshat Tyagi
  const studentLaundry = calculateLaundryAssignment(14);

  return [
    // --- AKSHAT TYAGI'S BOOKINGS ---
    {
      id: 'bk-akshat-1',
      type: 'room',
      ownerId: 'CSE2024031',
      ownerName: 'Akshat Tyagi',
      roomId: 'DR-201',
      roomName: 'Discussion Room 201',
      date: tomorrow,
      startTime: '14:00',
      endTime: '15:30',
      purpose: 'DSA study group',
    },
    {
      id: 'lnd-akshat-1',
      type: 'laundry',
      ownerId: 'CSE2024031',
      ownerName: 'Akshat Tyagi',
      slipNumber: 14,
      bagNumber: 'B-204',
      date: studentLaundry.date,
      formattedDate: studentLaundry.formattedDate,
      pickupTime: studentLaundry.pickupTime,
      timeWindow: studentLaundry.timeWindow,
    },

    // --- OTHER STUDENTS' ROOM BOOKINGS (FOR BUSY CALENDAR) ---
    // Today
    {
      id: 'bk-other-1',
      type: 'room',
      ownerId: 'ECE2023014',
      ownerName: 'Rohan Mehta',
      roomId: 'DR-101',
      roomName: 'Discussion Room 101',
      date: today,
      startTime: '09:00',
      endTime: '10:30',
      purpose: 'DSA study group',
    },
    {
      id: 'bk-other-2',
      type: 'room',
      ownerId: 'ME2024088',
      ownerName: 'Pooja Verma',
      roomId: 'DR-101',
      roomName: 'Discussion Room 101',
      date: today,
      startTime: '15:00',
      endTime: '17:00',
      purpose: 'Project meeting',
    },
    {
      id: 'bk-other-3',
      type: 'room',
      ownerId: 'CSE2023055',
      ownerName: 'Karan Sharma',
      roomId: 'DR-201',
      roomName: 'Discussion Room 201',
      date: today,
      startTime: '11:00',
      endTime: '13:00',
      purpose: 'Mock interview prep',
    },
    {
      id: 'bk-other-4',
      type: 'room',
      ownerId: 'EE2024012',
      ownerName: 'Sneha Patel',
      roomId: 'DR-202',
      roomName: 'Discussion Room 202',
      date: today,
      startTime: '14:00',
      endTime: '15:30',
      purpose: 'Project meeting',
    },
    {
      id: 'bk-other-5',
      type: 'room',
      ownerId: 'IT2023041',
      ownerName: 'Devansh Nair',
      roomId: 'DR-301',
      roomName: 'Discussion Room 301',
      date: today,
      startTime: '16:00',
      endTime: '18:00',
      purpose: 'DSA study group',
    },

    // Tomorrow
    {
      id: 'bk-other-6',
      type: 'room',
      ownerId: 'CH2024019',
      ownerName: 'Ananya Iyer',
      roomId: 'DR-101',
      roomName: 'Discussion Room 101',
      date: tomorrow,
      startTime: '10:00',
      endTime: '11:30',
      purpose: 'DSA study group',
    },
    {
      id: 'bk-other-7',
      type: 'room',
      ownerId: 'ECE2023014',
      ownerName: 'Rohan Mehta',
      roomId: 'DR-102',
      roomName: 'Discussion Room 102',
      date: tomorrow,
      startTime: '13:00',
      endTime: '14:30',
      purpose: 'Mock interview prep',
    },
    {
      id: 'bk-other-8',
      type: 'room',
      ownerId: 'CSE2023055',
      ownerName: 'Karan Sharma',
      roomId: 'DR-202',
      roomName: 'Discussion Room 202',
      date: tomorrow,
      startTime: '09:30',
      endTime: '11:00',
      purpose: 'Project meeting',
    },
    {
      id: 'bk-other-9',
      type: 'room',
      ownerId: 'ME2024088',
      ownerName: 'Pooja Verma',
      roomId: 'DR-301',
      roomName: 'Discussion Room 301',
      date: tomorrow,
      startTime: '11:00',
      endTime: '13:00',
      purpose: 'DSA study group',
    },
    {
      id: 'bk-other-10',
      type: 'room',
      ownerId: 'EE2024012',
      ownerName: 'Sneha Patel',
      roomId: 'DR-301',
      roomName: 'Discussion Room 301',
      date: tomorrow,
      startTime: '15:00',
      endTime: '17:00',
      purpose: 'Mock interview prep',
    },

    // Day After
    {
      id: 'bk-other-11',
      type: 'room',
      ownerId: 'CSE2023055',
      ownerName: 'Karan Sharma',
      roomId: 'DR-101',
      roomName: 'Discussion Room 101',
      date: dayAfter,
      startTime: '11:00',
      endTime: '12:30',
      purpose: 'Mock interview prep',
    },
    {
      id: 'bk-other-12',
      type: 'room',
      ownerId: 'CH2024019',
      ownerName: 'Ananya Iyer',
      roomId: 'DR-102',
      roomName: 'Discussion Room 102',
      date: dayAfter,
      startTime: '15:00',
      endTime: '16:30',
      purpose: 'Project meeting',
    },
    {
      id: 'bk-other-13',
      type: 'room',
      ownerId: 'IT2023041',
      ownerName: 'Devansh Nair',
      roomId: 'DR-201',
      roomName: 'Discussion Room 201',
      date: dayAfter,
      startTime: '10:00',
      endTime: '12:00',
      purpose: 'DSA study group',
    },
    {
      id: 'bk-other-14',
      type: 'room',
      ownerId: 'ECE2023014',
      ownerName: 'Rohan Mehta',
      roomId: 'DR-202',
      roomName: 'Discussion Room 202',
      date: dayAfter,
      startTime: '13:30',
      endTime: '15:00',
      purpose: 'Mock interview prep',
    },
    {
      id: 'bk-other-15',
      type: 'room',
      ownerId: 'EE2024012',
      ownerName: 'Sneha Patel',
      roomId: 'DR-301',
      roomName: 'Discussion Room 301',
      date: dayAfter,
      startTime: '14:00',
      endTime: '16:00',
      purpose: 'Project meeting',
    },
  ];
}
