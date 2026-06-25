<?php

namespace App\Filament\Resources\Staff\Pages;

use App\Filament\Resources\Staff\StaffResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ManageRecords;

class ManageStaff extends ManageRecords
{
    protected static string $resource = StaffResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make()
                ->mutateFormDataUsing(function (array $data): array {
                    $data['is_staff'] = true;
                    // Generate a random member_id for staff to satisfy the DB constraint
                    $data['member_id'] = 'STAFF-' . strtoupper(uniqid());
                    return $data;
                }),
        ];
    }
}
