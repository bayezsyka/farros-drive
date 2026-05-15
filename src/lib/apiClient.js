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

async function request(endpoint, options = {}) {
  if (!resolvedApiBaseUrl) {
    throw new Error('API base URL belum dikonfigurasi')
  }

  const url = endpoint.startsWith('http') ? endpoint : `${resolvedApiBaseUrl}${endpoint}`
  const headers = new Headers(options.headers || {})
  let body = options.body

  if (body && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body,
  })

  if (!response.ok) {
    let message = `Request gagal (${response.status})`

    try {
      const payload = await response.json()
      message = payload.error || message
    } catch {
      // Keep fallback message if response is not JSON.
    }

    throw new Error(message)
  }

  const contentType = response.headers.get('Content-Type') || ''
  if (contentType.includes('application/json')) {
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

  return response
}

export function getDownloadUrl(itemPath) {
  if (!resolvedApiBaseUrl) {
    return null
  }

  return `${resolvedApiBaseUrl}/download?path=${encodeURIComponent(itemPath)}`
}

export const apiClient = {
  createFolder(payload) {
    return request('/folders', {
      method: 'POST',
      body: payload,
    })
  },
  deleteForever(payload) {
    return request('/trash', {
      method: 'DELETE',
      body: payload,
    })
  },
  getHealth() {
    return request('/health')
  },
  getItem(itemPath) {
    return request(`/item?path=${encodeURIComponent(itemPath)}`)
  },
  listItems(itemPath = '/') {
    return request(`/items?path=${encodeURIComponent(itemPath)}`)
  },
  listTrash() {
    return request('/trash')
  },
  moveToTrash(payload) {
    return request('/item', {
      method: 'DELETE',
      body: payload,
    })
  },
  renameItem(payload) {
    return request('/item/rename', {
      method: 'PATCH',
      body: payload,
    })
  },
  restoreTrash(payload) {
    return request('/trash/restore', {
      method: 'POST',
      body: payload,
    })
  },
  search(query) {
    return request(`/search?q=${encodeURIComponent(query)}`)
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
