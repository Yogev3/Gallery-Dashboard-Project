import { Injectable } from '@nestjs/common'
import { Event } from '../types'
import { USE_MOCK } from '../lib/config'
import { generateMockEvents, IMAGE_FORMATS } from '../lib/mock-data'
// import { getDb } from '../lib/db'
// import { EVENTS_COLL } from '../lib/config'
import { GetEventsDto } from './dto/get-events.dto'

@Injectable()
export class EventsService {
  async fetchEvents(filters: GetEventsDto): Promise<Event[]> {
    const limit = filters.limit ?? 3000

    if (USE_MOCK) {
      let docs = generateMockEvents(limit)

      if (filters.isFailed !== undefined) {
        docs = docs.filter(d => d.isFailed === filters.isFailed)
      }
      if (filters.sourceSystems && filters.sourceSystems.length > 0) {
        docs = docs.filter(d => filters.sourceSystems!.includes(d.sourceSystem))
      }
      if (filters.imageFormats && filters.imageFormats.length > 0) {
        docs = docs.filter(d => filters.imageFormats!.includes(d.imageFormat))
      }
      if (filters.pendingRestart !== undefined) {
        docs = docs.filter(d => d.pendingRestart === filters.pendingRestart)
      }

      return docs
    }

    // --- MongoDB version (uncomment when USE_MOCK=false) ---
    // const query: Record<string, any> = {}
    // if (filters.isFailed !== undefined) query['isFailed'] = filters.isFailed
    // if (filters.sourceSystems?.length) query['sourceSystem'] = { $in: filters.sourceSystems }
    // if (filters.imageFormats?.length)  query['imageFormat']  = { $in: filters.imageFormats }
    // if (filters.pendingRestart !== undefined) query['pendingRestart'] = filters.pendingRestart
    // const db = await getDb()
    // return db.collection(EVENTS_COLL).find(query, { projection: { _id: 0 } }).limit(limit).toArray()

    return []
  }

  async fetchFailedEvents(limit: number, sourceSystems?: string[]): Promise<Event[]> {
    return this.fetchEvents({ limit, isFailed: true, sourceSystems })
  }

  async fetchPendingRestartEvents(limit: number): Promise<Event[]> {
    return this.fetchEvents({ limit, isFailed: true, pendingRestart: true })
  }

  async fetchImageFormats(): Promise<string[]> {
    if (USE_MOCK) {
      return [...IMAGE_FORMATS].sort()
    }

    // --- MongoDB version (uncomment when USE_MOCK=false) ---
    // const db = await getDb()
    // return (await db.collection(EVENTS_COLL).distinct('imageFormat')).sort()

    return [...IMAGE_FORMATS].sort()
  }
}
