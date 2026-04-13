# TaskFlow Project Knowledge Base (`codex.md`)

Last updated: 2026-04-13 13:00:31 +0600

## 1. Project Snapshot
TaskFlow is a full-stack task management monorepo with:
- `backend/`: Laravel 13 REST API
- `frontend/`: React 19 + Vite client

Current core capabilities:
- Task CRUD for active tasks
- Soft-delete archiving (`DELETE /tasks/{id}`)
- Archive listing (`GET /tasks/archived`)
- Restore archived tasks (`PATCH /tasks/{id}/restore`)
- Permanent delete for archived tasks (`DELETE /tasks/{id}/force`)
- Status filter, title search, and sorting
- Dashboard metrics + insights + 7-day delivery trend
- Top-right floating toast notifications for user actions
- Archive mode UI that shows archive table only (hides dashboard cards/charts)

## 2. Tech Stack
- Backend: PHP `^8.3`, Laravel `^13.0`
- Frontend: React `^19.2.4`, Vite `^8`, Axios `^1.15.0`
- UI date picker: `react-calendar`
- DB: MySQL (local)
- Testing: PHPUnit (Laravel), ESLint + Vite build checks (frontend)

## 3. Monorepo Layout
- Root has documentation and two app folders.
- No root runtime package/scripts for serving both apps together.
- Backend and frontend are run separately.

## 4. Quick Start (Local)

### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed   # optional
php artisan serve
```

Default API base:
- `http://127.0.0.1:8000/api`

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Default frontend URL:
- `http://127.0.0.1:5173`

Vite proxy (`frontend/vite.config.js`) forwards `/api` to:
- `http://127.0.0.1:8000`

## 5. Environment Variables

### Backend: `backend/.env.example`
Local defaults include MySQL + MAMP-style values:
- `DB_CONNECTION=mysql`
- `DB_HOST=localhost`
- `DB_PORT=8889`
- `DB_DATABASE=taskflow_db`
- `DB_USERNAME=root`
- `DB_PASSWORD=root`
- `DB_SOCKET=/Applications/MAMP/tmp/mysql/mysql.sock`

### Frontend: `frontend/.env.example`
- `VITE_API_BASE_URL=/api`

Optional direct API URL:
- `VITE_API_BASE_URL=http://127.0.0.1:8000/api`

## 6. Backend Architecture

### Core Backend Files
- Routes: `backend/routes/api.php`
- Controller: `backend/app/Http/Controllers/Api/TaskController.php`
- Model: `backend/app/Models/Task.php`
- Requests: `backend/app/Http/Requests/*Task*Request.php`
- Resource: `backend/app/Http/Resources/TaskResource.php`
- Response trait: `backend/app/Http/Controllers/Concerns/ApiResponse.php`
- API exception formatting: `backend/bootstrap/app.php`

### Task Model Rules
`Task::STATUSES`:
- `pending`
- `in_progress`
- `completed`

`Task::SORTABLE_FIELDS`:
- `title`, `status`, `due_date`, `created_at`, `updated_at`

Query scopes:
- `filterStatus($status)`
- `searchByTitle($search)`
- `sortByParam($sort)`

Default sort:
- `-created_at` (newest first)

Soft-delete support:
- `use SoftDeletes` on model
- Archive operations use `onlyTrashed()` queries

### DB Schema (`tasks`)
From:
- `2026_04_12_133831_create_tasks_table.php`
- `2026_04_13_000000_add_deleted_at_to_tasks_table.php`

Columns:
- `id`
- `title` (required)
- `description` (nullable)
- `status` (`pending|in_progress|completed`, default `pending`)
- `due_date` (nullable date)
- `created_at`, `updated_at`
- `deleted_at` (soft delete)

### API Endpoints
`backend/routes/api.php`:
1. `GET /api/tasks`
2. `GET /api/tasks/archived`
3. `POST /api/tasks`
4. `GET /api/tasks/{task}`
5. `PUT /api/tasks/{task}`
6. `PATCH /api/tasks/{task}/status`
7. `DELETE /api/tasks/{task}`
8. `PATCH /api/tasks/{task}/restore`
9. `DELETE /api/tasks/{task}/force`

### Validation
- `IndexTaskRequest`
  - `status`: nullable, in statuses
  - `search`: nullable string max 255
  - `sort`: nullable, in allowed sort values (`Task::allowedSorts()`)
