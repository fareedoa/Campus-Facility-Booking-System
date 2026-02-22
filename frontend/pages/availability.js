/*
 * pages/availability.js
 * ─────────────────────────────────────────────────────────
 * Availability page:
 *   buildAvailabilityHTML() - injects the static skeleton
 *   renderCalendar()        - draws the mini monthly calendar
 *   changeMonth()           - prev/next month navigation
 *   selectDate()            - user clicks a calendar day
 *   loadSlots()             - triggered when facility or date changes
 *   renderSlotsForSelected()- draws the 30-min time slot grid
 *   selectSlot()            - user clicks a free slot
 *   bookSelectedSlot()      - opens booking modal pre-filled
 * ─────────────────────────────────────────────────────────
 */

// ════════════════════════════════════
//  BUILD STATIC HTML SKELETON
// ════════════════════════════════════

function buildAvailabilityHTML() {
  document.getElementById('page-availability').innerHTML = `

    <div class="section-header">
      <div>
        <div class="section-title">Check Availability</div>
        <div class="section-sub">Select a date and facility to view 30-minute time slots</div>
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

        <!-- Facility dropdown -->
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
                30-minute time slots shown below
              </div>
            </div>
            <div style="display:flex;gap:10px;font-size:12px;align-items:center;">
              <span style="color:var(--sage)">● Available</span>
              <span style="color:var(--crimson)">● Booked</span>
            </div>
          </div>
          <div class="card-body">
            <div id="slotsContent">
              <div class="empty-state">
                <div class="empty-icon">📅</div>
                <h3>No date selected</h3>
                <p>Pick a date and facility to see available time slots</p>
              </div>
            </div>
            <div id="slotBookBtnWrap" style="margin-top:16px;display:none;">
              <button class="btn btn-gold" style="width:100%"
                onclick="bookSelectedSlot()">
                Book Selected Slot →
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

  document.getElementById('calMonthLabel').textContent =
    calDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const firstDow = new Date(y, m, 1).getDay();   // 0 = Sunday
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
    const isToday  = dateStr === todayStr;
    const isSel    = dateStr === selectedDate;
    const hasBk    = bookings.some(b => b.date === dateStr);

    const cls = [
      isToday && !isSel ? 'today'         : '',
      isSel             ? 'selected'      : '',
      hasBk             ? 'has-bookings'  : '',
    ].filter(Boolean).join(' ');

    html += `<div class="cal-day ${cls}" onclick="selectDate('${dateStr}')">${d}</div>`;
  }

  document.getElementById('calDays').innerHTML = html;
}

function changeMonth(dir) {
  calDate.setMonth(calDate.getMonth() + dir);
  renderCalendar();
}

function selectDate(dateStr) {
  selectedDate = dateStr;
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

function renderSlotsForSelected(facId) {
  const titleEl   = document.getElementById('slotsTitle');
  const subtitleEl = document.getElementById('slotsSubtitle');
  const contentEl = document.getElementById('slotsContent');
  const btnWrap   = document.getElementById('slotBookBtnWrap');

  // Nothing selected yet
  if (!selectedDate || !facId) {
    if (titleEl)   titleEl.textContent   = 'Select a date & facility';
    if (subtitleEl) subtitleEl.textContent = '30-minute time slots';
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
  if (titleEl)    titleEl.textContent    = fac ? fac.name : 'Facility';
  if (subtitleEl) subtitleEl.textContent = prettyDate(selectedDate);

  // Generate every 30-min slot from 07:00 to 21:00
  const slots = _generateSlots(facId);

  selectedSlot = null;
  if (btnWrap) btnWrap.style.display = 'none';

  if (contentEl) {
    contentEl.innerHTML = `
      <div class="slots-grid">
        ${slots.map(s => `
          <div class="time-slot ${s.booked ? 'booked' : 'available'}"
            id="slot-${s.start.replace(':', '')}"
            onclick="${s.booked ? '' : `selectSlot('${s.start}', '${s.end}')`}">
            ${s.start}
            <div class="slot-status">${s.booked ? 'Booked' : 'Free'}</div>
          </div>
        `).join('')}
      </div>`;
  }
}

/** Build the array of 30-min slot objects for a given facility + selectedDate */
function _generateSlots(facId) {
  const slots = [];
  for (let h = 7; h < 21; h++) {
    ['00', '30'].forEach(min => {
      const start  = `${String(h).padStart(2, '0')}:${min}`;
      const endH   = min === '30' ? h + 1 : h;
      const endMin = min === '30' ? '00' : '30';
      const end    = `${String(endH).padStart(2, '0')}:${endMin}`;

      const booked = bookings.some(b =>
        b.facility_id == facId &&
        b.date        === selectedDate &&
        b.status      !== 'Cancelled' &&
        b.start_time  <= start &&
        b.end_time    >  start
      );

      slots.push({ start, end, booked });
    });
  }
  return slots;
}

function selectSlot(start, end) {
  // Deselect any previously selected slot
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  const slotEl = document.getElementById('slot-' + start.replace(':', ''));
  if (slotEl) slotEl.classList.add('selected');

  selectedSlot = { start, end };
  document.getElementById('slotBookBtnWrap').style.display = 'block';
}

function bookSelectedSlot() {
  if (!selectedSlot) return;
  const facId = document.getElementById('availFacility').value;
  document.getElementById('formFacility').value = facId;
  document.getElementById('formDate').value     = selectedDate;
  document.getElementById('formStart').value    = selectedSlot.start;
  document.getElementById('formEnd').value      = selectedSlot.end;
  updateBookingSummary();
  openBookingModal();
}
