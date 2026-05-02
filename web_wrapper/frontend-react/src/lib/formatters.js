export function formatDateTime(value) {
  if (!value) {
    return 'No timestamp'
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch (error) {
    return value
  }
}

export function formatRelativeTime(value) {
  if (!value) {
    return 'Just now'
  }

  try {
    const date = new Date(value)
    const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000)
    const thresholds = [
      ['year', 60 * 60 * 24 * 365],
      ['month', 60 * 60 * 24 * 30],
      ['day', 60 * 60 * 24],
      ['hour', 60 * 60],
      ['minute', 60],
      ['second', 1],
    ]

    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    for (const [unit, seconds] of thresholds) {
      if (Math.abs(diffSeconds) >= seconds || unit === 'second') {
        return formatter.format(Math.round(diffSeconds / seconds), unit)
      }
    }
  } catch (error) {}

  return value
}

export function formatDuration(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'Pending'
  }

  const seconds = Number(value)
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

export function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function titleCase(value = '') {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}
