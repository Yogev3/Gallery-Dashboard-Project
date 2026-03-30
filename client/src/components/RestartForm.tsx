import { useState, FormEvent } from 'react'
import { restartEvent } from '../api/client'

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

interface RestartFormProps {
  onSuccess?: (msg: string) => void
}

export default function RestartForm({ onSuccess }: RestartFormProps) {
  const [eventId, setEventId]   = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [notes, setNotes]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg]     = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSuccessMsg(null)
    setErrorMsg(null)
    setLoading(true)

    try {
      const result = await restartEvent(eventId.trim(), priority, notes)
      if (result.success) {
        const msg = result.message ?? `אתחול עבור ${result.eventId} נשלח בהצלחה`
        setSuccessMsg(msg)
        setEventId('')
        setNotes('')
        onSuccess?.(msg)
      } else {
        setErrorMsg(result.error ?? 'שגיאה לא ידועה')
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'שגיאת רשת')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="restart-form">
      <h3>הפעל אתחול לאירוע</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="eventId">מזהה אירוע</label>
          <input
            id="eventId"
            type="text"
            value={eventId}
            onChange={e => setEventId(e.target.value)}
            placeholder="img_XXXXXXX"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="priority">עדיפות</label>
          <select
            id="priority"
            value={priority}
            onChange={e => setPriority(e.target.value)}
          >
            {VALID_PRIORITIES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="notes">הערות</label>
          <textarea
            id="notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="סיבת האתחול..."
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'שולח...' : 'שלח אתחול'}
        </button>
      </form>

      {successMsg && <div className="alert-success">{successMsg}</div>}
      {errorMsg   && <div className="alert-error">{errorMsg}</div>}
    </div>
  )
}
