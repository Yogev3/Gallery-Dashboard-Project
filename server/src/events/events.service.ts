import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Event, PaginatedResult, EventsStats, NameCount, DayCount, HourCount, SourceStatusCount } from '../types'
import { generateMockEvents, IMAGE_FORMATS } from '../lib/mock-data'
import { DbService } from '../lib/db'
import { GetEventsDto } from './dto/get-events.dto'

@Injectable()
export class EventsService {
  constructor(
    private readonly config: ConfigService,
    private readonly dbService: DbService,
  ) {}

  private get useMock(): boolean {
    return this.config.get<boolean>('USE_MOCK')
  }

  private get eventsColl(): string {
    return this.config.get<string>('EVENTS_COLL')!
  }

  async fetchEvents(filters: GetEventsDto): Promise<Event[]> {
    const limit = filters.limit ?? 3000

    if (this.useMock) {
      let docs = generateMockEvents(limit)

      if (filters.isFailed !== undefined) {
        docs = docs.filter(d => d.isFailed === filters.isFailed)
      }
      if (filters.sourceIds && filters.sourceIds.length > 0) {
        docs = docs.filter(d => filters.sourceIds!.includes(d.sourceId))
      }
      if (filters.formats && filters.formats.length > 0) {
        docs = docs.filter(d => filters.formats!.includes(d.format!))
      }
      if (filters.pendingRestart) {
        docs = docs.filter(d => d.isFailed && (d.restartCount ?? 0) < 3)
      }

      return docs
    }

    const query: Record<string, any> = {}
    if (filters.isFailed !== undefined) query['isFailed'] = filters.isFailed
    if (filters.sourceIds?.length) query['sourceId'] = { $in: filters.sourceIds }
    if (filters.formats?.length)   query['format']   = { $in: filters.formats }
    if (filters.pendingRestart !== undefined) query['pendingRestart'] = filters.pendingRestart
    const db = await this.dbService.getDb()
    return db.collection<Event>(this.eventsColl).find(query, { projection: { _id: 0 } }).limit(limit).toArray()
  }

  async fetchEventsPaginated(filters: GetEventsDto): Promise<PaginatedResult<Event>> {
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 50
    const skip = (page - 1) * pageSize

    if (this.useMock) {
      let docs = generateMockEvents(filters.limit ?? 100000)

      if (filters.isFailed !== undefined) {
        docs = docs.filter(d => d.isFailed === filters.isFailed)
      }
      if (filters.sourceIds && filters.sourceIds.length > 0) {
        docs = docs.filter(d => filters.sourceIds!.includes(d.sourceId))
      }
      if (filters.formats && filters.formats.length > 0) {
        docs = docs.filter(d => filters.formats!.includes(d.format!))
      }
      if (filters.pendingRestart) {
        docs = docs.filter(d => d.isFailed && (d.restartCount ?? 0) < 3)
      }

      docs.sort((a, b) => b.receivedDate - a.receivedDate)

      const total = docs.length
      const data = docs.slice(skip, skip + pageSize)

      return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      }
    }

    const query: Record<string, any> = {}
    if (filters.isFailed !== undefined) query['isFailed'] = filters.isFailed
    if (filters.sourceIds?.length) query['sourceId'] = { $in: filters.sourceIds }
    if (filters.formats?.length)   query['format']   = { $in: filters.formats }
    if (filters.pendingRestart !== undefined) query['pendingRestart'] = filters.pendingRestart
    const db = await this.dbService.getDb()
    const col = db.collection<Event>(this.eventsColl)
    const [data, total] = await Promise.all([
      col.find(query, { projection: { _id: 0 } })
        .sort({ receivedDate: -1 })
        .skip(skip)
        .limit(pageSize)
        .toArray(),
      col.countDocuments(query),
    ])
    return { data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  }

  async fetchFailedEvents(limit: number, sourceIds?: number[]): Promise<Event[]> {
    return this.fetchEvents({ limit, isFailed: true, sourceIds })
  }

  async fetchFailedEventsPaginated(page: number, pageSize: number, sourceIds?: number[]): Promise<PaginatedResult<Event>> {
    return this.fetchEventsPaginated({ page, pageSize, isFailed: true, sourceIds })
  }

