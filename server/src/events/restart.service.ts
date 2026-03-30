import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RestartResult } from '../types'

@Injectable()
export class RestartService {
  constructor(private readonly config: ConfigService) {}

  async restartEvent(eventId: string): Promise<RestartResult> {
    if (!eventId || !eventId.trim()) {
      return {
        success: false,
        eventId,
        error: 'מזהה אירוע לא יכול להיות ריק',
      }
    }

    try {
      const restartUrl = this.config.get<string>('RESTART_URL')
      const response = await fetch(restartUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return { success: true, eventId, message: `אתחול עבור ${eventId} נשלח בהצלחה` }
    } catch (err: any) {
      return { success: false, eventId, error: err.message ?? 'שגיאת רשת' }
    }
  }
}
