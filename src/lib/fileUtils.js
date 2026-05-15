const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']
const archiveExtensions = ['zip', 'rar', 'gz', '7z', 'tar']
const tableExtensions = ['xlsx', 'xls', 'csv']
const codeExtensions = ['txt', 'env', 'conf', 'ini', 'log']

export function getExtension(name = '') {
  const parts = name.split('.')
  return parts.length > 1 ? parts.at(-1).toLowerCase() : ''
}

export function getFileIconName(item) {
  if (item.type === 'folder') {
    return 'folder'
  }

  const extension = item.extension || getExtension(item.name)

  if (extension === 'sql') {
    return 'database'
  }

  if (extension === 'pdf') {
    return 'text'
  }

  if (archiveExtensions.includes(extension)) {
    return 'archive'
  }

  if (imageExtensions.includes(extension)) {
    return 'image'
  }

  if (tableExtensions.includes(extension)) {
    return 'table'
  }

  if (codeExtensions.includes(extension)) {
    return 'code'
  }

  return 'file'
}

export function getFileCategory(item) {
  const extension = item.extension || getExtension(item.name)

  if (item.type === 'folder') {
    return 'folder'
  }

  if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) {
    return 'dokumen'
  }

  if (imageExtensions.includes(extension)) {
    return 'gambar'
  }

  if (archiveExtensions.includes(extension)) {
    return 'arsip'
  }

  if (extension === 'sql') {
    return 'sql'
  }

  if (tableExtensions.includes(extension)) {
    return 'excel'
  }

  return 'lainnya'
}

export function getItemStatus(item) {
  return item.deletedAt ? 'Di sampah' : 'Aktif'
}

export function buildPath(item, itemsMap) {
  const segments = [item.name]
  let currentParentId = item.parentId

  while (currentParentId) {
    const parent = itemsMap.get(currentParentId)

    if (!parent) {
      break
    }

    segments.unshift(parent.name)
    currentParentId = parent.parentId
  }

  return `/${segments.join('/')}`
}

export function sortDriveItems(items) {
  return [...items].sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === 'folder' ? -1 : 1
    }

    return left.name.localeCompare(right.name, 'id-ID')
  })
}

export function getBreadcrumbTrail(items, folderId) {
  if (!folderId) {
    return []
  }

  const itemsMap = new Map(items.map((item) => [item.id, item]))
  const trail = []
  let currentId = folderId

  while (currentId) {
    const item = itemsMap.get(currentId)

    if (!item) {
      break
    }

    trail.unshift(item)
    currentId = item.parentId
  }

  return trail
}
