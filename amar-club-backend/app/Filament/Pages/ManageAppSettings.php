<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Schemas\Schema;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use App\Models\AppSetting;
use Filament\Actions\Action;

class ManageAppSettings extends Page implements HasForms
{
    use InteractsWithForms;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-cog-6-tooth';
    protected static string|\UnitEnum|null $navigationGroup = 'System';
    protected static ?string $navigationLabel = 'App Settings';
    protected static ?string $title = 'App Settings';
    protected static ?int $navigationSort = 4;

    protected string $view = 'filament.pages.manage-app-settings';

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill([
            'maintenance_mode' => AppSetting::getValue('maintenance_mode', 'false') === 'true',
            'minimum_app_version' => AppSetting::getValue('minimum_app_version', '1.0.0'),
            'app_store_url' => AppSetting::getValue('app_store_url', ''),
            'play_store_url' => AppSetting::getValue('play_store_url', ''),
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Toggle::make('maintenance_mode')
                    ->label('Maintenance Mode')
                    ->helperText('If enabled, the mobile app will show a maintenance screen and block logins.'),
                
                TextInput::make('minimum_app_version')
                    ->label('Minimum App Version')
                    ->required()
                    ->helperText('e.g., 1.0.0. Users with older versions will be forced to update.'),

                TextInput::make('app_store_url')
                    ->label('iOS App Store URL')
                    ->url()
                    ->helperText('Link to the Apple App Store. Used by the "Update Required" screen.'),

                TextInput::make('play_store_url')
                    ->label('Google Play Store URL')
                    ->url()
                    ->helperText('Link to the Google Play Store. Used by the "Update Required" screen.'),
            ])
            ->statePath('data');
    }

    protected function getFormActions(): array
    {
        return [
            Action::make('save')
                ->label('Save Settings')
                ->submit('save')
                ->color('primary')
                ->icon('heroicon-m-check'),
        ];
    }

    public function save(): void
    {
        $data = $this->form->getState();

        AppSetting::setValue('maintenance_mode', $data['maintenance_mode'] ? 'true' : 'false');
        AppSetting::setValue('minimum_app_version', $data['minimum_app_version']);
        AppSetting::setValue('app_store_url', $data['app_store_url'] ?? '');
        AppSetting::setValue('play_store_url', $data['play_store_url'] ?? '');

        Notification::make()
            ->title('Settings saved successfully!')
            ->success()
            ->send();
    }
}
