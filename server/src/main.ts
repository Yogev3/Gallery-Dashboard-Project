import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)

  const corsOrigin = config.get<string>('CORS_ORIGIN') || '*'
  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  const port = config.get<number>('PORT')
  await app.listen(port, '0.0.0.0')
  console.log(`Server running on http://0.0.0.0:${port}`)
}

bootstrap()
