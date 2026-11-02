import { API_BASE_URL } from '@/lib/api/config'

/**
 * Uploaded files are proxied by nginx from the current app origin in production,
 * or served from the API origin when `VITE_API_BASE_URL` is an absolute URL.
 * Rebases legacy `http://localhost:5000/uploads/...` URLs to the active API/app origin.
 */
export function resolvePublicAssetUrl(url: string | null | undefined): string {
  if (!url || typeof window === 'undefined') return url ?? ''
  if (url.startsWith('blob:') || url.startsWith('data:')) return url

  try {
    let targetOrigin = window.location.origin
    if (/^https?:\/\//i.test(API_BASE_URL)) {
      targetOrigin = new URL(API_BASE_URL).origin
    }

    const parsed = new URL(url, targetOrigin)
    if (parsed.pathname.startsWith('/uploads/')) {
      return `${targetOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`
    }
    return parsed.toString()
  } catch {
    return url
  }
}
