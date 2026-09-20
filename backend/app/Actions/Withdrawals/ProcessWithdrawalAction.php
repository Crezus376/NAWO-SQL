<?php

namespace App\Actions\Withdrawals;

use App\Models\User;
use App\Models\Withdrawal;
use App\Notifications\WithdrawalStatusChanged;
use Illuminate\Http\UploadedFile;

class ProcessWithdrawalAction
{
    public function execute(User $admin, Withdrawal $withdrawal, array $data, ?UploadedFile $proofFile): Withdrawal
    {
        abort_if($withdrawal->status === 'paid', 422, 'Cette demande a déjà été payée.');
        $proof = $proofFile?->store('withdrawal-proofs');
        if ($data['status'] === 'paid' && empty($data['reference']) && ! $proof && ! $withdrawal->proof_path) {
            abort(422, 'Ajoutez une référence ou une preuve de paiement.');
        }
        $withdrawal->update(['status' => $data['status'], 'transaction_reference' => $data['reference'] ?? $withdrawal->transaction_reference, 'admin_comment' => $data['comment'] ?? $withdrawal->admin_comment, 'proof_path' => $proof ?? $withdrawal->proof_path, 'processed_by' => $admin->id, 'processed_at' => $data['status'] === 'paid' ? now() : $withdrawal->processed_at]);
        $withdrawal->organizer->notify(new WithdrawalStatusChanged($withdrawal->fresh()));

        return $withdrawal->fresh()->load(['event', 'organizer']);
    }
}
