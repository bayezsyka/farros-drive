const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || ''

export const configuredApiBaseUrl = rawApiBaseUrl
export const isApiConfigured = Boolean(rawApiBaseUrl)
export const resolvedApiBaseUrl = resolveApiBaseUrl(rawApiBaseUrl)

function resolveApiBaseUrl(apiBaseUrl) {
  if (!apiBaseUrl) {
    return null
  }

  const trimmed = apiBaseUrl.replace(/\/+$/, '')

  if (!import.meta.env.DEV || !/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  try {
    const url = new URL(trimmed)
    const isLocalBackend = ['127.0.0.1', 'localhost'].includes(url.hostname) && url.port === '8085'

    if (isLocalBackend) {
      return url.pathname || '/api'
    }
  } catch {
    return trimmed
  }

  return trimmed
}

function buildUrl(endpoint, query = null) {
  if (!resolvedApiBaseUrl) {
    throw new Error('API base URL belum dikonfigurasi')
  }

  const base = endpoint.startsWith('http') ? endpoint : `${resolvedApiBaseUrl}${endpoint}`

  if (!query || !Object.keys(query).length) {
    return base
  }

  const url = new URL(base, window.location.origin)
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }
    url.searchParams.set(key, value)
  })

  if (/^https?:\/\//i.test(base)) {
    return url.toString()
  }

  return `${url.pathname}${url.search}`
}

async function requestRaw(endpoint, options = {}, query = null) {
  const url = buildUrl(endpoint, query)
  const headers = new Headers(options.headers || {})
  let body = options.body

  if (body && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }

  const response = await fetch(url, {
    ...options,
    body,
    credentials: 'include',
    headers,
  })

  if (!response.ok) {
    let message = `Request gagal (${response.status})`

    try {
      const payload = await response.json()
      message = payload.error || payload.data?.error || message
    } catch {
      // Keep fallback message.
    }

    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return response
}

async function request(endpoint, options = {}, query = null) {
  const response = await requestRaw(endpoint, options, query)
  const contentType = response.headers.get('Content-Type') || ''

  if (!contentType.includes('application/json')) {
    return response
  }

  const payload = await response.json()
  if (
    payload &&
    typeof payload === 'object' &&
    Object.prototype.hasOwnProperty.call(payload, 'success') &&
    Object.prototype.hasOwnProperty.call(payload, 'data')
  ) {
    return payload.data
  }

  return payload
}

async function requestText(endpoint, options = {}, query = null) {
  const response = await requestRaw(endpoint, options, query)
  return response.text()
}

export function getDownloadUrl(itemPath) {
  if (!resolvedApiBaseUrl) {
    return null
  }

  return buildUrl('/download', { path: itemPath })
}

export function getPreviewUrl(itemPath) {
  if (!resolvedApiBaseUrl) {
    return null
  }

  return buildUrl('/preview', { path: itemPath })
}

export const apiClient = {
  buildUrl,
  createFolder(payload) {
    return request('/folders', { method: 'POST', body: payload })
  },
  createShare(payload) {
    return request('/share', { method: 'POST', body: payload })
  },
  deleteForever(payload) {
    return request('/trash', { method: 'DELETE', body: payload })
  },
  deleteShare(payload) {
    return request('/share', { method: 'DELETE', body: payload })
  },
  fetchPreviewText(itemPath) {
    return requestText('/preview', {}, { path: itemPath })
  },
  fetchPublicPreviewText(token, itemPath) {
    return requestText(`/public/preview/${token}`, {}, { path: itemPath })
  },
  getAuthMe() {
    return request('/auth/me')
  },
  getDownloadUrl,
  getHealth() {
    return request('/health')
  },
  getItem(itemPath) {
    return request('/item', {}, { path: itemPath })
  },
  getPreviewUrl,
  getPublicDownloadUrl(token, itemPath = '/') {
    return buildUrl(`/public/download/${token}`, { path: itemPath })
  },
  getPublicPreviewUrl(token, itemPath = '/') {
    return buildUrl(`/public/preview/${token}`, { path: itemPath })
  },
  getPublicShare(token, itemPath = '/') {
    return request(`/public/share/${token}`, {}, { path: itemPath })
  },
  getStorage() {
    return request('/storage')
  },
  listItems(itemPath = '/') {
    return request('/items', {}, { path: itemPath })
  },
  listShares() {
    return request('/shares')
  },
  listTrash() {
    return request('/trash')
  },
  login(password) {
    return request('/auth/login', {
      method: 'POST',
      body: { password },
    })
  },
  logout() {
    return request('/auth/logout', { method: 'POST' })
  },
  moveToTrash(payload) {
    return request('/item', { method: 'DELETE', body: payload })
  },
  renameItem(payload) {
    return request('/item/rename', { method: 'PATCH', body: payload })
  },
  restoreTrash(payload) {
    return request('/trash/restore', { method: 'POST', body: payload })
  },
  search(query) {
    return request('/search', {}, { q: query })
  },
  async uploadFiles(targetPath, fileList) {
    const formData = new FormData()
    formData.set('path', targetPath)

    Array.from(fileList).forEach((file) => {
      formData.append('files', file)
    })

    return request('/upload', {
      method: 'POST',
      body: formData,
    })
  },
}
