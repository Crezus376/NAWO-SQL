<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_id')->nullable();
            $table->uuid('event_id')->index();
            $table->uuid('host_id')->nullable();
            $table->uuid('session_id')->nullable();
            $table->string('result', 32)->index();
            $table->timestamp('scanned_at')->useCurrent();
            $table->timestamps();
            $table->foreign('ticket_id')->references('id')->on('tickets')->cascadeOnDelete();
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
            $table->foreign('host_id')->references('id')->on('hosts')->nullOnDelete();
            $table->foreign('session_id')->references('id')->on('event_sessions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scans');
    }
};
