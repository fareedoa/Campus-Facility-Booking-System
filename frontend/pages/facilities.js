/*
 * pages/facilities.js
 * ─────────────────────────────────────────────────────────
 * Facilities page.
 *
 * FIXED:
 *   - Availability badge checks b.status === 'CONFIRMED' (uppercase)
 *   - Uses b.facility?.id to match API response structure
 *   - selectFacilityAvail() defers DOM access until after page navigation
 * ─────────────────────────────────────────────────────────
 */

const FACILITY_EMOJIS = {
  'Lecture Hall': '🏛',
  'Lab': '🔬',
  'Study Room': '📚',
  'Conference': '🤝',
  'Sports': '⚽',
  'default': '🏢',
};

const FACILITY_GRADIENTS = {
  'Lecture Hall': 'linear-gradient(135deg, #1a3d2b, #2d5a3f)',
  'Lab': 'linear-gradient(135deg, #1a2a4a, #2d4a7a)',
  'Study Room': 'linear-gradient(135deg, #4a2d1a, #7a4d2d)',
  'Conference': 'linear-gradient(135deg, #2d1a4a, #5a3d7a)',
  'Sports': 'linear-gradient(135deg, #1a4a2a, #3d7a4a)',
  'default': 'linear-gradient(135deg, #2a2a3a, #4a4a5a)',
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
      <div class="chip active"   onclick="setFilter('all', this)">All</div>
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
  const q = (document.getElementById('facilitySearch')?.value || '').toLowerCase();
  const list = facilities.filter(f => {
    const matchText = !q || f.name.toLowerCase().includes(q) || (f.location || '').toLowerCase().includes(q);
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
  // FIXED: use uppercase status and b.facility?.id to match API response
  const confirmedBookings = bookings.filter(b => {
    const fid = b.facility?.id || b.facilityId;
    return fid == f.id && (b.status || '').toUpperCase() === 'CONFIRMED';
  }).length;

  const utilPct = Math.min(100, Math.round((confirmedBookings / 8) * 100));
  const isAvail = confirmedBookings < 3;
  const gradient = FACILITY_GRADIENTS[f.type] || FACILITY_GRADIENTS.default;
  const emoji = FACILITY_EMOJIS[f.type] || FACILITY_EMOJIS.default;

  return `
    <div class="facility-card">

      <!-- Card image area -->
      <div class="facility-img" style="background:${gradient}">
        <span class="facility-emoji">${emoji}</span>
        <span class="facility-tag">${f.type || 'General'}</span>
        <span class="avail-badge ${isAvail ? 'open' : 'busy'}">
          ${isAvail ? 'Available' : 'Busy'}
        </span>
      </div>

      <!-- Card body -->
      <div class="facility-body">
        <div class="facility-name">${f.name}</div>
        <div class="facility-meta">
          <div class="facility-meta-item">📍 ${f.location || 'On Campus'}</div>
          <div class="facility-meta-item">👥 ${f.capacity || '—'}</div>
        </div>

        <!-- Utilisation bar -->
        <div class="capacity-bar">
          <div class="capacity-fill" style="width:${utilPct}%"></div>
        </div>
        <div style="font-size:11px;color:var(--mid);margin-top:4px;">
          ${utilPct}% utilisation today
        </div>

        <!-- Action buttons -->
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-primary btn-sm"
            onclick="selectFacilityAvail(${f.id})">Check Slots</button>
          <button class="btn btn-gold btn-sm"
            onclick="quickBook(${f.id})">Book Now</button>
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

/** Jump to Availability page, pre-select this facility */
function selectFacilityAvail(id) {
  // Navigate first, then populate the select — avoids race condition
  // where availFacility select doesn't exist until page builds
  showPage('availability', document.querySelector('.nav-item[onclick*="availability"]'));
  setTimeout(() => {
    const el = document.getElementById('availFacility');
    if (el) el.value = id;
    selectedDate = fmtDate(new Date());
    renderCalendar();
    loadSlots();
  }, 50);
}

/** Open booking modal with this facility pre-selected */
function quickBook(id) {
  const el = document.getElementById('formFacility');
  if (el) el.value = id;
  updateBookingSummary();
  openBookingModal();
}

// ════════════════════════════════════
//  ADMIN — DELETE FACILITY
// ════════════════════════════════════

// Use a simple custom approach: temporarily store the pending facility ID
// and show the existing deleteDialog with a different message
let _pendingFacilityDeleteId = null;

function deleteFacility(id) {
  const f = facilities.find(x => x.id == id);
  if (!f) return;
  _pendingFacilityDeleteId = id;

  // Populate the deleteDialog with facility info (re-using the booking delete dialog)
  const infoEl = document.getElementById('deleteDialogInfo');
  if (infoEl) {
    infoEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:6px;">
        <div><strong>🏛 Facility:</strong> ${f.name}</div>
        <div><strong>📍 Location:</strong> ${f.location || 'On Campus'}</div>
        <div><strong>👥 Capacity:</strong> ${f.capacity || '—'}</div>
        <div style="margin-top:8px;padding:10px;background:rgba(192,57,43,0.1);border-radius:8px;font-size:12px;color:var(--crimson);">
          ⚠️ This will also delete all bookings for this facility.
        </div>
      </div>`;
  }

  // Override the confirm button to handle facility deletion
  const confirmBtn = document.getElementById('deleteDialogConfirmBtn');
  if (confirmBtn) {
    // Swap handler temporarily
    confirmBtn.onclick = confirmFacilityDelete;
  }

  document.getElementById('deleteDialog').classList.add('open');
}

async function confirmFacilityDelete() {
  if (_pendingFacilityDeleteId === null) return;
  const btn = document.getElementById('deleteDialogConfirmBtn');
  btn.innerHTML = '<span class="spinner"></span> Deleting…';
  btn.disabled = true;

  try {
    await apiDeleteFacility(_pendingFacilityDeleteId);
    facilities = facilities.filter(f => f.id != _pendingFacilityDeleteId);
    bookings = bookings.filter(b => (b.facility?.id || b.facilityId) != _pendingFacilityDeleteId);
    populateFacilitySelects();
    renderFacilities();
    closeModal('deleteDialog');
    toast('Facility deleted', 'error');
    refreshAllPages();
  } catch (err) {
    toast(err.message || 'Delete failed', 'error');
  } finally {
    btn.innerHTML = 'Yes, Delete It';
    btn.disabled = false;
    // Restore default booking-delete handler
    btn.onclick = confirmDeleteBooking;
    _pendingFacilityDeleteId = null;
  }
}
