<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_type_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_type_id');
            $table->uuid('session_id');
            $table->timestamps();
            $table->unique(['ticket_type_id', 'session_id']);
            $table->foreign('ticket_type_id')->references('id')->on('ticket_types')->cascadeOnDelete();
            $table->foreign('session_id')->references('id')->on('event_sessions')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_type_sessions');
    }
};
