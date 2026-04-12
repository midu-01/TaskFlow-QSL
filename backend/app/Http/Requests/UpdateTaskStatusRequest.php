<?php

namespace App\Http\Requests;

class UpdateTaskStatusRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', 'in:pending,in_progress,completed'],
        ];
    }
}
