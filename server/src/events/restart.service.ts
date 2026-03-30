import { Injectable } from '@nestjs/common'
import { RestartResult } from '../types'
import { USE_MOCK, RESTART_API_BASE_URL } from '../lib/config'

export const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

@Injectable()
export class RestartService {
  async restartEvent(eventId: string, priority: string, notes: string): Promise<RestartResult> {
    if (!eventId || !eventId.trim()) {
      return {
        success: false,
        eventId,
        error: 'מזהה אירוע לא יכול להיות ריק',
      }
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return {
        success: false,
        eventId,
        error: `עדיפות לא חוקית: ${priority}. ערכים מותרים: ${VALID_PRIORITIES.join(', ')}`,
      }
    }

    if (USE_MOCK) {
      return {
        success: true,
        eventId,
        message: `אתחול עבור ${eventId} נוסף לתור בעדיפות ${priority} (מצב דמו)`,
      }
    }

    // --- Real API version (uncomment when USE_MOCK=false) ---
    // try {
    //   const response = await fetch(`${RESTART_API_BASE_URL}/events/${eventId}/restart`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ priority, notes }),
    //   })
    //   if (!response.ok) throw new Error(`HTTP ${response.status}`)
    //   const data = await response.json()
    //   return { success: true, eventId, message: data.message ?? 'אתחול נשלח' }
    // } catch (err: any) {
    //   return { success: false, eventId, error: err.message ?? 'שגיאת רשת' }
    // }

    void RESTART_API_BASE_URL
    return {
      success: false,
      eventId,
      error: 'Real API not configured. Set USE_MOCK=false and uncomment restart.service.ts.',
    }
  }
}
