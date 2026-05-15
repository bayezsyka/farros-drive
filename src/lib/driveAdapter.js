import { getExtension } from './fileUtils'

export function normalizeVirtualPath(inputPath = '/') {
  const normalized = String(inputPath || '/').replace(/\\/g, '/').trim()
  const segments = normalized.split('/').filter(Boolean)
  return segments.length ? `/${segments.join('/')}` : '/'
}

export function getParentPath(inputPath = '/') {
  const normalizedPath = normalizeVirtualPath(inputPath)

  if (normalizedPath === '/') {
    return '/'
  }

  const segments = normalizedPath.split('/').filter(Boolean)
  segments.pop()

  return segments.length ? `/${segments.join('/')}` : '/'
}

export function getPathName(inputPath = '/') {
  const normalizedPath = normalizeVirtualPath(inputPath)

  if (normalizedPath === '/') {
    return ''
  }

  const segments = normalizedPath.split('/').filter(Boolean)
  return segments.at(-1) || ''
}

export function joinDrivePath(parentPath, name) {
  const trimmedName = String(name || '').trim()

  if (!trimmedName) {
    return normalizeVirtualPath(parentPath)
  }

  if (!parentPath || parentPath === '/') {
    return normalizeVirtualPath(`/${trimmedName}`)
  }

  return normalizeVirtualPath(`${normalizeVirtualPath(parentPath)}/${trimmedName}`)
}

export function buildBreadcrumbItems(currentPath = '/') {
  const normalizedPath = normalizeVirtualPath(currentPath)

  if (normalizedPath === '/') {
    return []
  }

  const segments = normalizedPath.split('/').filter(Boolean)

  return segments.map((segment, index) => ({
    id: `/${segments.slice(0, index + 1).join('/')}`,
    name: segment,
    path: `/${segments.slice(0, index + 1).join('/')}`,
  }))
}

export function sortDriveItems(items = []) {
  return [...items].sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === 'folder' ? -1 : 1
    }

    return left.name.localeCompare(right.name, 'id-ID')
  })
}

export function adaptApiItem(item) {
  const itemPath = normalizeVirtualPath(item.path)
  const trashPath = item.trashPath ? normalizeVirtualPath(item.trashPath) : ''

  return {
    id: normalizeVirtualPath(item.id || trashPath || itemPath),
    name: item.name,
    type: (item.kind || item.type) === 'folder' ? 'folder' : 'file',
    extension: item.extension || getExtension(item.name),
    mimeType: item.mimeType || 'application/octet-stream',
    size: Number(item.size || 0),
    path: itemPath,
    parentPath: normalizeVirtualPath(item.parentPath || getParentPath(itemPath)),
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt || null,
    trashPath,
    originalPath: item.originalPath ? normalizeVirtualPath(item.originalPath) : '',
  }
}

export function adaptShareItem(item) {
  return {
    id: item.id || item.token,
    token: item.token,
    name: item.name,
    type: item.type === 'folder' ? 'folder' : 'file',
    path: normalizeVirtualPath(item.path || '/'),
    allowDownload: Boolean(item.allowDownload),
    createdAt: item.createdAt,
    expiresAt: item.expiresAt || null,
    permission: item.permission || 'viewer',
    url: item.url,
  }
}

export function adaptPublicItem(item) {
  return {
    id: normalizeVirtualPath(item.id || item.path),
    name: item.name,
    type: item.type === 'folder' ? 'folder' : 'file',
    extension: item.extension || getExtension(item.name),
    mimeType: item.mimeType || 'application/octet-stream',
    size: Number(item.size || 0),
    path: normalizeVirtualPath(item.path),
    parentPath: normalizeVirtualPath(item.parentPath || getParentPath(item.path)),
    updatedAt: item.updatedAt,
  }
}
