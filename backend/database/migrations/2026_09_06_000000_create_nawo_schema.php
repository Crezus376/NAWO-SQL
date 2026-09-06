<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('email')->nullable();
            $table->string('full_name')->nullable();
            $table->timestamps();
            $table->foreign('id')->references('id')->on('users')->cascadeOnDelete();
        });
        Schema::create('user_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('role', 32);
            $table->timestamps();
            $table->unique(['user_id', 'role']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
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
        Schema::create('event_pages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_id')->unique();
            $table->string('mode', 32)->default('custom');
            $table->string('status', 40)->default('pending')->index();
            $table->text('brief')->nullable();
            $table->string('preview_url')->nullable();
            $table->decimal('price_amount', 12, 2)->nullable();
            $table->boolean('is_active')->default(false);
            $table->json('content')->default('{}');
            $table->timestamps();
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
        });
        Schema::create('event_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_id');
            $table->string('name');
            $table->date('session_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('location')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index(['event_id', 'sort_order']);
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
        });
        Schema::create('ticket_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_id')->index();
            $table->string('name');
            $table->decimal('price', 12, 2)->default(0);
            $table->unsignedInteger('quantity')->default(0);
            $table->unsignedInteger('sold')->default(0);
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
        });
        Schema::create('ticket_type_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_type_id');
            $table->uuid('session_id');
            $table->timestamps();
            $table->unique(['ticket_type_id', 'session_id']);
            $table->foreign('ticket_type_id')->references('id')->on('ticket_types')->cascadeOnDelete();
            $table->foreign('session_id')->references('id')->on('event_sessions')->cascadeOnDelete();
        });
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
        Schema::create('promo_codes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_id');
            $table->string('code', 40);
            $table->string('discount_type', 20)->default('percent');
            $table->decimal('discount_value', 12, 2)->default(0);
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['event_id', 'code']);
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
        });
        Schema::create('ambassadors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_id');
            $table->string('name');
            $table->string('ref_code', 60);
            $table->unsignedInteger('sales_goal')->default(0);
            $table->timestamps();
            $table->unique(['event_id', 'ref_code']);
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
        });
        Schema::create('hosts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_id')->index();
            $table->string('name');
            $table->string('access_code', 40)->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
        });
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('event_id')->index();
            $table->uuid('ticket_type_id');
            $table->uuid('ambassador_id')->nullable();
            $table->uuid('promo_code_id')->nullable();
            $table->uuid('idempotency_key')->unique();
            $table->string('first_name', 80);
            $table->string('last_name', 80);
            $table->string('email');
            $table->string('phone', 40)->nullable();
            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->string('status', 32)->default('pending')->index();
            $table->timestamps();
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
            $table->foreign('ticket_type_id')->references('id')->on('ticket_types')->restrictOnDelete();
            $table->foreign('ambassador_id')->references('id')->on('ambassadors')->nullOnDelete();
            $table->foreign('promo_code_id')->references('id')->on('promo_codes')->nullOnDelete();
        });
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id')->index();
            $table->string('provider')->default('manual');
            $table->string('provider_reference')->nullable();
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('status', 32)->default('pending')->index();
            $table->timestamps();
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
        });
        Schema::create('tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id')->index();
            $table->uuid('event_id')->index();
            $table->uuid('ticket_type_id');
            $table->string('ticket_number')->unique();
            $table->string('qr_token', 120)->unique();
            $table->string('holder_first_name', 80);
            $table->string('holder_last_name', 80);
            $table->boolean('is_used')->default(false);
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
            $table->foreign('ticket_type_id')->references('id')->on('ticket_types')->restrictOnDelete();
        });
        Schema::create('ticket_session_access', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_id');
            $table->uuid('session_id');
            $table->boolean('is_used')->default(false);
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
            $table->unique(['ticket_id', 'session_id']);
            $table->foreign('ticket_id')->references('id')->on('tickets')->cascadeOnDelete();
            $table->foreign('session_id')->references('id')->on('event_sessions')->cascadeOnDelete();
        });
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
        Schema::create('withdrawals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organizer_id')->index();
            $table->uuid('event_id')->nullable();
            $table->decimal('amount_requested', 12, 2);
            $table->decimal('fee_amount', 12, 2)->default(0);
            $table->decimal('total_debited', 12, 2)->default(0);
            $table->decimal('net_amount', 12, 2)->default(0);
            $table->decimal('fee_rate', 5, 4)->default(0.10);
            $table->string('payout_method', 60);
            $table->string('payout_details', 200);
            $table->string('status', 32)->default('pending')->index();
            $table->string('transaction_reference', 120)->nullable();
            $table->string('proof_path')->nullable();
            $table->text('admin_comment')->nullable();
            $table->text('organizer_note')->nullable();
            $table->uuid('processed_by')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            $table->foreign('organizer_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('event_id')->references('id')->on('events')->nullOnDelete();
            $table->foreign('processed_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        foreach (['withdrawals', 'scans', 'ticket_session_access', 'tickets', 'payments', 'orders', 'hosts', 'ambassadors', 'promo_codes', 'ticket_templates', 'ticket_type_sessions', 'ticket_types', 'event_sessions', 'event_pages', 'events', 'user_roles', 'profiles'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
