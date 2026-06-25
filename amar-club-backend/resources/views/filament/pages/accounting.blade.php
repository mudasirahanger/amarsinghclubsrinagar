<x-filament-panels::page>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {{-- GST Exports --}}
        <x-filament::section>
            <x-slot name="heading">
                GST Sales Reports
            </x-slot>
            <x-slot name="description">
                Generate and download GSTR1 compliant sales reports in CSV format for the accounting department.
            </x-slot>

            <div class="flex flex-col gap-4 mt-4">
                {{ $this->exportGstr1Action }}
            </div>
        </x-filament::section>

    </div>
</x-filament-panels::page>
