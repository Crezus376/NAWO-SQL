<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('event_pages')->whereNull('content')->update(['content' => '{}']);
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE event_pages MODIFY content JSON NOT NULL');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE event_pages MODIFY content JSON NULL');
        }
    }
};
