/* ============================================================
   app.js — Online Document Printing Management System
   All logic: auth, print requests, admin actions, aurora bg
   ============================================================ */

/* ============================================================
   SECTION 1: DATA LAYER
   We use localStorage to persist data across pages.
   In a real backend (Flask/MySQL), these would be API calls.
   ============================================================ */

/**
 * Load users from localStorage.
 * Returns an array of user objects: { id, name, email, password }
 */
function getUsers() {
  return JSON.parse(localStorage.getItem('dp_users') || '[]');
}

/**
 * Save users array back to localStorage.
 */
function saveUsers(users) {
  localStorage.setItem('dp_users', JSON.stringify(users));
}

/**
 * Load print requests from localStorage.
 * Each request: { id, userId, fileName, copies, color, pageRange, status, createdAt }
 */
function getRequests() {
  return JSON.parse(localStorage.getItem('dp_requests') || '[]');
}

/**
 * Save requests array back to localStorage.
 */
function saveRequests(requests) {
  localStorage.setItem('dp_requests', JSON.stringify(requests));
}

/**
 * Get the currently logged-in user from sessionStorage.
 * sessionStorage clears when the browser tab is closed (like a session).
 */
function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem('dp_current_user') || 'null');
}

/**
 * Set the currently logged-in user.
 */
function setCurrentUser(user) {
  sessionStorage.setItem('dp_current_user', JSON.stringify(user));
}

/**
 * Log out the current user.
 */
function logoutUser() {
  sessionStorage.removeItem('dp_current_user');
}

/**
 * Generate a simple unique ID using timestamp + random number.
 */
function generateId() {
  return 'REQ-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
}

/* ============================================================
   SECTION 2: GUARD — Redirect if not logged in
   Call this at the top of any protected page.
   ============================================================ */
function requireLogin() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
  }
  return user;
}

/**
 * Require admin role.
 * In this demo, the admin email is hardcoded as: admin@printdesk.com
 * In a real app, this would be a role field in the database.
 */
function requireAdmin() {
  const user = requireLogin();
  if (user.email !== 'admin@printdesk.com') {
    window.location.href = 'dashboard.html';
  }
  return user;
}

/* ============================================================
   SECTION 3: UI HELPERS
   ============================================================ */

/**
 * Show an alert message in a named element.
 * @param {string} elementId - The ID of the alert div
 * @param {string} message   - Text to display
 * @param {string} type      - 'error' | 'success' | 'info'
 */
function showAlert(elementId, message, type = 'error') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = message;
  el.style.display = 'block';
  // Auto-hide success/info alerts after 3 seconds
  if (type !== 'error') {
    setTimeout(() => { el.style.display = 'none'; }, 3500);
  }
}

/**
 * Hide an alert element.
 */
function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.style.display = 'none';
}

/**
 * Return the HTML for a status badge.
 * @param {string} status - 'Pending' | 'Processing' | 'Completed'
 */
