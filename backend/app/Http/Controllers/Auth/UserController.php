<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\UpdateCurrentUserAction;
use App\Actions\Auth\UpdateCurrentUserPasswordAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\UpdateCurrentUserPasswordRequest;
use App\Http\Requests\Auth\UpdateCurrentUserRequest;
use App\Http\Resources\UserResource;

class UserController extends Controller
{
    public function updateData(UpdateCurrentUserRequest $request, UpdateCurrentUserAction $action): UserResource
    {
        return new UserResource($action->execute($request->user(), $request->validated()));
    }

    public function updatePassword(UpdateCurrentUserPasswordRequest $request, UpdateCurrentUserPasswordAction $action): array
    {
        $action->execute($request->user(), $request->validated('password'), $request);

        return ['data' => ['updated' => true]];
    }
}
