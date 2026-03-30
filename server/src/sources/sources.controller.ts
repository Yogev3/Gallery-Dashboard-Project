import { Controller, Get } from '@nestjs/common'
import { SourcesService } from './sources.service'

@Controller('api')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get('sources')
  async getSources() {
    return this.sourcesService.fetchSources()
  }
}