function statusBadge(status) {
  const cls = status === 'Pending'    ? 'badge-pending'
            : status === 'Processing' ? 'badge-processing'
            :                           'badge-completed';
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${status}</span>`;
}

/**
 * Format a timestamp into a readable date string.
 */
function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ============================================================
   SECTION 4: RIPPLE EFFECT on Bento Cards and Buttons
   ============================================================ */
function attachRipple(selector) {
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener('click', function(e) {
      // Create the ripple circle element
      const circle = document.createElement('span');
      circle.classList.add('ripple-circle');

      // Size it based on the element's dimensions
      const size = Math.max(el.offsetWidth, el.offsetHeight);
      circle.style.width  = size + 'px';
      circle.style.height = size + 'px';

      // Position it at the click point
      const rect = el.getBoundingClientRect();
      circle.style.left = (e.clientX - rect.left - size / 2) + 'px';
      circle.style.top  = (e.clientY - rect.top  - size / 2) + 'px';

      el.appendChild(circle);

      // Remove the element after animation ends
      setTimeout(() => circle.remove(), 600);
    });
  });
}

/* ============================================================
   SECTION 5: AURORA BACKGROUND (Animated soft gradient)
   Uses Canvas 2D API — no WebGL needed, beginner-friendly.
   Creates soft, slowly-moving colored blobs.
   ============================================================ */
function initAurora(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Resize canvas to fill the window
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Define the aurora "blobs" — each is a colored circle that moves slowly
  const blobs = [
    { x: 0.2, y: 0.3, r: 0.45, color: 'rgba(167,139,250,0.35)', vx: 0.0003, vy: 0.0002 },
    { x: 0.7, y: 0.6, r: 0.50, color: 'rgba(124,58,237,0.22)',  vx: -0.0002, vy: 0.0003 },
    { x: 0.5, y: 0.1, r: 0.40, color: 'rgba(196,181,253,0.30)', vx: 0.0002, vy: -0.0002 },
    { x: 0.9, y: 0.2, r: 0.35, color: 'rgba(233,213,255,0.40)', vx: -0.0003, vy: 0.0002 },
    { x: 0.1, y: 0.8, r: 0.38, color: 'rgba(139,92,246,0.20)',  vx: 0.0002, vy: -0.0003 },
  ];

  // Animation tick counter
  let tick = 0;

  function draw() {
    tick++;

    // Clear with a very light purple-white base
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f5f3ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw each blob as a radial gradient circle
    blobs.forEach(blob => {
      // Move position using sine waves for organic, looping motion
      const px = (blob.x + Math.sin(tick * blob.vx * 200) * 0.18) * canvas.width;
      const py = (blob.y + Math.cos(tick * blob.vy * 200) * 0.15) * canvas.height;
      const r  = blob.r * Math.max(canvas.width, canvas.height);

      // Create radial gradient (bright center, transparent edge)
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
   SECTION 6: LOGIN PAGE LOGIC
   ============================================================ */
function initLoginPage() {
  // Redirect to dashboard if already logged in
  if (getCurrentUser()) {
    window.location.href = 'dashboard.html';
    return;
  }

  initAurora('aurora-canvas');

  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    hideAlert('login-alert');

    const email    = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showAlert('login-alert', 'Please fill in all fields.');
      return;
    }

    // --- PLACEHOLDER: Replace with fetch() call to backend ---
    // fetch('/api/login', { method: 'POST', body: JSON.stringify({email, password}) })
    //   .then(res => res.json())
    //   .then(data => { setCurrentUser(data.user); window.location.href = 'dashboard.html'; });

    const users = getUsers();

    // Special admin account (auto-created if not present)
    const adminExists = users.find(u => u.email === 'admin@printdesk.com');
    if (!adminExists) {
      users.push({ id: 'admin-001', name: 'Admin', email: 'admin@printdesk.com', password: 'admin123' });
      saveUsers(users);
    }

    // Find user by email + password
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      showAlert('login-alert', 'Invalid email or password. Try again.');
      return;
    }

    // Store session and redirect
    setCurrentUser(user);

    // Admins go to admin dashboard, users go to user dashboard
    if (user.email === 'admin@printdesk.com') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  });

  // Attach ripple on submit button
  attachRipple('.btn-primary');
}

/* ============================================================
   SECTION 7: REGISTER PAGE LOGIC
   ============================================================ */
function initRegisterPage() {
  if (getCurrentUser()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    hideAlert('reg-alert');

    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;
    const confirm  = document.getElementById('reg-confirm').value;

    // --- Validations ---
    if (!name || !email || !password || !confirm) {
      showAlert('reg-alert', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      showAlert('reg-alert', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      showAlert('reg-alert', 'Passwords do not match.');
      return;
    }
    if (email === 'admin@printdesk.com') {
      showAlert('reg-alert', 'This email is reserved.');
      return;
    }

    const users = getUsers();

    // Check if email already exists
    if (users.find(u => u.email === email)) {
      showAlert('reg-alert', 'An account with this email already exists.');
      return;
    }

    // --- PLACEHOLDER: Replace with fetch() call to backend ---
    // fetch('/api/register', { method: 'POST', body: JSON.stringify({name, email, password}) })

    // Create new user object and save
    const newUser = {
      id:        'USR-' + Date.now(),
      name,
      email,
      password,
      createdAt: Date.now()
    };

    users.push(newUser);
    saveUsers(users);

    showAlert('reg-alert', 'Account created! Redirecting to login...', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 1800);
  });

  attachRipple('.btn-primary');
}

/* ============================================================
   SECTION 8: USER DASHBOARD PAGE
   ============================================================ */
function initDashboardPage() {
  const user = requireLogin();

  // If admin accidentally lands here, redirect to admin page
  if (user.email === 'admin@printdesk.com') {
    window.location.href = 'admin.html';
    return;
  }

  initAurora('aurora-canvas');

  // Show the user's name
  const nameEl = document.getElementById('user-name');
  if (nameEl) nameEl.textContent = user.name;

  // Show count of their requests
  const requests = getRequests().filter(r => r.userId === user.id);
  const countEl  = document.getElementById('request-count');
  if (countEl) countEl.textContent = requests.length;

  // Attach ripple to bento cards
  attachRipple('.bento-card');

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logoutUser();
      window.location.href = 'index.html';
    });
  }
}

/* ============================================================
   SECTION 9: UPLOAD / PRINT REQUEST PAGE
   ============================================================ */
function initUploadPage() {
  const user = requireLogin();

  const form = document.getElementById('upload-form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    hideAlert('upload-alert');

    const fileName  = document.getElementById('file-name').value.trim();
    const copies    = parseInt(document.getElementById('copies').value);
    const colorVal  = document.querySelector('input[name="color"]:checked');
    const pageRange = document.getElementById('page-range').value.trim();

    // --- Validations ---
    if (!fileName) {
      showAlert('upload-alert', 'Please enter the file name.');
      return;
    }
    if (!copies || copies < 1) {
      showAlert('upload-alert', 'Number of copies must be at least 1.');
      return;
    }
    if (!colorVal) {
      showAlert('upload-alert', 'Please select a print type (B&W or Color).');
      return;
    }

    // --- PLACEHOLDER: Replace with fetch() call to backend ---
    // fetch('/api/requests', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + user.token },
    //   body: JSON.stringify({ fileName, copies, color: colorVal.value, pageRange })
    // })

    // Build the new request object
    const newRequest = {
      id:        generateId(),
      userId:    user.id,
      userName:  user.name,
      fileName,
      copies,
      color:     colorVal.value,        // 'B&W' or 'Color'
      pageRange: pageRange || 'All',
      status:    'Pending',             // Always starts as Pending
      createdAt: Date.now()
    };

    // Save to localStorage
    const requests = getRequests();
    requests.push(newRequest);
    saveRequests(requests);

    showAlert('upload-alert', `Request submitted! ID: ${newRequest.id}`, 'success');

    // Reset form after submission
    form.reset();

    // Redirect to status page after a short delay
    setTimeout(() => { window.location.href = 'status.html'; }, 2000);
  });

  attachRipple('.btn-primary');
}

/* ============================================================
   SECTION 10: ORDER STATUS PAGE
   ============================================================ */
function initStatusPage() {
  const user = requireLogin();

  const tbody  = document.getElementById('status-tbody');
  const emptyEl = document.getElementById('status-empty');
  if (!tbody) return;

  // Get only this user's requests, newest first
  const requests = getRequests()
    .filter(r => r.userId === user.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  if (requests.length === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  // Build table rows
  tbody.innerHTML = requests.map(r => `
    <tr>
      <td><code style="font-size:0.8rem;color:var(--purple-dark)">${r.id}</code></td>
      <td>${escapeHtml(r.fileName)}</td>
      <td>${r.copies}</td>
      <td>${r.color}</td>
      <td>${r.pageRange}</td>
      <td>${statusBadge(r.status)}</td>
      <td style="color:var(--text-light);font-size:0.82rem">${formatDate(r.createdAt)}</td>
    </tr>
  `).join('');
}

/* ============================================================
   SECTION 11: ADMIN DASHBOARD PAGE
   ============================================================ */
function initAdminPage() {
  requireAdmin();

  renderAdminStats();
  renderAdminTable();

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logoutUser();
      window.location.href = 'index.html';
    });
  }
}

/**
 * Render the stats cards at the top of the admin page.
 */
function renderAdminStats() {
  const all        = getRequests();
  const pending    = all.filter(r => r.status === 'Pending').length;
  const processing = all.filter(r => r.status === 'Processing').length;
  const completed  = all.filter(r => r.status === 'Completed').length;

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setEl('stat-total',      all.length);
  setEl('stat-pending',    pending);
  setEl('stat-processing', processing);
  setEl('stat-completed',  completed);
}

/**
 * Render the full requests table with action buttons.
 */
function renderAdminTable() {
  const tbody   = document.getElementById('admin-tbody');
  const emptyEl = document.getElementById('admin-empty');
  if (!tbody) return;

  const requests = getRequests().sort((a, b) => b.createdAt - a.createdAt);

  if (requests.length === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    tbody.innerHTML = '';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  tbody.innerHTML = requests.map(r => `
    <tr id="row-${r.id}">
      <td><code style="font-size:0.78rem;color:var(--purple-dark)">${r.id}</code></td>
      <td>${escapeHtml(r.userName)}</td>
      <td>${escapeHtml(r.fileName)}</td>
      <td>${r.copies}</td>
      <td>${r.color}</td>
      <td>${r.pageRange}</td>
      <td>${statusBadge(r.status)}</td>
      <td style="color:var(--text-light);font-size:0.82rem">${formatDate(r.createdAt)}</td>
      <td>
        <div class="action-btns">
          ${r.status !== 'Completed' ? `
            <button class="btn btn-sm btn-warning bento-card-btn" onclick="updateStatus('${r.id}', 'Processing')">
              ⚙️ Processing
            </button>
            <button class="btn btn-sm btn-success bento-card-btn" onclick="updateStatus('${r.id}', 'Completed')">
              ✅ Complete
            </button>
          ` : `<span style="color:var(--success);font-size:0.82rem;font-weight:600">✔ Done</span>`}
        </div>
      </td>
    </tr>
  `).join('');

  // Attach ripple to the newly created action buttons
  attachRipple('.bento-card-btn');
}

/**
 * Update the status of a specific request.
 * Called by onclick on admin table buttons.
 * @param {string} requestId - The request's ID
 * @param {string} newStatus - 'Processing' or 'Completed'
 */
function updateStatus(requestId, newStatus) {
  // --- PLACEHOLDER: Replace with fetch() call to backend ---
  // fetch(`/api/requests/${requestId}`, {
  //   method: 'PATCH',
  //   body: JSON.stringify({ status: newStatus })
  // })

  const requests = getRequests();
  const idx = requests.findIndex(r => r.id === requestId);

  if (idx === -1) return;

  requests[idx].status = newStatus;
  saveRequests(requests);

  // Re-render the table and stats to reflect the change
  renderAdminStats();
  renderAdminTable();
}

/* ============================================================
   SECTION 12: NAVBAR HELPERS
   ============================================================ */

/**
 * Show the user's name in the navbar.
 */
function populateNavbar() {
  const user  = getCurrentUser();
  const nameEl = document.getElementById('nav-user-name');
  if (nameEl && user) nameEl.textContent = user.name;
}

/* ============================================================
   SECTION 13: SECURITY HELPER
   Prevent XSS by escaping user-provided strings before
   inserting them into the DOM via innerHTML.
   ============================================================ */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ============================================================
   SECTION 15: DARK MODE
   Toggles "dark" class on <body>.
   Preference is saved in localStorage so it persists across pages.
   ============================================================ */

/**
 * Apply the saved theme on page load (called at bottom of DOMContentLoaded).
 */
function applyTheme() {
  const saved = localStorage.getItem('dp_theme');
  if (saved === 'dark') {
    document.body.classList.add('dark');
  }
  updateThemeBtn();
}

/**
 * Update the toggle button label based on current theme.
 */
function updateThemeBtn() {
  const btn    = document.getElementById('theme-toggle');
  if (!btn) return;
  const isDark = document.body.classList.contains('dark');
  btn.textContent = isDark ? '☀️' : '🌙';
  btn.title       = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}

/**
 * Toggle between light and dark mode.
 */
function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('dp_theme', isDark ? 'dark' : 'light');
  updateThemeBtn();
}


   Detect which page we're on and initialize accordingly.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
  // Apply saved theme first (before anything renders)
  applyTheme();

  // Wire up the theme toggle button on every page
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Get the current filename from the URL
  const page = window.location.pathname.split('/').pop() || 'index.html';

  if (page === 'index.html' || page === '')   initLoginPage();
  else if (page === 'register.html')          initRegisterPage();
  else if (page === 'dashboard.html')         initDashboardPage();
  else if (page === 'upload.html')            initUploadPage();
  else if (page === 'status.html')            initStatusPage();
  else if (page === 'admin.html')             initAdminPage();
  else if (page === 'help.html')              { requireLogin(); /* no special init needed */ }

  // Populate navbar on all pages
  populateNavbar();

  // Handle global navbar logout button (if present)
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    // Prevent double-binding (initDashboardPage may already bind this)
    // We use a flag to avoid duplicate listeners
    if (!logoutBtn.dataset.bound) {
      logoutBtn.dataset.bound = 'true';
      logoutBtn.addEventListener('click', () => {
        logoutUser();
        window.location.href = 'index.html';
      });
    }
  }
});