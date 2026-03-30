import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MongoClient, Db } from 'mongodb'

@Injectable()
export class DbService implements OnModuleDestroy {
  private client: MongoClient | null = null
  private db: Db | null = null

  constructor(private readonly config: ConfigService) {}

  async getDb(): Promise<Db> {
    if (!this.db) {
      const uri = this.config.get<string>('MONGO_URI')!
      const dbName = this.config.get<string>('MONGO_DB_NAME')!
      this.client = new MongoClient(uri)
      await this.client.connect()
      this.db = this.client.db(dbName)
    }
    return this.db
  }

  async onModuleDestroy() {
    await this.client?.close()
  }
}
