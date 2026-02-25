/*
 * utils.js
 * ─────────────────────────────────────────────────────────
 * Shared utility functions used by all page modules.
 * Nothing here touches the DOM directly — pure helpers.
 * ─────────────────────────────────────────────────────────
 */

// ── Date helpers ─────────────────────────────────────────

/** Format a Date object as YYYY-MM-DD */
function fmtDate(date) {
  return date.toISOString().split('T')[0];
}

/** Format a YYYY-MM-DD string as a human-readable date */
function prettyDate(dateStr) {
  return new Date(dateStr + 'T12:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Data lookup helpers ──────────────────────────────────

/** Return the facility name for a given facility ID */
function getFacilityName(id) {
  const fac = facilities.find(f => f.id == id || f.id === parseInt(id));
  return fac?.name || 'Unknown Facility';
}

// ── Toast notification ───────────────────────────────────

/**
 * Show a toast notification.
 * @param {string} msg   - Message to display
 * @param {string} type  - 'success' | 'error' | '' (default gold)
 */
function toast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> ${msg}`;
  container.appendChild(el);

  // Auto-dismiss after 3.5s
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

// ── Populate facility <select> dropdowns ─────────────────

/** Sync all facility dropdowns with the current facilities array */
function populateFacilitySelects() {
  ['formFacility', 'availFacility'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const current = el.value;
    el.innerHTML = `<option value="">— Select facility —</option>`;
    facilities.forEach(f => {
      el.innerHTML += `<option value="${f.id}">${f.name}</option>`;
    });
    // Preserve selection if it still exists
    if (current) el.value = current;
  });
}

// ── Refresh all pages after a data change ────────────────

/**
 * Re-render every page that depends on shared state.
 * Call this after any create / update / delete operation.
 */
function refreshAllPages() {
  renderDashboard();
  renderFacilities();
  renderCalendar();
  renderBookingsTable();
}
