/*
 * pages/dashboard.js
 * ─────────────────────────────────────────────────────────
 * Dashboard page.
 *
 * FIXED:
 *   - All status comparisons use UPPERCASE to match API ('CONFIRMED' not 'Confirmed')
 *   - Field name reads use b.startTime / b.endTime (camelCase from API)
 *   - Displays booked facility name via b.facility?.name
 * ─────────────────────────────────────────────────────────
 */

function buildDashboardHTML() {
  document.getElementById('page-dashboard').innerHTML = `

    <!-- Hero Banner -->
    <div class="hero-banner">
      <div class="hero-greeting">Welcome back</div>
      <h1 class="hero-title">Book your next<br><span>campus space</span> today</h1>
      <p class="hero-sub">Find and reserve lecture halls, labs, study rooms and more — all in one place.</p>
      <div class="hero-actions">
        <button class="btn btn-gold" onclick="showPage('availability')">
          Check Availability
        </button>
        <button class="btn btn-outline" style="color:var(--cream);border-color:rgba(245,240,232,0.3);" onclick="showPage('facilities')">
          Browse Facilities
        </button>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Facilities</div>
        <div class="stat-value" id="statFacilities">—</div>
        <div class="stat-change">Available on campus</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Confirmed</div>
        <div class="stat-value" id="statConfirmed">—</div>
        <div class="stat-change">Active reservations</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pending</div>
        <div class="stat-value" id="statPending">—</div>
        <div class="stat-change">Awaiting confirmation</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Cancelled</div>
        <div class="stat-value" id="statCancelled">—</div>
        <div class="stat-change">Cancelled bookings</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Completed</div>
        <div class="stat-value" id="statCompleted">—</div>
        <div class="stat-change">Past bookings</div>
      </div>
    </div>

    <!-- Bottom two-column row -->
    <div class="grid-2">

      <!-- Recent Activity feed -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-header-title">Recent Bookings</div>
            <div style="font-size:12px;color:var(--mid);margin-top:2px;">Your latest activity</div>
          </div>
          <button class="btn btn-outline btn-sm"
            onclick="showPage('bookings', document.querySelector('[onclick*=bookings]'))">
            View All
          </button>
        </div>
        <div class="card-body activity-feed" id="recentActivity"></div>
      </div>

      <!-- Chart + quick stats -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-header-title">Booking Activity</div>
            <div style="font-size:12px;color:var(--mid);margin-top:2px;">Bookings per day this week</div>
          </div>
        </div>
        <div class="card-body">
          <div class="mini-chart" id="miniChart"></div>
        </div>
        <div class="card-header" style="border-top:1px solid var(--smoke);border-bottom:none;padding-top:16px;">
          <div class="card-header-title">Quick Stats</div>
        </div>
        <div class="card-body" id="quickStats" style="padding-top:8px;"></div>
      </div>

    </div>
  `;
}

// ════════════════════════════════════
//  RENDER DYNAMIC DATA
// ════════════════════════════════════

function renderDashboard() {
  const up = (v) => (v || '').toUpperCase();
  // FIXED: compare uppercase status values as returned by the API
  const confirmed = bookings.filter(b => up(b.status) === 'CONFIRMED').length;
  const pending = bookings.filter(b => up(b.status) === 'PENDING').length;
  const cancelled = bookings.filter(b => up(b.status) === 'CANCELLED').length;
  const completed = bookings.filter(b => up(b.status) === 'COMPLETED').length;

  document.getElementById('statFacilities').textContent = facilities.length;
  document.getElementById('statConfirmed').textContent = confirmed;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statCancelled').textContent = cancelled;
  document.getElementById('statCompleted').textContent = completed;

  _renderActivityFeed();
  _renderMiniChart();
  _renderQuickStats();
}

function _renderActivityFeed() {
  const feed = document.getElementById('recentActivity');
  if (!feed) return;

  const statusColors = {
    CONFIRMED: '#1a3d2b',
    PENDING: '#7a5a00',
    CANCELLED: '#8b2e2e',
    COMPLETED: '#2d5a3f',
  };
  const statusIcons = {
    CONFIRMED: '🟢',
    PENDING: '🟡',
    CANCELLED: '🔴',
    COMPLETED: '✅',
  };

  const recent = bookings.slice(0, 5);

  if (!recent.length) {
    feed.innerHTML = `
      <div class="empty-state" style="padding:30px">
        <div class="empty-icon">📋</div>
        <p>No recent activity yet</p>
      </div>`;
    return;
  }

  feed.innerHTML = recent.map(b => {
    const status = (b.status || 'CONFIRMED').toUpperCase();
    const facName = b.facility?.name || getFacilityName(b.facility?.id || b.facilityId);
    const st = b.startTime || b.start_time || '';
    const et = b.endTime || b.end_time || '';
    return `
    <div class="activity-item">
      <div class="activity-dot" style="background:${statusColors[status] || 'var(--smoke)'}22">
        ${statusIcons[status] || '📌'}
      </div>
      <div>
        <div class="activity-text">${facName}</div>
        <div class="activity-time">
          ${b.date} · ${st}–${et} ·
          <span style="color:var(--forest);font-weight:600">${status}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function _renderMiniChart() {
  const chart = document.getElementById('miniChart');
  if (!chart) return;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(monday.getDate() + mondayOffset);

  const counts = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const dateStr = fmtDate(d);
    counts.push(bookings.filter(b => b.date === dateStr).length);
  }

  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) {
    chart.innerHTML = `
      <div class="empty-state" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;min-height:120px;">
        <div class="empty-icon">📊</div>
        <p style="margin:8px 0 0 0;">No bookings this week</p>
      </div>`;
    return;
  }

  const max = Math.max(...counts, 1);
  chart.innerHTML = counts.map((c, i) => `
    <div class="bar-item">
      <div class="bar" style="height:${(c / max) * 52}px" title="${c} bookings"></div>
      <span class="bar-label">${days[i]}</span>
    </div>
  `).join('');
}

function _renderQuickStats() {
  const qs = document.getElementById('quickStats');
  if (!qs) return;

  const confirmed = bookings.filter(b => (b.status || '').toUpperCase() === 'CONFIRMED').length;
  const utilRate = bookings.length > 0 ? Math.round((confirmed / bookings.length) * 100) : 0;

  let topFac = '—';
  if (bookings.length > 0) {
    const counts = {};
    bookings.forEach(b => {
      const facId = b.facility?.id || b.facilityId;
      if (facId) counts[facId] = (counts[facId] || 0) + 1;
    });
    const mostBookedId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, Object.keys(counts)[0]);
    topFac = facilities.find(f => f.id === parseInt(mostBookedId))?.name || '—';
  }

  qs.innerHTML = `
    <div class="summary-row">
      <span class="summary-key">Most booked</span>
      <span class="summary-val">${topFac}</span>
    </div>
    <div class="summary-row">
      <span class="summary-key">Confirmation rate</span>
      <span class="summary-val">${utilRate}%</span>
    </div>
    <div class="summary-row">
      <span class="summary-key">Total facilities</span>
      <span class="summary-val">${facilities.length}</span>
    </div>
  `;
}
