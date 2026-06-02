async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    credentials: 'include'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || 'REQUEST_FAILED';
    throw new Error(msg);
  }
  return data;
}

export const api = {
  me: () => request('/api/auth/me'),
  login: (emailOrPhone, password) =>
    request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, password })
    }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  registerUser: (payload) =>
    request('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }),
  createComplaint: (formData) =>
    request('/api/complaints', {
      method: 'POST',
      body: formData
    }),
  track: (trackingCode) => request(`/api/complaints/track/${encodeURIComponent(trackingCode)}`),
  adminList: (status) => request(`/api/admin/complaints?status=${encodeURIComponent(status)}`),
  adminUpdateStatus: (trackingCode, status, comment) =>
    request(`/api/admin/complaints/${encodeURIComponent(trackingCode)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, comment })
    }),
  adminCreateAdmin: (fullName, email, password) =>
    request('/api/admin/users/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password })
    }),
  adminListUsers: () => request('/api/admin/users'),
  myComplaints: () => request('/api/users/me/complaints')
};
