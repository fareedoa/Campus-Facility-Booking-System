/*
 * modals.js
 * ─────────────────────────────────────────────────────────
 * All modal interactions:
 *   - New Booking modal  (open, summary update, submit)
 *   - Edit Booking modal (open, submit)
 *   - Add Facility modal (open, submit)
 *   - Cancel booking action
 *   - Generic close helper
 *   - Click-outside-to-close listener
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
  document.getElementById('formError').style.display = 'none';
  updateBookingSummary();
  document.getElementById('bookingModal').classList.add('open');
}

/** Update the live summary box as the user fills in the form */
function updateBookingSummary() {
  const fid   = document.getElementById('formFacility').value;
  const date  = document.getElementById('formDate').value;
  const start = document.getElementById('formStart').value;
  const end   = document.getElementById('formEnd').value;
  const box   = document.getElementById('bookingSummary');

  if (fid && date && start && end) {
    box.style.display = '';
    document.getElementById('sumFacility').textContent = getFacilityName(fid);
    document.getElementById('sumDate').textContent     = date;
    document.getElementById('sumTime').textContent     = `${start} – ${end}`;
  } else {
    box.style.display = 'none';
  }
}

async function submitBooking() {
  const fid   = document.getElementById('formFacility').value;
  const date  = document.getElementById('formDate').value;
  const start = document.getElementById('formStart').value;
  const end   = document.getElementById('formEnd').value;
  const name  = document.getElementById('formName').value;
  const email = document.getElementById('formEmail').value;
  const errEl = document.getElementById('formError');

  // ── Validation ──
  if (!fid || !date || !start || !end || !name || !email) {
    errEl.textContent    = 'Please fill in all required fields.';
    errEl.style.display  = '';
    return;
  }
  if (start >= end) {
    errEl.textContent   = 'End time must be after start time.';
    errEl.style.display = '';
    return;
  }

  // ── Conflict check (client-side) ──
  const conflict = bookings.some(b =>
    b.facility_id == fid &&
    b.date        === date &&
    b.status      !== 'Cancelled' &&
    !(end <= b.start_time || start >= b.end_time)
  );

  if (conflict) {
    errEl.textContent   = 'This time slot conflicts with an existing booking.';
    errEl.style.display = '';
    return;
  }

  errEl.style.display = 'none';

  // ── Show loading state ──
  const btn = document.getElementById('submitBtn');
  btn.innerHTML = '<span class="spinner"></span> Processing…';
  btn.disabled  = true;

  // ── Call API ──
  const payload = {
    facility_id: parseInt(fid),
    user_id:     CURRENT_USER.id,
    date,
    start_time:  start,
    end_time:    end,
    status:      'Confirmed',
  };

  const res        = await apiCreateBooking(payload);
  const fac        = facilities.find(f => f.id == fid);
  const newBooking = res || {
    id:            Date.now(),
    ...payload,
    facility_name: fac?.name,
    user_name:     name,
  };

  bookings.push(newBooking);

  // ── Reset UI ──
  btn.innerHTML = 'Confirm Booking';
  btn.disabled  = false;
  closeModal('bookingModal');
  toast(`Booked: ${fac?.name || 'Facility'} on ${date}`, 'success');
  refreshAllPages();
}

// ════════════════════════════════════
//  EDIT BOOKING MODAL
// ════════════════════════════════════

function openEditModal(id) {
  const b = bookings.find(b => b.id == id);
  if (!b) return;
  document.getElementById('editId').value     = id;
  document.getElementById('editDate').value   = b.date;
  document.getElementById('editStart').value  = b.start_time;
  document.getElementById('editEnd').value    = b.end_time;
  document.getElementById('editStatus').value = b.status;
  document.getElementById('editModal').classList.add('open');
}

async function submitEdit() {
  const id     = parseInt(document.getElementById('editId').value);
  const date   = document.getElementById('editDate').value;
  const start  = document.getElementById('editStart').value;
  const end    = document.getElementById('editEnd').value;
  const status = document.getElementById('editStatus').value;

  const payload = { date, start_time: start, end_time: end, status };
  await apiUpdateBooking(id, payload);

  const idx = bookings.findIndex(b => b.id == id);
  if (idx > -1) bookings[idx] = { ...bookings[idx], ...payload };

  closeModal('editModal');
  toast('Booking updated successfully', 'success');
  refreshAllPages();
}

// ════════════════════════════════════
//  CANCEL BOOKING
// ════════════════════════════════════

async function cancelBooking(id) {
  if (!confirm('Cancel this booking? This cannot be undone.')) return;
  await apiCancelBooking(id);
  const idx = bookings.findIndex(b => b.id == id);
  if (idx > -1) bookings[idx].status = 'Cancelled';
  toast('Booking cancelled', 'error');
  refreshAllPages();
}

// ════════════════════════════════════
//  ADD FACILITY MODAL
// ════════════════════════════════════

function openAddFacilityModal() {
  document.getElementById('facilityModal').classList.add('open');
}

async function submitFacility() {
  const name     = document.getElementById('facName').value.trim();
  const location = document.getElementById('facLocation').value.trim();
  const capacity = document.getElementById('facCapacity').value.trim();
  const type     = document.getElementById('facType').value;

  if (!name || !location || !capacity) {
    toast('Please fill in all fields', 'error');
    return;
  }

  const payload = { name, location, capacity: parseInt(capacity), type };
  const res     = await apiCreateFacility(payload);
  const newFac  = res || { id: Date.now(), ...payload };

  facilities.push(newFac);
  populateFacilitySelects();
  closeModal('facilityModal');

  // Clear inputs for next use
  ['facName', 'facLocation', 'facCapacity'].forEach(id => {
    document.getElementById(id).value = '';
  });

  toast(`Facility "${name}" added successfully`, 'success');
  renderFacilities();
}
