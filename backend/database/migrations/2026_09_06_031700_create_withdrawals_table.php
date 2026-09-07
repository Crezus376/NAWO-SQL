<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
        Schema::dropIfExists('withdrawals');
    }
};
