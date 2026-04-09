import { Event, EventFilters, EventsStats, PaginatedResult, RestartResult, Source } from '../types'

const BASE = (import.meta.env.VITE_API_BASE as string) || '/api'

async function get<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(path, window.location.origin)
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== '') {
        url.searchParams.set(key, val)
      }
    }
  }
  const res = await fetch(url.pathname + url.search)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`)
  return res.json()
}

export async function fetchSources(): Promise<Source[]> {
  return get<Source[]>(`${BASE}/sources`)
}

export async function fetchEvents(filters: EventFilters): Promise<Event[]> {
  const params: Record<string, string | undefined> = {}
  if (filters.limit !== undefined) params.limit = String(filters.limit)
  if (filters.isFailed !== undefined) params.isFailed = String(filters.isFailed)
  if (filters.sourceIds?.length) params.sourceIds = filters.sourceIds.join(',')
  if (filters.formats?.length) params.formats = filters.formats.join(',')
  if (filters.pendingRestart !== undefined) params.pendingRestart = String(filters.pendingRestart)
  return get<Event[]>(`${BASE}/events`, params)
}

export async function fetchFailedEvents(limit = 3000): Promise<Event[]> {
  return get<Event[]>(`${BASE}/events/failed`, { limit: String(limit) })
}

export async function fetchFailedEventsPaginated(page: number, pageSize: number, sourceIds?: number[]): Promise<PaginatedResult<Event>> {
  const params: Record<string, string | undefined> = {
    page: String(page),
    pageSize: String(pageSize),
  }
  if (sourceIds?.length) params.sourceIds = sourceIds.join(',')
  return get<PaginatedResult<Event>>(`${BASE}/events/failed`, params)
}

export async function fetchPendingRestartEvents(limit = 3000): Promise<Event[]> {
  return get<Event[]>(`${BASE}/events/pending-restart`, { limit: String(limit) })
}

export async function fetchPendingRestartEventsPaginated(page: number, pageSize: number): Promise<PaginatedResult<Event>> {
  return get<PaginatedResult<Event>>(`${BASE}/events/pending-restart`, {
    page: String(page),
    pageSize: String(pageSize),
  })
}

export async function fetchEventsStats(filters?: { sourceIds?: number[]; formats?: string[] }): Promise<EventsStats> {
  const params: Record<string, string | undefined> = {}
  if (filters?.sourceIds?.length) params.sourceIds = filters.sourceIds.join(',')
  if (filters?.formats?.length) params.formats = filters.formats.join(',')
  return get<EventsStats>(`${BASE}/events/stats`, params)
}

export async function fetchImageFormats(): Promise<string[]> {
  return get<string[]>(`${BASE}/formats`)
}

export async function restartEvents(imageIds: string[]): Promise<RestartResult> {
  return post<RestartResult>(`${BASE}/restart`, { imageIds })
}
