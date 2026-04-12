<?php

namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_task_successfully(): void
    {
        $response = $this->postJson('/api/tasks', [
            'title' => 'Write assessment submission',
            'description' => 'Prepare all deliverables',
            'status' => 'pending',
            'due_date' => '2026-04-20',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Write assessment submission')
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('tasks', [
            'title' => 'Write assessment submission',
            'status' => 'pending',
        ]);
    }

    public function test_validation_fails_when_title_is_missing(): void
    {
        $response = $this->postJson('/api/tasks', [
            'description' => 'No title',
            'status' => 'pending',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['title']);
    }

    public function test_update_task(): void
    {
        $task = Task::factory()->create([
            'title' => 'Initial title',
            'status' => 'pending',
        ]);

        $response = $this->putJson("/api/tasks/{$task->id}", [
            'title' => 'Updated title',
            'description' => 'Updated description',
            'status' => 'in_progress',
            'due_date' => '2026-04-25',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Updated title')
            ->assertJsonPath('data.status', 'in_progress');

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'title' => 'Updated title',
            'status' => 'in_progress',
        ]);
    }

    public function test_delete_task_archives_task(): void
    {
        $task = Task::factory()->create();

        $response = $this->deleteJson("/api/tasks/{$task->id}");

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Task archived successfully.');

        $this->assertSoftDeleted('tasks', [
            'id' => $task->id,
        ]);
    }

    public function test_filter_by_status(): void
    {
        Task::factory()->create(['status' => 'pending']);
        Task::factory()->create(['status' => 'in_progress']);
        Task::factory()->create(['status' => 'pending']);

        $response = $this->getJson('/api/tasks?status=pending');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data');

        $statuses = collect($response->json('data'))->pluck('status')->unique()->values()->all();
        $this->assertSame(['pending'], $statuses);
    }

    public function test_invalid_status_validation(): void
    {
        $response = $this->postJson('/api/tasks', [
            'title' => 'Invalid status task',
            'status' => 'archived',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_index_excludes_archived_tasks(): void
    {
        $activeTask = Task::factory()->create(['title' => 'Visible task']);
        $archivedTask = Task::factory()->create(['title' => 'Archived task']);
        $archivedTask->delete();

        $response = $this->getJson('/api/tasks');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $activeTask->id);
    }

    public function test_archived_endpoint_returns_only_archived_tasks(): void
    {
        Task::factory()->create(['title' => 'Visible task']);
        $archivedTask = Task::factory()->create(['title' => 'Archived task']);
        $archivedTask->delete();

        $response = $this->getJson('/api/tasks/archived');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $archivedTask->id)
            ->assertJsonPath('data.0.title', 'Archived task');
    }

    public function test_restore_archived_task(): void
    {
        $task = Task::factory()->create([
            'title' => 'Restorable task',
            'status' => 'pending',
        ]);
        $task->delete();

        $response = $this->patchJson("/api/tasks/{$task->id}/restore");

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Task restored successfully.')
            ->assertJsonPath('data.id', $task->id)
            ->assertJsonPath('data.title', 'Restorable task');

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'deleted_at' => null,
        ]);
    }

    public function test_force_delete_archived_task_permanently_removes_task(): void
    {
        $task = Task::factory()->create([
            'title' => 'Task to purge',
            'status' => 'pending',
        ]);
        $task->delete();

        $response = $this->deleteJson("/api/tasks/{$task->id}/force");

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Task permanently deleted successfully.');

        $this->assertDatabaseMissing('tasks', [
            'id' => $task->id,
        ]);
    }
}
