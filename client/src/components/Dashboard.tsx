import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'

import KpiCard from './KpiCard'
import EventsTable from './EventsTable'
import {
  fetchSources,
  fetchEventsStats,
  fetchFailedEventsPaginated,
  fetchPendingRestartEventsPaginated,
  fetchImageFormats,
} from '../api/client'
import { Event, EventsStats, PaginatedResult, Source } from '../types'

// ── helpers ──────────────────────────────────────────────────────────────────

const EMPTY_STATS: EventsStats = {
  totalEvents: 0, successCount: 0, failedCount: 0, pendingCount: 0,
  dailyFailures: [], hourlyEvents: [], failedBySource: [], sourceCounts: [],
  formatCounts: [], reasonCounts: [], facesCounts: [], statusSplit: [],
  sourceStatusStacked: [],
}

// ── Multi-select dropdown ─────────────────────────────────────────────────────

interface MultiSelectProps {
  label: string
  options: { value: string; display: string }[]
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
    : selected.map(v => options.find(o => o.value === v)?.display ?? v).join(', ')

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
            <label key={opt.value} className="dropdown-item">
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
              />
              {opt.display}
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

export default function Dashboard() {
  // filters — sourceIds stored as string[] for the multi-select, converted to number[] for API
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [selectedFormats, setSelectedFormats]     = useState<string[]>([])

  // pagination
  const [failedPage, setFailedPage]   = useState(1)
  const [pendingPage, setPendingPage] = useState(1)
  const [pageSize, setPageSize]       = useState(50)

  // data
  const [stats, setStats]                 = useState<EventsStats>(EMPTY_STATS)
  const [failedResult, setFailedResult]   = useState<PaginatedResult<Event>>({ data: [], total: 0, page: 1, pageSize: 50, totalPages: 1 })
  const [pendingResult, setPendingResult] = useState<PaginatedResult<Event>>({ data: [], total: 0, page: 1, pageSize: 50, totalPages: 1 })
  const [sources, setSources]             = useState<Source[]>([])
  const [formats, setFormats]             = useState<string[]>([])
  const [loading, setLoading]             = useState(true)
  const [eventsLoading, setEventsLoading] = useState(false)

  // sourceId → SourceName lookup
  const sourceNameMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const s of sources) {
      m[String(s.sourceId)] = s.SourceName
    }
    return m
  }, [sources])

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

  // load stats + table data when filters change
  const loadData = useCallback(async () => {
    setEventsLoading(true)
    try {
      const sourceIds = selectedSourceIds.length ? selectedSourceIds.map(Number) : undefined
      const fmts = selectedFormats.length ? selectedFormats : undefined

      const [st, failed, pending] = await Promise.all([
        fetchEventsStats({ sourceIds, formats: fmts }),
        fetchFailedEventsPaginated(failedPage, pageSize, sourceIds),
        fetchPendingRestartEventsPaginated(pendingPage, pageSize),
      ])
      setStats(st)
      setFailedResult(failed)
      setPendingResult(pending)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setEventsLoading(false)
    }
  }, [selectedSourceIds, selectedFormats, failedPage, pendingPage, pageSize])

  useEffect(() => {
    if (!loading) {
      loadData()
    }
  }, [loading, loadData])

  if (loading) {
    return <div className="loading-text">טוען נתונים...</div>
  }

  // ── helper: resolve sourceId to name in stats arrays ─────────────────────
  function resolveSourceName(id: string): string {
    return sourceNameMap[id] ?? id
  }

  // ── stats from server ────────────────────────────────────────────────────
  const { totalEvents, successCount, failedCount, pendingCount,
    dailyFailures, hourlyEvents, failedBySource, sourceCounts,
    formatCounts, reasonCounts, facesCounts, statusSplit,
    sourceStatusStacked } = stats

  // map sourceId → SourceName for chart display
  const sourceCountsDisplay = sourceCounts.map(s => ({ ...s, name: resolveSourceName(s.name) }))
  const failedBySourceDisplay = failedBySource.map(s => ({ ...s, name: resolveSourceName(s.name) }))
  const sourceStatusDisplay = sourceStatusStacked.map(s => ({ ...s, source: resolveSourceName(s.source) }))

  const sourceOptions = sources.map(s => ({ value: String(s.sourceId), display: s.SourceName }))

  // ── tables use server-side paginated data directly
  const failedTableEvents = failedResult.data
  const failedCountPages = failedResult.totalPages

  const pendingTableEvents = pendingResult.data
  const pendingCountPages = pendingResult.totalPages

  return (
    <div>
      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="filter-bar">
        <label>
          מקור
          <MultiSelect
            label="מקור"
            options={sourceOptions}
            selected={selectedSourceIds}
            onChange={setSelectedSourceIds}
          />
        </label>

        <label>
          פורמט תמונה
          <select
            value={selectedFormats[0] ?? ''}
            onChange={e => {
              const v = e.target.value
              setSelectedFormats(v ? [v] : [])
            }}
          >
            <option value="">הכל</option>
            {formats.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
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
          onClick={loadData}
          disabled={eventsLoading}
        >
          {eventsLoading ? 'טוען...' : 'רענן'}
        </button>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div className="kpi-row">
        <KpiCard label='כישלונות טוטאליים (סה"כ)'  value={failedCount}  variant="failed"  />
        <KpiCard label="ממתינים לאתחול"   value={pendingCount}  variant="pending" />
        <KpiCard label='הצלחות (סה"כ)'    value={successCount}  variant="ok"      />
        <KpiCard label='סה"כ אירועים'     value={totalEvents}   variant="neutral" />
      </div>

      {/* ── Failures over time ──────────────────────────────────────────── */}
      <div className="chart-card-full">
        <p className="section-title">כישלונות לפי יום</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyFailures} margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} width={50} />
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

      {/* ── Side-by-side tables ────────────────────────────────────────── */}
      <div className="tables-grid-2">
        <div className="table-panel">
          <p className="section-title">
            אירועים שנכשלו ({failedCount.toLocaleString()})
          </p>
          <Pagination
            page={failedPage}
            totalPages={failedCountPages}
            pageSize={pageSize}
            totalItems={failedCount}
            onPageChange={setFailedPage}
            onPageSizeChange={s => { setPageSize(s); setFailedPage(1); setPendingPage(1) }}
          />
          <EventsTable
            events={failedTableEvents}
            sourceNameMap={sourceNameMap}
            columns={[
              'imageId', 'personId', 'sourceId', 'semiSource',
              'format', 'failureReason', 'restartCount',
              'amountOfFaces', 'createdDate', 'receivedDate',
            ]}
          />
          <Pagination
            page={failedPage}
            totalPages={failedCountPages}
            pageSize={pageSize}
            totalItems={failedCount}
            onPageChange={setFailedPage}
            onPageSizeChange={s => { setPageSize(s); setFailedPage(1); setPendingPage(1) }}
          />
        </div>

        <div className="table-panel">
          <p className="section-title">
            ממתינים להפעלה מחדש ({pendingCount.toLocaleString()})
          </p>
          <Pagination
            page={pendingPage}
            totalPages={pendingCountPages}
            pageSize={pageSize}
            totalItems={pendingCount}
            onPageChange={setPendingPage}
            onPageSizeChange={s => { setPageSize(s); setFailedPage(1); setPendingPage(1) }}
          />
          <EventsTable
            events={pendingTableEvents}
            sourceNameMap={sourceNameMap}
            columns={[
              'imageId', 'personId', 'sourceId', 'semiSource',
              'format', 'failureReason', 'restartCount',
              'amountOfFaces', 'createdDate', 'receivedDate',
            ]}
          />
          <Pagination
            page={pendingPage}
            totalPages={pendingCountPages}
            pageSize={pageSize}
            totalItems={pendingCount}
            onPageChange={setPendingPage}
            onPageSizeChange={s => { setPageSize(s); setFailedPage(1); setPendingPage(1) }}
          />
        </div>
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
                data={statusSplit}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
              >
                {statusSplit.map(entry => (
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
            <BarChart data={failedBySourceDisplay} margin={{ top: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} width={50} />
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
                data={sourceCountsDisplay}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
              >
                {sourceCountsDisplay.map((entry, i) => (
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
            <BarChart data={formatCounts} margin={{ top: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} width={50} />
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
            <BarChart data={sourceStatusDisplay} margin={{ top: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="source" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} width={50} />
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Bar dataKey="success" stackId="a" fill="#2D6A4F" name="הצלחה" />
              <Bar dataKey="failed" stackId="a" fill="#C1121F" name="כישלון" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <p className="section-title">סיבות כישלון</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reasonCounts} layout="vertical" margin={{ left: 20, right: 40, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} width={50} />
              <YAxis dataKey="name" type="category" width={200} tick={{ fontSize: 11 }} />
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
            <BarChart data={facesCounts.sort((a, b) => Number(a.name) - Number(b.name))} margin={{ top: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" label={{ value: 'כמות פנים', position: 'insideBottom', offset: -2 }} />
              <YAxis allowDecimals={false} width={50} />
              <Tooltip />
              <Bar dataKey="count" fill="#1D3557" name="אירועים" label={{ position: 'top', fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <p className="section-title">כל האירועים לפי שעה</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyEvents} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} width={50} />
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
