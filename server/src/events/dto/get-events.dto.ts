export class GetEventsDto {
  limit?: number
  page?: number
  pageSize?: number
  isFailed?: boolean
  sourceIds?: number[]
  formats?: string[]
  pendingRestart?: boolean
}
