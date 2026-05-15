export function formatBytes(bytes = 0) {
  if (!bytes) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

export function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatRelativeTime(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  const diffMs = date.getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60000)
  const rtf = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })

  const thresholds = [
    { limit: 60, unit: 'minute', value: diffMinutes },
    { limit: 1440, unit: 'hour', value: Math.round(diffMinutes / 60) },
    { limit: 43200, unit: 'day', value: Math.round(diffMinutes / 1440) },
    { limit: 525600, unit: 'month', value: Math.round(diffMinutes / 43200) },
  ]

  for (const threshold of thresholds) {
    if (Math.abs(diffMinutes) < threshold.limit) {
      return rtf.format(threshold.value, threshold.unit)
    }
  }

  return rtf.format(Math.round(diffMinutes / 525600), 'year')
}

export function formatPercent(value = 0) {
  return `${Number(value || 0).toFixed(1)}%`
}
