/*
 * pages/admin.js
 * ─────────────────────────────────────────────────────────
 * Admin Panel page.
 *
 * FIXED:
 *   - All field names use camelCase (b.startTime, b.endTime, b.facility?.name)
 *   - Status comparisons use uppercase
 *   - Status breakdown works correctly
 *   - Notes column shown
 *   - Refresh re-fetches from API
 * ─────────────────────────────────────────────────────────
 */

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
          <button class="btn btn-outline btn-sm" onclick="refreshAdminData()">↺ Refresh</button>
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
              <th>#</th>
              <th>Facility</th>
              <th>Student ID</th>
              <th>Date</th>
              <th>Time</th>
              <th>Notes</th>
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

async function refreshAdminData() {
  try {
    const fresh = await apiFetchAllBookings();
    if (Array.isArray(fresh)) bookings = fresh;
  } catch (err) {
    toast(err.message || 'Refresh failed', 'error');
  }
  loadAdminData();
}

function loadAdminData() {
  _renderStatusBreakdown();
  _renderUtilisationBars();
  _renderAdminBookingsTable();
}

function _renderStatusBreakdown() {
  const el = document.getElementById('adminStatus');
  if (!el) return;

  // FIXED: uppercase counts to match API output
  const counts = { CONFIRMED: 0, PENDING: 0, CANCELLED: 0, COMPLETED: 0 };
  bookings.forEach(b => {
    const s = (b.status || '').toUpperCase();
    if (counts[s] !== undefined) counts[s]++;
  });
  const total = bookings.length || 1;

  const barColors = {
    CONFIRMED: 'var(--forest)',
    PENDING: 'var(--gold)',
    CANCELLED: 'var(--crimson)',
    COMPLETED: 'var(--sage)',
  };
  const labels = {
    CONFIRMED: 'Confirmed',
    PENDING: 'Pending',
    CANCELLED: 'Cancelled',
    COMPLETED: 'Completed',
  };

  el.innerHTML = Object.entries(counts).map(([status, count]) => `
    <div style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;">
        <span style="font-weight:600">${labels[status]}</span>
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
      // FIXED: uppercase status and correct facility id lookup
      const confirmed = bookings.filter(b => {
        const fid = b.facility?.id || b.facilityId;
        return fid === f.id && (b.status || '').toUpperCase() === 'CONFIRMED';
      }).length;
      return {
        name: f.name.split(' ').slice(0, 3).join(' '),
        pct: Math.min(100, confirmed * 12),
      };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  if (!util.length) {
    el.innerHTML = '<p style="color:var(--mid);font-size:13px;text-align:center;padding:20px">No data yet</p>';
    return;
  }

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
        <td colspan="8" style="text-align:center;padding:40px;color:var(--mid);">
          No bookings yet
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(b => {
    const facName = b.facility?.name || getFacilityName(b.facility?.id || b.facilityId);
    const st = b.startTime || b.start_time || '—';
    const et = b.endTime || b.end_time || '—';
    const sid = b.studentId || b.student_id || '—';
    const bStatus = (b.status || 'CONFIRMED').toUpperCase();
    const notes = b.notes ? `<span title="${b.notes}" style="font-size:12px;color:var(--mid);">${b.notes.substring(0, 25)}${b.notes.length > 25 ? '…' : ''}</span>` : '—';

    return `
    <tr>
      <td style="font-size:12px;color:var(--mid);">#${b.id}</td>
      <td><strong>${facName}</strong></td>
      <td><code style="background:var(--smoke);padding:2px 6px;border-radius:4px;font-size:12px;">${sid}</code></td>
      <td>${b.date || '—'}</td>
      <td>${st}–${et}</td>
      <td>${notes}</td>
      <td><span class="badge badge-${bStatus.toLowerCase()}">${bStatus}</span></td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline btn-sm" onclick="openEditModal(${b.id})">Edit</button>
          <button class="btn btn-danger btn-sm"  onclick="openCancelDialog(${b.id})">Cancel</button>
          <button class="btn btn-sm" style="background:#3d1515;color:#e88;border:1px solid #6b2323;" onclick="openDeleteDialog(${b.id})">Delete</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}
