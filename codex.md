# TaskFlow Project Knowledge Base (`codex.md`)

Last updated: 2026-04-13 04:11:25 +06

## 1. What This Project Is
TaskFlow is a full-stack task management app built as a monorepo with:
- `backend/`: Laravel 13 REST API
- `frontend/`: React 19 + Vite client

Main capabilities:
- Create, read, update, delete tasks
- Filter by status
- Search by title
- Sort tasks
- Task analytics widgets (totals, completion rate, due soon, overdue)

## 2. Tech Stack
- Backend: PHP `^8.3`, Laravel `^13.0`
- Frontend: React `^19.2.4`, Vite `^8`
- HTTP client: Axios (frontend + backend dev deps)
- DB: MySQL for local runtime
- Tests: PHPUnit (Laravel feature tests)
- UI date picker: `react-calendar`

## 3. Monorepo Layout
- Root contains docs and two apps.
- No root `package.json` or root runtime command.
- You run backend and frontend separately.

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

Default API URL:
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

Vite proxy forwards `/api` to backend (`http://127.0.0.1:8000`).

## 5. Environment Variables

### `backend/.env.example`
Configured for local MySQL/MAMP-style setup:
- `DB_CONNECTION=mysql`
- `DB_HOST=localhost`
- `DB_PORT=8889`
- `DB_DATABASE=taskflow_db`
- `DB_USERNAME=root`
- `DB_PASSWORD=root`
- `DB_SOCKET=/Applications/MAMP/tmp/mysql/mysql.sock`

Also includes standard Laravel app/session/cache/mail/redis/aws defaults.

### `frontend/.env.example`
- `VITE_API_BASE_URL=/api`

If needed, set absolute API URL instead:
- `VITE_API_BASE_URL=http://127.0.0.1:8000/api`

## 6. Backend Architecture

### Core files
- Routing: `backend/routes/api.php`
- Controller: `backend/app/Http/Controllers/Api/TaskController.php`
- Model: `backend/app/Models/Task.php`
- Requests: `backend/app/Http/Requests/*Task*Request.php`
- Resource: `backend/app/Http/Resources/TaskResource.php`
- Response trait: `backend/app/Http/Controllers/Concerns/ApiResponse.php`
- Global API exception formatting: `backend/bootstrap/app.php`

### Task model rules
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

Default sort: `-created_at` (newest first).

### DB schema (`tasks` table)
From migration `2026_04_12_133831_create_tasks_table.php`:
- `id` (pk)
- `title` (string, required)
- `description` (text, nullable)
- `status` (enum: pending/in_progress/completed, default pending)
- `due_date` (date, nullable)
- `created_at`, `updated_at`

### API endpoints
All in `backend/routes/api.php` with numeric route model binding:
1. `GET /api/tasks`
2. `POST /api/tasks`
3. `GET /api/tasks/{task}`
4. `PUT /api/tasks/{task}`
5. `PATCH /api/tasks/{task}/status`
6. `DELETE /api/tasks/{task}`

### Validation
- `IndexTaskRequest`:
  - `status`: nullable, in statuses
  - `search`: nullable string max 255
  - `sort`: nullable, in allowed sorts (asc/desc via `-` prefix)
- `StoreTaskRequest` / `UpdateTaskRequest`:
  - `title`: required string max 255
  - `description`: nullable string
  - `status`: required in statuses
  - `due_date`: nullable date
- `UpdateTaskStatusRequest`:
  - `status`: required in statuses

### Response format
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

API-level exception shaping (in `bootstrap/app.php`):
- Validation -> 422 with `Validation failed.`
- Not found -> 404 with `Resource not found.`

### Health endpoint
Laravel health route is enabled at:
- `GET /up`

## 7. Frontend Architecture

### Entry and app shell
- Entry: `frontend/src/main.jsx`
- Main page/state: `frontend/src/App.jsx`
- Styling: `frontend/src/index.css`

### UI behavior in `App.jsx`
- Loads two datasets:
  - Overview dataset (`allTasks`) for dashboard metrics
  - Table dataset (`tableTasks`) for filtered/sorted task list
- Debounced filter fetch (~250ms)
- Create modal + Edit modal with shared `TaskForm`
- Delete confirmation with `window.confirm`
- Success toast-style message auto-clears in 2.5s
- Error messages derived from backend `errors` first, then `message`

### Components
- `TaskForm.jsx`:
  - Fields: title, status, description, due date
  - Uses `react-calendar` for due date selection
  - Converts selected date to `YYYY-MM-DD`
- `TaskList.jsx`:
  - Card-based task list layout
  - Shows title, status chip, description, due date, id
  - Edit/Delete actions per card

### API client
- `src/api/client.js` creates Axios instance with baseURL from `VITE_API_BASE_URL` or `/api`
- `src/api/tasks.js` implements:
  - `fetchTasks`
  - `createTask`
  - `updateTask`
  - `updateTaskStatus`
  - `deleteTask`

## 8. Frontend Styling System
`frontend/src/index.css` defines:
- Theme CSS vars for neutrals + status colors
- Responsive dashboard/cards layout
- Modal styles
- Calendar style overrides
- Breakpoints at `1180px` and `960px`
- Font: Google `Manrope`

