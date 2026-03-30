import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { configValidationSchema } from './lib/config'
import { EventsModule } from './events/events.module'
import { SourcesModule } from './sources/sources.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
    }),
    EventsModule,
    SourcesModule,
  ],
})
export class AppModule {}
