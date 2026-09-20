<?php

namespace Tests\Feature;

use App\Enums\QueueName;
use App\Models\User;
use App\Notifications\ResetPassword;
use App\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\Concerns\CreatesNawoFixtures;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use CreatesNawoFixtures;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeader('Origin', 'http://localhost:3000');
    }

    public function test_registration_creates_unverified_user_role_and_sends_email(): void
    {
        Notification::fake();
        $this->postJson('/api/auth/users', [
            'email' => 'NEW@Example.test', 'password' => 'secret12', 'password_confirmation' => 'secret12',
        ])->assertCreated()
            ->assertJsonPath('data.email', 'new@example.test')
            ->assertJsonPath('data.roles.0', 'organizer')
            ->assertJsonPath('data.is_admin', false)
            ->assertJsonPath('data.email_verified', false);

        $user = User::where('email', 'new@example.test')->firstOrFail();
        $this->assertNull($user->email_verified_at);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'email' => $user->email, 'full_name' => null]);
        $this->assertDatabaseHas('user_roles', ['user_id' => $user->id, 'role' => 'organizer']);
        $this->getJson('/api/auth/user')->assertUnauthorized();
        Notification::assertSentTo($user, VerifyEmail::class, fn (VerifyEmail $notification) => $notification->queue === QueueName::Emails->value);
    }

    public function test_registration_validates_email_password_confirmation_and_uniqueness(): void
    {
        $this->user(email: 'used@example.test');

        $this->postJson('/api/auth/users', ['email' => 'bad', 'password' => '123', 'password_confirmation' => '456'])
            ->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
        $this->postJson('/api/auth/users', ['email' => "victim@example.test\r\nBcc:evil@example.test", 'password' => 'secret12', 'password_confirmation' => 'secret12'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->postJson('/api/auth/users', ['email' => 'used@example.test', 'password' => 'secret12', 'password_confirmation' => 'secret12'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_login_me_and_logout_flow(): void
    {
        $user = $this->user('admin', 'admin@example.test');

        $this->postJson('/api/auth/sessions', ['email' => 'admin@example.test', 'password' => 'wrong'])
            ->assertUnprocessable()->assertJsonPath('message', 'Identifiants invalides.');
        $this->postJson('/api/auth/sessions', ['email' => 'ADMIN@example.test', 'password' => 'secret12'])
            ->assertOk()->assertJsonPath('data.id', $user->id)->assertJsonPath('data.is_admin', true);
        $this->getJson('/api/auth/user')->assertOk()->assertJsonPath('data.email', 'admin@example.test');
        $this->deleteJson('/api/auth/session')->assertNoContent();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/auth/user')->assertUnauthorized();
    }

    public function test_unverified_login_returns_422_without_creating_a_session(): void
    {
        $user = $this->user(email: 'unverified@example.test');
        $user->forceFill(['email_verified_at' => null])->save();

        $this->postJson('/api/auth/sessions', ['email' => $user->email, 'password' => 'secret12'])
            ->assertUnprocessable()
            ->assertJsonPath('code', 'email_unverified');
        $this->getJson('/api/auth/user')->assertUnauthorized();
    }

    public function test_existing_unverified_session_is_invalidated_on_next_authenticated_request(): void
    {
        $user = $this->user(email: 'session-unverified@example.test');
        $this->actingAs($user)->getJson('/api/auth/user')->assertOk();
        $user->forceFill(['email_verified_at' => null])->save();

        $this->getJson('/api/organizer/dashboard')
            ->assertUnprocessable()
            ->assertJsonPath('code', 'email_unverified');
        $this->getJson('/api/auth/user')->assertUnauthorized();
    }

    public function test_verification_link_marks_email_verified_and_redirects_to_frontend(): void
    {
        $user = $this->user(email: 'verify@example.test');
        $user->forceFill(['email_verified_at' => null])->save();
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(10), [
            'user' => $user->id,
            'hash' => sha1($user->getEmailForVerification()),
        ]);

        $this->get($url)->assertRedirect(config('app.frontend_url').'/verify-email?status=verified&email='.urlencode($user->email));
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_invalid_verification_link_does_not_verify_email(): void
    {
        $user = $this->user(email: 'invalid-verify@example.test');
        $user->forceFill(['email_verified_at' => null])->save();
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(10), [
            'user' => $user->id,
            'hash' => sha1('different@example.test'),
        ]);

        $this->get($url)->assertRedirect(config('app.frontend_url').'/verify-email?status=invalid&email='.urlencode($user->email));
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_expired_verification_link_redirects_to_frontend_without_verifying_email(): void
    {
        $user = $this->user(email: 'expired-verify@example.test');
        $user->forceFill(['email_verified_at' => null])->save();
        $url = URL::temporarySignedRoute('verification.verify', now()->subMinute(), [
            'user' => $user->id,
            'hash' => sha1($user->getEmailForVerification()),
        ]);

        $this->get($url)->assertRedirect(config('app.frontend_url').'/verify-email?status=invalid&email='.urlencode($user->email));
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_resend_verification_is_generic_and_limited_to_five_per_day(): void
    {
        config(['app.env' => 'production']);
        Notification::fake();
        $user = $this->user(email: 'resend@example.test');
        $user->forceFill(['email_verified_at' => null])->save();

        foreach (range(1, 6) as $attempt) {
            $this->postJson('/api/auth/email-verification-notifications', ['email' => $user->email])
                ->assertOk()
                ->assertJsonPath('data.sent', true)
                ->assertJsonPath('message', 'Si un compte existe et que son adresse n’est pas encore vérifiée, un email a été envoyé.');
        }
        Notification::assertSentToTimes($user, VerifyEmail::class, 5);

        Notification::fake();
        $this->postJson('/api/auth/email-verification-notifications', ['email' => 'missing@example.test'])
            ->assertOk()
            ->assertJsonPath('message', 'Si un compte existe et que son adresse n’est pas encore vérifiée, un email a été envoyé.');
        Notification::assertNothingSent();
    }

    public function test_resend_verification_is_not_limited_outside_production(): void
    {
        config(['app.env' => 'testing']);
        Notification::fake();
        $user = $this->user(email: 'resend-testing@example.test');
        $user->forceFill(['email_verified_at' => null])->save();

        foreach (range(1, 6) as $attempt) {
            $this->postJson('/api/auth/email-verification-notifications', ['email' => $user->email])->assertOk();
        }

        Notification::assertSentToTimes($user, VerifyEmail::class, 6);
    }

    public function test_corrupted_user_role_returns_safe_api_error(): void
    {
        $user = $this->user();
        DB::table('user_roles')->where('user_id', $user->id)->update(['role' => 'support']);

        $this->postJson('/api/auth/sessions', ['email' => $user->email, 'password' => 'secret12'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Impossible de vous connecter pour le moment. Contactez l’équipe technique.');
        $this->getJson('/api/auth/user')->assertUnauthorized();
    }

    public function test_corrupted_user_role_invalidates_an_existing_session(): void
    {
        $user = $this->user();
        $this->actingAs($user)->getJson('/api/auth/user')->assertOk();
        DB::table('user_roles')->where('user_id', $user->id)->update(['role' => 'support']);

        $this->getJson('/api/organizer/dashboard')
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Impossible de vous connecter pour le moment. Contactez l’équipe technique.');
        $this->getJson('/api/auth/user')->assertUnauthorized();
    }

    public function test_password_reset_notification_and_token_flow(): void
    {
        Notification::fake();
        $user = $this->user(email: 'reset@example.test');
        $token = null;

        $this->postJson('/api/auth/password-reset-links', ['email' => $user->email])
            ->assertOk()->assertJsonPath('data.sent', true);
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use (&$token) {
            $token = $notification->token;

            return $notification->queue === QueueName::Emails->value;
        });
        $this->assertNotNull($token);

        $this->postJson('/api/auth/password-resets', [
            'token' => 'invalid', 'email' => $user->email, 'password' => 'changed12', 'password_confirmation' => 'changed12',
        ])->assertUnprocessable();
        $this->postJson('/api/auth/password-resets', [
            'token' => $token, 'email' => $user->email, 'password' => 'changed12', 'password_confirmation' => 'changed12',
        ])->assertOk()->assertJsonPath('data.reset', true);
        $this->assertTrue(Hash::check('changed12', $user->fresh()->password));
    }

    public function test_authenticated_user_can_update_profile_and_password(): void
    {
        $user = $this->user(email: 'profile@example.test');
        $user->createToken('other-device');

        $this->actingAs($user)->patchJson('/api/auth/user', [
            'full_name' => 'Ada Lovelace',
        ])->assertOk()
            ->assertJsonPath('data.full_name', 'Ada Lovelace')
            ->assertJsonPath('data.email', 'profile@example.test');

        $this->actingAs($user)->patchJson('/api/auth/user/password', [
            'current_password' => 'wrong',
            'password' => 'changed12',
            'password_confirmation' => 'changed12',
        ])->assertUnprocessable();

        $this->actingAs($user)->patchJson('/api/auth/user/password', [
            'current_password' => 'secret12',
            'password' => 'changed12',
            'password_confirmation' => 'changed12',
        ])->assertOk()->assertJsonPath('data.updated', true);

        $this->assertTrue(Hash::check('changed12', $user->fresh()->password));
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $user->id]);
        $this->getJson('/api/auth/user')->assertOk()->assertJsonPath('data.email', $user->email);
    }

    public function test_profile_update_rejects_email_changes(): void
    {
        $user = $this->user(email: 'profile@example.test');

        $this->actingAs($user)->patchJson('/api/auth/user', [
            'full_name' => 'Ada Lovelace',
            'email' => 'other@example.test',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email']);
    }

    public function test_forgot_password_does_not_disclose_unknown_email(): void
    {
        Notification::fake();
        $this->postJson('/api/auth/password-reset-links', ['email' => 'missing@example.test'])
            ->assertOk()->assertJsonPath('data.sent', true);
        Notification::assertNothingSent();
    }

    public function test_protected_routes_reject_guests(): void
    {
        $this->getJson('/api/organizer/dashboard')->assertUnauthorized();
        $this->postJson('/api/organizer/events', [])->assertUnauthorized();
        $this->getJson('/api/organizer/withdrawals')->assertUnauthorized();
        $this->getJson('/api/admin/dashboard')->assertUnauthorized();
    }

    public function test_login_rate_limit_and_security_headers(): void
    {
        $this->user(email: 'limited@example.test');
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/auth/sessions', ['email' => 'limited@example.test', 'password' => 'wrong'])->assertUnprocessable();
        }
        $this->postJson('/api/auth/sessions', ['email' => 'limited@example.test', 'password' => 'wrong'])->assertTooManyRequests();

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
}
