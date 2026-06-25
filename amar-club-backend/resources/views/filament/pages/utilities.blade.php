<x-filament-panels::page>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {{-- Members --}}
        <x-filament::section>
            <x-slot name="heading">
                Members Management
            </x-slot>
            <x-slot name="description">
                Import or export member data (CSV/XLSX). Sample CSVs are available inside the import dialog.
            </x-slot>

            <div class="flex flex-col gap-4 mt-4">
                {{ $this->importMembersAction }}
                {{ $this->exportMembersAction }}
            </div>
        </x-filament::section>

        {{-- Menu Items --}}
        <x-filament::section>
            <x-slot name="heading">
                Menu Items Management
            </x-slot>
            <x-slot name="description">
                Bulk upload menu items with their prices, GST, and categories.
            </x-slot>

            <div class="flex flex-col gap-4 mt-4">
                {{ $this->importItemsAction }}
                {{ $this->exportItemsAction }}
            </div>
        </x-filament::section>

        {{-- Categories --}}
        <x-filament::section>
            <x-slot name="heading">
                Categories Management
            </x-slot>
            <x-slot name="description">
                Manage your food and beverage categories in bulk.
            </x-slot>

            <div class="flex flex-col gap-4 mt-4">
                {{ $this->importCategoriesAction }}
                {{ $this->exportCategoriesAction }}
            </div>
        </x-filament::section>

    </div>
</x-filament-panels::page>
