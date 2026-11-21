import { getAuth, clearAuth } from '../authStorage'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function request(endpoint, options = {}) {
  const token = getAuth()?.token
  
  const headers = { ...options.headers }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })

  // 401 = no/invalid credentials -> the session is dead, go back to login.
  // 403 with `required_roles` = authenticated but the role is not allowed
  // (e.g. an editor hitting an admin-only delete). That must NOT log the user
  // out; it is surfaced as a normal error so the view can explain it.
  // 403 without `required_roles` keeps the legacy behaviour (invalid token).
  if (response.status === 401) {
    clearAuth()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  let errorBody = null
  if (!response.ok) {
    errorBody = await response.json().catch(() => null)
  }

  if (response.status === 403 && !(errorBody && Array.isArray(errorBody.required_roles))) {
    clearAuth()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const error = errorBody || { message: 'Request failed' }
    const err = new Error(error.message)
    err.status = response.status
    // Structured details the views can display as-is (e.g. category delete 409
    // reports how many articles reference the category).
    err.errors = Array.isArray(error.errors) ? error.errors : []
    err.articleCount = typeof error.articleCount === 'number' ? error.articleCount : undefined
    // Set on role rejections: the action needs one of these roles.
    err.requiredRoles = Array.isArray(error.required_roles) ? error.required_roles : null
    throw err
  }

  return response.json()
}

// Human-readable message for a role rejection, used by the views.
export function roleErrorMessage(err) {
  if (!err || !err.requiredRoles) return null
  const needed = err.requiredRoles.join(' / ')
  return `You do not have permission for this action. It requires the ${needed} role — ask an administrator.`
}

// Current role from the token payload stored at login (falls back to 'editor',
// matching the backend's least-privilege default).
export function currentRole() {
  try {
    const { user } = getAuth() || {}
    const role = user && typeof user.role === 'string' ? user.role.toLowerCase() : ''
    return role === 'admin' ? 'admin' : 'editor'
  } catch {
    return 'editor'
  }
}

export function isAdmin() {
  return currentRole() === 'admin'
}

export const auth = {
  login: (username, password, remember = true) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, remember: !!remember }),
  }),
}

export const articles = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/articles${query ? '?' + query : ''}`)
  },
  getBySlug: (slug) => request(`/articles/${slug}`),
  create: (data) => request('/articles', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`/articles/${id}`, { method: 'DELETE' }),
}

export const categories = {
  getAll: () => request('/categories'),
  create: (data) => request('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
}

export const contacts = {
  getAll: (limit) => request(`/contacts${limit ? `?limit=${encodeURIComponent(limit)}` : ''}`),
}

export const seo = {
  getAll: () => request('/seo'),
  getByKey: (pageKey) => request(`/seo/${encodeURIComponent(pageKey)}`),
  update: (pageKey, data) => request(`/seo/${encodeURIComponent(pageKey)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (pageKey) => request(`/seo/${encodeURIComponent(pageKey)}`, { method: 'DELETE' }),
}

export const redirects = {
  getAll: () => request('/redirects'),
  create: (data) => request('/redirects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/redirects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`/redirects/${id}`, { method: 'DELETE' }),
}

// Booking-lead inbox (admin + editor; `remove` and `stats` are admin-only on
// the server, so a role rejection comes back as a normal 403 error body).
export const booking = {
  list: (params = {}) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      query.set(key, String(value))
    })
    const qs = query.toString()
    return request(`/booking/leads${qs ? `?${qs}` : ''}`)
  },
  get: (id) => request(`/booking/leads/${encodeURIComponent(id)}`),
  updateStatus: (id, status) => request(`/booking/leads/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  resendEmail: (id) => request(`/booking/leads/${encodeURIComponent(id)}/resend-email`, {
    method: 'POST',
  }),
  remove: (id) => request(`/booking/leads/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  stats: (days = 7) => request(`/booking/stats?days=${encodeURIComponent(days)}`),
}

export const upload = {
  image: (file) => {
    const formData = new FormData()
    formData.append('image', file)
    return request('/upload', {
      method: 'POST',
      body: formData,
    })
  },
}