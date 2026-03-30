import { Module } from '@nestjs/common'
import { EventsController } from './events.controller'
import { EventsService } from './events.service'
import { RestartService } from './restart.service'
import { DbService } from '../lib/db'

@Module({
  controllers: [EventsController],
  providers: [EventsService, RestartService, DbService],
})
export class EventsModule {}
