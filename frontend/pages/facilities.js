/*
 * pages/facilities.js
 * ─────────────────────────────────────────────────────────
 * Facilities page:
 *   buildFacilitiesHTML() - injects the static skeleton
 *   renderFacilities()    - renders the card grid with
 *                           search + type filtering applied
 *   setFilter()           - handles chip filter clicks
 *   selectFacilityAvail() - jumps to Availability page
 *   quickBook()           - opens booking modal pre-filled
 *   deleteFacility()      - admin-only delete action
 * ─────────────────────────────────────────────────────────
 */

// ── Visual maps ─────────────────────────────────────────

const FACILITY_EMOJIS = {
  'Lecture Hall': '🏛',
  'Lab':          '🔬',
  'Study Room':   '📚',
  'Conference':   '🤝',
  'Sports':       '⚽',
  'default':      '🏢',
};

const FACILITY_GRADIENTS = {
  'Lecture Hall': 'linear-gradient(135deg, #1a3d2b, #2d5a3f)',
  'Lab':          'linear-gradient(135deg, #1a2a4a, #2d4a7a)',
  'Study Room':   'linear-gradient(135deg, #4a2d1a, #7a4d2d)',
  'Conference':   'linear-gradient(135deg, #2d1a4a, #5a3d7a)',
  'Sports':       'linear-gradient(135deg, #1a4a2a, #3d7a4a)',
  'default':      'linear-gradient(135deg, #2a2a3a, #4a4a5a)',
};

// ════════════════════════════════════
//  BUILD STATIC HTML SKELETON
// ════════════════════════════════════

function buildFacilitiesHTML() {
  document.getElementById('page-facilities').innerHTML = `

    <div class="section-header">
      <div>
        <div class="section-title">Campus Facilities</div>
        <div class="section-sub">Browse and book available spaces</div>
      </div>
      <button class="btn btn-primary" onclick="openAddFacilityModal()"
        id="addFacilityBtn" style="display:none">
        + Add Facility
      </button>
    </div>

    <!-- Search bar -->
    <div class="search-bar">
      <div class="search-input-wrap" style="flex:1">
        <span class="search-icon">🔍</span>
        <input type="text" id="facilitySearch"
          placeholder="Search by name or location…"
          oninput="renderFacilities()"/>
      </div>
    </div>

    <!-- Type filter chips -->
    <div class="filter-chips" id="facilityFilters">
      <div class="chip active"  onclick="setFilter('all', this)">All</div>
      <div class="chip" onclick="setFilter('Lecture Hall', this)">Lecture Halls</div>
      <div class="chip" onclick="setFilter('Lab', this)">Labs</div>
      <div class="chip" onclick="setFilter('Study Room', this)">Study Rooms</div>
      <div class="chip" onclick="setFilter('Sports', this)">Sports</div>
      <div class="chip" onclick="setFilter('Conference', this)">Conference</div>
    </div>

    <!-- Facility cards grid -->
    <div class="facilities-grid" id="facilitiesGrid"></div>
  `;
}

// ════════════════════════════════════
//  RENDER FACILITIES GRID
// ════════════════════════════════════

function renderFacilities() {
  const q    = (document.getElementById('facilitySearch')?.value || '').toLowerCase();
  const list = facilities.filter(f => {
    const matchText = !q || f.name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q);
    const matchType = currentFilter === 'all' || f.type === currentFilter;
    return matchText && matchType;
  });

  const grid = document.getElementById('facilitiesGrid');
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🏛</div>
        <h3>No facilities found</h3>
        <p>Try different search terms or filters</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(f => _facilityCardHTML(f)).join('');
}

function _facilityCardHTML(f) {
  const confirmedToday = bookings.filter(
    b => b.facility_id == f.id && b.status === 'Confirmed'
  ).length;

  const utilPct  = Math.min(100, Math.round((confirmedToday / 8) * 100));
  const isAvail  = confirmedToday < 3;
  const gradient = FACILITY_GRADIENTS[f.type] || FACILITY_GRADIENTS.default;
  const emoji    = FACILITY_EMOJIS[f.type]    || FACILITY_EMOJIS.default;

  return `
    <div class="facility-card" onclick="quickBook(${f.id})">

      <!-- Card image area -->
      <div class="facility-img" style="background:${gradient}">
        <span class="facility-emoji">${emoji}</span>
        <span class="facility-tag">${f.type}</span>
        <span class="avail-badge ${isAvail ? 'open' : 'busy'}">
          ${isAvail ? 'Available' : 'Busy'}
        </span>
      </div>

      <!-- Card body -->
      <div class="facility-body">
        <div class="facility-name">${f.name}</div>
        <div class="facility-meta">
          <div class="facility-meta-item">📍 ${f.location}</div>
          <div class="facility-meta-item">👥 ${f.capacity}</div>
        </div>

        <!-- Utilisation bar -->
        <div class="capacity-bar">
          <div class="capacity-fill" style="width:${utilPct}%"></div>
        </div>
        <div style="font-size:11px;color:var(--mid);margin-top:4px;">
          ${utilPct}% utilisation today
        </div>

        <!-- Action buttons (stop propagation so card click doesn't trigger) -->
        <div style="display:flex;gap:8px;margin-top:12px;" onclick="event.stopPropagation()">
          <button class="btn btn-primary btn-sm"
            onclick="selectFacilityAvail(${f.id})">Check Slots</button>
          <button class="btn btn-gold btn-sm"
            onclick="quickBook(${f.id})">Book Now</button>
          ${isAdmin
            ? `<button class="btn btn-danger btn-sm"
                onclick="deleteFacility(${f.id})">Delete</button>`
            : ''}
        </div>
      </div>
    </div>
  `;
}

// ════════════════════════════════════
//  FILTER CHIPS
// ════════════════════════════════════

function setFilter(type, el) {
  currentFilter = type;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderFacilities();
}

// ════════════════════════════════════
//  QUICK ACTIONS
// ════════════════════════════════════

/** Jump to Availability page with this facility pre-selected */
function selectFacilityAvail(id) {
  document.getElementById('availFacility').value = id;
  selectedDate = fmtDate(new Date());
  showPage('availability', document.querySelector('[onclick*=availability]'));
  setTimeout(() => { renderCalendar(); loadSlots(); }, 100);
}

/** Open booking modal with this facility pre-selected */
function quickBook(id) {
  document.getElementById('formFacility').value = id;
  openBookingModal();
}

// ════════════════════════════════════
//  ADMIN — DELETE FACILITY
// ════════════════════════════════════

async function deleteFacility(id) {
  if (!confirm('Delete this facility? All associated bookings will also be removed.')) return;
  await apiDeleteFacility(id);
  facilities = facilities.filter(f => f.id != id);
  bookings   = bookings.filter(b => b.facility_id != id);
  populateFacilitySelects();
  renderFacilities();
  toast('Facility deleted', 'error');
}
