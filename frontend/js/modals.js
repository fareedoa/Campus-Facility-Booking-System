/*
 * modals.js
 * ─────────────────────────────────────────────────────────
 * All modal interactions:
 *   - New Booking modal  (open, summary update, submit)
 *   - Edit Booking modal (open, submit)
 *   - Cancel booking action (soft-cancel via PATCH)
 *   - Delete booking action (hard-delete via DELETE)
 *   - Generic close helper
 *   - Click-outside-to-close listener
 *
 * FIXED:
 *   - submitBooking() no longer falls back to a mock local object;
 *     real API errors are shown to the user.
 *   - submitEdit() now sends camelCase field names matching the Java DTO.
 *   - submitEdit() includes status so admins can change it.
 *   - apiCancelBooking now uses PATCH /cancel endpoint.
 * ─────────────────────────────────────────────────────────
 */

// ════════════════════════════════════
//  GENERIC CLOSE
// ════════════════════════════════════

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Close any modal by clicking outside it
window.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ════════════════════════════════════
//  NEW BOOKING MODAL
// ════════════════════════════════════

function openBookingModal() {
  const errEl = document.getElementById('formError');
  if (errEl) errEl.style.display = 'none';

  // Student ID must be typed manually since students don't sign in
  const sidEl = document.getElementById('formStudentId');
  if (sidEl) sidEl.value = '';

  updateBookingSummary();
  document.getElementById('bookingModal').classList.add('open');
}

/** Auto-set end time to 30 minutes after start time */
function autoSetEndTime() {
  const startInput = document.getElementById('formStart');
  const endInput = document.getElementById('formEnd');

  if (!startInput.value) return;

  const [hours, minutes] = startInput.value.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0);
  startDate.setMinutes(startDate.getMinutes() + 30);

  const endHours = String(startDate.getHours()).padStart(2, '0');
  const endMinutes = String(startDate.getMinutes()).padStart(2, '0');
  endInput.value = `${endHours}:${endMinutes}`;
}

/** Update the live summary box as the user fills in the form */
function updateBookingSummary() {
  const fid = document.getElementById('formFacility')?.value;
  const date = document.getElementById('formDate')?.value;
  const start = document.getElementById('formStart')?.value;
  const end = document.getElementById('formEnd')?.value;
  const box = document.getElementById('bookingSummary');

  if (fid && date && start && end) {
    if (box) box.style.display = '';
    const sumFac = document.getElementById('sumFacility');
    const sumDate = document.getElementById('sumDate');
    const sumTime = document.getElementById('sumTime');
    if (sumFac) sumFac.textContent = getFacilityName(fid);
    if (sumDate) sumDate.textContent = prettyDate(date);
    if (sumTime) sumTime.textContent = `${start} – ${end}`;
  } else {
    if (box) box.style.display = 'none';
  }
}

async function submitBooking() {
  const fid = document.getElementById('formFacility').value;
  const date = document.getElementById('formDate').value;
  const start = document.getElementById('formStart').value;
  const end = document.getElementById('formEnd').value;
  const studentId = document.getElementById('formStudentId').value.trim();
  const notes = document.getElementById('formNotes')?.value?.trim() || '';
  const errEl = document.getElementById('formError');

  // ── Client-side validation ──
  if (!fid || !date || !start || !end || !studentId) {
    errEl.textContent = 'Please fill in all required fields.';
    errEl.style.display = '';
    return;
  }
  if (start >= end) {
    errEl.textContent = 'End time must be after start time.';
    errEl.style.display = '';
    return;
  }

  // ── Past-time validation ──
  const todayStr = fmtDate(new Date());
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const [sh, sm] = start.split(':').map(Number);
  const startMins = sh * 60 + sm;

  if (date < todayStr) {
    errEl.textContent = 'Cannot book a date in the past. Please select today or a future date.';
    errEl.style.display = '';
    return;
  }
  if (date === todayStr && startMins <= nowMinutes) {
    errEl.textContent = `The time slot ${start} has already passed. Please choose a future time.`;
    errEl.style.display = '';
    return;
  }

  // ── Operating hours: 06:00 – 19:00 ──
  const OPEN_MINUTES = 6 * 60;   // 06:00
  const CLOSE_MINUTES = 19 * 60;  // 19:00
  const [eh, em] = end.split(':').map(Number);
  const endMins = eh * 60 + em;

  if (startMins < OPEN_MINUTES) {
    errEl.textContent = 'Bookings cannot start before 6:00 AM. Campus opens at 6:00 AM.';
    errEl.style.display = '';
    return;
  }
  if (endMins > CLOSE_MINUTES) {
    errEl.textContent = 'Bookings cannot end after 7:00 PM. Campus closes at 7:00 PM.';
    errEl.style.display = '';
    return;
  }

  errEl.style.display = 'none';

  const btn = document.getElementById('submitBtn');
  btn.innerHTML = '<span class="spinner"></span> Processing…';
  btn.disabled = true;

  const payload = {
    facilityId: parseInt(fid),
    studentId,
    date,
    startTime: start,
    endTime: end,
    notes,
  };

  try {
    // ── Call API — throws on failure ──
    const res = await apiCreateBooking(payload);
    bookings.unshift(res);          // add to front (API returns newest first)

    populateFacilitySelects();
    closeModal('bookingModal');
    toast(`Booked: ${getFacilityName(fid)} on ${date}`, 'success');
    refreshAllPages();
  } catch (err) {
    // Show real backend error message to the user
    errEl.textContent = err.message || 'Booking failed. Please try again.';
    errEl.style.display = '';
  } finally {
    btn.innerHTML = 'Confirm Booking';
    btn.disabled = false;
  }
}

