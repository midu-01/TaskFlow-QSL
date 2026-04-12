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

    public function test_delete_task(): void
    {
        $task = Task::factory()->create();

        $response = $this->deleteJson("/api/tasks/{$task->id}");

        $response
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('tasks', [
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
}
