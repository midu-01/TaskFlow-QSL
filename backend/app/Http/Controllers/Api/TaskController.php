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
        $validated = $request->validated();

        $tasks = Task::query()
            ->filterStatus($validated['status'] ?? null)
            ->searchByTitle($validated['search'] ?? null)
            ->sortByParam($validated['sort'] ?? '-created_at')
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

        return $this->successResponse(null, 'Task deleted successfully.');
    }
}
