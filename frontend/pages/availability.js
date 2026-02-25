/*
 * pages/availability.js
 * ─────────────────────────────────────────────────────────
 * Availability page.
 *
 * NEW / FIXED:
 *   - Past dates greyed out and unclickable
 *   - Multi-slot selection: click multiple adjacent free slots,
 *     the booking covers from the first slot's start to the
 *     last selected slot's end (e.g. 09:00 + 09:30 = 09:00–10:00)
 *   - Selected slots highlighted; button shows the combined range
 *   - Booked slots are visually blocked and unclickable
 *   - Facility select is populated by populateFacilitySelects()
 *     after page HTML is built (fixed race condition)
 * ─────────────────────────────────────────────────────────
 */

// Track multiple selected slots as an ordered array: [{start, end}, …]
let _selectedSlots = [];

// ════════════════════════════════════
//  BUILD STATIC HTML SKELETON
// ════════════════════════════════════

function buildAvailabilityHTML() {
  document.getElementById('page-availability').innerHTML = `

    <div class="section-header">
      <div>
        <div class="section-title">Check Availability</div>
        <div class="section-sub">Select a date and facility to view 30-minute time slots. You can select multiple adjacent slots.</div>
      </div>
    </div>

    <div class="avail-container">

      <!-- Left column: calendar + facility selector -->
      <div>

        <!-- Mini calendar -->
        <div class="mini-cal">
          <div class="cal-header">
            <button class="cal-nav" onclick="changeMonth(-1)">‹</button>
            <div class="cal-month" id="calMonthLabel"></div>
            <button class="cal-nav" onclick="changeMonth(1)">›</button>
          </div>
          <div class="cal-days-header">
            <div class="cal-day-label">Su</div>
            <div class="cal-day-label">Mo</div>
            <div class="cal-day-label">Tu</div>
            <div class="cal-day-label">We</div>
            <div class="cal-day-label">Th</div>
            <div class="cal-day-label">Fr</div>
            <div class="cal-day-label">Sa</div>
          </div>
          <div class="cal-days" id="calDays"></div>
        </div>

        <!-- Facility dropdown — populated by populateFacilitySelects() in app.js -->
        <div class="facility-selector">
          <div class="select-label">Select Facility</div>
          <select id="availFacility" onchange="loadSlots()">
            <option value="">— Choose a facility —</option>
          </select>
        </div>

        <!-- Selected date label -->
        <div id="selectedDateLabel"
          style="margin-top:14px;font-size:13px;color:var(--mid);"></div>
      </div>

      <!-- Right column: time slots panel -->
      <div>
        <div class="card" id="slotsCard">
          <div class="card-header">
            <div>
              <div class="card-header-title" id="slotsTitle">Select a date &amp; facility</div>
              <div style="font-size:12px;color:var(--mid);margin-top:2px;" id="slotsSubtitle">
                30-minute time slots — click to select, click again to deselect
              </div>
            </div>
            <div style="display:flex;gap:10px;font-size:12px;align-items:center;">
              <span style="color:var(--sage)">● Available</span>
              <span style="color:var(--gold)">● Selected</span>
              <span style="color:var(--crimson)">● Booked</span>
            </div>
          </div>
          <div class="card-body">
            <div id="slotsContent">
              <div class="empty-state">
                <div class="empty-icon">📅</div>
                <h3>No date selected</h3>
                <p>Pick a date and facility to see time slots</p>
              </div>
            </div>
            <!-- Book button shown when ≥1 slot selected -->
            <div id="slotBookBtnWrap" style="margin-top:16px;display:none;">
              <div id="selectedSlotsLabel"
                style="font-size:13px;color:var(--mid);margin-bottom:10px;text-align:center;"></div>
              <button class="btn btn-gold" style="width:100%"
                onclick="bookSelectedSlot()">
                Book Selected Slot(s) →
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}

// ════════════════════════════════════
//  CALENDAR RENDERING
// ════════════════════════════════════

function renderCalendar() {
  const y = calDate.getFullYear();
  const m = calDate.getMonth();

  const calMonthLabel = document.getElementById('calMonthLabel');
  if (calMonthLabel) {
    calMonthLabel.textContent =
      calDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  const firstDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayStr = fmtDate(new Date());

  let html = '';

  // Trailing days from previous month
  for (let i = 0; i < firstDow; i++) {
    const d = new Date(y, m, 1 - firstDow + i).getDate();
    html += `<div class="cal-day other-month">${d}</div>`;
  }

  // Days of the current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const isSel = dateStr === selectedDate;
    const isPast = dateStr < todayStr;
    const hasBk = bookings.some(b => b.date === dateStr);

    let cls = [];
    if (isPast) cls.push('past');
    if (isToday && !isSel) cls.push('today');
    if (isSel) cls.push('selected');
    if (hasBk && !isPast) cls.push('has-bookings');

    const click = isPast ? '' : `onclick="selectDate('${dateStr}')"`;
    html += `<div class="cal-day ${cls.join(' ')}" ${click}>${d}</div>`;
  }

  const calDays = document.getElementById('calDays');
  if (calDays) calDays.innerHTML = html;
}

function changeMonth(dir) {
  calDate.setMonth(calDate.getMonth() + dir);
  renderCalendar();
}

function selectDate(dateStr) {
  if (dateStr < fmtDate(new Date())) return;
  selectedDate = dateStr;
  _selectedSlots = [];
  renderCalendar();

  const label = document.getElementById('selectedDateLabel');
  if (label) label.textContent = `Selected: ${prettyDate(dateStr)}`;

  loadSlots();
}

// ════════════════════════════════════
//  TIME SLOTS
// ════════════════════════════════════

function loadSlots() {
  const facId = document.getElementById('availFacility')?.value;
  renderSlotsForSelected(facId);
}

async function renderSlotsForSelected(facId) {
  const titleEl = document.getElementById('slotsTitle');
  const subtitleEl = document.getElementById('slotsSubtitle');
  const contentEl = document.getElementById('slotsContent');
  const btnWrap = document.getElementById('slotBookBtnWrap');

  _selectedSlots = [];

  if (!selectedDate || !facId) {
    if (titleEl) titleEl.textContent = 'Select a date & facility';
    if (subtitleEl) subtitleEl.textContent = '30-minute time slots — click to select';
    if (contentEl) contentEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <h3>Nothing selected</h3>
        <p>Pick a date and facility to see available slots</p>
      </div>`;
    if (btnWrap) btnWrap.style.display = 'none';
    return;
  }

  const fac = facilities.find(f => f.id == facId);
  if (titleEl) titleEl.textContent = fac ? fac.name : 'Facility';
  if (subtitleEl) subtitleEl.textContent = prettyDate(selectedDate);
  if (contentEl) contentEl.innerHTML = `<div style="text-align:center;padding:40px;color:var(--mid);">Loading slots…</div>`;
  if (btnWrap) btnWrap.style.display = 'none';

  try {
    const result = await apiFetchAvailableSlots(facId, selectedDate);
    const slots = result?.slots || [];

    if (!slots.length) {
      contentEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>No slots returned</h3>
          <p>Unable to load availability for this date</p>
        </div>`;
      return;
    }

    // Store slots on the window for reference when booking
    window._currentSlots = slots;

    contentEl.innerHTML = `
      <div class="slots-grid">
        ${slots.map(s => `
          <div class="time-slot ${s.booked ? 'booked' : 'available'}"
            id="slot-${s.start.replace(':', '')}"
            data-start="${s.start}"
            data-end="${s.end}"
            data-booked="${s.booked}"
            ${s.booked ? '' : `onclick="toggleSlot('${s.start}', '${s.end}')"`}>
            <span class="slot-time">${s.start}</span>
            <div class="slot-status">${s.booked ? 'Booked' : 'Free'}</div>
          </div>
        `).join('')}
      </div>`;
  } catch (err) {
    if (contentEl) contentEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Error loading slots</h3>
        <p>${err.message || 'Unable to fetch availability'}</p>
      </div>`;
  }
}

