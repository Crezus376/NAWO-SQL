<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\LoginAction;
use App\Actions\Auth\LogoutAction;
use App\Actions\Auth\RegisterUserAction;
use App\Actions\Auth\ResendEmailVerificationAction;
use App\Actions\Auth\ResetPasswordAction;
use App\Actions\Auth\SendPasswordResetLinkAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterUserRequest;
use App\Http\Requests\Auth\ResendEmailVerificationRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\StorePasswordResetLinkRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AuthController extends Controller
{
    public function register(RegisterUserRequest $request, RegisterUserAction $action)
    {
        return (new UserResource($action->execute($request->validated())))->response()->setStatusCode(201);
    }

    public function login(LoginRequest $request, LoginAction $action): UserResource
    {
        return new UserResource($action->execute($request, $request->validated()));
    }

    public function logout(Request $request, LogoutAction $action): Response
    {
        $action->execute($request);

        return response()->noContent();
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function sendVerification(ResendEmailVerificationRequest $request, ResendEmailVerificationAction $action): array
    {
        $action->execute($request->validated('email'));

        return ['data' => ['sent' => true], 'message' => 'Si un compte existe et que son adresse n’est pas encore vérifiée, un email a été envoyé.'];
    }

    public function verifyEmail(Request $request, User $user, string $hash)
    {
        $path = rtrim(config('app.frontend_email_verification_path'), '/');
        $redirect = fn (string $status) => redirect()->to(rtrim(config('app.frontend_url'), '/').$path.'?status='.$status.'&email='.urlencode($user->email));
        if (! $request->hasValidSignature() || ! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return $redirect('invalid');
        }
        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return $redirect('verified');
    }

    public function sendResetLink(StorePasswordResetLinkRequest $request, SendPasswordResetLinkAction $action): array
    {
        $action->execute($request->validated('email'));

        return ['data' => ['sent' => true]];
    }

    public function resetPassword(ResetPasswordRequest $request, ResetPasswordAction $action): array
    {
        $action->execute($request->validated());

        return ['data' => ['reset' => true]];
    }
}
