/*
 * api.js
 * ─────────────────────────────────────────────────────────
 * All communication with the backend REST API lives here.
 * Each function maps directly to one of the endpoints
 * defined in Task 2.
 *
 * Error handling: non-ok responses now extract the backend
 * error message and throw it — callers receive a real error
 * rather than a silent null.
 * ─────────────────────────────────────────────────────────
 */

// ── Auth header helper ───────────────────────────────────

function getAuthHeader() {
  const token = localStorage.getItem('campusbook_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ── Low-level helpers ────────────────────────────────────

async function apiGet(path) {
  const res = await fetch(BASE_URL + path, {
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `GET ${path} → ${res.status}`);
  }
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `POST ${path} → ${res.status}`);
  return data;
}

async function apiPut(path, body) {
  const res = await fetch(BASE_URL + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `PUT ${path} → ${res.status}`);
  return data;
}

async function apiPatch(path, body = null) {
  const res = await fetch(BASE_URL + path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `PATCH ${path} → ${res.status}`);
  return data;
}

async function apiDelete(path) {
  const res = await fetch(BASE_URL + path, {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `DELETE ${path} → ${res.status}`);
  return data;
}

// ── Auth Endpoints ───────────────────────────────────────

async function apiLogin(username, password) {
  return apiPost('/api/auth/login', { username, password });
}

async function apiRegister(payload) {
  return apiPost('/api/auth/register', payload);
}

async function apiLogout() {
  try { await apiPost('/api/auth/logout', {}); } catch (_) { /* ignore */ }
  localStorage.removeItem('campusbook_token');
  localStorage.removeItem('campusbook_user');
}

async function apiGetCurrentUser() {
  return apiGet('/api/auth/me');
}

// ── Facility Endpoints ───────────────────────────────────

// GET /facilities
async function apiFetchAllFacilities() {
  return apiGet('/api/facilities');
}

// GET /facilities/:id
async function apiFetchFacility(id) {
  return apiGet(`/api/facilities/${id}`);
}

// POST /facilities
async function apiCreateFacility(payload) {
  return apiPost('/api/facilities', payload);
}

// PUT /facilities/:id
async function apiUpdateFacility(id, payload) {
  return apiPut(`/api/facilities/${id}`, payload);
}

// DELETE /facilities/:id
async function apiDeleteFacility(id) {
  return apiDelete(`/api/facilities/${id}`);
}

// ── Booking Endpoints ────────────────────────────────────

// GET /bookings  (all) or GET /bookings?studentId=X (filtered)
async function apiFetchAllBookings(studentId = null) {
  const qs = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
  return apiGet(`/api/bookings${qs}`);
}

// GET /bookings/:id
async function apiFetchBooking(id) {
  return apiGet(`/api/bookings/${id}`);
}

// POST /bookings
async function apiCreateBooking(payload) {
  return apiPost('/api/bookings', payload);
}

// PUT /bookings/:id  (full update — admin)
async function apiUpdateBooking(id, payload) {
  return apiPut(`/api/bookings/${id}`, payload);
}

// PATCH /bookings/:id/cancel  — soft-cancel (sets status = CANCELLED)
async function apiCancelBooking(id) {
  return apiPatch(`/api/bookings/${id}/cancel`);
}

// DELETE /bookings/:id  — hard-delete (admin only)
async function apiDeleteBooking(id) {
  return apiDelete(`/api/bookings/${id}`);
}

// ── Availability Endpoints ───────────────────────────────

// GET /availability?facilityId=X&date=YYYY-MM-DD&startTime=HH:MM&endTime=HH:MM
async function apiFetchAvailability(facilityId, date, startTime, endTime) {
  return apiGet(`/api/availability?facilityId=${facilityId}&date=${date}&startTime=${startTime}&endTime=${endTime}`);
}

// GET /availability/slots?facilityId=X&date=YYYY-MM-DD
async function apiFetchAvailableSlots(facilityId, date) {
  return apiGet(`/api/availability/slots?facilityId=${facilityId}&date=${date}`);
}
