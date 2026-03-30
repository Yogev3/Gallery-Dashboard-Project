export interface FacePosition {
  left: number
  right: number
  top: number
  bottom: number
}

export interface Event {
  imageId: string
  personId: string
  imageHash: string
  imageFormat: 'JPEG' | 'PNG' | 'BMP' | 'TIFF'
  sourceSystem: string
  semiSource: string
  createdDate: string   // ISO string (serialised from Date)
  receivedDate: string
  isFailed: boolean
  amountOfFaces: number
  failureReason?: string    // only when isFailed = true
  pendingRestart: boolean   // only true when isFailed = true
  restartCount: number
  facesPositions: FacePosition[]
}

export interface Source {
  sourceId: number
  SourceName: string
  SourceHebName: string
  weight: number    // mock-only: generation frequency weight
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
  sourceSystems?: string[]
  imageFormats?: string[]
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
