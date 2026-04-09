import {
  Controller,
  Get,
  Post,
  Query,
  Body,
} from '@nestjs/common'
import { EventsService } from './events.service'
import { RestartService } from './restart.service'
import { GetEventsDto } from './dto/get-events.dto'
import { RestartEventDto } from './dto/restart-event.dto'

@Controller('api')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly restartService: RestartService,
  ) {}

  @Get('events')
  async getEvents(@Query() query: Record<string, string>) {
    const filters: GetEventsDto = {}

    if (query.limit !== undefined) {
      filters.limit = parseInt(query.limit, 10)
    }
    if (query.isFailed !== undefined) {
      filters.isFailed = query.isFailed === 'true'
    }
    if (query.sourceIds) {
      filters.sourceIds = query.sourceIds.split(',').filter(Boolean).map(Number)
    }
    if (query.formats) {
      filters.formats = query.formats.split(',').filter(Boolean)
    }
    if (query.pendingRestart !== undefined) {
      filters.pendingRestart = query.pendingRestart === 'true'
    }

    return this.eventsService.fetchEvents(filters)
  }

  @Get('events/failed')
  async getFailedEvents(@Query() query: Record<string, string>) {
    const page = query.page ? parseInt(query.page, 10) : undefined
    const pageSize = query.pageSize ? parseInt(query.pageSize, 10) : undefined
    const sourceIds = query.sourceIds
      ? query.sourceIds.split(',').filter(Boolean).map(Number)
      : undefined

    if (page !== undefined && pageSize !== undefined) {
      return this.eventsService.fetchFailedEventsPaginated(page, pageSize, sourceIds)
    }

    const limit = query.limit ? parseInt(query.limit, 10) : 3000
    return this.eventsService.fetchFailedEvents(limit, sourceIds)
  }

  @Get('events/pending-restart')
  async getPendingRestartEvents(@Query() query: Record<string, string>) {
    const page = query.page ? parseInt(query.page, 10) : undefined
    const pageSize = query.pageSize ? parseInt(query.pageSize, 10) : undefined

    if (page !== undefined && pageSize !== undefined) {
      return this.eventsService.fetchPendingRestartEventsPaginated(page, pageSize)
    }

    const limit = query.limit ? parseInt(query.limit, 10) : 3000
    return this.eventsService.fetchPendingRestartEvents(limit)
  }

  @Get('events/stats')
  async getEventsStats(@Query() query: Record<string, string>) {
    const filters: { sourceIds?: number[]; formats?: string[] } = {}
    if (query.sourceIds) {
      filters.sourceIds = query.sourceIds.split(',').filter(Boolean).map(Number)
    }
    if (query.formats) {
      filters.formats = query.formats.split(',').filter(Boolean)
    }
    return this.eventsService.fetchStats(filters)
  }

  @Get('formats')
  async getFormats() {
    return this.eventsService.fetchImageFormats()
  }

  @Post('restart')
  async restartEvent(@Body() body: RestartEventDto) {
    return this.restartService.restartEvent(body.eventId)
  }
}