  async fetchPendingRestartEvents(limit: number): Promise<Event[]> {
    return this.fetchEvents({ limit, isFailed: true, pendingRestart: true })
  }

  async fetchPendingRestartEventsPaginated(page: number, pageSize: number): Promise<PaginatedResult<Event>> {
    return this.fetchEventsPaginated({ page, pageSize, isFailed: true, pendingRestart: true })
  }

  async fetchStats(filters?: { sourceIds?: number[]; formats?: string[] }): Promise<EventsStats> {
    if (this.useMock) {
      const docs = generateMockEvents(100000)

      let filtered = docs
      if (filters?.sourceIds?.length) {
        filtered = filtered.filter(d => filters.sourceIds!.includes(d.sourceId))
      }
      if (filters?.formats?.length) {
        filtered = filtered.filter(d => filters.formats!.includes(d.format!))
      }

      return this.computeStats(filtered)
    }

    const db = await this.dbService.getDb()
    const col = db.collection<Event>(this.eventsColl)
    const matchStage: Record<string, any> = {}
    if (filters?.sourceIds?.length) matchStage['sourceId'] = { $in: filters.sourceIds }
    if (filters?.formats?.length)   matchStage['format']   = { $in: filters.formats }

    const pipeline = [
      ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
      { $facet: {
        total:        [{ $count: 'count' }],
        failed:       [{ $match: { isFailed: true } }, { $count: 'count' }],
        pending:      [{ $match: { isFailed: true, pendingRestart: true } }, { $count: 'count' }],
        bySource:     [{ $group: { _id: '$sourceId', count: { $sum: 1 } } }],
        byFormat:     [{ $group: { _id: '$format', count: { $sum: 1 } } }],
        byReason:     [{ $match: { isFailed: true, failureReason: { $ne: null } } }, { $group: { _id: '$failureReason', count: { $sum: 1 } } }],
        byFaces:      [{ $group: { _id: '$amountOfFaces', count: { $sum: 1 } } }],
        dailyFailed:  [
          { $match: { isFailed: true } },
          { $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: { $toDate: { $cond: {
                  if: { $gt: ['$createdDate', 1e10] },
                  then: '$createdDate',
                  else: { $multiply: ['$createdDate', 1000] },
                }}},
              },
            },
            count: { $sum: 1 },
          }},
        ],
        hourly: [
          { $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d %H:00',
                date: { $toDate: { $cond: {
                  if: { $gt: ['$createdDate', 1e10] },
                  then: '$createdDate',
                  else: { $multiply: ['$createdDate', 1000] },
                }}},
              },
            },
            count: { $sum: 1 },
          }},
        ],
        sourceStatus: [{ $group: { _id: { src: '$sourceId', failed: '$isFailed' }, count: { $sum: 1 } } }],
      }}
    ]
    const [result] = await col.aggregate(pipeline).toArray() as any[]

    const totalEvents = result.total[0]?.count ?? 0
    const failedCount = result.failed[0]?.count ?? 0
    const pendingCount = result.pending[0]?.count ?? 0
    const successCount = totalEvents - failedCount

    const toNameCount = (arr: any[]): NameCount[] =>
      arr.map((r: any) => ({ name: String(r._id), count: r.count })).sort((a, b) => b.count - a.count)

    const dailyFailures: DayCount[] = result.dailyFailed
      .map((r: any) => ({ day: r._id, count: r.count }))
      .sort((a: DayCount, b: DayCount) => a.day.localeCompare(b.day))

    const hourlyEvents: HourCount[] = result.hourly
      .map((r: any) => ({ hour: r._id, count: r.count }))
      .sort((a: HourCount, b: HourCount) => a.hour.localeCompare(b.hour))

    const srcStatusMap: Record<string, { failed: number; success: number }> = {}
    for (const r of result.sourceStatus) {
      const src = String(r._id.src)
      if (!srcStatusMap[src]) srcStatusMap[src] = { failed: 0, success: 0 }
      if (r._id.failed) srcStatusMap[src].failed = r.count
      else srcStatusMap[src].success = r.count
    }
    const sourceStatusStacked: SourceStatusCount[] = Object.entries(srcStatusMap)
      .map(([source, v]) => ({ source, ...v }))

    const failedBySourceArr = result.bySource.filter((r: any) => {
      return result.sourceStatus.some((s: any) => String(s._id.src) === String(r._id) && s._id.failed)
    })

    return {
      totalEvents,
      successCount,
      failedCount,
      pendingCount,
      dailyFailures,
      hourlyEvents,
      failedBySource: toNameCount(failedBySourceArr),
      sourceCounts: toNameCount(result.bySource),
      formatCounts: toNameCount(result.byFormat),
      reasonCounts: toNameCount(result.byReason),
      facesCounts: toNameCount(result.byFaces),
      statusSplit: [
        { name: 'כישלון', count: failedCount },
        { name: 'הצלחה', count: successCount },
      ],
      sourceStatusStacked,
    }
  }

  private computeStats(docs: Event[]): EventsStats {
    let failedCount = 0
    let pendingCount = 0
    const dailyFailMap: Record<string, number> = {}
    const hourlyMap: Record<string, number> = {}
    const failedSrcMap: Record<string, number> = {}
    const sourceMap: Record<string, number> = {}
    const formatMap: Record<string, number> = {}
    const reasonMap: Record<string, number> = {}
    const facesMap: Record<string, number> = {}
    const srcStatusMap: Record<string, { failed: number; success: number }> = {}

    for (const e of docs) {
      if (e.isFailed) {
        failedCount++
        if ((e.restartCount ?? 0) < 3) pendingCount++
      }

      const srcKey = String(e.sourceId)

      if (e.isFailed) {
        const d = new Date(e.createdDate * 1000)
        if (!isNaN(d.getTime())) {
          const key = d.toISOString().slice(0, 10)
          dailyFailMap[key] = (dailyFailMap[key] ?? 0) + 1
        }
      }

      {
        const d = new Date(e.createdDate * 1000)
        if (!isNaN(d.getTime())) {
          const key = d.toISOString().slice(0, 13) + ':00'
          hourlyMap[key] = (hourlyMap[key] ?? 0) + 1
        }
      }

      if (e.isFailed) {
        failedSrcMap[srcKey] = (failedSrcMap[srcKey] ?? 0) + 1
      }

      sourceMap[srcKey] = (sourceMap[srcKey] ?? 0) + 1
      if (e.format) {
        formatMap[e.format] = (formatMap[e.format] ?? 0) + 1
      }

      if (e.isFailed && e.failureReason) {
        reasonMap[e.failureReason] = (reasonMap[e.failureReason] ?? 0) + 1
      }

      const fKey = String(e.amountOfFaces ?? 0)
      facesMap[fKey] = (facesMap[fKey] ?? 0) + 1

      if (!srcStatusMap[srcKey]) srcStatusMap[srcKey] = { failed: 0, success: 0 }
      if (e.isFailed) srcStatusMap[srcKey].failed++
      else srcStatusMap[srcKey].success++
    }

    const totalEvents = docs.length
    const successCount = totalEvents - failedCount

    const toNameCount = (m: Record<string, number>): NameCount[] =>
      Object.entries(m).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)

    const dailyFailures: DayCount[] = Object.entries(dailyFailMap)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day.localeCompare(b.day))

    const hourlyEvents: HourCount[] = Object.entries(hourlyMap)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour))

    const sourceStatusStacked: SourceStatusCount[] = Object.entries(srcStatusMap)
      .map(([source, v]) => ({ source, ...v }))

    return {
      totalEvents,
      successCount,
      failedCount,
      pendingCount,
      dailyFailures,
      hourlyEvents,
      failedBySource: toNameCount(failedSrcMap),
      sourceCounts: toNameCount(sourceMap),
      formatCounts: toNameCount(formatMap),
      reasonCounts: toNameCount(reasonMap),
      facesCounts: toNameCount(facesMap),
      statusSplit: [
        { name: 'כישלון', count: failedCount },
        { name: 'הצלחה', count: successCount },
      ],
      sourceStatusStacked,
    }
  }

  async fetchImageFormats(): Promise<string[]> {
    if (this.useMock) {
      return [...IMAGE_FORMATS].sort()
    }

    const db = await this.dbService.getDb()
    return (await db.collection<Event>(this.eventsColl).distinct('format')).sort()
  }
}
