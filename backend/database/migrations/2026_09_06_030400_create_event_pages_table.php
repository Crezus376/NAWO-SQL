<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_pages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_id')->unique();
            $table->string('mode', 32)->default('custom');
            $table->string('status', 40)->default('pending')->index();
            $table->text('brief')->nullable();
            $table->string('preview_url')->nullable();
            $table->decimal('price_amount', 12, 2)->nullable();
            $table->boolean('is_active')->default(false);
            $content = $table->json('content');
            if (Schema::getConnection()->getDriverName() !== 'mysql') {
                $content->default('{}');
            }
            $table->timestamps();
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_pages');
    }
};
