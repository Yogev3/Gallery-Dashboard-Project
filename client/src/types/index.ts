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
  isFailed?: boolean
  sourceSystems?: string[]
  imageFormats?: string[]
  pendingRestart?: boolean
}
