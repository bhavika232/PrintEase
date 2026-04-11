/* ============================================================
   app.js — Online Document Printing Management System
   All logic: auth, print requests, admin actions, aurora bg
   ============================================================ */

const API_BASE = 'http://127.0.0.1:5000';

/* ============================================================
   SECTION 1: DATA LAYER (Session Storage for login)
   ============================================================ */

function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem('dp_current_user') || 'null');
}

function setCurrentUser(user) {
  sessionStorage.setItem('dp_current_user', JSON.stringify(user));
}

function logoutUser() {
  sessionStorage.removeItem('dp_current_user');
}

/* ============================================================
   SECTION 2: GUARD — Redirect if not logged in
   ============================================================ */
function requireLogin() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
  }
  return user;
}

function requireAdmin() {
  const user = requireLogin();
  if (user.role !== 'admin' && user.email !== 'admin@printdesk.com') {
    window.location.href = 'dashboard.html';
  }
  return user;
}

/* ============================================================
   SECTION 3: UI HELPERS
   ============================================================ */
function showAlert(elementId, message, type = 'error') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = message;
  el.style.display = 'block';
  if (type !== 'error') {
    setTimeout(() => { el.style.display = 'none'; }, 3500);
  }
}

function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.style.display = 'none';
}

function statusBadge(status) {
  const cls = status === 'Pending'    ? 'badge-pending'
            : status === 'Processing' ? 'badge-processing'
            :                           'badge-completed';
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${status}</span>`;
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ============================================================
   SECTION 4: RIPPLE EFFECT
   ============================================================ */
function attachRipple(selector) {
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener('click', function(e) {
      const circle = document.createElement('span');
      circle.classList.add('ripple-circle');
      const size = Math.max(el.offsetWidth, el.offsetHeight);
      circle.style.width  = size + 'px';
      circle.style.height = size + 'px';
      const rect = el.getBoundingClientRect();
      circle.style.left = (e.clientX - rect.left - size / 2) + 'px';
      circle.style.top  = (e.clientY - rect.top  - size / 2) + 'px';
      el.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });
  });
}

/* ============================================================
   SECTION 5: AURORA BACKGROUND
   ============================================================ */
function initAurora(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const blobs = [
    { x: 0.2, y: 0.3, r: 0.45, color: 'rgba(167,139,250,0.35)', vx: 0.0003, vy: 0.0002 },
    { x: 0.7, y: 0.6, r: 0.50, color: 'rgba(124,58,237,0.22)',  vx: -0.0002, vy: 0.0003 },
    { x: 0.5, y: 0.1, r: 0.40, color: 'rgba(196,181,253,0.30)', vx: 0.0002, vy: -0.0002 },
    { x: 0.9, y: 0.2, r: 0.35, color: 'rgba(233,213,255,0.40)', vx: -0.0003, vy: 0.0002 },
    { x: 0.1, y: 0.8, r: 0.38, color: 'rgba(139,92,246,0.20)',  vx: 0.0002, vy: -0.0003 },
  ];

  let tick = 0;
  function draw() {
    tick++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f5f3ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    blobs.forEach(blob => {
      const px = (blob.x + Math.sin(tick * blob.vx * 200) * 0.18) * canvas.width;
      const py = (blob.y + Math.cos(tick * blob.vy * 200) * 0.15) * canvas.height;
      const r  = blob.r * Math.max(canvas.width, canvas.height);
      const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
      grad.addColorStop(0,   blob.color);
      grad.addColorStop(1,   'rgba(245,243,255,0)');
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ============================================================
   SECTION 6: LOGIN PAGE
   ============================================================ */
function initLoginPage() {
  if (getCurrentUser()) {
    const u = getCurrentUser();
    window.location.href = (u.role === 'admin' || u.email === 'admin@printdesk.com') ? 'admin.html' : 'dashboard.html';
    return;
  }
  initAurora('aurora-canvas');

  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideAlert('login-alert');

    const email    = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    if (!email || !password) return showAlert('login-alert', 'Please fill all fields.');

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password})
      });
      const data = await res.json();
      if (!res.ok) return showAlert('login-alert', data.message || 'Login failed.');

      const user = { id: data.user_id, email, name: data.name, role: data.role };
      setCurrentUser(user);

      if (user.role === 'admin' || email === 'admin@printdesk.com') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    } catch(err) {
      showAlert('login-alert', 'Network error. Is backend running?');
    }
  });
  attachRipple('.btn-primary');
}

/* ============================================================
   SECTION 7: REGISTER PAGE
   ============================================================ */
function initRegisterPage() {
  if (getCurrentUser()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideAlert('reg-alert');

    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;
    const confirm  = document.getElementById('reg-confirm').value;

    if (!name || !email || !password || !confirm) return showAlert('reg-alert', 'Please fill all fields.');
    if (password.length < 6) return showAlert('reg-alert', 'Password minimum 6 chars.');
    if (password !== confirm) return showAlert('reg-alert', 'Passwords do not match.');

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, email, password})
      });
      const data = await res.json();
      if (!res.ok) return showAlert('reg-alert', data.message || 'Registration failed.');

      showAlert('reg-alert', 'Account created! Redirecting...', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 1800);
    } catch (err) {
      showAlert('reg-alert', 'Network error.');
    }
  });
  attachRipple('.btn-primary');
}

/* ============================================================
   SECTION 8: USER DASHBOARD
   ============================================================ */
function initDashboardPage() {
  const user = requireLogin();
  if (user.role === 'admin' || user.email === 'admin@printdesk.com') {
    window.location.href = 'admin.html';
    return;
  }
  initAurora('aurora-canvas');

  const nameEl = document.getElementById('user-name');
  if (nameEl) nameEl.textContent = user.name;

  fetch(`${API_BASE}/user_requests/${user.id}`)
    .then(r => r.json())
    .then(data => {
      const countEl  = document.getElementById('request-count');
      if (countEl) countEl.textContent = data.length || 0;
    }).catch(e => console.error(e));

  attachRipple('.bento-card');
}

/* ============================================================
   SECTION 9: UPLOAD FRONTEND
   ============================================================ */
function initUploadPage() {
  const user = requireLogin();
  const form = document.getElementById('upload-form');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideAlert('upload-alert');

    const fileName  = document.getElementById('file-name').value.trim();
    const copies    = parseInt(document.getElementById('copies').value);
    const colorVal  = document.querySelector('input[name="color"]:checked');
    const pageRange = document.getElementById('page-range').value.trim();

    if (!fileName || !copies || copies < 1 || !colorVal) return showAlert('upload-alert', 'Invalid input.');

    try {
      const res = await fetch(`${API_BASE}/submit_request`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          user_id: user.id,
          file_name: fileName,
          copies,
          color: colorVal.value,
          pages: pageRange || 'All'
        })
      });
      const data = await res.json();
      if (!res.ok) return showAlert('upload-alert', data.message || 'Upload failed.');

      showAlert('upload-alert', `Request submitted successfully!`, 'success');
      form.reset();
      setTimeout(() => { window.location.href = 'status.html'; }, 2000);
    } catch(err) {
      showAlert('upload-alert', 'Network error.');
    }
  });

  attachRipple('.btn-primary');
}

/* ============================================================
   SECTION 10: USER STATUS PAGE
   ============================================================ */
function initStatusPage() {
  const user = requireLogin();
  const tbody  = document.getElementById('status-tbody');
  const emptyEl = document.getElementById('status-empty');
  if (!tbody) return;

  fetch(`${API_BASE}/user_requests/${user.id}`)
    .then(r => r.json())
    .then(requests => {
      if (requests.length === 0) {
        if (emptyEl) emptyEl.style.display = 'block';
        return;
      }
      if (emptyEl) emptyEl.style.display = 'none';

      tbody.innerHTML = requests.map(r => `
        <tr>
          <td><code style="font-size:0.8rem;color:var(--purple-dark)">REQ-${r.req_id}</code></td>
          <td>${escapeHtml(r.file_name)}</td>
          <td>${r.copies}</td>
          <td>${r.color}</td>
          <td>${r.pages}</td>
          <td>${statusBadge(r.status)}</td>
          <td style="color:var(--text-light);font-size:0.82rem">${formatDate(r.request_date)}</td>
        </tr>
      `).join('');
    }).catch(e => console.error(e));
}

/* ============================================================
   SECTION 11: ADMIN DASHBOARD
   ============================================================ */
function initAdminPage() {
  requireAdmin();
  loadAdminData();
}

function loadAdminData() {
  fetch(`${API_BASE}/all_requests`)
    .then(r => r.json())
    .then(requests => {
      renderAdminStats(requests);
      renderAdminTable(requests);
    }).catch(e => console.error(e));
}

function renderAdminStats(all) {
  const pending    = all.filter(r => r.status === 'Pending').length;
  const processing = all.filter(r => r.status === 'Processing').length;
  const completed  = all.filter(r => r.status === 'Completed').length;

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('stat-total',      all.length);
  setEl('stat-pending',    pending);
  setEl('stat-processing', processing);
  setEl('stat-completed',  completed);
}

function renderAdminTable(requests) {
  const tbody   = document.getElementById('admin-tbody');
  const emptyEl = document.getElementById('admin-empty');
  if (!tbody) return;

  if (requests.length === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    tbody.innerHTML = '';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  tbody.innerHTML = requests.map(r => `
    <tr id="row-${r.req_id}">
      <td><code style="font-size:0.78rem;color:var(--purple-dark)">REQ-${r.req_id}</code></td>
      <td>${escapeHtml(r.userName)}</td>
      <td>${escapeHtml(r.file_name)}</td>
      <td>${r.copies}</td>
      <td>${r.color}</td>
      <td>${r.pages}</td>
      <td>${statusBadge(r.status)}</td>
      <td style="color:var(--text-light);font-size:0.82rem">${formatDate(r.request_date)}</td>
      <td>
        <div class="action-btns">
          ${r.status !== 'Completed' ? `
            <button class="btn btn-sm btn-warning bento-card-btn" onclick="updateStatus('${r.req_id}', 'Processing')">
              ⚙️ Processing
            </button>
            <button class="btn btn-sm btn-success bento-card-btn" onclick="updateStatus('${r.req_id}', 'Completed')">
              ✅ Complete
            </button>
          ` : `<span style="color:var(--success);font-size:0.82rem;font-weight:600">✔ Done</span>`}
        </div>
      </td>
    </tr>
  `).join('');
  attachRipple('.bento-card-btn');
}

window.updateStatus = async function(requestId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/update_status`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ req_id: requestId, status: newStatus })
    });
    if (res.ok) loadAdminData();
  } catch (e) {
    console.error(e);
  }
}

