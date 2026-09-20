<?php

namespace Tests\Unit\Actions;

use App\Actions\Events\CreateEventAction;
use App\Actions\Events\UpdateEventAction;
use App\Actions\TicketTypes\CreateTicketTypeAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\Concerns\CreatesNawoFixtures;
use Tests\TestCase;

class UploadCleanupTest extends TestCase
{
    use CreatesNawoFixtures;
    use RefreshDatabase;

    public function test_failed_event_creation_removes_the_uploaded_cover(): void
    {
        Storage::fake('public');
        DB::shouldReceive('transaction')->once()->andThrow(new RuntimeException('rollback'));

        try {
            app(CreateEventAction::class)->execute($this->user(), [
                'name' => 'Upload failure',
                'event_date' => '2027-01-01',
            ], UploadedFile::fake()->image('cover.jpg'));
            $this->fail('The transaction should fail.');
        } catch (RuntimeException $exception) {
            $this->assertSame('rollback', $exception->getMessage());
        }

        $this->assertSame([], Storage::disk('public')->allFiles('event-images'));
    }

    public function test_failed_event_update_removes_the_new_cover_but_keeps_the_old_one(): void
    {
        Storage::fake('public');
        $owner = $this->user();
        $event = $this->event($owner, ['cover_image_path' => 'event-images/old.jpg']);
        Storage::disk('public')->put($event->cover_image_path, 'old');
        DB::shouldReceive('transaction')->once()->andThrow(new RuntimeException('rollback'));

        try {
            app(UpdateEventAction::class)->execute($event, [], UploadedFile::fake()->image('new.jpg'));
            $this->fail('The transaction should fail.');
        } catch (RuntimeException $exception) {
            $this->assertSame('rollback', $exception->getMessage());
        }

        Storage::disk('public')->assertExists('event-images/old.jpg');
        $this->assertCount(1, Storage::disk('public')->allFiles('event-images'));
    }

    public function test_failed_ticket_type_creation_removes_the_uploaded_image(): void
    {
        Storage::fake('public');
        $event = $this->event($this->user());
        DB::shouldReceive('transaction')->once()->andThrow(new RuntimeException('rollback'));

        try {
            app(CreateTicketTypeAction::class)->execute($event, [
                'name' => 'VIP',
                'price' => 1000,
                'quantity' => 10,
            ], UploadedFile::fake()->image('ticket.jpg'));
            $this->fail('The transaction should fail.');
        } catch (RuntimeException $exception) {
            $this->assertSame('rollback', $exception->getMessage());
        }

        $this->assertSame([], Storage::disk('public')->allFiles('ticket-images'));
    }
}
