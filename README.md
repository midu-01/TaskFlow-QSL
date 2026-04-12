# Task Management System

A practical full-stack assessment project built with **Laravel + MySQL + React (Vite)**.

This system lets users manage tasks end-to-end:
- View tasks
- Create tasks
- Update tasks
- Delete tasks
- Update task status
- Filter by status
- Search by title
- Sort tasks

## Project Overview

This repository contains two apps:
- `backend/`: Laravel REST API
- `frontend/`: ReactJS client (Vite)

The frontend communicates with the backend via REST API endpoints under `/api/tasks`.

## Features

### Backend
- Laravel 13 API project
- MySQL-ready configuration (`.env.example`)
- `tasks` migration with required schema
- `Task` Eloquent model with casting/fillable
- Form Request validation:
  - `StoreTaskRequest`
  - `UpdateTaskRequest`
  - `UpdateTaskStatusRequest`
- Clean controller under `App\Http\Controllers\Api\TaskController`
- Consistent JSON success/error response structure
- Filtering, searching, sorting support in `GET /api/tasks`
- Proper status codes and 404/422 handling

### Frontend
- React 19 + Vite
- Axios API layer
- Responsive task management UI
- Create and edit task forms
- Delete confirmation
- Inline status change dropdown
- Status filter and title search
- Sort options
- Color-coded status badges
- Loading, empty, error, and success states

### Testing
Laravel feature tests included for:
- create task successfully
- validation fails when title missing
- update task
- delete task
- filter by status
- invalid status validation

## Tech Stack

- Backend: Laravel (PHP 8.3+)
- Database: MySQL (phpMyAdmin compatible)
- Frontend: ReactJS + Vite
- API: REST (JSON)
- Testing: PHPUnit (Laravel feature tests)

## Architecture

### Backend Structure
- Model: `App\Models\Task`
- Controller: `App\Http\Controllers\Api\TaskController`
- Requests: `App\Http\Requests\*Task*Request`
- Resource: `App\Http\Resources\TaskResource`
- Trait for response shape: `App\Http\Controllers\Concerns\ApiResponse`
- Routes: `routes/api.php`

### Frontend Structure
- API client/services: `src/api/`
- UI components: `src/components/`
- Main page/state: `src/App.jsx`

## Task Schema

`tasks` table fields:
- `id`
- `title` (required)
- `description` (nullable)
- `status` (required: `pending`, `in_progress`, `completed`)
- `due_date` (nullable)
- `created_at`
- `updated_at`

## API Endpoints

Base URL: `http://127.0.0.1:8000/api`

1. `GET /tasks`
2. `POST /tasks`
3. `GET /tasks/{id}`
4. `PUT /tasks/{id}`
5. `PATCH /tasks/{id}/status`
6. `DELETE /tasks/{id}`

### Query Parameters for `GET /tasks`
- `status` = `pending|in_progress|completed`
- `search` = partial title text
- `sort` = one of:
  - `created_at`, `-created_at`
  - `title`, `-title`
  - `status`, `-status`
  - `due_date`, `-due_date`
  - `updated_at`, `-updated_at`

### Validation Rules
- `title`: `required|string|max:255`
- `description`: `nullable|string`
- `status`: `required|in:pending,in_progress,completed`
- `due_date`: `nullable|date`

### JSON Response Shape
Success:
```json
{
  "success": true,
  "message": "Task created successfully.",
  "data": {
    "id": 1,
    "title": "Task title",
    "description": null,
    "status": "pending",
    "due_date": "2026-04-20",
    "created_at": "2026-04-12T13:00:00.000000Z",
    "updated_at": "2026-04-12T13:00:00.000000Z"
  }
}
```

Validation error (422):
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "title": ["The title field is required."]
  }
}
```

## Local Setup Instructions

### 1. Clone & Enter Project
```bash
git clone <your-repo-url>
cd TaskFlow
```

### 2. Backend Setup (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Update `.env` database values for MySQL:
```env
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=8889
DB_DATABASE=taskflow_db
DB_USERNAME=root
DB_PASSWORD=root
DB_SOCKET=/Applications/MAMP/tmp/mysql/mysql.sock
```

### Create Database
Create a database named `taskflow_db` from phpMyAdmin (or MySQL CLI).

MAMP connection reference:
- Host: `localhost` (or `127.0.0.1` depending on connection method)
- Port: `8889`
- Username: `root`
- Password: `root`
- Socket: `/Applications/MAMP/tmp/mysql/mysql.sock`
- Database: `taskflow_db`

### Run Migrations
```bash
php artisan migrate
```

### Optional: Seed Demo Data
```bash
php artisan db:seed
```

### Start Backend Server
```bash
php artisan serve
```

Backend runs at: `http://127.0.0.1:8000`

### 3. Frontend Setup (React + Vite)
Open a new terminal:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs at: `http://127.0.0.1:5173`

Vite proxy forwards `/api` calls to Laravel (`http://127.0.0.1:8000`).

## Testing Instructions

From `backend/` run:
```bash
php artisan test
```

## Assumptions / Decisions

- No authentication added (per assessment scope).
- `PUT /api/tasks/{id}` requires full task payload.
- Dedicated `PATCH /api/tasks/{id}/status` endpoint handles quick status updates.
- Frontend focuses on clean UX and reliability over advanced state libraries.
- API tests use SQLite in-memory for speed, while runtime setup uses MySQL.

## Future Improvements

1. Add authentication/authorization.
2. Add pagination for large task lists.
3. Add optimistic UI updates.
4. Add unit tests for query filtering/sorting logic.
5. Add Docker setup for one-command local boot.
6. Add OpenAPI/Swagger documentation.

## Deliverables Included

- Full Laravel backend code
- Full React frontend code
- Tasks migration
- Validation logic (Form Requests)
- REST API implementation
- Laravel feature tests
- Complete `README.md`
- `.env.example` for backend and frontend
- Optional demo seeder (`TaskSeeder`)
