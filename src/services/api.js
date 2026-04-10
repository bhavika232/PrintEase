// Dummy data and API placeholder services
// Replace these with real fetch() calls when backend is ready

let currentUser = null;

// Dummy users
const users = [
  { id: 1, name: 'Bhavika Sharma', email: 'bhavika@example.com', password: 'password123', role: 'user' },
  { id: 2, name: 'Admin User', email: 'admin@printease.com', password: 'admin123', role: 'admin' },
];

// Dummy print requests
let printRequests = [
  { id: 'REQ-001', userId: 1, fileName: 'Assignment_1.pdf', copies: 2, color: 'BW', pageRange: '1-10', status: 'Completed', createdAt: '2026-04-05' },
  { id: 'REQ-002', userId: 1, fileName: 'Report_Final.docx', copies: 1, color: 'Color', pageRange: 'All', status: 'Processing', createdAt: '2026-04-06' },
  { id: 'REQ-003', userId: 1, fileName: 'Presentation.pptx', copies: 3, color: 'Color', pageRange: '1-5', status: 'Pending', createdAt: '2026-04-07' },
];

let nextRequestId = 4;

// ===== AUTH API =====

export async function loginUser(email, password) {
  // Placeholder: Replace with fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        currentUser = { id: user.id, name: user.name, email: user.email, role: user.role };
        resolve({ success: true, user: currentUser });
      } else {
        reject(new Error('Invalid email or password'));
      }
    }, 500);
  });
}

export async function registerUser(name, email, password) {
  // Placeholder: Replace with fetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) })
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exists = users.find(u => u.email === email);
      if (exists) {
        reject(new Error('Email already registered'));
      } else {
        const newUser = { id: users.length + 1, name, email, password, role: 'user' };
        users.push(newUser);
        currentUser = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
        resolve({ success: true, user: currentUser });
      }
    }, 500);
  });
}

export function getCurrentUser() {
  return currentUser;
}

export function logoutUser() {
  currentUser = null;
}

// ===== PRINT REQUESTS API =====

export async function submitPrintRequest(requestData) {
  // Placeholder: Replace with fetch('/api/requests', { method: 'POST', body: JSON.stringify(requestData) })
  return new Promise((resolve) => {
    setTimeout(() => {
      const newRequest = {
        id: `REQ-${String(nextRequestId++).padStart(3, '0')}`,
        userId: currentUser?.id || 1,
        ...requestData,
        status: 'Pending',
        createdAt: new Date().toISOString().split('T')[0],
      };
      printRequests.push(newRequest);
      resolve({ success: true, request: newRequest });
    }, 400);
  });
}

export async function getUserRequests() {
  // Placeholder: Replace with fetch('/api/requests/user')
  return new Promise((resolve) => {
    setTimeout(() => {
      const userId = currentUser?.id || 1;
      const userReqs = printRequests.filter(r => r.userId === userId);
      resolve(userReqs);
    }, 300);
  });
}

export async function getAllRequests() {
  // Placeholder: Replace with fetch('/api/requests/all')
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...printRequests]);
    }, 300);
  });
}

export async function updateRequestStatus(requestId, newStatus) {
  // Placeholder: Replace with fetch(`/api/requests/${requestId}/status`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) })
  return new Promise((resolve) => {
    setTimeout(() => {
      const req = printRequests.find(r => r.id === requestId);
      if (req) {
        req.status = newStatus;
        resolve({ success: true, request: req });
      }
    }, 300);
  });
}

// ===== STATS API =====

export async function getUserStats() {
  // Placeholder: Replace with fetch('/api/stats/user')
  return new Promise((resolve) => {
    setTimeout(() => {
      const userId = currentUser?.id || 1;
      const userReqs = printRequests.filter(r => r.userId === userId);
      resolve({
        total: userReqs.length,
        pending: userReqs.filter(r => r.status === 'Pending').length,
        processing: userReqs.filter(r => r.status === 'Processing').length,
        completed: userReqs.filter(r => r.status === 'Completed').length,
      });
    }, 200);
  });
}
