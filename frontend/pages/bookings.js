/*
 * pages/bookings.js
 * ─────────────────────────────────────────────────────────
 * Booking History page.
 *
 * FIXED:
 *   - Reads b.startTime / b.endTime (camelCase, as returned by API)
 *   - Reads b.facility?.name (not b.facility_name)
 *   - Shows ALL statuses including CANCELLED (full booking history)
 *   - Status comparisons use uppercase
 * ─────────────────────────────────────────────────────────
 */

function buildBookingsHTML() {
  document.getElementById('page-bookings').innerHTML = `

    <div class="section-header">
      <div>
        <div class="section-title">My Bookings</div>
        <div class="section-sub">All your campus facility reservations</div>
      </div>
      <button class="btn btn-primary" onclick="openBookingModal()">+ New Booking</button>
    </div>

    <!-- Search + Status filter row -->
    <div class="search-bar">
      <div class="search-input-wrap" style="flex:1">
        <span class="search-icon">🔍</span>
        <input type="text" id="bookingSearch"
          placeholder="Search by facility, student ID or status…"
          oninput="renderBookingsTable()"/>
      </div>
      <select id="statusFilter" onchange="renderBookingsTable()" style="width:160px;">
        <option value="">All Statuses</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="PENDING">Pending</option>
        <option value="CANCELLED">Cancelled</option>
        <option value="COMPLETED">Completed</option>
      </select>
    </div>

    <!-- Bookings table -->
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Facility</th>
              <th>Student ID</th>
              <th>Date</th>
              <th>Time</th>
              <th>Notes</th>
              <th>Status</th>
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
  const q = (document.getElementById('bookingSearch')?.value || '').toLowerCase();
  const status = (document.getElementById('statusFilter')?.value || '').toUpperCase();

  const list = bookings.filter(b => {
    const facName = (b.facility?.name || getFacilityName(b.facility?.id || b.facilityId)).toLowerCase();
    const sid = (b.studentId || '').toLowerCase();
    const bStatus = (b.status || '').toUpperCase();
    const matchQ = !q || facName.includes(q) || sid.includes(q) || bStatus.toLowerCase().includes(q);
    const matchS = !status || bStatus === status;
    return matchQ && matchS;
  });

  const tbody = document.getElementById('bookingsTable');
  const empty = document.getElementById('bookingsEmpty');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = '';
    empty.style.display = '';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = list.map(b => _bookingRowHTML(b)).join('');
}

function _bookingRowHTML(b) {
  // API returns camelCase: b.startTime, b.endTime, b.facility.name
  const facName = b.facility?.name || getFacilityName(b.facility?.id || b.facilityId);
  const bStatus = (b.status || 'CONFIRMED').toUpperCase();
  const badgeCls = `badge-${bStatus.toLowerCase()}`;
  const st = b.startTime || b.start_time || '—';
  const et = b.endTime || b.end_time || '—';
  const notes = b.notes ? `<span title="${b.notes}" style="color:var(--mid);font-size:12px;">${b.notes.substring(0, 30)}${b.notes.length > 30 ? '…' : ''}</span>` : '<span style="color:var(--mid);font-size:12px;">—</span>';

  // Students can cancel CONFIRMED or PENDING bookings
  const canCancel = bStatus === 'CONFIRMED' || bStatus === 'PENDING';
  const actionsHTML = canCancel
    ? `<button class="btn btn-danger btn-sm" onclick="openCancelDialog(${b.id})">Cancel</button>`
    : `<span style="font-size:12px;color:var(--mid);font-style:italic;">${bStatus === 'CANCELLED' ? 'Cancelled' : '—'}</span>`;

  return `
    <tr>
      <td><strong>${facName}</strong></td>
      <td><code style="background:var(--smoke);padding:2px 6px;border-radius:4px;font-size:12px;">${b.studentId || '—'}</code></td>
      <td>${b.date || '—'}</td>
      <td>${st} – ${et}</td>
      <td>${notes}</td>
      <td><span class="badge ${badgeCls}">${bStatus}</span></td>
      <td>${actionsHTML}</td>
    </tr>
  `;
}
