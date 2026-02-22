/*
 * config.js
 * ─────────────────────────────────────────────────────────
 * Application configuration.
 * This is the ONLY file you need to edit to connect the
 * frontend to your deployed backend.
 * ─────────────────────────────────────────────────────────
 */

// ── Replace this URL with your deployed backend address ──
// Examples:
//   Local dev:   'http://localhost:3000'
//   Render:      'https://your-app-name.onrender.com'
//   Custom:      'https://api.yourdomain.com'
const BASE_URL = 'http://localhost:3000';

// ── Page title map (used by the topbar) ──
const PAGE_TITLES = {
  dashboard:    'Dashboard',
  facilities:   'Campus Facilities',
  availability: 'Check Availability',
  bookings:     'My Bookings',
  admin:        'Admin Panel',
  docs:         'API Documentation',
};

// ── Current logged-in user (replace with real auth later) ──
const CURRENT_USER = {
  id:     1,
  name:   'Kofi Mensah',
  email:  'k.mensah@ug.edu.gh',
  role:   'student',
  initials: 'K',
};
