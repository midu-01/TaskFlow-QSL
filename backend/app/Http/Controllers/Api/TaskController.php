<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\IndexTaskRequest;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Requests\UpdateTaskStatusRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;

class TaskController extends Controller
{
    use ApiResponse;

    public function index(IndexTaskRequest $request)
    {
        $tasks = $this->resolveTaskCollection($request->validated());

        return $this->successResponse(
            TaskResource::collection($tasks)->resolve(),
            'Tasks retrieved successfully.'
        );
    }

    public function archived(IndexTaskRequest $request)
    {
        $tasks = $this->resolveTaskCollection($request->validated(), true);

        return $this->successResponse(
            TaskResource::collection($tasks)->resolve(),
            'Archived tasks retrieved successfully.'
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

    public function show(Task $task)
    {
        return $this->successResponse(
            TaskResource::make($task)->resolve(),
            'Task retrieved successfully.'
        );
    }

    public function update(UpdateTaskRequest $request, Task $task)
    {
        $task->update($request->validated());

        return $this->successResponse(
            TaskResource::make($task->fresh())->resolve(),
            'Task updated successfully.'
        );
    }

    public function updateStatus(UpdateTaskStatusRequest $request, Task $task)
    {
        $task->update([
            'status' => $request->validated('status'),
        ]);

        return $this->successResponse(
            TaskResource::make($task->fresh())->resolve(),
            'Task status updated successfully.'
        );
    }

    public function destroy(Task $task)
    {
        $task->delete();

        return $this->successResponse(null, 'Task archived successfully.');
    }

    public function restore(int $task)
    {
        $archivedTask = Task::onlyTrashed()->findOrFail($task);
        $archivedTask->restore();

        return $this->successResponse(
            TaskResource::make($archivedTask->fresh())->resolve(),
            'Task restored successfully.'
        );
    }

    public function forceDelete(int $task)
    {
        $archivedTask = Task::onlyTrashed()->findOrFail($task);
        $archivedTask->forceDelete();

        return $this->successResponse(null, 'Task permanently deleted successfully.');
    }

    private function resolveTaskCollection(array $validated, bool $archivedOnly = false)
    {
        $query = Task::query();

        if ($archivedOnly) {
            $query->onlyTrashed();
        }

        return $query
            ->filterStatus($validated['status'] ?? null)
            ->searchByTitle($validated['search'] ?? null)
            ->sortByParam($validated['sort'] ?? '-created_at')
            ->get();
    }
}
