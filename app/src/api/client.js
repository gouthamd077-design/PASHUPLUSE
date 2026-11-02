const CUSTOM_BASE = import.meta.env.VITE_API_BASE_URL;

export function resolveApiUrl(endpoint) {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (CUSTOM_BASE) {
    const base = CUSTOM_BASE.replace(/\/$/, '');
    return `${base}${cleanEndpoint}`;
  }

  // Under Vercel multi-service routing and Vite dev proxy, backend routes are exposed under /api
  return cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;
}

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

  const url = resolveApiUrl(endpoint);

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
