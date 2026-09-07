<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_id')->index();
            $table->uuid('ticket_type_id')->unique();
            $table->string('image_path')->nullable();
            $table->integer('qr_x')->default(100);
            $table->integer('qr_y')->default(100);
            $table->integer('qr_width')->default(180);
            $table->integer('qr_height')->default(180);
            $table->string('status', 32)->default('draft');
            $table->timestamps();
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
            $table->foreign('ticket_type_id')->references('id')->on('ticket_types')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_templates');
    }
};
