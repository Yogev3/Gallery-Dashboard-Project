export interface FacePosition {
  left: number
  right: number
  top: number
  bottom: number
}

export interface Event {
  imageId: string
  personId: string
  imageHash?: string
  format?: string
  sourceId: number
  semiSource?: string
  createdDate: number         // unix timestamp (seconds)
  receivedDate: number        // unix timestamp (seconds)
  isFailed?: boolean
  amountOfFaces?: number
  failureReason?: string
  pendingRestart?: boolean
  restartCount?: number
  facesPositions?: FacePosition[]
}

export interface Source {
  sourceId: number
  SourceName: string
  SourceHebName: string
}

export interface RestartResult {
  success: boolean
  eventId: string
  message?: string
  error?: string
}

export interface EventFilters {
  limit?: number
  page?: number
  pageSize?: number
  isFailed?: boolean
  sourceIds?: number[]
  formats?: string[]
  pendingRestart?: boolean
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface NameCount {
  name: string
  count: number
}

export interface DayCount {
  day: string
  count: number
}

export interface HourCount {
  hour: string
  count: number
}

export interface SourceStatusCount {
  source: string
  failed: number
  success: number
}

export interface EventsStats {
  totalEvents: number
  successCount: number
  failedCount: number
  pendingCount: number
  dailyFailures: DayCount[]
  hourlyEvents: HourCount[]
  failedBySource: NameCount[]
  sourceCounts: NameCount[]
  formatCounts: NameCount[]
  reasonCounts: NameCount[]
  facesCounts: NameCount[]
  statusSplit: NameCount[]
  sourceStatusStacked: SourceStatusCount[]
}
