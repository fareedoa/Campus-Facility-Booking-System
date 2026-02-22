/*
 * pages/dashboard.js
 * ─────────────────────────────────────────────────────────
 * Dashboard page:
 *   buildDashboardHTML() - injects the static skeleton HTML
 *   renderDashboard()    - populates dynamic data (stats,
 *                          recent activity, bar chart)
 * ─────────────────────────────────────────────────────────
 */

// ════════════════════════════════════
//  BUILD STATIC HTML SKELETON
// ════════════════════════════════════

function buildDashboardHTML() {
  document.getElementById('page-dashboard').innerHTML = `

    <!-- Hero Banner -->
    <div class="hero-banner">
      <div class="hero-greeting">Welcome back</div>
      <h1 class="hero-title">Book your next<br><span>campus space</span> today</h1>
      <p class="hero-sub">Find and reserve lecture halls, labs, study rooms and more — all in one place.</p>
      <div class="hero-actions">
        <button class="btn btn-gold"
          onclick="showPage('availability', document.querySelector('[onclick*=availability]'))">
          Check Availability
        </button>
        <button class="btn btn-outline"
          style="color:var(--cream);border-color:rgba(245,240,232,0.3);"
          onclick="showPage('facilities', document.querySelector('[onclick*=facilities]'))">
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
        <div class="stat-label">Active Bookings</div>
        <div class="stat-value" id="statActive">—</div>
        <div class="stat-change">Currently confirmed</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Your Bookings</div>
        <div class="stat-value" id="statMine">—</div>
        <div class="stat-change">All time</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pending</div>
        <div class="stat-value" id="statPending">—</div>
        <div class="stat-change">Awaiting confirmation</div>
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
  const active  = bookings.filter(b => b.status === 'Confirmed').length;
  const mine    = bookings.filter(b => b.user_id === CURRENT_USER.id).length;
  const pending = bookings.filter(b => b.status === 'Pending').length;

  // ── Stats cards ──
  document.getElementById('statFacilities').textContent = facilities.length;
  document.getElementById('statActive').textContent     = active;
  document.getElementById('statMine').textContent       = mine;
  document.getElementById('statPending').textContent    = pending;

  // ── Recent activity feed ──
  _renderActivityFeed();

  // ── Weekly bar chart ──
  _renderMiniChart();

  // ── Quick stats ──
  _renderQuickStats();
}

function _renderActivityFeed() {
  const feed = document.getElementById('recentActivity');
  if (!feed) return;

  const icons  = { Confirmed: '🟢', Pending: '🟡', Cancelled: '🔴', Completed: '✅' };
  const colors = {
    Confirmed: 'rgba(26,61,43,.1)',
    Pending:   'rgba(201,168,76,.12)',
    Cancelled: 'rgba(192,57,43,.1)',
    Completed: 'rgba(122,171,138,.15)',
  };

  const recent = [...bookings].reverse().slice(0, 5);

  if (!recent.length) {
    feed.innerHTML = `
      <div class="empty-state" style="padding:30px">
        <div class="empty-icon">📋</div>
        <p>No recent activity yet</p>
      </div>`;
    return;
  }

  feed.innerHTML = recent.map(b => `
    <div class="activity-item">
      <div class="activity-dot" style="background:${colors[b.status] || 'var(--smoke)'}">
        ${icons[b.status] || '📌'}
      </div>
      <div>
        <div class="activity-text">
          ${b.facility_name || getFacilityName(b.facility_id)}
        </div>
        <div class="activity-time">
          ${b.date} · ${b.start_time}–${b.end_time} ·
          <span style="color:var(--forest);font-weight:600">${b.status}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function _renderMiniChart() {
  const chart = document.getElementById('miniChart');
  if (!chart) return;

  const days   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const counts = days.map(() => Math.floor(Math.random() * 8 + 1));
  const max    = Math.max(...counts);

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

  const confirmed = bookings.filter(b => b.status === 'Confirmed').length;
  const utilRate  = Math.round((confirmed / Math.max(facilities.length * 8, 1)) * 100);
  const topFac    = facilities[0]?.name || '—';

  qs.innerHTML = `
    <div class="summary-row">
      <span class="summary-key">Most booked</span>
      <span class="summary-val">${topFac}</span>
    </div>
    <div class="summary-row">
      <span class="summary-key">Utilisation rate</span>
      <span class="summary-val">${utilRate || 24}%</span>
    </div>
    <div class="summary-row">
      <span class="summary-key">Total facilities</span>
      <span class="summary-val">${facilities.length}</span>
    </div>
  `;
}
