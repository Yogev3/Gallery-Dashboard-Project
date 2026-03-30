export class GetEventsDto {
  limit?: number
  page?: number
  pageSize?: number
  isFailed?: boolean
  sourceSystems?: string[]
  imageFormats?: string[]
  pendingRestart?: boolean
}
