/*
 * pages/bookings.js
 * ─────────────────────────────────────────────────────────
 * Booking History page:
 *   buildBookingsHTML()    - injects the static skeleton
 *   renderBookingsTable()  - populates the table with
 *                            search + status filtering
 * ─────────────────────────────────────────────────────────
 */

// ════════════════════════════════════
//  BUILD STATIC HTML SKELETON
// ════════════════════════════════════

function buildBookingsHTML() {
  document.getElementById('page-bookings').innerHTML = `

    <div class="section-header">
      <div>
        <div class="section-title">Booking History</div>
        <div class="section-sub">All your reservations in one place</div>
      </div>
      <button class="btn btn-primary" onclick="openBookingModal()">+ New Booking</button>
    </div>

    <!-- Search + Status filter row -->
    <div class="search-bar">
      <div class="search-input-wrap" style="flex:1">
        <span class="search-icon">🔍</span>
        <input type="text" id="bookingSearch"
          placeholder="Search by facility or status…"
          oninput="renderBookingsTable()"/>
      </div>
      <select id="statusFilter" onchange="renderBookingsTable()" style="width:160px;">
        <option value="">All Statuses</option>
        <option>Confirmed</option>
        <option>Pending</option>
        <option>Cancelled</option>
        <option>Completed</option>
      </select>
    </div>

    <!-- Bookings table -->
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Facility</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Booked By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="bookingsTable"></tbody>
        </table>
      </div>
      <div id="bookingsEmpty" class="empty-state" style="display:none;">
        <div class="empty-icon">📋</div>
        <h3>No bookings found</h3>
        <p>Try adjusting your filters or create a new booking</p>
      </div>
    </div>
  `;
}

// ════════════════════════════════════
//  RENDER BOOKINGS TABLE
// ════════════════════════════════════

function renderBookingsTable() {
  const q      = (document.getElementById('bookingSearch')?.value || '').toLowerCase();
  const status = document.getElementById('statusFilter')?.value || '';

  // In normal mode show only current user's bookings; in admin mode show all
  let list = isAdmin
    ? bookings
    : bookings.filter(b => b.user_id === CURRENT_USER.id);

  // Apply search and status filters
  list = list.filter(b => {
    const name = (b.facility_name || getFacilityName(b.facility_id)).toLowerCase();
    const matchQ = !q || name.includes(q) || b.status.toLowerCase().includes(q);
    const matchS = !status || b.status === status;
    return matchQ && matchS;
  });

  const tbody = document.getElementById('bookingsTable');
  const empty = document.getElementById('bookingsEmpty');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML    = '';
    empty.style.display = '';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML     = list.map(b => _bookingRowHTML(b)).join('');
}

function _bookingRowHTML(b) {
  const facName = b.facility_name || getFacilityName(b.facility_id);
  const badgeCls = `badge-${b.status.toLowerCase()}`;

  return `
    <tr>
      <td><strong>${facName}</strong></td>
      <td>${b.date}</td>
      <td>${b.start_time} – ${b.end_time}</td>
      <td><span class="badge ${badgeCls}">${b.status}</span></td>
      <td>${b.user_name || 'You'}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline btn-sm" onclick="openEditModal(${b.id})">Edit</button>
          <button class="btn btn-danger btn-sm"  onclick="cancelBooking(${b.id})">Cancel</button>
        </div>
      </td>
    </tr>
  `;
}