- `StoreTaskRequest` / `UpdateTaskRequest`
  - `title`: required string max 255
  - `description`: nullable string
  - `status`: required in statuses
  - `due_date`: nullable date
- `UpdateTaskStatusRequest`
  - `status`: required in statuses

### Response Shape
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

Global API exception shaping (`bootstrap/app.php`):
- Validation exceptions -> `422`, message `Validation failed.`
- Not found exceptions -> `404`, message `Resource not found.`

Health endpoint:
- `GET /up`

## 7. Frontend Architecture (Current Refactored State)

### App Composition
- Entry: `frontend/src/main.jsx`
- App shell: `frontend/src/App.jsx`
- Main state/actions hook: `frontend/src/hooks/useTaskDashboard.js`

`App.jsx` now composes modular UI blocks:
- `components/dashboard/ToastStack.jsx`
- `components/dashboard/DashboardHeader.jsx`
- `components/dashboard/DashboardOverview.jsx`
- `components/dashboard/TaskWorkspace.jsx`
- `components/dashboard/TaskModals.jsx`

### Reusable Components
- `components/TaskForm.jsx`
  - title/status/description/due date fields
  - uses `react-calendar`
  - serializes due date to `YYYY-MM-DD`
- `components/TaskList.jsx`
  - card-based task list
  - actions for edit/archive or restore/permanent delete
- `components/StatusBadge.jsx`
  - generic badge component (currently not used in main screen)

### Hook Responsibilities (`useTaskDashboard`)
- Fetches overview data (`allTasks`) and table data (`tableTasks`)
- Handles archive view toggle and archive endpoint switching
- Debounced list fetch (~250ms) on filter changes
- Handles create/edit/archive/restore/force-delete flows
- Manages loading/submitting/action state flags
- Auto-clears success toast after 2.5s
- Computes derived data via utilities:
  - task summary
  - insights (due soon / overdue / rates)
  - delivery trend series for chart

### API Client
- `src/api/client.js`: Axios instance, base URL from `VITE_API_BASE_URL` or `/api`
- `src/api/tasks.js`:
  - `fetchTasks`
  - `fetchArchivedTasks`
  - `createTask`
  - `updateTask`
  - `updateTaskStatus`
  - `deleteTask`
  - `restoreTask`
  - `forceDeleteTask`

## 8. Frontend Styling System (Modular)
`frontend/src/index.css` now imports focused style modules:
- `styles/base.css`
- `styles/alerts.css`
- `styles/layout.css`
- `styles/forms.css`
- `styles/task-cards.css`
- `styles/responsive.css`

Behavioral highlights:
- Floating top-right toasts in `alerts.css`
- Breakpoints: `1180px`, `960px`
- Font: Google `Manrope`

## 9. Scripts and Commands

### Backend
From `backend/composer.json`:
- `composer run setup`
- `composer run dev`
- `composer run test`

From `backend/package.json`:
- `npm run dev`
- `npm run build`

### Frontend
From `frontend/package.json`:
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

## 10. Verification Status
Checks run on 2026-04-13:
- `cd backend && php artisan test` -> PASS (`12 tests`, `47 assertions`)
- `cd frontend && npm run lint` -> PASS
- `cd frontend && npm run build` -> PASS

## 11. Seed Data and Factories
- `TaskFactory` creates realistic demo tasks (optional description/due date)
- `TaskSeeder` inserts 15 tasks
- `DatabaseSeeder` calls `TaskSeeder`

## 12. Important Notes
- No authentication is implemented.
- `PUT /api/tasks/{id}` expects a full payload.
- `PATCH /api/tasks/{id}/status` exists and is currently not used in the main UI flow.
- `TaskResource` does not expose `deleted_at` in API output.

## 13. Suggested Session Onboarding
1. Read this file (`codex.md`).
2. Open root `README.md`.
3. Review frontend flow in:
   - `frontend/src/App.jsx`
   - `frontend/src/hooks/useTaskDashboard.js`
   - `frontend/src/components/dashboard/*`
4. Review backend flow in:
   - `backend/routes/api.php`
   - `backend/app/Http/Controllers/Api/TaskController.php`
5. Run backend and frontend using section 4 commands.

