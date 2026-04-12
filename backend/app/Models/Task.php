<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    /** @use HasFactory<\Database\Factories\TaskFactory> */
    use HasFactory;
    use SoftDeletes;

    public const STATUSES = [
        'pending',
        'in_progress',
        'completed',
    ];

    public const SORTABLE_FIELDS = [
        'title',
        'status',
        'due_date',
        'created_at',
        'updated_at',
    ];

    protected $fillable = [
        'title',
        'description',
        'status',
        'due_date',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
        ];
    }

    public static function allowedSorts(): array
    {
        $sorts = [];

        foreach (self::SORTABLE_FIELDS as $field) {
            $sorts[] = $field;
            $sorts[] = "-{$field}";
        }

        return $sorts;
    }

    public function scopeFilterStatus(Builder $query, ?string $status): Builder
    {
        if (! $status) {
            return $query;
        }

        return $query->where('status', $status);
    }

    public function scopeSearchByTitle(Builder $query, ?string $search): Builder
    {
        if (! $search) {
            return $query;
        }

        return $query->where('title', 'like', "%{$search}%");
    }

    public function scopeSortByParam(Builder $query, ?string $sort): Builder
    {
        $sortValue = $sort ?: '-created_at';
        $direction = str_starts_with($sortValue, '-') ? 'desc' : 'asc';
        $sortField = ltrim($sortValue, '-');

        if (! in_array($sortField, self::SORTABLE_FIELDS, true)) {
            $sortField = 'created_at';
            $direction = 'desc';
        }

        return $query->orderBy($sortField, $direction);
    }
}
