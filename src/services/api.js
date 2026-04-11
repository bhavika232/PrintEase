const API_BASE = 'http://127.0.0.1:5000';

let currentUser = null;

// Helper to handle fetch responses
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options
  });
  
  let data;
  if (response.headers.get('content-type')?.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  
  if (!response.ok) {
    throw new Error(data.message || data || 'API request failed');
  }
  return data;
}

// ===== AUTH API =====

export async function loginUser(email, password) {
  try {
    const data = await request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    currentUser = { 
      id: data.user_id, 
      name: data.name, 
      email: email, 
      role: data.role,
      balance: data.balance
    };
    
    return { success: true, user: currentUser };
  } catch (error) {
    throw error;
  }
}

export async function registerUser(name, email, password) {
  try {
    await request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    return loginUser(email, password);
  } catch (error) {
    throw error;
  }
}

export function getCurrentUser() {
  return currentUser;
}

export function logoutUser() {
  currentUser = null;
}

// ===== WALLET & PROFILE API =====

export async function topUpUser(amount) {
  try {
    const data = await request('/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id, amount })
    });
    if (currentUser) {
      currentUser.balance = data.new_balance;
    }
    return { success: true, newBalance: data.new_balance };
  } catch (error) {
    throw error;
  }
}

export async function updateProfile(name, password) {
  try {
    await request('/update_profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id, name, password })
    });
    if (currentUser && name) {
      currentUser.name = name;
    }
    return { success: true };
  } catch (error) {
    throw error;
  }
}

// ===== PRINT REQUESTS API =====

export async function submitPrintRequest(requestData, file) {
  try {
    const formData = new FormData();
    formData.append('user_id', currentUser?.id);
    formData.append('copies', requestData.copies);
    formData.append('color', requestData.color);
    formData.append('pages', requestData.pageRange || 'All');
    formData.append('file', file);
    
    const data = await request('/submit_request', {
      method: 'POST',
      body: formData // No Content-Type header needed for FormData
    });
    
    if (currentUser) {
      currentUser.balance = data.new_balance;
    }
    
    return { success: true, message: data.message, cost: data.cost };
  } catch (error) {
    throw error;
  }
}

export async function getUserRequests() {
  try {
    if (!currentUser) return [];
    const data = await request(`/user_requests/${currentUser.id}`);
    if (currentUser) {
      currentUser.balance = data.balance;
    }
    
    return (data.requests || []).map(r => ({
      id: `REQ-${r.req_id}`,
      fileName: r.file_name,
      copies: r.copies,
      color: r.color,
      pageRange: r.pages,
      cost: r.cost,
      status: r.status,
      createdAt: r.request_date
    }));
  } catch (error) {
    console.error('Failed to fetch user requests:', error);
    return [];
  }
}

export async function getAllRequests() {
  try {
    const data = await request('/all_requests');
    
    return data.map(r => ({
      id: `REQ-${r.req_id}`,
      userName: r.userName,
      fileName: r.file_name,
      copies: r.copies,
      color: r.color,
      pageRange: r.pages,
      cost: r.cost,
      status: r.status,
      createdAt: r.request_date
    }));
  } catch (error) {
    console.error('Failed to fetch all requests:', error);
    return [];
  }
}

export async function updateRequestStatus(requestId, newStatus) {
  try {
    const numericId = requestId.replace('REQ-', '');
    
    const data = await request('/update_status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ req_id: numericId, status: newStatus })
    });
    
    return { success: true, message: data.message };
  } catch (error) {
    throw error;
  }
}

export function downloadReceipt(requestId) {
    const numericId = requestId.replace('REQ-', '');
    const url = `${API_BASE}/receipt/${numericId}`;
    window.open(url, '_blank');
}

// ===== STATS API =====

export async function getUserStats() {
  try {
    const requests = await getUserRequests();
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'Pending').length,
      processing: requests.filter(r => r.status === 'Processing').length,
      completed: requests.filter(r => r.status === 'Completed').length,
      spent: requests.reduce((acc, r) => acc + (r.cost || 0), 0)
    };
  } catch (error) {
    return { total: 0, pending: 0, processing: 0, completed: 0, spent: 0 };
  }
}
