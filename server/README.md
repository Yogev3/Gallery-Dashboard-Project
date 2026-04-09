# Server (NestJS)

## Required Environment Variables

All variables are **required** — the server will fail to start if any are missing. Create a `.env` file in the `server/` directory (see `.env.example`).

| Variable | Type | Description |
|---|---|---|
| `PORT` | number | Server port (e.g. `3001`) |
| `MONGO_URI` | string | MongoDB connection URI (e.g. `mongodb://mongo-service:27017`) |
| `MONGO_DB_NAME` | string | Database name (e.g. `events_db`) |
| `EVENTS_COLL` | string | Events collection name (e.g. `new-events`) |
| `SOURCES_COLL` | string | Sources collection name (e.g. `sources`) |
| `USE_MOCK` | boolean | `true` for mock data, `false` for real MongoDB |
| `RESTART_URL` | string (URI) | URL for the restart endpoint (e.g. `http://restart-service:3002/restart`) |
| `CORS_ORIGIN` | string | Allowed CORS origin (`*` for all, or a specific origin) |

## Running

```bash
cp .env.example .env   # then fill in values
npm install
npm run start:dev      # development with watch
npm run start          # production
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/events` | List events (query: `limit`, `isFailed`, `sourceIds`, `formats`, `pendingRestart`) |
| GET | `/api/events/failed` | Failed events (query: `page`, `pageSize`, `sourceIds`, or `limit`) |
| GET | `/api/events/pending-restart` | Pending restart events (query: `page`, `pageSize`, or `limit`) |
| GET | `/api/events/stats` | Aggregated stats (query: `sourceIds`, `formats`) |
| GET | `/api/formats` | Distinct image formats |
| GET | `/api/sources` | All sources from the sources collection |
| POST | `/api/restart` | Trigger event restart (body: `{ "eventId": "..." }`) |

Note: `sourceIds` is a comma-separated list of numeric source IDs (e.g. `1,3,5`).
