import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Source } from '../types'
import { MOCK_SOURCES } from '../lib/mock-data'
import { DbService } from '../lib/db'

@Injectable()
export class SourcesService {
  constructor(
    private readonly config: ConfigService,
    private readonly dbService: DbService,
  ) {}

  async fetchSources(): Promise<Source[]> {
    if (this.config.get<boolean>('USE_MOCK')) {
      return MOCK_SOURCES
    }

    const db = await this.dbService.getDb()
    const coll = this.config.get<string>('SOURCES_COLL')!
    return db.collection<Source>(coll).find({}, { projection: { _id: 0 } }).toArray()
  }
}
