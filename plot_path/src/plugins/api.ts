/* eslint-disable no-undef */

export async function apiFetch (path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');
  const baseUrl = import.meta.env.VITE_API_URL;

  const headers: HeadersInit = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('Content-Type');
  const rawText = await response.clone().text();

  let data: Record<string, any> | null = null;

  if (contentType?.includes('application/json')) {
    try {
      data = JSON.parse(rawText);
    } catch (err) {
      console.error('[apiFetch] Failed to parse JSON:', err);
      throw new Error('Invalid JSON response');
    }
  }

  if (!response.ok) {
    const message = data?.message || `API error ${response.status}`;
    console.error('[apiFetch] Request failed:', message);
    throw new Error(message);
  }

  return data;
}
