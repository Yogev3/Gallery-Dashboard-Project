import { Event, Source } from '../types'

// ---------------------------------------------------------------------------
// Static reference data — mirrors what would live in the `sources` collection
// ---------------------------------------------------------------------------
export const MOCK_SOURCES: Source[] = [
  { sourceId: 1, SourceName: 'louvre',   SourceHebName: 'לובר'     },
  { sourceId: 2, SourceName: 'red-wolf', SourceHebName: 'זאב אדום' },
  { sourceId: 3, SourceName: 'akila',    SourceHebName: 'עקילה'    },
  { sourceId: 4, SourceName: 'shabas',   SourceHebName: 'שב"ס'     },
  { sourceId: 5, SourceName: 'rashbag',  SourceHebName: 'רשב"ג'    },
]

const SOURCE_WEIGHTS = [28, 24, 18, 15, 15]

export const IMAGE_FORMATS: string[] = ['JPEG', 'PNG', 'BMP', 'TIFF']
export const SEMI_SOURCES:  string[] = ['primary', 'secondary', 'tertiary']
export const FAILURE_REASONS: string[] = [
  'IMAGE_TOO_SMALL',
  'LOW_QUALITY',
  'NO_FACE_DETECTED',
  'HASH_COLLISION',
  'TIMEOUT',
]

// ---------------------------------------------------------------------------
// Weighted random selection helper
// ---------------------------------------------------------------------------
function weightedChoice<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ---------------------------------------------------------------------------
// Mock event generator
// ---------------------------------------------------------------------------
export function generateMockEvents(n: number): Event[] {
  const sourceIds     = MOCK_SOURCES.map(s => s.sourceId)
  const now = Math.floor(Date.now() / 1000)
  const sevenDaysSec = 7 * 24 * 60 * 60
  const events: Event[] = []

  for (let i = 0; i < n; i++) {
    const isFailed = Math.random() < 0.22

    const sourceId   = weightedChoice(sourceIds, SOURCE_WEIGHTS)
    const semiSource = SEMI_SOURCES[randomInt(0, SEMI_SOURCES.length - 1)]
    const format     = weightedChoice(IMAGE_FORMATS, [60, 25, 10, 5])
    const faceCount  = weightedChoice([1, 2, 3, 4, 5], [55, 25, 12, 5, 3])

    const createdSec  = now - randomInt(0, sevenDaysSec)
    const receivedSec = createdSec + randomInt(1, 60)

    const failureReason  = isFailed ? FAILURE_REASONS[randomInt(0, FAILURE_REASONS.length - 1)] : undefined
    const restartCount   = isFailed ? weightedChoice([0, 1, 2, 3, 4, 5], [35, 25, 15, 10, 10, 5]) : 0
    const pendingRestart = isFailed && restartCount < 3

    const facesPositions = Array.from({ length: faceCount }, () => ({
      left:   randomInt(0, 400),
      right:  randomInt(400, 800),
      top:    randomInt(0, 300),
      bottom: randomInt(300, 600),
    }))

    events.push({
      imageId:        `img_${randomInt(1000000, 9999999)}`,
      personId:       `person_${randomInt(10000, 99999)}`,
      imageHash:      `hash_${randomInt(100000000, 999999999)}`,
      format,
      sourceId,
      semiSource,
      createdDate:    createdSec,
      receivedDate:   receivedSec,
      isFailed,
      amountOfFaces:  faceCount,
      failureReason,
      pendingRestart,
      restartCount,
      facesPositions,
    })
  }

  return events
}