## 9. Scripts and Commands

### Backend scripts
From `backend/composer.json`:
- `composer run setup`: install + env + key + migrate + npm install + build
- `composer run dev`: Laravel serve + queue listener + pail logs + vite (concurrently)
- `composer run test`: clear config + run tests

From `backend/package.json`:
- `npm run dev`
- `npm run build`

### Frontend scripts
From `frontend/package.json`:
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

## 10. Testing and Verification Status
Checks run on 2026-04-13:
- `cd backend && php artisan test` -> PASS (`8 tests`, `27 assertions`)
- `cd frontend && npm run lint` -> PASS
- `cd frontend && npm run build` -> PASS

## 11. Seed Data and Factories
- `TaskFactory` generates realistic demo tasks with optional description/due_date
- `TaskSeeder` creates 15 tasks
- `DatabaseSeeder` calls `TaskSeeder`

## 12. Important Notes for New Sessions
- This is currently a no-auth app (open API in local dev scope).
- `PUT /api/tasks/{id}` expects full task payload.
- `PATCH /api/tasks/{id}/status` exists but current UI flow updates status via full edit form (`PUT`).
- Frontend has utility/refactor-ready files currently not wired into `App.jsx`:
  - `src/hooks/useTaskDashboard.js`
  - `src/utils/taskUtils.js`
  - `src/constants/taskConstants.js`
  - `src/components/StatusBadge.jsx`
- `src/api/tasks.js` includes `updateTaskStatus` helper, currently unused by the current screen.

## 13. Suggested Session Onboarding Flow
When opening this project in a new tab/chat:
1. Read this file (`codex.md`) first.
2. Check root `README.md` for assignment-level context.
3. Open `frontend/src/App.jsx` for UI behavior.
4. Open `backend/app/Http/Controllers/Api/TaskController.php` for API flow.
5. Run backend/frontend with commands in section 4.

## 14. Complete Tracked File Inventory
```txt
README.md
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
backend/database/factories/TaskFactory.php
backend/database/factories/UserFactory.php
backend/database/migrations/0001_01_01_000000_create_users_table.php
backend/database/migrations/0001_01_01_000001_create_cache_table.php
backend/database/migrations/0001_01_01_000002_create_jobs_table.php
backend/database/migrations/2026_04_12_133831_create_tasks_table.php
backend/database/seeders/DatabaseSeeder.php
backend/database/seeders/TaskSeeder.php
backend/package.json
backend/phpunit.xml
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
frontend/src/constants/taskConstants.js
frontend/src/hooks/useTaskDashboard.js
frontend/src/index.css
frontend/src/main.jsx
frontend/src/utils/taskUtils.js
frontend/vite.config.js
```

## 15. Assignment Brief Mapping (What Is Already Covered)

This section maps the assignment brief directly to the current implementation.

| Assignment requirement | Current status | Where implemented |
| --- | --- | --- |
| Clean and intuitive interface to view/manage tasks | Implemented | `frontend/src/App.jsx`, `frontend/src/components/TaskList.jsx`, `frontend/src/index.css` |
| Create, update, remove tasks | Implemented | `POST/PUT/DELETE /api/tasks`, `TaskForm`, edit/delete actions |
| Track task status (pending/in progress/completed) | Implemented | `tasks.status` enum + status validation + status badges/forms |
| Smooth frontend-backend interaction | Implemented | Axios API layer + Vite `/api` proxy + consistent JSON responses |
| Reliable and structured backend system | Implemented | Laravel Form Requests, Resource, API response trait, scoped query filters/sorting |
| Basic use cases handled reliably | Implemented | Laravel feature tests (`TaskApiTest`) + frontend loading/error/success states |

Conclusion:
- The current codebase already satisfies the required assignment scope.
- Existing extras (search/sort/insights widgets) strengthen the submission beyond minimum requirements.

## 16. High-Value Additions (Optional, If You Want Extra Credit)

If you want to make the submission stand out, implement these in order:

1. Pagination on `GET /api/tasks`
- Why: improves performance and scalability with larger datasets.
- Backend: `paginate()` and include pagination metadata.
- Frontend: page controls and preserved filter/sort state.

2. Quick status toggle from list cards
- Why: faster workflow for team usage; better UX.
- Use existing `PATCH /api/tasks/{task}/status` endpoint in UI.

3. Due-date validation rule
- Why: prevents invalid planning data.
- Example: optionally enforce `due_date >= today` on create/update.

4. Small E2E test smoke (frontend)
- Why: demonstrates reliability beyond API tests.
- Validate create -> update -> delete happy path.

## 17. Suggested Demo Script (3-5 Minutes)

1. Open dashboard and explain task stats + due soon/overdue insight.
2. Create a task with due date and status `pending`.
3. Filter by status and search by title fragment.
4. Edit task (title/status) and show immediate UI refresh.
5. Delete task and show success feedback.
6. Briefly mention backend quality controls:
- Form Request validation
- Standardized JSON API responses
- Feature tests passing
