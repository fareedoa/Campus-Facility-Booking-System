/*
 * mockdata.js
 * ─────────────────────────────────────────────────────────
 * Realistic sample data used as a fallback when the backend
 * API is unreachable. The app will automatically use this
 * data so the UI is always fully demonstrable.
 *
 * To add more mock records, just push new objects into
 * MOCK_FACILITIES or MOCK_BOOKINGS following the same shape.
 * ─────────────────────────────────────────────────────────
 */

const MOCK_FACILITIES = [
  { id: 1, name: 'Engineering Lecture Hall A', location: 'Block C, Level 2',     capacity: 200, type: 'Lecture Hall' },
  { id: 2, name: 'ICT Lab 1',                  location: 'ICT Building, Ground', capacity: 40,  type: 'Lab' },
  { id: 3, name: 'Graduate Study Room',         location: 'Main Library, 3F',     capacity: 20,  type: 'Study Room' },
  { id: 4, name: 'Senate Conference Room',      location: 'Admin Block, Level 1', capacity: 30,  type: 'Conference' },
  { id: 5, name: 'Sports Complex Hall',         location: 'Sports Annex',         capacity: 500, type: 'Sports' },
  { id: 6, name: 'Engineering Lab B2',          location: 'Block D, Level 1',     capacity: 35,  type: 'Lab' },
];

const MOCK_USERS = [
  { id: 1, name: 'Kofi Mensah',       email: 'k.mensah@ug.edu.gh',  role: 'student' },
  { id: 2, name: 'Abena Asante',      email: 'a.asante@ug.edu.gh',  role: 'student' },
  { id: 3, name: 'Dr. Kweku Boateng', email: 'kweku@ug.edu.gh',      role: 'admin'   },
];

// Helper: format today and tomorrow as YYYY-MM-DD
const _today    = new Date();
const _fmt      = d => d.toISOString().split('T')[0];
const _tomorrow = new Date(_today.getTime() + 86400000);
const _yesterday= new Date(_today.getTime() - 86400000);

const MOCK_BOOKINGS = [
  {
    id: 1,
    facility_id:   1,
    facility_name: 'Engineering Lecture Hall A',
    user_id:       1,
    user_name:     'Kofi Mensah',
    date:          _fmt(_today),
    start_time:    '08:00',
    end_time:      '10:00',
    status:        'Confirmed',
  },
  {
    id: 2,
    facility_id:   2,
    facility_name: 'ICT Lab 1',
    user_id:       2,
    user_name:     'Abena Asante',
    date:          _fmt(_today),
    start_time:    '10:00',
    end_time:      '12:00',
    status:        'Pending',
  },
  {
    id: 3,
    facility_id:   3,
    facility_name: 'Graduate Study Room',
    user_id:       1,
    user_name:     'Kofi Mensah',
    date:          _fmt(_tomorrow),
    start_time:    '14:00',
    end_time:      '16:00',
    status:        'Confirmed',
  },
  {
    id: 4,
    facility_id:   4,
    facility_name: 'Senate Conference Room',
    user_id:       3,
    user_name:     'Dr. Kweku Boateng',
    date:          _fmt(_yesterday),
    start_time:    '09:00',
    end_time:      '11:00',
    status:        'Completed',
  },
];
