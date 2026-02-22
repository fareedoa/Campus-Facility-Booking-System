/*
 * pages/docs.js
 * ─────────────────────────────────────────────────────────
 * API Documentation page:
 *   buildDocsHTML() - injects the static skeleton container
 *   renderDocs()    - generates the styled endpoint cards
 *                     for all 9 REST API endpoints
 * ─────────────────────────────────────────────────────────
 */

// ── Endpoint definitions ─────────────────────────────────
const API_ENDPOINTS = [
  {
    method:   'GET',
    path:     '/facilities',
    desc:     'Retrieve all campus facilities.',
    response: 'Array of facility objects: [ { id, name, location, capacity, type } ]',
    body:     null,
    query:    null,
  },
  {
    method:   'GET',
    path:     '/facilities/{id}',
    desc:     'Retrieve a single facility by its ID. Returns 404 if not found.',
    response: 'Single facility object: { id, name, location, capacity, type }',
    body:     null,
    query:    null,
  },
  {
    method:   'POST',
    path:     '/facilities',
    desc:     'Create a new campus facility. Requires admin privileges.',
    response: '201 Created — the new facility object.',
    body:     '{\n  "name":     "Engineering Lecture Hall A",\n  "location": "Block C, Level 2",\n  "capacity": 200,\n  "type":     "Lecture Hall"\n}',
    query:    null,
  },
  {
    method:   'DELETE',
    path:     '/facilities/{id}',
    desc:     'Delete a facility and all its associated bookings. Requires admin privileges.',
    response: '204 No Content',
    body:     null,
    query:    null,
  },
  {
    method:   'GET',
    path:     '/bookings',
    desc:     'Retrieve all bookings. Returns joined facility and user names.',
    response: 'Array of booking objects: [ { id, facility_id, facility_name, user_id, user_name, date, start_time, end_time, status } ]',
    body:     null,
    query:    null,
  },
  {
    method:   'POST',
    path:     '/bookings',
    desc:     'Create a new booking. The server should validate for conflicts before inserting.',
    response: '201 Created — the new booking object.',
    body:     '{\n  "facility_id": 1,\n  "user_id":     1,\n  "date":        "2026-03-10",\n  "start_time":  "09:00",\n  "end_time":    "09:30",\n  "status":      "Confirmed"\n}',
    query:    null,
  },
  {
    method:   'PUT',
    path:     '/bookings/{id}',
    desc:     'Update an existing booking. All fields are optional — send only what needs changing.',
    response: '200 OK — the updated booking object.',
    body:     '{\n  "date":       "2026-03-11",   // optional\n  "start_time": "10:00",        // optional\n  "end_time":   "10:30",        // optional\n  "status":     "Cancelled"     // optional\n}',
    query:    null,
  },
  {
    method:   'DELETE',
    path:     '/bookings/{id}',
    desc:     'Cancel (delete) a booking by its ID.',
    response: '204 No Content',
    body:     null,
    query:    null,
  },
  {
    method:   'GET',
    path:     '/availability',
    desc:     'Check available time slots for a facility on a given date.',
    response: 'Array of slot objects: [ { start_time, end_time, available: true/false } ]',
    body:     null,
    query:    '?facility_id=1&date=2026-03-10',
  },
];

// ── Method colour scheme ─────────────────────────────────
const METHOD_COLORS = {
  GET:    { text: '#2d5a3f', bg: 'rgba(26,61,43,.1)' },
  POST:   { text: '#1a2a6a', bg: 'rgba(26,42,106,.1)' },
  PUT:    { text: '#7a4a1a', bg: 'rgba(122,74,26,.1)' },
  DELETE: { text: '#6a1a1a', bg: 'rgba(106,26,26,.1)' },
};

// ════════════════════════════════════
//  BUILD STATIC HTML SKELETON
// ════════════════════════════════════

function buildDocsHTML() {
  document.getElementById('page-docs').innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">API Documentation</div>
        <div class="section-sub">RESTful endpoints for the Campus Facility Booking System</div>
      </div>
    </div>
    <div id="docsContent"></div>
  `;
}

// ════════════════════════════════════
//  RENDER DOCS CONTENT
// ════════════════════════════════════

function renderDocs() {
  const container = document.getElementById('docsContent');
  if (!container) return;

  container.innerHTML = `

    <!-- Base URL card -->
    <div class="card" style="margin-bottom:24px;">
      <div class="card-header">
        <div class="card-header-title">Base URL</div>
      </div>
      <div class="card-body">
        <code style="
          background:var(--surface); padding:10px 16px;
          border-radius:8px; font-size:14px; display:block;
          color:var(--forest); border:1px solid var(--border);">
          ${BASE_URL}
        </code>
        <p style="margin-top:12px;font-size:13px;color:var(--mid);">
          All endpoints accept and return JSON.<br/>
          Include <code style="background:var(--smoke);padding:1px 6px;border-radius:4px;">
          Content-Type: application/json</code> on all POST and PUT requests.
        </p>
      </div>
    </div>

    <!-- Endpoint cards -->
    ${API_ENDPOINTS.map(e => _endpointCardHTML(e)).join('')}
  `;
}

function _endpointCardHTML(e) {
  const col = METHOD_COLORS[e.method] || METHOD_COLORS.GET;

  return `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <span style="
            padding:4px 12px; border-radius:6px;
            font-size:11px; font-weight:800; letter-spacing:1px;
            background:${col.bg}; color:${col.text};">
            ${e.method}
          </span>
          <code style="font-size:15px;font-weight:600;color:var(--ink);">
            ${e.path}${e.query || ''}
          </code>
        </div>
      </div>
      <div class="card-body">
        <p style="font-size:14px;color:var(--ink);margin-bottom:12px;">${e.desc}</p>

        ${e.body ? `
          <div style="margin-bottom:12px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--mid);margin-bottom:6px;">
              Request Body
            </div>
            <pre style="
              background:var(--surface); padding:14px; border-radius:8px;
              font-size:13px; color:var(--forest); border:1px solid var(--border);
              overflow-x:auto; font-family:'Courier New',monospace; line-height:1.6;">
${e.body}</pre>
          </div>
        ` : ''}

        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--mid);margin-bottom:4px;">
            Response
          </div>
          <div style="font-size:13px;color:var(--mid);">${e.response}</div>
        </div>
      </div>
    </div>
  `;
}
