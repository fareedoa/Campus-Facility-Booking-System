/*
 * pages/admin.js
 * ─────────────────────────────────────────────────────────
 * Admin Panel page:
 *   buildAdminHTML()  - injects the static skeleton
 *   loadAdminData()   - renders status breakdown bars,
 *                       facility utilisation chart, and
 *                       the full bookings management table
 * ─────────────────────────────────────────────────────────
 */

// ════════════════════════════════════
//  BUILD STATIC HTML SKELETON
// ════════════════════════════════════

function buildAdminHTML() {
  document.getElementById('page-admin').innerHTML = `

    <div class="section-header">
      <div>
        <div class="section-title">Admin Panel</div>
        <div class="section-sub">Manage facilities and monitor all bookings</div>
      </div>
    </div>

    <!-- Top analytics row -->
    <div class="grid-2" style="margin-bottom:28px;">

      <!-- Booking status breakdown -->
      <div class="card">
        <div class="card-header">
          <div class="card-header-title">Booking Status Overview</div>
          <button class="btn btn-outline btn-sm" onclick="loadAdminData()">↺ Refresh</button>
        </div>
        <div class="card-body" id="adminStatus"></div>
      </div>

      <!-- Facility utilisation bars -->
      <div class="card">
        <div class="card-header">
          <div class="card-header-title">Facility Utilisation</div>
        </div>
        <div class="card-body" id="adminUtil"></div>
      </div>

    </div>

    <!-- All bookings management table -->
    <div class="card">
      <div class="card-header">
        <div class="card-header-title">All Bookings</div>
        <button class="btn btn-primary btn-sm" onclick="openBookingModal()">+ Add Booking</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Facility</th>
              <th>Date</th>
              <th>Time</th>
              <th>User</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="adminBookingsTable"></tbody>
        </table>
      </div>
    </div>
  `;
}

// ════════════════════════════════════
//  RENDER ADMIN DATA
// ════════════════════════════════════

function loadAdminData() {
  _renderStatusBreakdown();
  _renderUtilisationBars();
  _renderAdminBookingsTable();
}

function _renderStatusBreakdown() {
  const el = document.getElementById('adminStatus');
  if (!el) return;

  const counts = { Confirmed: 0, Pending: 0, Cancelled: 0, Completed: 0 };
  bookings.forEach(b => { if (counts[b.status] !== undefined) counts[b.status]++; });
  const total = bookings.length || 1;

  const barColors = {
    Confirmed: 'var(--forest)',
    Pending:   'var(--gold)',
    Cancelled: 'var(--crimson)',
    Completed: 'var(--sage)',
  };

  el.innerHTML = Object.entries(counts).map(([status, count]) => `
    <div style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;">
        <span style="font-weight:600">${status}</span>
        <span style="color:var(--mid)">${count}</span>
      </div>
      <div style="height:6px;background:var(--smoke);border-radius:4px;overflow:hidden;">
        <div style="
          height:100%; border-radius:4px;
          background:${barColors[status]};
          width:${Math.round((count / total) * 100)}%;
          transition:width .5s ease;">
        </div>
      </div>
    </div>
  `).join('');
}

function _renderUtilisationBars() {
  const el = document.getElementById('adminUtil');
  if (!el) return;

  const util = facilities
    .map(f => {
      const confirmed = bookings.filter(
        b => b.facility_id === f.id && b.status === 'Confirmed'
      ).length;
      return {
        name: f.name.split(' ').slice(0, 3).join(' '),
        pct:  Math.min(100, confirmed * 12),
      };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  el.innerHTML = util.map(u => `
    <div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
        <span>${u.name}</span>
        <span style="color:var(--mid)">${u.pct}%</span>
      </div>
      <div style="height:5px;background:var(--smoke);border-radius:3px;overflow:hidden;">
        <div style="
          height:100%; border-radius:3px;
          background:linear-gradient(90deg, var(--forest), var(--sage));
          width:${u.pct}%; transition:width .5s;">
        </div>
      </div>
    </div>
  `).join('');
}

function _renderAdminBookingsTable() {
  const tbody = document.getElementById('adminBookingsTable');
  if (!tbody) return;

  if (!bookings.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:40px;color:var(--mid);">
          No bookings yet
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td>${b.facility_name || getFacilityName(b.facility_id)}</td>
      <td>${b.date}</td>
      <td>${b.start_time}–${b.end_time}</td>
      <td>${b.user_name || 'User #' + b.user_id}</td>
      <td><span class="badge badge-${b.status.toLowerCase()}">${b.status}</span></td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline btn-sm" onclick="openEditModal(${b.id})">Edit</button>
          <button class="btn btn-danger btn-sm"  onclick="cancelBooking(${b.id})">Cancel</button>
        </div>
      </td>
    </tr>
  `).join('');
}
