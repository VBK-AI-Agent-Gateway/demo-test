# prisma-task-api

Express + Prisma + PostgreSQL **Project / Task CRUD API** with input validation, unified error handling, pagination, search, database migrations, seed data, and Supertest integration tests.

## Features

- **CRUD**: `Project` and `Task` resources
- **Validation**: zod schemas for body / query / params
- **Unified errors**: `{ error: { code, message, details? } }` envelope, 404 handler, Prisma error mapping
- **Pagination**: `page`, `pageSize` (max 100), returns `{ data, pagination }`
- **Search**: `q` case-insensitive search on name/title/description
- **Filters**: tasks support `status`, `priority`, `projectId`
- **Migrations**: `prisma migrate` (dev) / `migrate deploy` (prod)
- **Seed data**: 3 projects, 12 tasks
- **Tests**: Supertest integration suite covering create / read / update / delete / pagination / search

## Quick start (Docker)

```bash
docker compose up --build
# API: http://localhost:3000
```

This starts PostgreSQL, runs migrations, seeds data, then boots the API.

## Run tests

```bash
# Option A: docker compose (Postgres + Jest in containers)
docker compose -f docker-compose.test.yml up --abort-on-container-exit --exit-code-from api

# Option B: local Postgres
cp .env.example .env    # set DATABASE_URL
npm install
npx prisma migrate deploy
npm test
```

## API reference

### Projects

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/projects` | List (query: `page`, `pageSize`, `q`) |
| GET | `/api/projects/:id` | Get one (includes tasks) |
| POST | `/api/projects` | Create `{ name, description? }` |
| PUT | `/api/projects/:id` | Update (partial allowed) |
| DELETE | `/api/projects/:id` | Delete (cascade deletes tasks) |

### Tasks

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/tasks` | List (query: `page`, `pageSize`, `q`, `status`, `priority`, `projectId`) |
| GET | `/api/tasks/:id` | Get one |
| POST | `/api/tasks` | Create `{ title, description?, status?, priority?, dueDate?, projectId }` |
| PUT | `/api/tasks/:id` | Update |
| DELETE | `/api/tasks/:id` | Delete |

### Examples

```bash
# Create project
curl -X POST http://localhost:3000/api/projects \
  -H 'content-type: application/json' \
  -d '{"name":"Demo","description":"A demo project"}'

# List with pagination + search
curl 'http://localhost:3000/api/projects?page=1&pageSize=5&q=demo'

# Create task
curl -X POST http://localhost:3000/api/tasks \
  -H 'content-type: application/json' \
  -d '{"title":"Write docs","projectId":"<PROJECT_UUID>","priority":"HIGH"}'

# Update task
curl -X PUT http://localhost:3000/api/tasks/<TASK_UUID> \
  -H 'content-type: application/json' \
  -d '{"status":"DONE"}'

# Delete
curl -X DELETE http://localhost:3000/api/tasks/<TASK_UUID>
```

## Error format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": { "fieldErrors": { "name": ["name is required"] } }
  }
}
```

Codes: `BAD_REQUEST` (400), `NOT_FOUND` (404), `VALIDATION_ERROR` (422), `INTERNAL_ERROR` (500).

## Project layout

```
src/
  app.js               # express app factory (testable)
  server.js            # entrypoint
  lib/prisma.js        # prisma singleton
  middleware/
    validate.js        # zod validation middleware
    error.js           # ApiError + unified error handler
  routes/
    projects.js
    tasks.js
prisma/
  schema.prisma
  seed.js
  migrations/
tests/
  api.test.js          # Supertest integration suite
docker-compose.yml     # db + api
docker-compose.test.yml# db + jest
Dockerfile
```