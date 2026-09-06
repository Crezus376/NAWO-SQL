<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_checks_database(): void
    {
        $this->getJson('/api/health')->assertOk()
            ->assertJsonPath('data.status', 'ok')->assertJsonPath('data.database', 'ok');
    }
}
