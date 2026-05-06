const API_URL = import.meta.env.VITE_API_URL || '';

export function getToken() {
  return localStorage.getItem('token');
}

export function setSession(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getUser() {
  const value = localStorage.getItem('user');
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    // Corrupted localStorage data — clear it
    clearSession();
    return null;
  }
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error('Network error — please check your connection and that the backend is running.');
  }

  if (!response.ok) {
    // Auto-logout on 401 (expired/invalid token) for non-auth endpoints
    if (response.status === 401 && !path.startsWith('/api/auth/')) {
      clearSession();
      window.location.reload();
      throw new Error('Session expired — please log in again.');
    }

    let message = 'Something went wrong';
    try {
      const body = await response.json();
      message = body.message || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}
