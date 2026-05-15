import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react'
import { dummyDriveItems } from '../data/dummyDriveItems'
import { apiClient, configuredApiBaseUrl, getDownloadUrl, isApiConfigured, resolvedApiBaseUrl } from '../lib/apiClient'
import {
  adaptApiItem,
  adaptDummyItems,
  getParentPath,
  getPathName,
  joinDrivePath,
  normalizeVirtualPath,
  sortDriveItems,
} from '../lib/driveAdapter'
import { getExtension } from '../lib/fileUtils'

const STORAGE_KEY = 'farros-drive-items'
const CAPACITY_BYTES = 20 * 1024 * 1024 * 1024

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
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
    deletedAt: item.deletedAt || null,
    trashPath: item.trashPath ? normalizeVirtualPath(item.trashPath) : '',
    originalPath: item.originalPath ? normalizeVirtualPath(item.originalPath) : '',
  }
}

function loadLocalItems() {
  try {
    const rawItems = window.localStorage.getItem(STORAGE_KEY)

    if (!rawItems) {
      return adaptDummyItems(dummyDriveItems).map(normalizeLocalItem)
    }

    return JSON.parse(rawItems).map(normalizeLocalItem)
  } catch {
    return adaptDummyItems(dummyDriveItems).map(normalizeLocalItem)
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
  return items.filter(
    (item) => item[field] === rootPath || item[field].startsWith(`${rootPath}/`),
  )
}

export function DriveProvider({ children }) {
  const [localItems, setLocalItems] = useState(loadLocalItems)
  const [serverItems, setServerItems] = useState([])
  const [trashItems, setTrashItems] = useState([])
  const [mode, setMode] = useState(isApiConfigured ? 'checking' : 'local')
  const [backend, setBackend] = useState({
    apiBaseUrl: configuredApiBaseUrl || '',
    app: 'Farros Drive',
    configured: isApiConfigured,
    connected: false,
    error: '',
    mode: 'localStorage',
    resolvedApiBaseUrl: resolvedApiBaseUrl || '',
    statusLabel: isApiConfigured ? 'Memeriksa server' : 'Mode simulasi',
    storageRoot: '-',
    version: 'phase-1',
  })
  const [isSyncing, setIsSyncing] = useState(false)

  const commitLocalItems = (updater) => {
    setLocalItems((currentItems) => {
      const nextItems = (typeof updater === 'function' ? updater(currentItems) : updater).map(
        normalizeLocalItem,
      )

      persistLocalItems(nextItems)
      return nextItems
    })
  }

  const refreshServerSnapshot = useCallback(async (healthPayload = null) => {
    setIsSyncing(true)

    try {
      const collectedItems = []
      const queue = ['/']

      while (queue.length) {
        const currentPath = queue.shift()
        const response = await apiClient.listItems(currentPath)

        for (const rawItem of response.items || []) {
          const item = adaptApiItem(rawItem)
          collectedItems.push(item)

          if (item.type === 'folder') {
            queue.push(item.path)
          }
        }
      }

      const trashResponse = await apiClient.listTrash()
      const normalizedTrashItems = (trashResponse.items || []).map(adaptApiItem)

      setServerItems(sortDriveItems(collectedItems))
      setTrashItems(toTrashRootItems(normalizedTrashItems))
      setMode('server')
      setBackend((current) => ({
        ...current,
        app: healthPayload?.app || current.app,
        connected: true,
        error: '',
        mode: 'server',
        statusLabel: 'Tersambung ke server',
        storageRoot: healthPayload?.storageRoot || current.storageRoot,
        version: healthPayload?.version || current.version,
      }))
    } finally {
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    if (mode !== 'server') {
      setTrashItems(toTrashRootItems(localItems))
    }
  }, [localItems, mode])

  useEffect(() => {
    if (!isApiConfigured) {
      return
    }

    let cancelled = false

    const connectToServer = async () => {
      setIsSyncing(true)

      try {
        const healthPayload = await apiClient.getHealth()
        if (cancelled) {
          return
        }

        await refreshServerSnapshot(healthPayload)
      } catch (error) {
        if (cancelled) {
          return
        }

        setMode('local')
        setBackend((current) => ({
          ...current,
          connected: false,
          error: error.message,
          mode: 'localStorage',
          statusLabel: 'Mode simulasi',
          storageRoot: '-',
          version: 'phase-1',
        }))
      } finally {
        if (!cancelled) {
          setIsSyncing(false)
        }
      }
    }

    connectToServer()

    return () => {
      cancelled = true
    }
  }, [refreshServerSnapshot])

  const activeItems = mode === 'server' ? serverItems : localItems.filter((item) => !item.deletedAt)
  const currentTrashItems = mode === 'server' ? trashItems : toTrashRootItems(localItems)

  const createFolder = async (name, parentPath = '/') => {
    const sanitizedName = sanitizeLocalName(name)
    if (!sanitizedName) {
      return null
    }

    if (mode === 'server') {
      const item = await apiClient.createFolder({
        path: normalizeVirtualPath(parentPath),
        name: sanitizedName,
      })

      await refreshServerSnapshot()
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
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
      trashPath: '',
      originalPath: '',
    })

    commitLocalItems((currentItems) => [...currentItems, folder])
    return folder
  }

  const addFiles = async (files, parentPath = '/') => {
    if (!files?.length) {
      return []
    }

    if (mode === 'server') {
      const response = await apiClient.uploadFiles(normalizeVirtualPath(parentPath), files)
      await refreshServerSnapshot()
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
        createdAt: timestamp,
        updatedAt: timestamp,
        deletedAt: null,
        trashPath: '',
        originalPath: '',
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

    if (mode === 'server') {
      await apiClient.renameItem({
        path: normalizeVirtualPath(itemPath),
        newName: sanitizedName,
      })
      await refreshServerSnapshot()
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
    if (mode === 'server') {
      await apiClient.moveToTrash({
        path: normalizeVirtualPath(itemPath),
      })
      await refreshServerSnapshot()
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

    if (mode === 'server') {
      await apiClient.restoreTrash({
        trashPath: normalizedTrashPath,
        restorePath: normalizedRestorePath,
      })
      await refreshServerSnapshot()
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

    if (mode === 'server') {
      await apiClient.deleteForever({
        trashPath: normalizedTrashPath,
      })
      await refreshServerSnapshot()
      return
    }

    commitLocalItems((currentItems) =>
      currentItems.filter(
        (item) =>
          item.trashPath !== normalizedTrashPath &&
          !item.trashPath.startsWith(`${normalizedTrashPath}/`),
      ),
    )
  }

  const getItemsByPath = (parentPath = '/') =>
    sortDriveItems(
      activeItems.filter((item) => item.parentPath === normalizeVirtualPath(parentPath)),
    )

  const getItemByPath = (itemPath) => {
    const normalizedPath = normalizeVirtualPath(itemPath)
    return (
      activeItems.find((item) => item.path === normalizedPath) ||
      currentTrashItems.find(
        (item) => item.trashPath === normalizedPath || item.path === normalizedPath,
      ) ||
      null
    )
  }

  const getRecentItems = (limit = 8) =>
    activeItems
      .filter((item) => item.type === 'file')
      .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
      .slice(0, limit)

  const getTrashItems = () => currentTrashItems

  const searchItems = (keyword, parentPath = '/') => {
    const query = keyword.trim().toLowerCase()
    const scopedItems = getItemsByPath(parentPath)

    if (!query) {
      return scopedItems
    }

    return scopedItems.filter((item) => item.name.toLowerCase().includes(query))
  }

  const getStorageSummary = () => {
    const files = activeItems.filter((item) => item.type === 'file')
    const folders = activeItems.filter((item) => item.type === 'folder')
    const usedBytes = files.reduce((total, item) => total + item.size, 0)
    const latestFile = [...files].sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))[0]

    return {
      fileCount: files.length,
      folderCount: folders.length,
      usedBytes,
      capacityBytes: CAPACITY_BYTES,
      remainingBytes: Math.max(CAPACITY_BYTES - usedBytes, 0),
      recentFileName: latestFile?.name || '-',
    }
  }

  const refreshData = async () => {
    if (mode === 'server') {
      const healthPayload = await apiClient.getHealth()
      await refreshServerSnapshot(healthPayload)
      return
    }

    setTrashItems(toTrashRootItems(localItems))
  }

  const store = {
    activeItems,
    addFiles,
    backend,
    createFolder,
    currentMode: mode === 'server' ? 'server' : 'localStorage',
    deleteForever,
    downloadUrlForPath: getDownloadUrl,
    getItemByPath,
    getItemsByPath,
    getRecentItems,
    getStorageSummary,
    getTrashItems,
    isServerMode: mode === 'server',
    isSyncing,
    items: activeItems,
    moveToTrash,
    refreshData,
    renameItem,
    resolvedApiBaseUrl: resolvedApiBaseUrl || '',
    restoreItem,
    searchItems,
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
