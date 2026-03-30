import { Module } from '@nestjs/common'
import { EventsController } from './events.controller'
import { EventsService } from './events.service'
import { RestartService } from './restart.service'

@Module({
  controllers: [EventsController],
  providers: [EventsService, RestartService],
})
export class EventsModule {}
