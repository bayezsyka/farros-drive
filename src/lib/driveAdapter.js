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
    id: trashPath || itemPath,
    name: item.name,
    type: item.kind === 'folder' ? 'folder' : 'file',
    extension: item.extension || getExtension(item.name),
    mimeType: item.mimeType || 'application/octet-stream',
    size: Number(item.size || 0),
    path: itemPath,
    parentPath: normalizeVirtualPath(item.parentPath || getParentPath(itemPath)),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt || null,
    trashPath,
    originalPath: item.originalPath ? normalizeVirtualPath(item.originalPath) : '',
  }
}

export function adaptDummyItems(items) {
  const itemsById = new Map(items.map((item) => [item.id, item]))

  return items.map((item) => {
    const itemPath = normalizeVirtualPath(item.path)
    const parentItem = item.parentId ? itemsById.get(item.parentId) : null

    return {
      id: itemPath,
      name: item.name,
      type: item.type,
      extension: item.extension || getExtension(item.name),
      mimeType: item.mimeType || 'application/octet-stream',
      size: Number(item.size || 0),
      path: itemPath,
      parentPath: parentItem ? normalizeVirtualPath(parentItem.path) : '/',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt || null,
      trashPath: '',
      originalPath: '',
    }
  })
}
