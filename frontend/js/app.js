/*
 * app.js
 * ─────────────────────────────────────────────────────────
 * Application entry point.
 * Responsibilities:
 *   - init(): fetch data, seed UI, render first page
 *   - showPage(): navigate between pages
 *   - toggleAdminMode(): switch between student and admin views
 * ─────────────────────────────────────────────────────────
 */

// ════════════════════════════════════
//  INIT
// ════════════════════════════════════

async function init() {
  // Set minimum date on booking form to today
  const todayStr = fmtDate(new Date());
  const formDate = document.getElementById('formDate');
  if (formDate) {
    formDate.value = todayStr;
    formDate.min   = todayStr;
  }

  // Set user info in sidebar
  document.getElementById('userAvatar').textContent    = CURRENT_USER.initials;
  document.getElementById('userName').textContent      = CURRENT_USER.name;
  document.getElementById('userRoleLabel').textContent = CURRENT_USER.role;

  // ── Fetch data (try API, fall back to mock) ──
  const apiFacilities = await apiFetchAllFacilities();
  facilities = apiFacilities || MOCK_FACILITIES;

  const apiBookings = await apiFetchAllBookings();
  bookings = apiBookings || MOCK_BOOKINGS;

  // ── Seed all pages ──
  populateFacilitySelects();
  buildDashboardHTML();
  buildFacilitiesHTML();
  buildAvailabilityHTML();
  buildBookingsHTML();
  buildAdminHTML();
  buildDocsHTML();

  // ── Render dynamic content ──
  renderDashboard();
  renderFacilities();
  renderCalendar();
  renderBookingsTable();
  loadAdminData();
  renderDocs();
}

// ════════════════════════════════════
//  NAVIGATION
// ════════════════════════════════════

function showPage(id, btn) {
  // Hide all pages, deactivate all nav items
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show target page
  document.getElementById('page-' + id).classList.add('active');
  if (btn) btn.classList.add('active');
  document.getElementById('topbarTitle').textContent = PAGE_TITLES[id] || id;

  // Page-specific on-enter actions
  if (id === 'availability') {
    selectedDate = fmtDate(new Date());
    renderCalendar();
    renderSlotsForSelected();
  }
}

// ════════════════════════════════════
//  ADMIN MODE TOGGLE
// ════════════════════════════════════

function toggleAdminMode() {
  isAdmin = document.getElementById('adminToggle').checked;

  // Update role label in sidebar
  document.getElementById('userRoleLabel').textContent = isAdmin ? 'Administrator' : 'Student';

  // Show/hide the Add Facility button
  const addBtn = document.getElementById('addFacilityBtn');
  if (addBtn) addBtn.style.display = isAdmin ? '' : 'none';

  // Re-render affected pages
  renderFacilities();
  renderBookingsTable();
  loadAdminData();
}

// ════════════════════════════════════
//  START THE APP
// ════════════════════════════════════
init();
