import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RestartResult } from '../types'

@Injectable()
export class RestartService {
  constructor(private readonly config: ConfigService) {}

  async restartEvents(imageIds: string[]): Promise<RestartResult> {
    if (!imageIds || imageIds.length === 0) {
      return {
        success: false,
        eventId: '',
        error: 'רשימת מזהי תמונות לא יכולה להיות ריקה',
      }
    }

    try {
      const restartUrl = this.config.get<string>('RESTART_URL')
      const response = await fetch(restartUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds }),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return {
        success: true,
        eventId: imageIds.join(', '),
        message: `אתחול עבור ${imageIds.length} אירועים נשלח בהצלחה`,
      }
    } catch (err: any) {
      return { success: false, eventId: imageIds.join(', '), error: err.message ?? 'שגיאת רשת' }
    }
  }
}
