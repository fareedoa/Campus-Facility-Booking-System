/*
 * state.js
 * ─────────────────────────────────────────────────────────
 * Single source of truth for shared application state.
 * All page modules read from and write to these variables.
 * ─────────────────────────────────────────────────────────
 */

// ── Data arrays (populated on init, mutated by CRUD ops) ──
let facilities = [];   // Array of facility objects
let bookings = [];   // Array of booking objects

// ── Authenticated user ────────────────────────────────────
let currentUser = null; // { id, username, name, email, role }

// ── UI state ─────────────────────────────────────────────
let currentFilter = 'all';  // Active facility type filter chip

// ── Calendar state ────────────────────────────────────────
let calDate = new Date();  // Month currently shown in mini calendar
let selectedDate = null;        // YYYY-MM-DD string of clicked date
let selectedSlot = null;        // { start: 'HH:MM', end: 'HH:MM' }
