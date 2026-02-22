/*
 * state.js
 * ─────────────────────────────────────────────────────────
 * Single source of truth for shared application state.
 * All page modules read from and write to these variables.
 *
 * Using plain variables (not a framework) keeps things
 * simple and avoids any build step.
 * ─────────────────────────────────────────────────────────
 */

// ── Data arrays (populated on init, mutated by CRUD ops) ──
let facilities = [];   // Array of facility objects
let bookings   = [];   // Array of booking objects

// ── UI state ─────────────────────────────────────────────
let isAdmin         = false;  // Whether Admin mode is toggled on
let currentFilter   = 'all';  // Active facility type filter chip

// ── Calendar state ────────────────────────────────────────
let calDate      = new Date();    // The month currently shown in the mini calendar
let selectedDate = null;          // The date the user has clicked (YYYY-MM-DD string)
let selectedSlot = null;          // { start: 'HH:MM', end: 'HH:MM' } from the slot grid
