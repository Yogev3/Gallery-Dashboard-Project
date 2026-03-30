import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'

import KpiCard from './KpiCard'
import EventsTable from './EventsTable'
import RestartForm from './RestartForm'
import {
  fetchSources,
  fetchEvents,
  fetchFailedEvents,
  fetchPendingRestartEvents,
  fetchImageFormats,
} from '../api/client'
import { Event, Source } from '../types'

// ── helpers ──────────────────────────────────────────────────────────────────

function groupByDay(events: Event[]): { day: string; count: number }[] {
  const counts: Record<string, number> = {}
  for (const e of events) {
    const d = new Date(e.createdDate)
    if (isNaN(d.getTime())) continue
    const key = d.toLocaleDateString('he-IL')
    counts[key] = (counts[key] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => {
      // parse back to compare
      const da = new Date(a.day.split('.').reverse().join('-'))
      const db = new Date(b.day.split('.').reverse().join('-'))
      return da.getTime() - db.getTime()
    })
}

function groupByHour(events: Event[]): { hour: string; count: number }[] {
  const counts: Record<string, number> = {}
  for (const e of events) {
    const d = new Date(e.createdDate)
    if (isNaN(d.getTime())) continue
    const key = `${d.toLocaleDateString('he-IL')} ${d.getHours()}:00`
    counts[key] = (counts[key] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => {
      const [dateA, timeA] = a.hour.split(' ')
      const [dateB, timeB] = b.hour.split(' ')
      const da = new Date(dateA.split('.').reverse().join('-') + 'T' + timeA)
      const db = new Date(dateB.split('.').reverse().join('-') + 'T' + timeB)
      return da.getTime() - db.getTime()
    })
}

function countBy(events: Event[], key: keyof Event): { name: string; count: number }[] {
  const counts: Record<string, number> = {}
  for (const e of events) {
    const val = String(e[key] ?? 'UNKNOWN')
    counts[val] = (counts[val] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

function statusSplit(events: Event[]): { name: string; count: number }[] {
  let failed = 0
  let success = 0
  for (const e of events) {
    if (e.isFailed) failed++
    else success++
  }
  return [
    { name: 'כישלון', count: failed },
    { name: 'הצלחה', count: success },
  ]
}

function sourceStatusStacked(
  events: Event[],
): { source: string; כישלון: number; הצלחה: number }[] {
  const map: Record<string, { כישלון: number; הצלחה: number }> = {}
  for (const e of events) {
    const src = e.sourceSystem
    if (!map[src]) map[src] = { כישלון: 0, הצלחה: 0 }
    if (e.isFailed) map[src].כישלון++
    else            map[src].הצלחה++
  }
  return Object.entries(map).map(([source, v]) => ({ source, ...v }))
}

// ── Multi-select dropdown ─────────────────────────────────────────────────────

interface MultiSelectProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function toggle(opt: string) {
    if (selected.includes(opt)) onChange(selected.filter(s => s !== opt))
    else onChange([...selected, opt])
  }

  const displayText = selected.length === 0
    ? `${label} (הכל)`
    : selected.join(', ')

  return (
    <div className="multi-select-dropdown" ref={ref}>
      <button
        type="button"
        className="dropdown-toggle"
        onClick={() => setOpen(o => !o)}
        title={displayText}
      >
        {displayText.length > 24 ? displayText.slice(0, 22) + '…' : displayText}
        {' ▾'}
      </button>
      {open && (
        <div className="dropdown-menu">
          {options.map(opt => (
            <label key={opt} className="dropdown-item">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200]

interface PaginationProps {
  page: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
}

function Pagination({ page, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange }: PaginationProps) {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, totalItems)

  return (
    <div className="pagination-bar">
      <span className="pagination-info">{from}–{to} מתוך {totalItems.toLocaleString()}</span>
      <div className="pagination-controls">
        <button
          className="page-btn"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          title="עמוד ראשון"
        >«</button>
        <button
          className="page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >‹ הקודם</button>
        <span className="page-current">עמוד {page} / {totalPages}</span>
        <button
          className="page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >הבא ›</button>
        <button
          className="page-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          title="עמוד אחרון"
        >»</button>
      </div>
      <label className="page-size-label">
        שורות בעמוד
        <select value={pageSize} onChange={e => { onPageSizeChange(Number(e.target.value)); onPageChange(1) }}>
          {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  'כישלון': '#C1121F',
  'הצלחה':  '#2D6A4F',
}

const LIMIT_OPTIONS = [500, 1000, 3000, 5000, 10000]

export default function Dashboard() {
  // filters
  const [limit, setLimit]               = useState(3000)
  const [isFailed, setIsFailed]         = useState<boolean | null>(null)
  const [sourceSystems, setSourceSystems] = useState<string[]>([])
  const [imageFormats, setImageFormats]   = useState<string[]>([])
  const [pendingOnly, setPendingOnly]     = useState(false)
  const [activeTab, setActiveTab]         = useState<'failed' | 'pending'>('failed')

  // pagination
  const [failedPage, setFailedPage]   = useState(1)
  const [pendingPage, setPendingPage] = useState(1)
  const [pageSize, setPageSize]       = useState(50)

  // data
  const [events, setEvents]               = useState<Event[]>([])
  const [failedEvents, setFailedEvents]   = useState<Event[]>([])
  const [pendingEvents, setPendingEvents] = useState<Event[]>([])
  const [sources, setSources]             = useState<Source[]>([])
  const [formats, setFormats]             = useState<string[]>([])
  const [loading, setLoading]             = useState(true)
  const [eventsLoading, setEventsLoading] = useState(false)

  // load static data on mount
  useEffect(() => {
    Promise.all([fetchSources(), fetchImageFormats()])
      .then(([srcs, fmts]) => {
        setSources(srcs)
        setFormats(fmts)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // load events when filters change
  const loadEvents = useCallback(async () => {
    setEventsLoading(true)
    try {
      const filters = {
        limit,
        isFailed: isFailed ?? undefined,
        sourceSystems: sourceSystems.length ? sourceSystems : undefined,
        imageFormats: imageFormats.length ? imageFormats : undefined,
        pendingRestart: pendingOnly ? true : undefined,
      }
      const [evs, failed, pending] = await Promise.all([
        fetchEvents(filters),
        fetchFailedEvents(limit),
        fetchPendingRestartEvents(limit),
      ])
      setEvents(evs)
      setFailedEvents(failed)
      setPendingEvents(pending)
    } catch (err) {
      console.error('Failed to load events:', err)
    } finally {
      setEventsLoading(false)
    }
  }, [limit, isFailed, sourceSystems, imageFormats, pendingOnly])

  useEffect(() => {
    if (!loading) {
      loadEvents()
    }
  }, [loading, loadEvents])

  // reset table pages when data reloads
  useEffect(() => { setFailedPage(1) }, [failedEvents])
  useEffect(() => { setPendingPage(1) }, [pendingEvents])

  if (loading) {
    return <div className="loading-text">טוען נתונים...</div>
  }

  // ── computed stats ────────────────────────────────────────────────────────
  const totalEvents  = events.length
  const successCount = events.filter(e => !e.isFailed).length
  const failedTotal  = failedEvents.length
  const pendingTotal = pendingEvents.length

  const dailyFailures  = groupByDay(failedEvents)
  const hourlyEvents   = groupByHour(events)
  const failedBySrc    = countBy(failedEvents, 'sourceSystem')
  const sourceCounts   = countBy(events, 'sourceSystem')
  const formatCounts   = countBy(events, 'imageFormat')
  const reasonCounts   = countBy(failedEvents.filter(e => e.failureReason), 'failureReason')
  const facesCounts    = countBy(events, 'amountOfFaces')
  const statusPie      = statusSplit(events)
  const stackedData    = sourceStatusStacked(events)

  const sourceNames = sources.map(s => s.SourceName)

  // ── failed table — sorted by receivedDate desc, paginated
  const failedSorted = [...failedEvents]
    .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime())
  const failedTotalPages = Math.max(1, Math.ceil(failedSorted.length / pageSize))
  const failedTableEvents = failedSorted.slice((failedPage - 1) * pageSize, failedPage * pageSize)

  // ── pending table — sorted by createdDate desc, paginated
  const pendingSorted = [...pendingEvents]
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
  const pendingTotalPages = Math.max(1, Math.ceil(pendingSorted.length / pageSize))
  const pendingTableEvents = pendingSorted.slice((pendingPage - 1) * pageSize, pendingPage * pageSize)

  return (
    <div>
      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="filter-bar">
        <label>
          מספר אירועים
          <select
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
          >
            {LIMIT_OPTIONS.map(l => (
              <option key={l} value={l}>{l.toLocaleString()}</option>
            ))}
          </select>
        </label>

        <label>
          סטטוס
          <select
            value={isFailed === null ? '' : String(isFailed)}
            onChange={e => {
              const v = e.target.value
              setIsFailed(v === '' ? null : v === 'true')
            }}
          >
            <option value="">הכל</option>
            <option value="false">הצלחה</option>
            <option value="true">כישלון</option>
          </select>
        </label>

        <label>
          מקור
          <MultiSelect
            label="מקור"
            options={sourceNames}
            selected={sourceSystems}
            onChange={setSourceSystems}
          />
        </label>

        <label>
          פורמט תמונה
          <select
            value={imageFormats[0] ?? ''}
            onChange={e => {
              const v = e.target.value
              setImageFormats(v ? [v] : [])
            }}
          >
            <option value="">הכל</option>
            {formats.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={e => setPendingOnly(e.target.checked)}
          />
          ממתינים לאתחול בלבד
        </label>

        <button
          type="button"
          style={{
            padding: '6px 16px',
            background: '#1D3557',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            alignSelf: 'flex-end',
          }}
          onClick={loadEvents}
          disabled={eventsLoading}
        >
          {eventsLoading ? 'טוען...' : 'רענן'}
        </button>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div className="kpi-row">
        <KpiCard label='כישלונות (סה"כ)'      value={failedTotal}  variant="failed"  />
        <KpiCard label="ממתינים לאתחול"       value={pendingTotal} variant="pending" />
        <KpiCard label="הצלחות (תצוגה נוכחית)" value={successCount} variant="ok"      />
        <KpiCard label='סה"כ אירועים (תצוגה)'  value={totalEvents}  variant="neutral" />
      </div>

      {/* ── Failures over time ──────────────────────────────────────────── */}
      <div className="chart-card-full">
        <p className="section-title">כישלונות לפי יום</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyFailures}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#C1121F"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="כישלונות"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <hr className="divider" />

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="tab-bar">
        <button
          className={`tab-btn${activeTab === 'failed' ? ' active' : ''}`}
          onClick={() => setActiveTab('failed')}
        >
          אירועים כושלים ({failedTotal.toLocaleString()})
        </button>
        <button
          className={`tab-btn${activeTab === 'pending' ? ' active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          ממתינים לאתחול ({pendingTotal.toLocaleString()})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'failed' && (
          <>
            <p className="section-title">
              סה&quot;כ כישלונות: {failedTotal.toLocaleString()}
            </p>
            <Pagination
              page={failedPage}
              totalPages={failedTotalPages}
              pageSize={pageSize}
              totalItems={failedSorted.length}
              onPageChange={setFailedPage}
              onPageSizeChange={setPageSize}
            />
            <EventsTable
              events={failedTableEvents}
              columns={[
                'imageId', 'personId', 'sourceSystem', 'imageFormat',
                'failureReason', 'restartCount', 'createdDate', 'receivedDate',
              ]}
            />
            <Pagination
              page={failedPage}
              totalPages={failedTotalPages}
              pageSize={pageSize}
              totalItems={failedSorted.length}
              onPageChange={setFailedPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}

        {activeTab === 'pending' && (
          <>
            <p className="section-title">
              סה&quot;כ ממתינים לאתחול: {pendingTotal.toLocaleString()}
            </p>
            <Pagination
              page={pendingPage}
              totalPages={pendingTotalPages}
              pageSize={pageSize}
              totalItems={pendingSorted.length}
              onPageChange={setPendingPage}
              onPageSizeChange={setPageSize}
            />
            <EventsTable
              events={pendingTableEvents}
              columns={[
                'imageId', 'personId', 'sourceSystem',
                'failureReason', 'restartCount', 'createdDate',
              ]}
            />
            <Pagination
              page={pendingPage}
              totalPages={pendingTotalPages}
              pageSize={pageSize}
              totalItems={pendingSorted.length}
              onPageChange={setPendingPage}
              onPageSizeChange={setPageSize}
            />
            <RestartForm />
          </>
        )}
      </div>

      <hr className="divider" />

      {/* ── Charts grid ─────────────────────────────────────────────────── */}

      {/* Row A — status pie + failures by source */}
      <div className="charts-grid-2">
        <div className="chart-card">
          <p className="section-title">הצלחה מול כישלון</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusPie}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) =>
                  percent > 0.03 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                }
              >
                {statusPie.map(entry => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] ?? '#888'}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <p className="section-title">כישלונות לפי מקור</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={failedBySrc} margin={{ top: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#C1121F" name="כישלונות" label={{ position: 'top', fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row B — source split pie + image format bar */}
      <div className="charts-grid-2">
        <div className="chart-card">
          <p className="section-title">פיצול אירועים לפי מקור</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sourceCounts}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) =>
                  percent > 0.03 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                }
              >
                {sourceCounts.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={['#1D3557','#457B9D','#A8DADC','#2D6A4F','#E76F00'][i % 5]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <p className="section-title">פורמט תמונה</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formatCounts} margin={{ top: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#457B9D" name="כמות" label={{ position: 'top', fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row C — source × status stacked + failure reasons */}
      <div className="charts-grid-2">
        <div className="chart-card">
          <p className="section-title">סטטוס לפי מקור</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stackedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="source" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="הצלחה" stackId="a" fill="#2D6A4F" />
              <Bar dataKey="כישלון" stackId="a" fill="#C1121F" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <p className="section-title">סיבות כישלון</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reasonCounts} layout="vertical" margin={{ right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#E76F00" name="כמות" label={{ position: 'right', fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row D — faces distribution + events per hour */}
      <div className="charts-grid-2">
        <div className="chart-card">
          <p className="section-title">התפלגות כמות פנים בתמונה</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={facesCounts.sort((a, b) => Number(a.name) - Number(b.name))} margin={{ top: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" label={{ value: 'כמות פנים', position: 'insideBottom', offset: -4 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#1D3557" name="אירועים" label={{ position: 'top', fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <p className="section-title">כל האירועים לפי שעה</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyEvents}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#457B9D"
                strokeWidth={2}
                dot={false}
                name="אירועים"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
