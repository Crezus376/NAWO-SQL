<?php

namespace App\Actions\EventPages;

use App\Models\EventPage;

class UpdateEventPageAction
{
    public function execute(EventPage $page, array $data): EventPage
    {
        $page->update($data);

        return $page->fresh();
    }
}
