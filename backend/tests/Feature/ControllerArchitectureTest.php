<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\Concerns\CreatesNawoFixtures;
use Tests\TestCase;

class ControllerArchitectureTest extends TestCase
{
    use CreatesNawoFixtures;
    use RefreshDatabase;

    public function test_api_routes_do_not_use_generic_resource_dispatchers(): void
    {
        $actions = collect(Route::getRoutes()->getRoutes())
            ->filter(fn ($route) => str_starts_with($route->uri(), 'api/'))
            ->map(fn ($route) => $route->getActionName())
            ->implode("\n");

        $this->assertStringNotContainsString('DataController', $actions);
        $this->assertStringNotContainsString('AdminController', $actions);
        $this->assertStringNotContainsString('EventController@listResource', $actions);
        $this->assertStringNotContainsString('EventController@createResource', $actions);
        $this->assertStringNotContainsString('EventController@updateResource', $actions);
        $this->assertStringNotContainsString('EventController@deleteResource', $actions);
    }

    public function test_legacy_generic_and_non_rest_routes_are_removed(): void
    {
        $admin = $this->user('admin');

        $this->getJson('/api/data/events')->assertNotFound();
        $this->actingAs($admin)->getJson('/api/admin/overview')->assertNotFound();
        $this->getJson('/api/auth/me')->assertNotFound();
        $this->postJson('/api/scan/ticket', [])->assertNotFound();
    }

    public function test_controllers_do_not_validate_requests_inline(): void
    {
        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator(app_path('Http/Controllers')));
        foreach ($files as $file) {
            if (! $file->isFile() || $file->getExtension() !== 'php') {
                continue;
            }
            $this->assertStringNotContainsString('->validate(', file_get_contents($file->getPathname()), $file->getPathname());
        }
    }
}
