<?php

namespace App\Http\Controllers;

use App\Models\Withdrawal;
use Illuminate\Support\Facades\Storage;

class WithdrawalProofController extends Controller
{
    public function show(Withdrawal $withdrawal)
    {
        $this->authorize('view', $withdrawal);
        abort_unless($withdrawal->proof_path && Storage::disk('local')->exists($withdrawal->proof_path), 404);

        return Storage::disk('local')->download($withdrawal->proof_path);
    }
}
