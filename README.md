# TaskFlow

TaskFlow is a full-stack task management app built as a monorepo:
- `backend/`: Laravel 13 REST API
- `frontend/`: React 19 + Vite client

## Current Features

- Create, read, update, and archive tasks
- Archive view for soft-deleted tasks
- Restore archived tasks
- Permanently delete archived tasks
- Filter by status, search by title, and sort task lists
- Dashboard analytics for active tasks:
  - active / total / completed counters
  - completion distribution and rate
  - due soon and overdue insights
  - 7-day delivery trend (created vs completed)
- Floating top-right toast notifications for create/update/archive/restore/delete outcomes
- Archive mode shows archive table only (dashboard cards/graphs are hidden)

## Tech Stack

- Backend: PHP 8.3+, Laravel 13
- Frontend: React 19, Vite 8, Axios, react-calendar
- Database: MySQL (local runtime)
- Tests: PHPUnit (Laravel feature tests)

## Architecture Snapshot

### Backend

- Routes: `backend/routes/api.php`
- Controller: `backend/app/Http/Controllers/Api/TaskController.php`
- Model: `backend/app/Models/Task.php`
- Requests: `backend/app/Http/Requests/*Task*Request.php`
- Resource: `backend/app/Http/Resources/TaskResource.php`
- API response helper: `backend/app/Http/Controllers/Concerns/ApiResponse.php`
- API exception shaping: `backend/bootstrap/app.php`

### Frontend

- App composition: `frontend/src/App.jsx`
- App state/actions hook: `frontend/src/hooks/useTaskDashboard.js`
- Dashboard UI modules: `frontend/src/components/dashboard/*`
- Reusable task UI: `frontend/src/components/TaskForm.jsx`, `frontend/src/components/TaskList.jsx`
- API layer: `frontend/src/api/client.js`, `frontend/src/api/tasks.js`
- Shared constants/utilities: `frontend/src/constants/taskConstants.js`, `frontend/src/utils/taskUtils.js`
- Modular styling entrypoint: `frontend/src/index.css` -> `frontend/src/styles/*`

## API Summary

Base URL: `http://127.0.0.1:8000/api`

- `GET /tasks` - list active tasks
- `GET /tasks/archived` - list archived tasks
- `POST /tasks` - create task
- `GET /tasks/{id}` - get task
- `PUT /tasks/{id}` - update task (full payload)
- `PATCH /tasks/{id}/status` - update only status
- `DELETE /tasks/{id}` - archive task (soft delete)
- `PATCH /tasks/{id}/restore` - restore archived task
- `DELETE /tasks/{id}/force` - permanently delete archived task

List query params (`/tasks` and `/tasks/archived`):
- `status`: `pending | in_progress | completed`
- `search`: partial title match
- `sort`: `created_at`, `-created_at`, `title`, `-title`, `status`, `-status`, `due_date`, `-due_date`, `updated_at`, `-updated_at`

## Data Model

`tasks` table columns:
- `id`
- `title` (required)
- `description` (nullable)
- `status` (`pending | in_progress | completed`, default `pending`)
- `due_date` (nullable)
- `created_at`, `updated_at`
- `deleted_at` (soft delete/archive)

## Run Locally

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

Optional seed:

```bash
php artisan db:seed
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Default URLs:
- Backend: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:5173`

## Environment

- `frontend/.env.example`: `VITE_API_BASE_URL=/api`
- Vite dev server proxies `/api` to backend (`http://127.0.0.1:8000`)

## API Response Shape

Success:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "...",
  "errors": {}
}
```

## Verification (Latest)

Executed on 2026-04-13:

```bash
cd backend && php artisan test
cd frontend && npm run lint
cd frontend && npm run build
```

Result:
- Backend tests: PASS (`12 tests`, `47 assertions`)
- Frontend lint: PASS
- Frontend build: PASS

## Notes

- No authentication layer is implemented.
- `PUT /tasks/{id}` expects full payload.
- `PATCH /tasks/{id}/status` exists in API and is currently not used in the main UI flow.