// ════════════════════════════════════
//  EDIT BOOKING MODAL
// ════════════════════════════════════

function openEditModal(id) {
  const b = bookings.find(b => b.id == id);
  if (!b) return;
  document.getElementById('editId').value = id;
  document.getElementById('editDate').value = b.date;
  // API returns camelCase: startTime / endTime
  document.getElementById('editStart').value = b.startTime || b.start_time || '';
  document.getElementById('editEnd').value = b.endTime || b.end_time || '';
  document.getElementById('editStatus').value = b.status || 'CONFIRMED';
  document.getElementById('editModal').classList.add('open');
}

async function submitEdit() {
  const id = parseInt(document.getElementById('editId').value);
  const date = document.getElementById('editDate').value;
  const start = document.getElementById('editStart').value;
  const end = document.getElementById('editEnd').value;
  const status = document.getElementById('editStatus').value;

  const original = bookings.find(b => b.id == id);
  if (!original) return;

  // Build a full BookingRequest payload (backend requires all fields on PUT)
  const payload = {
    facilityId: original.facility?.id || original.facility_id,
    studentId: original.studentId || original.student_id,
    date,
    startTime: start,   // camelCase matching Java DTO
    endTime: end,
    status,
    notes: original.notes || '',
  };

  try {
    const updated = await apiUpdateBooking(id, payload);
    const idx = bookings.findIndex(b => b.id == id);
    if (idx > -1) bookings[idx] = updated;

    closeModal('editModal');
    toast('Booking updated successfully', 'success');
    refreshAllPages();
  } catch (err) {
    toast(err.message || 'Update failed', 'error');
  }
}

// ════════════════════════════════════
//  CANCEL BOOKING DIALOG
// ════════════════════════════════════

let _pendingCancelId = null;
let _pendingDeleteId = null;

function openCancelDialog(id) {
  const b = bookings.find(b => b.id == id);
  if (!b) return;
  _pendingCancelId = id;

  const facName = b.facility?.name || getFacilityName(b.facility_id || b.facilityId);
  const st = b.startTime || b.start_time || '';
  const et = b.endTime || b.end_time || '';

  document.getElementById('cancelDialogInfo').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:6px;">
      <div><strong>📍 Facility:</strong> ${facName}</div>
      <div><strong>📅 Date:</strong> ${b.date || '—'}</div>
      <div><strong>⏰ Time:</strong> ${st} – ${et}</div>
      <div><strong>🏷 Status:</strong> ${b.status || '—'}</div>
    </div>`;

  document.getElementById('cancelDialog').classList.add('open');
}

async function confirmCancelBooking() {
  if (_pendingCancelId === null) return;
  const btn = document.getElementById('cancelDialogConfirmBtn');
  btn.innerHTML = '<span class="spinner"></span> Cancelling…';
  btn.disabled = true;

  try {
    const updated = await apiCancelBooking(_pendingCancelId);
    const idx = bookings.findIndex(b => b.id == _pendingCancelId);
    if (idx > -1) bookings[idx] = updated;   // replace with fresh server object

    closeModal('cancelDialog');
    toast('Booking cancelled', 'error');
    refreshAllPages();
  } catch (err) {
    toast(err.message || 'Cancel failed', 'error');
  } finally {
    btn.innerHTML = 'Yes, Cancel It';
    btn.disabled = false;
    _pendingCancelId = null;
  }
}

// ════════════════════════════════════
//  DELETE BOOKING DIALOG
// ════════════════════════════════════

function openDeleteDialog(id) {
  const b = bookings.find(b => b.id == id);
  if (!b) return;
  _pendingDeleteId = id;

  const facName = b.facility?.name || getFacilityName(b.facility_id || b.facilityId);
  const st = b.startTime || b.start_time || '';
  const et = b.endTime || b.end_time || '';

  document.getElementById('deleteDialogInfo').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:6px;">
      <div><strong>📍 Facility:</strong> ${facName}</div>
      <div><strong>📅 Date:</strong> ${b.date || '—'}</div>
      <div><strong>⏰ Time:</strong> ${st} – ${et}</div>
      <div><strong>🏷 Status:</strong> ${b.status || '—'}</div>
    </div>`;

  document.getElementById('deleteDialog').classList.add('open');
}

async function confirmDeleteBooking() {
  if (_pendingDeleteId === null) return;
  const btn = document.getElementById('deleteDialogConfirmBtn');
  btn.innerHTML = '<span class="spinner"></span> Deleting…';
  btn.disabled = true;

  try {
    await apiDeleteBooking(_pendingDeleteId);
    bookings = bookings.filter(b => b.id !== _pendingDeleteId);

    closeModal('deleteDialog');
    toast('Booking deleted', 'error');
    refreshAllPages();
  } catch (err) {
    toast(err.message || 'Delete failed', 'error');
  } finally {
    btn.innerHTML = 'Yes, Delete It';
    btn.disabled = false;
    _pendingDeleteId = null;
  }
}
