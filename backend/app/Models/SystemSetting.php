<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    protected $table = 'system_settings';

    protected $fillable = [
        'setting_key',
        'setting_value',
        'setting_type',
        'description',
        'is_public',
        'is_editable',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'is_editable' => 'boolean',
        ];
    }

    /**
     * Get a setting value by key.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = Cache::remember("setting.{$key}", 3600, function () use ($key) {
            return self::where('setting_key', $key)->first();
        });

        if (!$setting) {
            return $default;
        }

        return self::castValue($setting->setting_value, $setting->setting_type);
    }

    /**
     * Set a setting value.
     */
    public static function set(string $key, mixed $value): void
    {
        $setting = self::where('setting_key', $key)->first();

        if ($setting) {
            $setting->update(['setting_value' => (string) $value]);
        }

        Cache::forget("setting.{$key}");
    }

    /**
     * Get all public settings.
     */
    public static function getPublic(): array
    {
        return Cache::remember('settings.public', 3600, function () {
            return self::where('is_public', true)
                ->get()
                ->mapWithKeys(function ($setting) {
                    return [$setting->setting_key => self::castValue($setting->setting_value, $setting->setting_type)];
                })
                ->toArray();
        });
    }

    /**
     * Cast value based on type.
     */
    protected static function castValue(string $value, string $type): mixed
    {
        return match ($type) {
            'number' => is_numeric($value) ? (float) $value : 0,
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($value, true) ?? [],
            default => $value,
        };
    }

    /**
     * Get the typed value attribute.
     */
    public function getTypedValueAttribute(): mixed
    {
        return self::castValue($this->setting_value, $this->setting_type);
    }
}
