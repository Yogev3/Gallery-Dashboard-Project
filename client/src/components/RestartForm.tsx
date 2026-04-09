import { useState, FormEvent } from 'react'
import { restartEvents } from '../api/client'

interface RestartFormProps {
  failedImageIds: string[]
  onSuccess?: () => void
}

export default function RestartForm({ failedImageIds, onSuccess }: RestartFormProps) {
  const [imageId, setImageId]       = useState('')
  const [loading, setLoading]       = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg]     = useState<string | null>(null)

  async function send(ids: string[]) {
    setSuccessMsg(null)
    setErrorMsg(null)
    setLoading(true)

    try {
      const result = await restartEvents(ids)
      if (result.success) {
        setSuccessMsg(result.message ?? `אתחול עבור ${ids.length} אירועים נשלח בהצלחה`)
        setImageId('')
        onSuccess?.()
      } else {
        setErrorMsg(result.error ?? 'שגיאה לא ידועה')
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'שגיאת רשת')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmitSingle(e: FormEvent) {
    e.preventDefault()
    const trimmed = imageId.trim()
    if (!trimmed) return
    send([trimmed])
  }

  function handleRestartAll() {
    if (failedImageIds.length === 0) return
    send(failedImageIds)
  }

  return (
    <div className="restart-inline">
      <form onSubmit={handleSubmitSingle} className="restart-row">
        <div className="restart-input-group">
          <label htmlFor="imageId">imageId</label>
          <input
            id="imageId"
            type="text"
            value={imageId}
            onChange={e => setImageId(e.target.value)}
            placeholder="img_XXXXXXX"
            required
          />
        </div>
        <button type="submit" className="restart-btn restart-btn-single" disabled={loading}>
          {loading ? 'שולח...' : 'שלח אתחול'}
        </button>
        <button
          type="button"
          className="restart-btn restart-btn-all"
          disabled={loading || failedImageIds.length === 0}
          onClick={handleRestartAll}
        >
          {loading ? 'שולח...' : `אתחול כל הנכשלים (${failedImageIds.length.toLocaleString()})`}
        </button>
      </form>
      {successMsg && <div className="restart-alert restart-alert-ok">{successMsg}</div>}
      {errorMsg   && <div className="restart-alert restart-alert-err">{errorMsg}</div>}
    </div>
  )
}
