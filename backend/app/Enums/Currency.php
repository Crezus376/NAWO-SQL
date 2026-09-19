<?php

namespace App\Enums;

enum Currency: string
{
    case XOF = 'XOF';

    public function labelFr(): string
    {
        return match ($this) {
            self::XOF => 'FCFA',
        };
    }
}
