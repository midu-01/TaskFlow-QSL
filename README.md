# TaskFlow

TaskFlow is a full-stack task management app built as a monorepo:
- `backend/`: Laravel 13 REST API
- `frontend/`: React 19 + Vite client

## Current Features

- Create, read, update, and archive tasks
- Archive view for archived tasks
- Restore archived tasks (undo)
- Permanently delete archived tasks
- Filter by status, search by title, and sort task lists
- Dashboard insights:
  - status breakdown
  - completion rate
  - due soon / overdue counts
  - data-driven 7-day delivery trend (created vs completed)

## Tech Stack

- Backend: PHP 8.3+, Laravel 13
- Frontend: React 19, Vite 8, Axios
- Database: MySQL (local runtime)
- Tests: PHPUnit (Laravel feature tests)

## Project Structure

```txt
backend/   Laravel API
frontend/  React app
```

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
- `search`: partial title
- `sort`: `created_at`, `-created_at`, `title`, `-title`, `status`, `-status`, `due_date`, `-due_date`, `updated_at`, `-updated_at`

## Data Model

`tasks` table:
- `id`
- `title` (required)
- `description` (nullable)
- `status` (`pending | in_progress | completed`)
- `due_date` (nullable)
- `created_at`, `updated_at`
- `deleted_at` (for archive/soft delete)

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

## Verification

```bash
cd backend && php artisan test
cd frontend && npm run lint
cd frontend && npm run build
```

## Notes

- No authentication layer is implemented.
- API responses use a consistent shape: `success`, `message`, `data` (and `errors` on failures).