/* ============================================================
   SECTION 12: NAVBAR / GLOBAL
   ============================================================ */
function populateNavbar() {
  const user  = getCurrentUser();
  const nameEl = document.getElementById('nav-user-name');
  if (nameEl && user) nameEl.textContent = user.name;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function applyTheme() {
  const saved = localStorage.getItem('dp_theme');
  if (saved === 'dark') document.body.classList.add('dark');
  updateThemeBtn();
}

function updateThemeBtn() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const isDark = document.body.classList.contains('dark');
  btn.textContent = isDark ? '☀️' : '🌙';
  btn.title       = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('dp_theme', isDark ? 'dark' : 'light');
  updateThemeBtn();
}

document.addEventListener('DOMContentLoaded', function() {
  applyTheme();
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  const page = window.location.pathname.split('/').pop() || 'index.html';

  if (page === 'index.html' || page === '')   initLoginPage();
  else if (page === 'register.html')          initRegisterPage();
  else if (page === 'dashboard.html')         initDashboardPage();
  else if (page === 'upload.html')            initUploadPage();
  else if (page === 'status.html')            initStatusPage();
  else if (page === 'admin.html')             initAdminPage();
  else if (page === 'help.html')              { requireLogin(); }

  populateNavbar();

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn && !logoutBtn.dataset.bound) {
    logoutBtn.dataset.bound = 'true';
    logoutBtn.addEventListener('click', () => {
      logoutUser();
      window.location.href = 'index.html';
    });
  }
});
