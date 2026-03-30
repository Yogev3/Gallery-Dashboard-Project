import { Event } from '../types'

interface EventsTableProps {
  events: Event[]
  columns: (keyof Event)[]
}

function formatCellValue(key: keyof Event, value: unknown): string {
  if (value === undefined || value === null) return '—'
  if (key === 'isFailed') return value ? '✗' : '✓'
  if (key === 'pendingRestart') return value ? 'כן' : 'לא'
  if (key === 'createdDate' || key === 'receivedDate') {
    const d = new Date(value as string)
    return isNaN(d.getTime()) ? String(value) : d.toLocaleString('he-IL')
  }
  if (key === 'facesPositions') {
    return Array.isArray(value) ? `[${(value as unknown[]).length} faces]` : String(value)
  }
  return String(value)
}

const COLUMN_LABELS: Partial<Record<keyof Event, string>> = {
  imageId:        'מזהה תמונה',
  personId:       'מזהה אדם',
  imageHash:      'האש',
  imageFormat:    'פורמט',
  sourceSystem:   'מקור',
  semiSource:     'מקור משני',
  createdDate:    'תאריך יצירה',
  receivedDate:   'תאריך קבלה',
  isFailed:       'סטטוס',
  amountOfFaces:  'פנים',
  failureReason:  'סיבת כישלון',
  pendingRestart: 'ממתין לאתחול',
  restartCount:   'מספר אתחולים',
  facesPositions: 'מיקומי פנים',
}

export default function EventsTable({ events, columns }: EventsTableProps) {
  return (
    <div className="table-scroll">
      <table className="events-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col}>{COLUMN_LABELS[col] ?? col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: 24 }}>
                לא נמצאו אירועים
              </td>
            </tr>
          ) : (
            events.map((event, idx) => (
              <tr key={event.imageId + idx}>
                {columns.map(col => (
                  <td
                    key={col}
                    style={
                      col === 'isFailed'
                        ? { color: event.isFailed ? '#C1121F' : '#2D6A4F', fontWeight: 700 }
                        : undefined
                    }
                  >
                    {formatCellValue(col, event[col])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
