const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']
const archiveExtensions = ['zip', 'rar', 'gz', '7z', 'tar']
const tableExtensions = ['xlsx', 'xls', 'csv']
const textExtensions = ['txt', 'env', 'conf', 'ini', 'log', 'json', 'md', 'sql', 'nginx', 'yml', 'yaml']
const videoExtensions = ['mp4', 'webm', 'mov']
const audioExtensions = ['mp3', 'wav', 'ogg']

export function getExtension(name = '') {
  const parts = name.split('.')
  return parts.length > 1 ? parts.at(-1).toLowerCase() : ''
}

export function getPreviewKind(item) {
  const extension = item.extension || getExtension(item.name)

  if (item.type === 'folder') {
    return 'folder'
  }

  if (imageExtensions.includes(extension)) {
    return 'image'
  }

  if (extension === 'pdf') {
    return 'pdf'
  }

  if (videoExtensions.includes(extension)) {
    return 'video'
  }

  if (audioExtensions.includes(extension)) {
    return 'audio'
  }

  if (textExtensions.includes(extension)) {
    return 'text'
  }

  return 'other'
}

export function getFileIconName(item) {
  if (item.type === 'folder') {
    return 'folder'
  }

  const previewKind = getPreviewKind(item)

  if (item.extension === 'sql') {
    return 'database'
  }

  if (previewKind === 'pdf') {
    return 'text'
  }

  if (archiveExtensions.includes(item.extension || getExtension(item.name))) {
    return 'archive'
  }

  if (previewKind === 'image') {
    return 'image'
  }

  if (tableExtensions.includes(item.extension || getExtension(item.name))) {
    return 'table'
  }

  if (previewKind === 'text') {
    return 'code'
  }

  if (previewKind === 'video') {
    return 'video'
  }

  if (previewKind === 'audio') {
    return 'audio'
  }

  return 'file'
}

export function getFileCategory(item) {
  const extension = item.extension || getExtension(item.name)

  if (item.type === 'folder') {
    return 'folder'
  }

  if (['pdf', 'doc', 'docx', 'txt', 'md', 'json'].includes(extension)) {
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
