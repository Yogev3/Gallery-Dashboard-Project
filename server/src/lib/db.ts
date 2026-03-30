import { NotImplementedException } from '@nestjs/common'
// Uncomment when USE_MOCK=false:
// import { MongoClient, Db } from 'mongodb'
import { MONGO_URI, MONGO_DB_NAME } from './config'

// Uncomment when USE_MOCK=false:
// let client: MongoClient | null = null

/**
 * Returns a cached MongoDB Db handle.
 * Uncomment the body below and remove the throw when USE_MOCK=false.
 */
export async function getDb(): Promise<any> {
  // --- Uncomment when USE_MOCK=false ---
  // if (!client) {
  //   client = new MongoClient(MONGO_URI)
  //   await client.connect()
  // }
  // return client.db(MONGO_DB_NAME)

  void MONGO_URI
  void MONGO_DB_NAME
  throw new NotImplementedException(
    'MongoDB is disabled. Set USE_MOCK=false and uncomment db.ts to enable real database access.',
  )
}
