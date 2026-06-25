<x-filament-panels::page>
    <x-filament::section>
        <h2 class="text-lg font-bold">Release Notes - Version {{ \App\Models\AppSetting::getValue('minimum_app_version', '1.0.0') }}</h2>
        <ul class="mt-4 list-disc list-inside text-sm text-gray-600 space-y-2">
            <li>Added dynamic club branding (Name, Address, GST) to KOTs and Admin Panel.</li>
            <li>Improved payment popup persistence in the Expo App.</li>
            <li>Added Excel Export tool to the accounting section.</li>
            <li>Reorganized sidebar menu and added Resources section.</li>
        </ul>
    </x-filament::section>
</x-filament-panels::page>
