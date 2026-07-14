import { API_BASE_URL } from '@/lib/api/config'

export class ApiError extends Error {
  readonly status: number
  readonly errors?: string[]

  constructor(message: string, status: number, errors?: string[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

interface ApiSuccessResponse<T> {
  success: true
  data: T
}

interface ApiErrorResponse {
  success: false
  message?: string
  errors?: string[]
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

async function parseResponse<T>(response: Response): Promise<T> {
  let body: ApiResponse<T> | null = null

  try {
    body = (await response.json()) as ApiResponse<T>
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const message =
      body && 'message' in body && body.message
        ? body.message
        : response.statusText || 'Request failed'
    const errors = body && 'errors' in body ? body.errors : undefined
    throw new ApiError(message, response.status, errors)
  }

  if (body && 'success' in body && body.success === false) {
    throw new ApiError(body.message ?? 'Request failed', response.status, body.errors)
  }

  if (body && 'data' in body) {
    return body.data
  }

  return body as T
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers)

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  return parseResponse<T>(response)
}

export async function apiRequestWithAuth<T>(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  return apiRequest<T>(path, { ...init, headers })
}
