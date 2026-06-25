<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Schemas\Schema;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Notifications\Notification;
use App\Models\User;
use App\Notifications\CustomAnnouncement;
use Filament\Actions\Action;

class BroadcastPushNotification extends Page implements HasForms
{
    use InteractsWithForms;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-megaphone';
    protected static string|\UnitEnum|null $navigationGroup = 'System';
    protected static ?string $navigationLabel = 'Broadcast Push';
    protected static ?string $title = 'Send Push Notification';
    protected static ?int $navigationSort = 3;

    protected string $view = 'filament.pages.broadcast-push-notification';

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill();
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->schema([
                TextInput::make('title')
                    ->label('Notification Title')
                    ->required()
                    ->maxLength(255),
                Textarea::make('message')
                    ->label('Notification Message')
                    ->required()
                    ->rows(4),
            ])
            ->statePath('data');
    }

    protected function getFormActions(): array
    {
        return [
            Action::make('send')
                ->label('Send Broadcast to All Users')
                ->submit('send')
                ->requiresConfirmation()
                ->color('primary')
                ->icon('heroicon-m-paper-airplane'),
        ];
    }

    public function send(): void
    {
        $data = $this->form->getState();

        $users = User::whereNotNull('expo_push_token')->get();
        
        if ($users->isEmpty()) {
            Notification::make()
                ->title('No users found with valid push tokens.')
                ->danger()
                ->send();
            return;
        }

        foreach ($users as $user) {
            $user->notify(new CustomAnnouncement($data['title'], $data['message']));
        }

        Notification::make()
            ->title('Push notification successfully sent to ' . $users->count() . ' members!')
            ->success()
            ->send();

        $this->form->fill();
    }
}
