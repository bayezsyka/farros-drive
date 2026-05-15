import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react'
import { dummyDriveItems } from '../data/dummyDriveItems'
import { apiClient, configuredApiBaseUrl, getDownloadUrl, getPreviewUrl, isApiConfigured, resolvedApiBaseUrl } from '../lib/apiClient'
import {
  adaptApiItem,
  adaptPublicItem,
  adaptShareItem,
  buildBreadcrumbItems,
  getParentPath,
  getPathName,
  joinDrivePath,
  normalizeVirtualPath,
  sortDriveItems,
} from '../lib/driveAdapter'
import { getExtension } from '../lib/fileUtils'

const STORAGE_KEY = 'farros-drive-items'

const DriveStoreContext = createContext(null)

function sanitizeLocalName(rawName) {
  const sanitized = Array.from(String(rawName || ''))
    .map((character) => {
      const codePoint = character.codePointAt(0) || 0
      if (codePoint < 32 || '<>:"/\\|?*'.includes(character)) {
        return ' '
      }

      return character
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()

  return sanitized.replace(/^[. ]+|[. ]+$/g, '')
}

function splitName(name) {
  const extension = getExtension(name)
  const suffix = extension ? `.${extension}` : ''

  return {
    base: suffix ? name.slice(0, -suffix.length) : name,
    suffix,
  }
}

function nextSiblingPath(items, parentPath, desiredName, options = {}) {
  const normalizedParentPath = normalizeVirtualPath(parentPath)
  const field = options.field || 'path'
  const excludeValue = options.excludeValue || ''
  const existing = new Set(
    items
      .filter((item) => item[field] && item[field] !== excludeValue && getParentPath(item[field]) === normalizedParentPath)
      .map((item) => item[field]),
  )

  const { base, suffix } = splitName(desiredName)
  let index = 0

  while (true) {
    const candidateName = index === 0 ? desiredName : `${base} (${index})${suffix}`
    const candidatePath = joinDrivePath(normalizedParentPath, candidateName)

    if (!existing.has(candidatePath)) {
      return candidatePath
    }

    index += 1
  }
}

function normalizeLocalItem(item) {
  const itemPath = normalizeVirtualPath(item.path)
  const type = item.type === 'folder' ? 'folder' : 'file'

  return {
    id: item.trashPath ? normalizeVirtualPath(item.trashPath) : itemPath,
    name: item.name,
    type,
    extension: type === 'folder' ? '' : item.extension || getExtension(item.name),
    mimeType: item.mimeType || (type === 'folder' ? 'inode/directory' : 'application/octet-stream'),
    size: type === 'folder' ? 0 : Number(item.size || 0),
    path: itemPath,
    parentPath: normalizeVirtualPath(item.parentPath || getParentPath(itemPath)),
    updatedAt: item.updatedAt || new Date().toISOString(),
    deletedAt: item.deletedAt || null,
    trashPath: item.trashPath ? normalizeVirtualPath(item.trashPath) : '',
    originalPath: item.originalPath ? normalizeVirtualPath(item.originalPath) : '',
  }
}

function adaptDummyItems(items) {
  const itemsById = new Map(items.map((item) => [item.id, item]))

  return items.map((item) => {
    const itemPath = normalizeVirtualPath(item.path)
    const parentItem = item.parentId ? itemsById.get(item.parentId) : null

    return normalizeLocalItem({
      id: itemPath,
      name: item.name,
      type: item.type,
      extension: item.extension || getExtension(item.name),
      mimeType: item.mimeType || 'application/octet-stream',
      size: Number(item.size || 0),
      path: itemPath,
      parentPath: parentItem ? normalizeVirtualPath(parentItem.path) : '/',
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt || null,
    })
  })
}

function loadLocalItems() {
  try {
    const rawItems = window.localStorage.getItem(STORAGE_KEY)

    if (!rawItems) {
      return adaptDummyItems(dummyDriveItems)
    }

    return JSON.parse(rawItems).map(normalizeLocalItem)
  } catch {
    return adaptDummyItems(dummyDriveItems)
  }
}

function persistLocalItems(items) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function toTrashRootItems(items) {
  return items
    .filter((item) => item.deletedAt && item.trashPath && getParentPath(item.trashPath) === '/.trash')
    .sort((left, right) => new Date(right.deletedAt) - new Date(left.deletedAt))
}

function getDescendantsByPath(items, rootPath, field = 'path') {
  return items.filter((item) => item[field] === rootPath || item[field].startsWith(`${rootPath}/`))
}

function collectLocalStorageSummary(items) {
  const activeItems = items.filter((item) => !item.deletedAt)
  const files = activeItems.filter((item) => item.type === 'file')
  const folders = activeItems.filter((item) => item.type === 'folder')
  const usedBytes = files.reduce((total, item) => total + item.size, 0)

  return {
    drive: {
      root: '/dev-drive',
      usedBytes,
      fileCount: files.length,
      folderCount: folders.length,
    },
    disk: {
      mount: '/',
      totalBytes: 0,
      usedBytes: 0,
      freeBytes: 0,
      usedPercent: 0,
    },
  }
}

async function collectServerItems() {
  const items = []
  const queue = ['/']

  while (queue.length) {
    const currentPath = queue.shift()
    const response = await apiClient.listItems(currentPath)
    const pageItems = sortDriveItems((response.items || []).map(adaptApiItem))

    pageItems.forEach((item) => {
      items.push(item)
      if (item.type === 'folder') {
        queue.push(item.path)
      }
    })
  }

  return sortDriveItems(items)
}

export function DriveProvider({ children }) {
  const [localItems, setLocalItems] = useState(loadLocalItems)
  const [serverItems, setServerItems] = useState([])
  const [trashItems, setTrashItems] = useState([])
  const [shares, setShares] = useState([])
  const [storageSummary, setStorageSummary] = useState(collectLocalStorageSummary(loadLocalItems()))
  const [isSyncing, setIsSyncing] = useState(false)
  const [authState, setAuthState] = useState(
    isApiConfigured
      ? { status: 'checking', authenticated: false, passwordConfigured: true, error: '' }
      : { status: 'authenticated', authenticated: true, passwordConfigured: false, error: '' },
  )
  const [backend, setBackend] = useState({
    apiBaseUrl: configuredApiBaseUrl || '',
    app: 'Farros Drive',
    configured: isApiConfigured,
    connected: !isApiConfigured,
    error: '',
    mode: isApiConfigured ? 'server' : 'localStorage',
    resolvedApiBaseUrl: resolvedApiBaseUrl || '',
    statusLabel: isApiConfigured ? 'Menghubungkan' : 'Mode lokal',
    storageRoot: isApiConfigured ? '-' : '/dev-drive',
    version: 'phase-3',
  })

  const currentMode = isApiConfigured ? 'server' : 'localStorage'

  const commitLocalItems = (updater) => {
    setLocalItems((currentItems) => {
      const nextItems = (typeof updater === 'function' ? updater(currentItems) : updater).map(normalizeLocalItem)
      persistLocalItems(nextItems)
      setStorageSummary(collectLocalStorageSummary(nextItems))
      return nextItems
    })
  }

  const refreshServerData = useCallback(async (healthPayload = null) => {
    if (!isApiConfigured) {
      return
    }

    setIsSyncing(true)

    try {
      const currentHealth = healthPayload || (await apiClient.getHealth())
      const [items, trashResponse, shareResponse, storageResponse] = await Promise.all([
        collectServerItems(),
        apiClient.listTrash(),
        apiClient.listShares(),
        apiClient.getStorage(),
      ])

      setServerItems(items)
      setTrashItems(sortDriveItems((trashResponse.items || []).map(adaptApiItem)))
      setShares((shareResponse.shares || []).map(adaptShareItem))
      setStorageSummary(storageResponse)
      setBackend((current) => ({
        ...current,
        app: currentHealth.app || current.app,
        connected: true,
        error: '',
        mode: 'server',
        resolvedApiBaseUrl: resolvedApiBaseUrl || '',
        statusLabel: 'Online',
        storageRoot: currentHealth.storageRoot || current.storageRoot,
        version: currentHealth.version || current.version,
      }))
    } catch (error) {
      if (error.status === 401) {
        setAuthState((current) => ({
          ...current,
          authenticated: false,
          status: 'unauthenticated',
        }))
        setServerItems([])
        setTrashItems([])
        setShares([])
        return
      }

      setBackend((current) => ({
        ...current,
        connected: false,
        error: error.message,
        statusLabel: 'Backend bermasalah',
      }))
      throw error
    } finally {
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    if (!isApiConfigured) {
      setTrashItems(toTrashRootItems(localItems))
      setStorageSummary(collectLocalStorageSummary(localItems))
      return undefined
    }

    let cancelled = false

    const bootstrap = async () => {
      try {
        const healthPayload = await apiClient.getHealth()
        if (cancelled) {
          return
        }

        setBackend((current) => ({
          ...current,
          app: healthPayload.app || current.app,
          connected: true,
          error: '',
          statusLabel: 'Online',
          storageRoot: healthPayload.storageRoot || current.storageRoot,
          version: healthPayload.version || current.version,
        }))

        const me = await apiClient.getAuthMe()
        if (cancelled) {
          return
        }

        setAuthState({
          status: me.authenticated ? 'authenticated' : 'unauthenticated',
          authenticated: Boolean(me.authenticated),
          passwordConfigured: Boolean(me.passwordConfigured),
          error: '',
        })

        if (me.authenticated) {
          await refreshServerData(healthPayload)
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        setBackend((current) => ({
          ...current,
          connected: false,
          error: error.message,
          statusLabel: 'Backend tidak tersedia',
        }))
        setAuthState((current) => ({
          ...current,
          status: 'unauthenticated',
          error: error.message,
        }))
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [localItems, refreshServerData])

  const activeItems = isApiConfigured ? serverItems : localItems.filter((item) => !item.deletedAt)
  const currentTrashItems = isApiConfigured ? trashItems : toTrashRootItems(localItems)

  const createFolder = async (name, parentPath = '/') => {
    const sanitizedName = sanitizeLocalName(name)
    if (!sanitizedName) {
      return null
    }

    if (isApiConfigured) {
      const item = await apiClient.createFolder({
        path: normalizeVirtualPath(parentPath),
        name: sanitizedName,
      })
      await refreshServerData()
      return adaptApiItem(item)
    }

    const timestamp = new Date().toISOString()
    const itemPath = nextSiblingPath(localItems.filter((item) => !item.deletedAt), parentPath, sanitizedName)
    const folder = normalizeLocalItem({
      id: itemPath,
      name: getPathName(itemPath),
      type: 'folder',
      extension: '',
      mimeType: 'inode/directory',
      size: 0,
      path: itemPath,
      parentPath: getParentPath(itemPath),
      updatedAt: timestamp,
    })

    commitLocalItems((currentItems) => [...currentItems, folder])
    return folder
  }

  const addFiles = async (files, parentPath = '/') => {
    if (!files?.length) {
      return []
    }

    if (isApiConfigured) {
      const response = await apiClient.uploadFiles(normalizeVirtualPath(parentPath), files)
      await refreshServerData()
      return (response.items || []).map(adaptApiItem)
    }

    const timestamp = new Date().toISOString()
    const existingItems = localItems.filter((item) => !item.deletedAt)
    const nextItems = Array.from(files).map((file) => {
      const sanitizedName = sanitizeLocalName(file.name) || `upload-${Date.now()}`
      const itemPath = nextSiblingPath(existingItems, parentPath, sanitizedName)
      const item = normalizeLocalItem({
        id: itemPath,
        name: getPathName(itemPath),
        type: 'file',
        extension: getExtension(sanitizedName),
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        path: itemPath,
        parentPath: getParentPath(itemPath),
        updatedAt: timestamp,
      })

      existingItems.push(item)
      return item
    })

    commitLocalItems((currentItems) => [...currentItems, ...nextItems])
    return nextItems
  }

  const renameItem = async (itemPath, nextName) => {
    const sanitizedName = sanitizeLocalName(nextName)
    if (!sanitizedName) {
      return false
    }

    if (isApiConfigured) {
      await apiClient.renameItem({
        path: normalizeVirtualPath(itemPath),
        newName: sanitizedName,
      })
      await refreshServerData()
      return true
    }

    commitLocalItems((currentItems) => {
      const targetItem = currentItems.find((item) => item.path === itemPath && !item.deletedAt)
      if (!targetItem) {
        return currentItems
      }

      const replacementPath = nextSiblingPath(
        currentItems.filter((item) => !item.deletedAt),
        targetItem.parentPath,
        sanitizedName,
        { excludeValue: targetItem.path },
      )

      return currentItems.map((item) => {
        if (item.path !== targetItem.path && !item.path.startsWith(`${targetItem.path}/`)) {
          return item
        }

        const suffix = item.path.slice(targetItem.path.length)
        const updatedPath = normalizeVirtualPath(`${replacementPath}${suffix}`)

        return {
          ...item,
          id: item.trashPath || updatedPath,
          name: item.path === targetItem.path ? getPathName(updatedPath) : item.name,
          path: updatedPath,
          parentPath: getParentPath(updatedPath),
          updatedAt: new Date().toISOString(),
        }
      })
    })

    return true
  }

  const moveToTrash = async (itemPath) => {
    if (isApiConfigured) {
      await apiClient.moveToTrash({ path: normalizeVirtualPath(itemPath) })
      await refreshServerData()
      return
    }

    commitLocalItems((currentItems) => {
      const targetItem = currentItems.find((item) => item.path === itemPath && !item.deletedAt)
      if (!targetItem) {
        return currentItems
      }

      const now = new Date().toISOString()
      const descendants = getDescendantsByPath(currentItems, targetItem.path)
      const rootTrashPath = nextSiblingPath(
        currentItems.filter((item) => item.deletedAt),
        '/.trash',
        targetItem.name,
        { field: 'trashPath' },
      )
      const descendantPaths = new Set(descendants.map((item) => item.path))

      return currentItems.map((item) => {
        if (!descendantPaths.has(item.path)) {
          return item
        }

        const suffix = item.path.slice(targetItem.path.length)
        const itemTrashPath = normalizeVirtualPath(`${rootTrashPath}${suffix}`)

        return {
          ...item,
          id: itemTrashPath,
          deletedAt: now,
          originalPath: item.path,
          trashPath: itemTrashPath,
          updatedAt: now,
        }
      })
    })
  }

  const restoreItem = async (trashPath, restorePath) => {
    const normalizedTrashPath = normalizeVirtualPath(trashPath)
    const normalizedRestorePath = restorePath ? normalizeVirtualPath(restorePath) : ''

    if (isApiConfigured) {
      await apiClient.restoreTrash({
        trashPath: normalizedTrashPath,
        restorePath: normalizedRestorePath,
      })
      await refreshServerData()
      return
    }

    commitLocalItems((currentItems) => {
      const targetItem = currentItems.find((item) => item.trashPath === normalizedTrashPath && item.deletedAt)
      if (!targetItem) {
        return currentItems
      }

      const descendants = getDescendantsByPath(currentItems, normalizedTrashPath, 'trashPath')
      const activeItemsOnly = currentItems.filter((item) => !item.deletedAt)
      const rootRestorePath = nextSiblingPath(
        activeItemsOnly,
        getParentPath(normalizedRestorePath),
        getPathName(normalizedRestorePath),
      )
      const descendantTrashPaths = new Set(descendants.map((item) => item.trashPath))

      return currentItems.map((item) => {
        if (!descendantTrashPaths.has(item.trashPath)) {
          return item
        }

        const suffix = item.trashPath.slice(normalizedTrashPath.length)
        const nextPath = normalizeVirtualPath(`${rootRestorePath}${suffix}`)

        return {
          ...item,
          id: nextPath,
          path: nextPath,
          parentPath: getParentPath(nextPath),
          deletedAt: null,
          trashPath: '',
          originalPath: '',
          updatedAt: new Date().toISOString(),
        }
      })
    })
  }

  const deleteForever = async (trashPath) => {
    const normalizedTrashPath = normalizeVirtualPath(trashPath)

    if (isApiConfigured) {
      await apiClient.deleteForever({ trashPath: normalizedTrashPath })
      await refreshServerData()
      return
    }

    commitLocalItems((currentItems) =>
      currentItems.filter(
        (item) => item.trashPath !== normalizedTrashPath && !item.trashPath.startsWith(`${normalizedTrashPath}/`),
      ),
    )
  }

  const createShare = async (payload) => {
    const response = await apiClient.createShare(payload)
    await refreshServerData()
    return response
  }

  const revokeShare = async (token) => {
    await apiClient.deleteShare({ token })
    await refreshServerData()
  }

  const getItemsByPath = (parentPath = '/') =>
    sortDriveItems(activeItems.filter((item) => item.parentPath === normalizeVirtualPath(parentPath)))

  const getItemByPath = (itemPath) => {
    const normalizedPath = normalizeVirtualPath(itemPath)
    return (
      activeItems.find((item) => item.path === normalizedPath) ||
      currentTrashItems.find((item) => item.trashPath === normalizedPath || item.path === normalizedPath) ||
      null
    )
  }

  const getRecentItems = (limit = 12) =>
    activeItems
      .filter((item) => item.type === 'file')
      .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
      .slice(0, limit)

  const searchItems = (keyword, parentPath = '/') => {
    const query = keyword.trim().toLowerCase()
    const scopedItems = getItemsByPath(parentPath)

    if (!query) {
      return scopedItems
    }

    return scopedItems.filter((item) => item.name.toLowerCase().includes(query))
  }

  const refreshAuth = async () => {
    if (!isApiConfigured) {
      return
    }

    const me = await apiClient.getAuthMe()
    setAuthState({
      status: me.authenticated ? 'authenticated' : 'unauthenticated',
      authenticated: Boolean(me.authenticated),
      passwordConfigured: Boolean(me.passwordConfigured),
      error: '',
    })

    if (me.authenticated) {
      await refreshServerData()
    }
  }

  const login = async (password) => {
    await apiClient.login(password)
    await refreshAuth()
  }

  const logout = async () => {
    if (isApiConfigured) {
      await apiClient.logout()
    }

    setAuthState((current) => ({
      ...current,
      authenticated: false,
      status: isApiConfigured ? 'unauthenticated' : 'authenticated',
    }))
    setServerItems([])
    setTrashItems([])
    setShares([])
  }

  const refreshData = async () => {
    if (isApiConfigured) {
      await refreshServerData()
      return
    }

    setTrashItems(toTrashRootItems(localItems))
    setStorageSummary(collectLocalStorageSummary(localItems))
  }

  const loadPublicShare = async (token, itemPath = '/') => {
    const response = await apiClient.getPublicShare(token, itemPath)

    return {
      ...response,
      currentPath: normalizeVirtualPath(response.currentPath || '/'),
      item: response.item ? adaptPublicItem(response.item) : null,
      items: (response.items || []).map(adaptPublicItem),
    }
  }

  const store = {
    activeItems,
    addFiles,
    auth: authState,
    backend,
    buildBreadcrumbItems,
    createFolder,
    createShare,
    currentMode,
    deleteForever,
    downloadUrlForPath: getDownloadUrl,
    getItemByPath,
    getItemsByPath,
    getPreviewUrlForPath: getPreviewUrl,
    getRecentItems,
    getStorageSummary: () => storageSummary,
    getTrashItems: () => currentTrashItems,
    isApiConfigured,
    isReady: !isApiConfigured || authState.status !== 'checking',
    isServerMode: isApiConfigured,
    isSyncing,
    items: activeItems,
    loadPublicShare,
    login,
    logout,
    moveToTrash,
    previewText: apiClient.fetchPreviewText,
    previewTextPublic: apiClient.fetchPublicPreviewText,
    publicDownloadUrlForPath: apiClient.getPublicDownloadUrl,
    publicPreviewUrlForPath: apiClient.getPublicPreviewUrl,
    refreshAuth,
    refreshData,
    renameItem,
    resolvedApiBaseUrl: resolvedApiBaseUrl || '',
    restoreItem,
    revokeShare,
    searchItems,
    shares,
    trashItems: currentTrashItems,
  }

  return createElement(DriveStoreContext.Provider, { value: store }, children)
}

export function useDriveStore() {
  const context = useContext(DriveStoreContext)

  if (!context) {
    throw new Error('useDriveStore must be used within DriveProvider')
  }

  return context
}
