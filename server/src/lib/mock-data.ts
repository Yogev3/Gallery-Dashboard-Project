import { Event, Source } from '../types'

// ---------------------------------------------------------------------------
// Static reference data — mirrors what would live in the `sources` collection
// `weight` is mock-only and controls how often each source appears
// ---------------------------------------------------------------------------
export const MOCK_SOURCES: Source[] = [
  { sourceId: 1, SourceName: 'louvre',   SourceHebName: 'לובר',     weight: 28 },
  { sourceId: 2, SourceName: 'red-wolf', SourceHebName: 'זאב אדום', weight: 24 },
  { sourceId: 3, SourceName: 'akila',    SourceHebName: 'עקילה',    weight: 18 },
  { sourceId: 4, SourceName: 'shabas',   SourceHebName: 'שב"ס',     weight: 15 },
  { sourceId: 5, SourceName: 'rashbag',  SourceHebName: 'רשב"ג',    weight: 15 },
]

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
  const sourceNames   = MOCK_SOURCES.map(s => s.SourceName)
  const sourceWeights = MOCK_SOURCES.map(s => s.weight)
  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  const events: Event[] = []

  for (let i = 0; i < n; i++) {
    const isFailed = Math.random() < 0.22

    const source     = weightedChoice(sourceNames, sourceWeights)
    const semiSource = SEMI_SOURCES[randomInt(0, SEMI_SOURCES.length - 1)]
    const imgFormat  = weightedChoice(
      IMAGE_FORMATS as ('JPEG' | 'PNG' | 'BMP' | 'TIFF')[],
      [60, 25, 10, 5],
    )
    const faceCount = weightedChoice([1, 2, 3, 4, 5], [55, 25, 12, 5, 3])

    const createdMs  = now - randomInt(0, sevenDaysMs) - randomInt(0, 59) * 1000
    const receivedMs = createdMs + randomInt(1, 60) * 1000

    const failureReason  = isFailed ? FAILURE_REASONS[randomInt(0, FAILURE_REASONS.length - 1)] : undefined
    const pendingRestart = isFailed ? Math.random() < 0.35 : false
    const restartCount   = isFailed ? weightedChoice([0, 1, 2, 3], [50, 30, 15, 5]) : 0

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
      imageFormat:    imgFormat,
      sourceSystem:   source,
      semiSource:     semiSource,
      createdDate:    new Date(createdMs).toISOString(),
      receivedDate:   new Date(receivedMs).toISOString(),
      isFailed:       isFailed,
      amountOfFaces:  faceCount,
      failureReason:  failureReason,
      pendingRestart: pendingRestart,
      restartCount:   restartCount,
      facesPositions: facesPositions,
    })
  }

  return events
}
