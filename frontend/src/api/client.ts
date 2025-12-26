export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
  const url = baseUrl ? `${baseUrl}${path}` : path

  const method = (init?.method ?? 'GET').toUpperCase()
  const headers = new Headers(init?.headers)
  const hasBody = init?.body !== undefined && init?.body !== null
  if (hasBody && !headers.has('Content-Type') && method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Type', 'application/json')
  }

  const resp = await fetch(url, {
    ...init,
    headers,
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    const message = text.trim().startsWith('<!doctype html') ? resp.statusText : text || resp.statusText
    throw new ApiError(message, resp.status)
  }

  return (await resp.json()) as T
}
