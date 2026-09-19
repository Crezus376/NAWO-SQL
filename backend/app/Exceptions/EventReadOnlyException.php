<?php

namespace App\Exceptions;

use RuntimeException;

class EventReadOnlyException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('Cet événement est en lecture seule car son statut est invalide. Contactez l’équipe technique.');
    }
}