## 14. Complete Tracked File Inventory
```txt
README.md
backend/.editorconfig
backend/.env.example
backend/.gitattributes
backend/.gitignore
backend/README.md
backend/app/Http/Controllers/Api/TaskController.php
backend/app/Http/Controllers/Concerns/ApiResponse.php
backend/app/Http/Controllers/Controller.php
backend/app/Http/Requests/ApiRequest.php
backend/app/Http/Requests/IndexTaskRequest.php
backend/app/Http/Requests/StoreTaskRequest.php
backend/app/Http/Requests/UpdateTaskRequest.php
backend/app/Http/Requests/UpdateTaskStatusRequest.php
backend/app/Http/Resources/TaskResource.php
backend/app/Models/Task.php
backend/app/Models/User.php
backend/app/Providers/AppServiceProvider.php
backend/artisan
backend/bootstrap/app.php
backend/bootstrap/cache/.gitignore
backend/bootstrap/providers.php
backend/composer.json
backend/composer.lock
backend/config/app.php
backend/config/auth.php
backend/config/cache.php
backend/config/database.php
backend/config/filesystems.php
backend/config/logging.php
backend/config/mail.php
backend/config/queue.php
backend/config/services.php
backend/config/session.php
backend/database/.gitignore
backend/database/factories/TaskFactory.php
backend/database/factories/UserFactory.php
backend/database/migrations/0001_01_01_000000_create_users_table.php
backend/database/migrations/0001_01_01_000001_create_cache_table.php
backend/database/migrations/0001_01_01_000002_create_jobs_table.php
backend/database/migrations/2026_04_12_133831_create_tasks_table.php
backend/database/migrations/2026_04_13_000000_add_deleted_at_to_tasks_table.php
backend/database/seeders/DatabaseSeeder.php
backend/database/seeders/TaskSeeder.php
backend/package.json
backend/phpunit.xml
backend/public/.htaccess
backend/public/favicon.ico
backend/public/index.php
backend/public/robots.txt
backend/resources/css/app.css
backend/resources/js/app.js
backend/resources/js/bootstrap.js
backend/resources/views/welcome.blade.php
backend/routes/api.php
backend/routes/console.php
backend/routes/web.php
backend/storage/app/.gitignore
backend/storage/app/private/.gitignore
backend/storage/app/public/.gitignore
backend/storage/framework/.gitignore
backend/storage/framework/cache/.gitignore
backend/storage/framework/cache/data/.gitignore
backend/storage/framework/sessions/.gitignore
backend/storage/framework/testing/.gitignore
backend/storage/framework/views/.gitignore
backend/storage/logs/.gitignore
backend/tests/Feature/ExampleTest.php
backend/tests/Feature/TaskApiTest.php
backend/tests/TestCase.php
backend/tests/Unit/ExampleTest.php
backend/vite.config.js
codex.md
frontend/.env.example
frontend/.gitignore
frontend/README.md
frontend/eslint.config.js
frontend/index.html
frontend/package-lock.json
frontend/package.json
frontend/public/favicon.svg
frontend/public/icons.svg
frontend/src/App.jsx
frontend/src/api/client.js
frontend/src/api/tasks.js
frontend/src/components/StatusBadge.jsx
frontend/src/components/TaskForm.jsx
frontend/src/components/TaskList.jsx
frontend/src/components/dashboard/DashboardHeader.jsx
frontend/src/components/dashboard/DashboardOverview.jsx
frontend/src/components/dashboard/TaskModals.jsx
frontend/src/components/dashboard/TaskWorkspace.jsx
frontend/src/components/dashboard/ToastStack.jsx
frontend/src/constants/taskConstants.js
frontend/src/hooks/useTaskDashboard.js
frontend/src/index.css
frontend/src/main.jsx
frontend/src/styles/alerts.css
frontend/src/styles/base.css
frontend/src/styles/forms.css
frontend/src/styles/layout.css
frontend/src/styles/responsive.css
frontend/src/styles/task-cards.css
frontend/src/utils/taskUtils.js
frontend/vite.config.js
```

## 15. Suggested Next Improvements (Optional)
1. Add pagination for `/api/tasks` and `/api/tasks/archived`.
2. Wire quick status change UI to `PATCH /api/tasks/{id}/status`.
3. Add frontend E2E smoke tests for create -> archive -> restore -> force delete.
4. Consider auth + ownership rules if moving beyond local/dev scope.
