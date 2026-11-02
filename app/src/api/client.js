const API_BASE_URL = 'http://127.0.0.1:8000';

export function getAuthToken() {
  return localStorage.getItem('pashupulse_token') || null;
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('pashupulse_token', token);
  } else {
    localStorage.removeItem('pashupulse_token');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch (e) {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return null;
  }

  return await response.json();
}
