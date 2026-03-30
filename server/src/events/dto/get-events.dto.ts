export class GetEventsDto {
  limit?: number
  isFailed?: boolean
  sourceSystems?: string[]
  imageFormats?: string[]
  pendingRestart?: boolean
}
