<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\Concerns\CreatesNawoFixtures;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use CreatesNawoFixtures;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeader('Origin', 'http://localhost:8080');
    }

    public function test_registration_creates_profile_role_and_session(): void
    {
        $this->postJson('/api/auth/register', [
            'email' => 'NEW@Example.test', 'password' => 'secret12', 'password_confirmation' => 'secret12',
        ])->assertCreated()
            ->assertJsonPath('data.email', 'new@example.test')
            ->assertJsonPath('data.roles.0', 'organizer')
            ->assertJsonPath('data.is_admin', false);

        $user = User::where('email', 'new@example.test')->firstOrFail();
        $this->assertNotNull($user->email_verified_at);
        $this->assertDatabaseHas('profiles', ['id' => $user->id, 'email' => $user->email]);
        $this->assertDatabaseHas('user_roles', ['user_id' => $user->id, 'role' => 'organizer']);
        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('data.id', $user->id);
    }

    public function test_registration_validates_email_password_confirmation_and_uniqueness(): void
    {
        $this->user(email: 'used@example.test');

        $this->postJson('/api/auth/register', ['email' => 'bad', 'password' => '123', 'password_confirmation' => '456'])
            ->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
        $this->postJson('/api/auth/register', ['email' => "victim@example.test\r\nBcc:evil@example.test", 'password' => 'secret12', 'password_confirmation' => 'secret12'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->postJson('/api/auth/register', ['email' => 'used@example.test', 'password' => 'secret12', 'password_confirmation' => 'secret12'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_login_me_and_logout_flow(): void
    {
        $user = $this->user('admin', 'admin@example.test');

        $this->postJson('/api/auth/login', ['email' => 'admin@example.test', 'password' => 'wrong'])
            ->assertUnprocessable()->assertJsonPath('message', 'Identifiants invalides.');
        $this->postJson('/api/auth/login', ['email' => 'ADMIN@example.test', 'password' => 'secret12'])
            ->assertOk()->assertJsonPath('data.id', $user->id)->assertJsonPath('data.is_admin', true);
        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('data.profile.email', 'admin@example.test');
        $this->postJson('/api/auth/logout')->assertNoContent();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_password_reset_notification_and_token_flow(): void
    {
        Notification::fake();
        $user = $this->user(email: 'reset@example.test');
        $token = null;

        $this->postJson('/api/auth/forgot-password', ['email' => $user->email])
            ->assertOk()->assertJsonPath('data.sent', true);
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use (&$token) {
            $token = $notification->token;

            return true;
        });
        $this->assertNotNull($token);

        $this->postJson('/api/auth/reset-password', [
            'token' => 'invalid', 'email' => $user->email, 'password' => 'changed12', 'password_confirmation' => 'changed12',
        ])->assertUnprocessable();
        $this->postJson('/api/auth/reset-password', [
            'token' => $token, 'email' => $user->email, 'password' => 'changed12', 'password_confirmation' => 'changed12',
        ])->assertOk()->assertJsonPath('data.reset', true);
        $this->assertTrue(Hash::check('changed12', $user->fresh()->password));
    }

    public function test_forgot_password_does_not_disclose_unknown_email(): void
    {
        Notification::fake();
        $this->postJson('/api/auth/forgot-password', ['email' => 'missing@example.test'])
            ->assertOk()->assertJsonPath('data.sent', true);
        Notification::assertNothingSent();
    }

    public function test_protected_routes_reject_guests(): void
    {
        $this->getJson('/api/dashboard')->assertUnauthorized();
        $this->postJson('/api/dashboard/events', [])->assertUnauthorized();
        $this->getJson('/api/withdrawals')->assertUnauthorized();
        $this->getJson('/api/admin/overview')->assertUnauthorized();
        $this->postJson('/api/uploads/event-images', [])->assertUnauthorized();
    }

    public function test_logout_all_revokes_tokens_and_database_sessions(): void
    {
        config(['session.driver' => 'database']);
        $user = $this->user();
        $user->createToken('mobile');
        $otherSessionId = Str::random(40);
        \DB::table('sessions')->insert([
            'id' => $otherSessionId, 'user_id' => $user->id, 'payload' => '', 'last_activity' => time(),
        ]);

        $this->actingAs($user)->postJson('/api/auth/logout-all')->assertNoContent();
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $user->id]);
        $this->assertDatabaseMissing('sessions', ['id' => $otherSessionId]);
    }

    public function test_login_rate_limit_and_security_headers(): void
    {
        $this->user(email: 'limited@example.test');
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/auth/login', ['email' => 'limited@example.test', 'password' => 'wrong'])->assertUnprocessable();
        }
        $this->postJson('/api/auth/login', ['email' => 'limited@example.test', 'password' => 'wrong'])->assertTooManyRequests();

        $this->getJson('https://localhost/api/events')->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    public function test_cors_allows_configured_origin_only(): void
    {
        $this->flushHeaders();
        $this->withHeader('Origin', config('app.frontend_url', 'http://localhost:3000'))
            ->getJson('/api/events')->assertHeader('Access-Control-Allow-Origin', config('app.frontend_url', 'http://localhost:3000'));
        $this->flushHeaders();
        $this->call('GET', '/api/events', [], [], [], ['HTTP_ORIGIN' => 'https://evil.example', 'HTTP_ACCEPT' => 'application/json'])
            ->assertHeader('Access-Control-Allow-Origin', config('app.frontend_url', 'http://localhost:3000'));
    }

    public function test_account_deletion_requires_password_and_cascades_data(): void
    {
        $user = $this->user();
        $event = $this->event($user);
        $this->actingAs($user)->deleteJson('/api/auth/account', ['password' => 'wrong'])->assertUnprocessable();
        $this->deleteJson('/api/auth/account', ['password' => 'secret12'])->assertNoContent();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('events', ['id' => $event->id]);
    }
}
