import { Module } from '@nestjs/common'
import { EventsModule } from './events/events.module'
import { SourcesModule } from './sources/sources.module'

@Module({
  imports: [EventsModule, SourcesModule],
})
export class AppModule {}
