import { createContext, createElement, useContext, useMemo, useState } from 'react'
import { dummyDriveItems } from '../data/dummyDriveItems'
import { buildPath, getExtension, sortDriveItems } from '../lib/fileUtils'

const STORAGE_KEY = 'farros-drive-items'
const CAPACITY_BYTES = 20 * 1024 * 1024 * 1024

const DriveStoreContext = createContext(null)

function normalizeItems(items) {
  const itemsMap = new Map(items.map((item) => [item.id, item]))

  return items.map((item) => ({
    ...item,
    extension: item.type === 'folder' ? '' : item.extension || getExtension(item.name),
    path: buildPath(item, itemsMap),
  }))
}

function loadItems() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return normalizeItems(dummyDriveItems)
    }

    return normalizeItems(JSON.parse(raw))
  } catch {
    return normalizeItems(dummyDriveItems)
  }
}

function persistItems(items) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function getDescendantIds(items, rootId) {
  const lookup = new Map()

  items.forEach((item) => {
    if (!lookup.has(item.parentId)) {
      lookup.set(item.parentId, [])
    }

    lookup.get(item.parentId).push(item.id)
  })

  const visited = new Set([rootId])
  const queue = [rootId]

  while (queue.length) {
    const currentId = queue.shift()
    const children = lookup.get(currentId) || []

    children.forEach((childId) => {
      if (!visited.has(childId)) {
        visited.add(childId)
        queue.push(childId)
      }
    })
  }

  return visited
}

export function DriveProvider({ children }) {
  const [items, setItems] = useState(loadItems)

  const commitItems = (updater) => {
    setItems((currentItems) => {
      const nextItems = normalizeItems(
        typeof updater === 'function' ? updater(currentItems) : updater,
      )

      persistItems(nextItems)
      return nextItems
    })
  }

  const store = useMemo(() => {
    const getItemsByParent = (parentId = null) =>
      sortDriveItems(
        items.filter((item) => item.parentId === parentId && !item.deletedAt),
      )

    const getItemById = (id) => items.find((item) => item.id === id) || null

    const createFolder = (name, parentId = null) => {
      const folderName = name.trim()

      if (!folderName) {
        return null
      }

      const timestamp = new Date().toISOString()
      const folder = {
        id: `folder-${crypto.randomUUID()}`,
        name: folderName,
        type: 'folder',
        extension: '',
        mimeType: 'inode/directory',
        size: 0,
        parentId,
        createdAt: timestamp,
        updatedAt: timestamp,
        deletedAt: null,
        path: '',
      }

      commitItems((currentItems) => [...currentItems, folder])
      return folder
    }

    const addFiles = (files, parentId = null) => {
      const timestamp = new Date().toISOString()
      const normalizedFiles = Array.from(files).map((file) => ({
        id: `file-${crypto.randomUUID()}`,
        name: file.name,
        type: 'file',
        extension: getExtension(file.name),
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        parentId,
        createdAt: timestamp,
        updatedAt: timestamp,
        deletedAt: null,
        path: '',
      }))

      if (normalizedFiles.length) {
        commitItems((currentItems) => [...currentItems, ...normalizedFiles])
      }

      return normalizedFiles
    }

    const renameItem = (id, name) => {
      const nextName = name.trim()

      if (!nextName) {
        return false
      }

      commitItems((currentItems) =>
        currentItems.map((item) =>
          item.id === id
            ? { ...item, name: nextName, updatedAt: new Date().toISOString() }
            : item,
        ),
      )

      return true
    }

    const moveToTrash = (id) => {
      const descendants = getDescendantIds(items, id)
      const timestamp = new Date().toISOString()

      commitItems((currentItems) =>
        currentItems.map((item) =>
          descendants.has(item.id)
            ? { ...item, deletedAt: timestamp, updatedAt: timestamp }
            : item,
        ),
      )
    }

    const restoreItem = (id) => {
      const descendants = getDescendantIds(items, id)
      const timestamp = new Date().toISOString()

      commitItems((currentItems) =>
        currentItems.map((item) =>
          descendants.has(item.id)
            ? { ...item, deletedAt: null, updatedAt: timestamp }
            : item,
        ),
      )
    }

    const deleteForever = (id) => {
      const descendants = getDescendantIds(items, id)

      commitItems((currentItems) => currentItems.filter((item) => !descendants.has(item.id)))
    }

    const getRecentItems = (limit = 8) =>
      items
        .filter((item) => item.type === 'file' && !item.deletedAt)
        .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
        .slice(0, limit)

    const getTrashItems = () =>
      items
        .filter((item) => item.deletedAt)
        .sort((left, right) => new Date(right.deletedAt) - new Date(left.deletedAt))

    const searchItems = (keyword, parentId = null) => {
      const query = keyword.trim().toLowerCase()

      if (!query) {
        return getItemsByParent(parentId)
      }

      return sortDriveItems(
        items.filter(
          (item) =>
            !item.deletedAt &&
            item.parentId === parentId &&
            item.name.toLowerCase().includes(query),
        ),
      )
    }

    const getStorageSummary = () => {
      const activeItems = items.filter((item) => !item.deletedAt)
      const files = activeItems.filter((item) => item.type === 'file')
      const folders = activeItems.filter((item) => item.type === 'folder')
      const usedBytes = files.reduce((total, item) => total + item.size, 0)
      const latestFile =
        [...files].sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))[0]

      return {
        fileCount: files.length,
        folderCount: folders.length,
        usedBytes,
        capacityBytes: CAPACITY_BYTES,
        remainingBytes: Math.max(CAPACITY_BYTES - usedBytes, 0),
        recentFileName: latestFile?.name || '-',
      }
    }

    return {
      items,
      createFolder,
      addFiles,
      renameItem,
      moveToTrash,
      restoreItem,
      deleteForever,
      getItemsByParent,
      getItemById,
      getRecentItems,
      getTrashItems,
      searchItems,
      getStorageSummary,
    }
  }, [items])

  return createElement(DriveStoreContext.Provider, { value: store }, children)
}

export function useDriveStore() {
  const context = useContext(DriveStoreContext)

  if (!context) {
    throw new Error('useDriveStore must be used within DriveProvider')
  }

  return context
}
