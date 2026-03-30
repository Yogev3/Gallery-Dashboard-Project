import { Module } from '@nestjs/common'
import { SourcesController } from './sources.controller'
import { SourcesService } from './sources.service'
import { DbService } from '../lib/db'

@Module({
  controllers: [SourcesController],
  providers: [SourcesService, DbService],
})
export class SourcesModule {}
