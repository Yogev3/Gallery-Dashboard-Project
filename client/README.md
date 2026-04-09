# Client (React + Vite)

## Required Environment Variables

The client will fail to render if required variables are missing. Create a `.env` file in the `client/` directory (see `.env.example`).

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE` | **yes** | API base path (e.g. `/api` when behind a reverse proxy, or `http://server-host:3001/api` for direct access) |
| `VITE_API_TARGET` | no | Dev proxy target, only used by `vite dev` server (e.g. `http://localhost:3001`). Defaults to `http://localhost:3001` |

## Running

```bash
cp .env.example .env   # then fill in values
npm install
npm run dev            # development server on 0.0.0.0:5173
npm run build          # production build to dist/
npm run preview        # preview production build
```

## Notes

- The dev server binds to `0.0.0.0:5173` and proxies `/api` requests to the server (`VITE_API_TARGET`).
- For production builds, `VITE_API_BASE` is baked in at build time. Set it before running `npm run build`.
- If the client and server are behind the same reverse proxy/ingress, use `VITE_API_BASE=/api`.
