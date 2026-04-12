<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Requests\UpdateTaskStatusRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TaskController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $validator = Validator::make($request->query(), [
            'status' => ['nullable', 'in:pending,in_progress,completed'],
            'search' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed.', $validator->errors()->toArray(), 422);
        }

        $tasks = Task::query();

        if ($request->filled('status')) {
            $tasks->where('status', $request->string('status')->toString());
        }

        if ($request->filled('search')) {
            $searchTerm = $request->string('search')->toString();
            $tasks->where('title', 'like', "%{$searchTerm}%");
        }

        $sort = $request->string('sort', '-created_at')->toString();
        $allowedSortFields = ['title', 'status', 'due_date', 'created_at', 'updated_at'];
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $sortField = ltrim($sort, '-');

        if (! in_array($sortField, $allowedSortFields, true)) {
            return $this->errorResponse('Validation failed.', [
                'sort' => ['The selected sort field is invalid.'],
            ], 422);
        }

        $tasks = $tasks
            ->orderBy($sortField, $direction)
            ->get();

        return $this->successResponse(
            TaskResource::collection($tasks)->resolve(),
            'Tasks retrieved successfully.'
        );
    }

    public function store(StoreTaskRequest $request)
    {
        $task = Task::create($request->validated());

        return $this->successResponse(
            TaskResource::make($task)->resolve(),
            'Task created successfully.',
            201
        );
    }

    public function show(int $id)
    {
        $task = Task::find($id);

        if (! $task) {
            return $this->errorResponse('Task not found.', [], 404);
        }

        return $this->successResponse(
            TaskResource::make($task)->resolve(),
            'Task retrieved successfully.'
        );
    }

    public function update(UpdateTaskRequest $request, int $id)
    {
        $task = Task::find($id);

        if (! $task) {
            return $this->errorResponse('Task not found.', [], 404);
        }

        $task->update($request->validated());

        return $this->successResponse(
            TaskResource::make($task->fresh())->resolve(),
            'Task updated successfully.'
        );
    }

    public function updateStatus(UpdateTaskStatusRequest $request, int $id)
    {
        $task = Task::find($id);

        if (! $task) {
            return $this->errorResponse('Task not found.', [], 404);
        }

        $task->update([
            'status' => $request->validated('status'),
        ]);

        return $this->successResponse(
            TaskResource::make($task->fresh())->resolve(),
            'Task status updated successfully.'
        );
    }

    public function destroy(int $id)
    {
        $task = Task::find($id);

        if (! $task) {
            return $this->errorResponse('Task not found.', [], 404);
        }

        $task->delete();

        return $this->successResponse(null, 'Task deleted successfully.');
    }
}
