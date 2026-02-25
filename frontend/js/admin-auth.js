/*
 * admin-auth.js
 * ─────────────────────────────────────────────────────────
 * Authentication guard and HTTP helpers for admin.html.
 *
 * FIXED: Removed credentials:'include' from every fetch call.
 * The JWT is stored in localStorage (Bearer token), so the browser
 * does NOT need to send cookies — credentials:include was causing
 * the CORS preflight to fail.
 * ─────────────────────────────────────────────────────────
 */

// ══ Guard — redirect to login if not authenticated ══════
function checkAdminAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    return token;
}

// ══ Get stored admin user ════════════════════════════════
function getAdminUser() {
    try {
        return JSON.parse(localStorage.getItem('adminUser')) || {};
    } catch { return {}; }
}

// ══ Logout ═══════════════════════════════════════════════
async function adminLogout() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        try {
            await fetch(BASE_URL + '/api/auth/logout', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                // No credentials:'include' — we use Bearer token only
            });
        } catch (_) { /* ignore network errors on logout */ }
    }
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'login.html';
}

// ══ Auth header helper ════════════════════════════════════
function authHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    };
}

// ══ Authenticated HTTP helpers (no credentials:include) ══

async function adminGet(path) {
    try {
        const res = await fetch(BASE_URL + path, { headers: authHeaders() });
        if (res.status === 401) { adminLogout(); return null; }
        if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn('[ADMIN API]', err.message);
        return null;
    }
}

async function adminPost(path, body) {
    try {
        const res = await fetch(BASE_URL + path, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(body),
        });
        if (res.status === 401) { adminLogout(); return null; }
        if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn('[ADMIN API]', err.message);
        return null;
    }
}

async function adminPut(path, body) {
    try {
        const res = await fetch(BASE_URL + path, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(body),
        });
        if (res.status === 401) { adminLogout(); return null; }
        if (!res.ok) throw new Error(`PUT ${path} → ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn('[ADMIN API]', err.message);
        return null;
    }
}

async function adminPatch(path, body = null) {
    try {
        const res = await fetch(BASE_URL + path, {
            method: 'PATCH',
            headers: authHeaders(),
            body: body ? JSON.stringify(body) : null,
        });
        if (res.status === 401) { adminLogout(); return null; }
        if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn('[ADMIN API]', err.message);
        return null;
    }
}

async function adminDelete(path) {
    try {
        const res = await fetch(BASE_URL + path, {
            method: 'DELETE',
            headers: authHeaders(),
        });
        if (res.status === 401) { adminLogout(); return null; }
        if (!res.ok) throw new Error(`DELETE ${path} → ${res.status}`);
        return true;
    } catch (err) {
        console.warn('[ADMIN API]', err.message);
        return null;
    }
}
