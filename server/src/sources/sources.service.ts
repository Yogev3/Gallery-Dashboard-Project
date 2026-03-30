import { Injectable } from '@nestjs/common'
import { Source } from '../types'
import { USE_MOCK } from '../lib/config'
import { MOCK_SOURCES } from '../lib/mock-data'
// import { getDb } from '../lib/db'
// import { SOURCES_COLL } from '../lib/config'

@Injectable()
export class SourcesService {
  async fetchSources(): Promise<Source[]> {
    if (USE_MOCK) {
      return MOCK_SOURCES
    }

    // --- MongoDB version (uncomment when USE_MOCK=false) ---
    // const db = await getDb()
    // return db.collection(SOURCES_COLL).find({}, { projection: { _id: 0 } }).toArray()

    return MOCK_SOURCES
  }
}
