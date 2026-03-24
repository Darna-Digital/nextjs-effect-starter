# learning-effect

Next.js app using [Effect-TS](https://effect.website) for typed errors, dependency injection, and composable business logic.

## Setup

```bash
pnpm install
```

## Dev

```bash
pnpm dev
```

App runs at http://localhost:3000.

## Tests

```bash
pnpm test          # single run
pnpm test:watch    # watch mode
```

## Project structure

Features live in `features/` and follow the composable-functions pattern:

```
features/project/
  entity/           # schemas, types, interfaces
  functions/        # business logic, mocks, tests
  adapters/         # wires real deps (JSON storage, tracing, error handling)
```

Shared stuff like `StorageError` and the tracing config live in `lib/`.

## Tracing

Local observability runs on Docker: OTEL Collector → Tempo → Grafana.

### Start the stack

```bash
docker compose up -d
```

This gives you:

| Service        | Port | What it does                  |
|----------------|------|-------------------------------|
| OTEL Collector | 4318 | Receives traces from the app  |
| Tempo          | 3200 | Stores traces                 |
| Grafana        | 3001 | UI for querying traces        |

### View traces

1. Start the app with `pnpm dev`
2. Hit an endpoint — `curl http://localhost:3000/api/projects`
3. Open http://localhost:3001
4. Go to **Explore** → pick **Tempo** → **Search** → **Run query**

Each request produces nested spans like:

```
GET /api/projects
  └── Project.getAll
```

### How it works

The app sends traces via Effect's `OtlpTracer` to the OTEL Collector on port 4318. The collector forwards them to Tempo, and Grafana queries Tempo to display them. All config lives in `infra/`.

### Tear down

```bash
docker compose down
```

## API

### Projects

| Method | Endpoint              | Description      |
|--------|-----------------------|------------------|
| GET    | `/api/projects`       | List all         |
| POST   | `/api/projects`       | Create (needs `{"title": "..."}`) |
| GET    | `/api/projects/:id`   | Get by id        |
| PUT    | `/api/projects/:id`   | Update           |
| DELETE | `/api/projects/:id`   | Delete           |

### Todos

| Method | Endpoint           | Description      |
|--------|--------------------|------------------|
| GET    | `/api/todos`       | List all         |
| POST   | `/api/todos`       | Create           |
| GET    | `/api/todos/:id`   | Get by id        |
| PUT    | `/api/todos/:id`   | Update           |
| DELETE | `/api/todos/:id`   | Delete           |
