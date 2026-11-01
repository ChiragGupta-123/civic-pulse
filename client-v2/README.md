# Civic Pulse client v2

The municipal register SPA. React 18, Vite 5, strict TypeScript, Radix UI primitives, Tailwind CSS, Zustand, React Router and Leaflet.

## Run

```bash
npm install
npm run dev
```

The dev server is fixed to port **5174**. It proxies `/api`, `/ws` and `/local-media` to the FastAPI server on `127.0.0.1:8000`, so the browser makes same-origin requests and CORS does not apply in development.

The API, PostgreSQL, Redis and MinIO can be started from the repository root; see the root `README.md`. The frontend renders its error states when the API is absent, so the shell can be reviewed without it.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on port 5174 |
| `npm run typecheck` | Strict TypeScript check for the app and the Vite config |
| `npm run build` | Typecheck, then a production build into `dist/` |
| `npm run preview` | Serve the production build on port 5174 |

## Environment

`VITE_API_BASE_URL` defaults to `/api/v1`. Set it only when the API is served from another origin; direct cross-origin use requires that origin in the server's `CORS_ORIGINS`.

## Routes

| Route | State |
| --- | --- |
| `/` | Overview: public dashboard KPIs and the department ledger |
| `/grievances` | Register: filters, page-local search, pagination, map view, intake, detail panel |
| `/grievances/:ticketId` | Full record with audit trail and officer state transitions |
| `/login` | Session sign-in |
| `/accountability`, `/policies`, `/agent`, `/fact-check` | Phase 2 screens, backed by the endpoints named on each sheet |

## API contracts

- `GET /api/v1/grievances?page&page_size&severity&status&category`
- `GET /api/v1/grievances/{ticket_id}`
- `POST /api/v1/grievances` (multipart: `description`, `latitude`, `longitude`, `address_label`, `category_hint`, `photo_file`)
- `PATCH /api/v1/grievances/{ticket_id}/status` (JSON: `status`, `remarks`; officer or administrator)
- `GET /api/v1/grievances/public-dashboard`
- `POST /api/v1/auth/login`, `GET /api/v1/auth/me`

All responses are read through the shared `ApiEnvelope`, so errors surface as a typed `RequestError` with the server's message, field errors and request id.

## Design system

The Hallmark stamp and Furrow tokens live at the top of `src/styles/tokens.css`. `src/styles/index.css` holds the shared control, field, nav and ledger recipes. Tailwind reads the same custom properties from `tailwind.config.js`; there are no literal colours in component classes.

## Known limits

- Search is page-local: the list endpoint has no search parameter.
- The reading-language selector stores a preference but the interface copy is English only.
- The map uses OpenStreetMap tiles and needs network access.
