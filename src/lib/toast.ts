/**
 * Tiny global toast store (same idea as react-hot-toast, without a new dependency).
 *
 *   toast.success('Saved')
 *   toast.error(getUserErrorMessage(error, t))
 *
 * Works from anywhere (components, hooks, plain functions). Render <Toaster /> once at the app root.
 */
export type ToastType = 'success' | 'error'

export interface ToastItem {
  id: number
  type: ToastType
  message: string
  /** How long the toast stays, in ms (also drives the progress bar). */
  duration: number
}

const SUCCESS_MS = 3500
const ERROR_MS = 6000
const EXTRA_MS_PER_LINE = 1500
const MAX_MS = 12000
const MAX_VISIBLE = 4

let items: ToastItem[] = []
let nextId = 1
const timers = new Map<number, ReturnType<typeof setTimeout>>()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToasts(): ToastItem[] {
  return items
}

function dismiss(id: number) {
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  timers.delete(id)
  items = items.filter((item) => item.id !== id)
  emit()
}

function push(type: ToastType, message: string) {
  const text = message.trim()
  if (!text) return

  // The same message shown again replaces the old one instead of piling up.
  const duplicate = items.find((item) => item.type === type && item.message === text)
  if (duplicate) dismiss(duplicate.id)

  const lines = text.split('\n').length
  const base = type === 'success' ? SUCCESS_MS : ERROR_MS
  const duration = Math.min(base + (lines - 1) * EXTRA_MS_PER_LINE, MAX_MS)

  const id = nextId++
  items = [...items, { id, type, message: text, duration }].slice(-MAX_VISIBLE)
  emit()
  timers.set(id, setTimeout(() => dismiss(id), duration))
}

export const toast = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
  dismiss,
}
