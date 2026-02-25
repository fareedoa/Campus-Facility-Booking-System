/*
 * app.js
 * ─────────────────────────────────────────────────────────
 * Application entry point.
 * Responsibilities:
 *   - init(): verify auth, fetch data, render first page
 *   - showPage(): navigate between pages
 *   - Logout handler
 * ─────────────────────────────────────────────────────────
 */

// ════════════════════════════════════
//  AUTH GUARD
// ════════════════════════════════════

function loadCurrentUser() {
  const raw = localStorage.getItem('campusbook_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) { return null; }
}

function redirectToLogin() {
  window.location.href = 'login.html';
}

// ════════════════════════════════════
//  INIT
// ════════════════════════════════════

async function init() {
  // ── No authentication required for students ──
  currentUser = loadCurrentUser() || { name: 'Guest Student', role: 'STUDENT', username: '' };
  const token = localStorage.getItem('campusbook_token');

  // ── Display user info in sidebar ──
  const userNameEl = document.getElementById('sidebarUserName');
  const userRoleEl = document.getElementById('sidebarUserRole');
  if (userNameEl) userNameEl.textContent = currentUser.name || currentUser.username || 'Student';
  if (userRoleEl) userRoleEl.textContent = currentUser.role === 'ADMIN' ? 'Administrator' : 'Student';

  // ── Set minimum date on booking form to today ──
  const todayStr = fmtDate(new Date());
  const formDate = document.getElementById('formDate');
  if (formDate) {
    formDate.value = todayStr;
    formDate.min = todayStr;
  }

  // ── Fetch data from backend ──
  try {
    const apiFacilities = await apiFetchAllFacilities();
    facilities = Array.isArray(apiFacilities) ? apiFacilities : [];
  } catch (err) {
    console.error('[INIT] Failed to load facilities:', err.message);
    facilities = [];
  }

  try {
    const apiBookings = await apiFetchAllBookings();
    bookings = Array.isArray(apiBookings) ? apiBookings : [];
  } catch (err) {
    console.error('[INIT] Failed to load bookings:', err.message);
    bookings = [];
  }

  // ── Build all page skeletons first (creates the DOM elements) ──
  buildDashboardHTML();
  buildFacilitiesHTML();
  buildAvailabilityHTML();
  buildBookingsHTML();

  // ── Populate selects AFTER pages are built (elements now exist in DOM) ──
  populateFacilitySelects();

  // ── Render dynamic content ──
  renderDashboard();
  renderFacilities();
  renderCalendar();
  renderBookingsTable();
}

// ════════════════════════════════════
//  NAVIGATION
// ════════════════════════════════════

function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');

  // Auto-resolve the nav item if btn isn't provided (e.g. from dashboard hero buttons)
  const activeBtn = btn || document.querySelector(`.nav-item[onclick*="'${id}'"]`);
  if (activeBtn) activeBtn.classList.add('active');

  document.getElementById('topbarTitle').textContent = PAGE_TITLES[id] || id;

  // Close the mobile drawer after navigation
  closeSidebar();

  // Page-specific on-enter actions
  if (id === 'availability') {
    selectedDate = fmtDate(new Date());
    renderCalendar();
    const facEl = document.getElementById('availFacility');
    if (facEl && facEl.value) loadSlots();
  }
}

// ════════════════════════════════════
//  MOBILE SIDEBAR DRAWER
// ════════════════════════════════════

function toggleSidebar() {
  document.body.classList.toggle('sidebar-open');
}

function closeSidebar() {
  document.body.classList.remove('sidebar-open');
}

// ════════════════════════════════════
//  LOGOUT
// ════════════════════════════════════

async function logout() {
  await apiLogout();
  redirectToLogin();
}

// ════════════════════════════════════
//  START THE APP
// ════════════════════════════════════
init();