// ════════════════════════════════════
//  MULTI-SLOT SELECTION
// ════════════════════════════════════

/**
 * Toggle a free slot on/off.
 * Rule: selected slots must be adjacent (contiguous block only).
 * Clicking a non-adjacent slot deselects everything and starts fresh.
 */
function toggleSlot(start, end) {
  const slotEl = document.getElementById('slot-' + start.replace(':', ''));
  const alreadySelected = _selectedSlots.some(s => s.start === start);

  if (alreadySelected) {
    // Deselect: only allow deselecting the first or last slot of the selection
    const idx = _selectedSlots.findIndex(s => s.start === start);
    const isFirst = idx === 0;
    const isLast = idx === _selectedSlots.length - 1;

    if (isFirst || isLast) {
      _selectedSlots.splice(idx, 1);
    } else {
      // Clicking a middle slot clears everything
      _selectedSlots = [];
    }
  } else {
    if (_selectedSlots.length === 0) {
      // First selection
      _selectedSlots = [{ start, end }];
    } else {
      // Check adjacency
      const lastEnd = _selectedSlots[_selectedSlots.length - 1].end;
      const firstStart = _selectedSlots[0].start;

      if (start === lastEnd) {
        // Append to end
        _selectedSlots.push({ start, end });
      } else if (end === firstStart) {
        // Prepend to start
        _selectedSlots.unshift({ start, end });
      } else {
        // Not adjacent — start fresh selection
        _selectedSlots = [{ start, end }];
      }
    }
  }

  _refreshSlotHighlights();
  _updateBookButton();
}

