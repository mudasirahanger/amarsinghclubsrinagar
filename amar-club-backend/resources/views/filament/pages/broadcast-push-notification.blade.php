<x-filament-panels::page>
    <x-filament::card>
        <form wire:submit="send">
            {{ $this->form }}

            <div class="mt-4">
                <x-filament::button type="submit" color="primary">
                    Send Notification
                </x-filament::button>
            </div>
        </form>
    </x-filament::card>
</x-filament-panels::page>
