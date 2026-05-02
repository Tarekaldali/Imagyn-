const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

function buildHeaders(token, headers = {}) {
  const nextHeaders = {
    Accept: 'application/json',
    ...headers,
  }

  if (token) {
    nextHeaders.Authorization = `Bearer ${token}`
  }

  return nextHeaders
}

export async function apiRequest(path, { method = 'GET', body, token, headers } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...buildHeaders(token, headers),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const detail = typeof payload === 'string'
      ? payload
      : payload?.detail || payload?.error || 'Request failed'

    throw new Error(detail)
  }

  return payload
}

export { API_URL }