function _refreshSlotHighlights() {
  const selectedStarts = new Set(_selectedSlots.map(s => s.start));
  document.querySelectorAll('.time-slot').forEach(el => {
    const slotStart = el.dataset.start;
    const isBooked = el.dataset.booked === 'true';
    if (!isBooked) {
      el.classList.toggle('selected', selectedStarts.has(slotStart));
    }
  });
}

function _updateBookButton() {
  const btnWrap = document.getElementById('slotBookBtnWrap');
  const label = document.getElementById('selectedSlotsLabel');

  if (!_selectedSlots.length) {
    if (btnWrap) btnWrap.style.display = 'none';
    return;
  }

  const rangeStart = _selectedSlots[0].start;
  const rangeEnd = _selectedSlots[_selectedSlots.length - 1].end;
  const count = _selectedSlots.length;
  const mins = count * 30;

  if (label) {
    label.innerHTML = `
      <strong>${count} slot${count > 1 ? 's' : ''} selected</strong>
      — ${rangeStart} to ${rangeEnd} (${mins} min)`;
  }
  if (btnWrap) btnWrap.style.display = 'block';
}

// ════════════════════════════════════
//  BOOK SELECTED SLOTS
// ════════════════════════════════════

function bookSelectedSlot() {
  if (!_selectedSlots.length) return;

  const facId = document.getElementById('availFacility')?.value;
  const rangeStart = _selectedSlots[0].start;
  const rangeEnd = _selectedSlots[_selectedSlots.length - 1].end;

  const formFac = document.getElementById('formFacility');
  if (formFac) formFac.value = facId;

  const formDate = document.getElementById('formDate');
  if (formDate) formDate.value = selectedDate;

  const formStart = document.getElementById('formStart');
  if (formStart) formStart.value = rangeStart;

  const formEnd = document.getElementById('formEnd');
  if (formEnd) formEnd.value = rangeEnd;

  updateBookingSummary();
  openBookingModal();
}
