/*
 * api.js
 * ─────────────────────────────────────────────────────────
 * All communication with the backend REST API lives here.
 * Each function maps directly to one of the seven endpoints
 * defined in Task 2.
 *
 * Every function returns the parsed JSON response, or null
 * on failure — callers should always handle the null case
 * by falling back to local state.
 * ─────────────────────────────────────────────────────────
 */

// ── Low-level helpers ────────────────────────────────────

async function apiGet(path) {
  try {
    const res = await fetch(BASE_URL + path);
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API]', err.message);
    return null;
  }
}

async function apiPost(path, body) {
  try {
    const res = await fetch(BASE_URL + path, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API]', err.message);
    return null;
  }
}

async function apiPut(path, body) {
  try {
    const res = await fetch(BASE_URL + path, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PUT ${path} → ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API]', err.message);
    return null;
  }
}

async function apiDelete(path) {
  try {
    const res = await fetch(BASE_URL + path, { method: 'DELETE' });
    if (!res.ok) throw new Error(`DELETE ${path} → ${res.status}`);
    return true;
  } catch (err) {
    console.warn('[API]', err.message);
    return null;
  }
}

// ── Facility Endpoints ───────────────────────────────────

// GET /facilities
async function apiFetchAllFacilities() {
  return await apiGet('/facilities');
}

// GET /facilities/:id
async function apiFetchFacility(id) {
  return await apiGet(`/facilities/${id}`);
}

// POST /facilities
async function apiCreateFacility(payload) {
  return await apiPost('/facilities', payload);
}

// DELETE /facilities/:id
async function apiDeleteFacility(id) {
  return await apiDelete(`/facilities/${id}`);
}

// ── Booking Endpoints ────────────────────────────────────

// GET /bookings
async function apiFetchAllBookings() {
  return await apiGet('/bookings');
}

// POST /bookings
async function apiCreateBooking(payload) {
  return await apiPost('/bookings', payload);
}

// PUT /bookings/:id
async function apiUpdateBooking(id, payload) {
  return await apiPut(`/bookings/${id}`, payload);
}

// DELETE /bookings/:id
async function apiCancelBooking(id) {
  return await apiDelete(`/bookings/${id}`);
}

// ── Availability Endpoint ────────────────────────────────

// GET /availability?facility_id=X&date=YYYY-MM-DD
async function apiFetchAvailability(facilityId, date) {
  return await apiGet(`/availability?facility_id=${facilityId}&date=${date}`);
}
