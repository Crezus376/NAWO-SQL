<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organizer_id')->index();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->date('event_date')->index();
            $table->time('event_time')->nullable();
            $table->string('location');
            $table->string('cover_image_path')->nullable();
            $table->string('status', 32)->default('draft')->index();
            $table->string('page_mode', 32)->default('standard');
            $table->string('currency', 8)->default('XOF');
            $table->timestamps();
            $table->foreign('organizer_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
