<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Validation\Rule;

class IndexTaskRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::in(Task::STATUSES)],
            'search' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', Rule::in(Task::allowedSorts())],
        ];
    }
}
