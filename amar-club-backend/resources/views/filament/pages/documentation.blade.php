<x-filament-panels::page>
    <div class="space-y-6">
        
        <!-- Welcome Section -->
        <x-filament::section>
            <x-slot name="heading">Welcome to the Amar Singh Club Admin Portal</x-slot>
            <x-slot name="description">
                This documentation provides a comprehensive guide on how to navigate, manage, and utilize the features of the Amar Singh Club backend system.
            </x-slot>
            
            <div class="mt-4 prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300">
                <p>The Admin Portal allows you to manage members, process Kitchen Order Tickets (KOTs), track payments, export accounting data, and configure the system parameters for both the web dashboard and the Expo mobile application.</p>
            </div>
        </x-filament::section>

        <!-- KOT & Order Management -->
        <x-filament::section>
            <x-slot name="heading">1. KOT & Order Management</x-slot>
            
            <div class="mt-4 prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300">
                <ul class="list-disc list-inside space-y-2">
                    <li><strong>Creating an Order:</strong> Orders can be created from the dashboard or automatically synced from the Expo Mobile App.</li>
                    <li><strong>Archiving vs. Deleting:</strong> For security and audit purposes, Transactions and Orders cannot be permanently deleted. If an order is canceled or removed, it is marked as <em>Archived</em>.</li>
                    <li><strong>Notifications Sync:</strong> When a KOT is archived or canceled in the admin panel, the notification and activity feed on the mobile app will automatically be updated to remove it from the user's view.</li>
                </ul>
            </div>
        </x-filament::section>

        <!-- Accounting & Exports -->
        <x-filament::section>
            <x-slot name="heading">2. Accounting & Data Export</x-slot>
            
            <div class="mt-4 prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300">
                <p>The system provides robust tools for financial tracking and integration with external ERP software.</p>
                <ul class="list-disc list-inside space-y-2 mt-2">
                    <li><strong>Accounting Dashboard:</strong> Navigate to the <em>Accounting</em> menu under the main navigation to view overall financial metrics.</li>
                    <li><strong>Marg ERP Integration:</strong> You can export all transactions into a format natively compatible with Marg ERP. Click the <em>Download Marg ERP Export</em> button to generate an Excel file formatted specifically for Marg imports.</li>
                    <li><strong>GSTR1 Export:</strong> Use the <em>Download GSTR1 Report</em> button to generate tax-ready documents for GST filing.</li>
                </ul>
            </div>
        </x-filament::section>

        <!-- Application Settings -->
        <x-filament::section>
            <x-slot name="heading">3. Application Settings & Branding</x-slot>
            
            <div class="mt-4 prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300">
                <p>The <em>App Settings</em> menu (located under the System group) controls the global configuration of the platform:</p>
                <ul class="list-disc list-inside space-y-2 mt-2">
                    <li><strong>Dynamic Branding:</strong> Update the <em>Admin Title / Club Name</em>, <em>Club Address</em>, and <em>GST Number</em>. These changes will immediately reflect in the top-left corner of the admin panel and on all printed KOT PDFs/Receipts.</li>
                    <li><strong>Mobile App Control:</strong> Toggle <em>Maintenance Mode</em> to temporarily block mobile logins, or update the <em>Minimum App Version</em> to force users on older versions of the app to upgrade via the App Store/Play Store.</li>
                </ul>
            </div>
        </x-filament::section>

        <!-- Mobile App Experience -->
        <x-filament::section>
            <x-slot name="heading">4. Mobile App (Expo) Features</x-slot>
            
            <div class="mt-4 prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300">
                <p>The companion mobile app is designed to provide members with a seamless experience:</p>
                <ul class="list-disc list-inside space-y-2 mt-2">
                    <li><strong>Secure Payments:</strong> The payment popup modal is persistent. It cannot be accidentally closed by tapping outside the box. It will only disappear when the user explicitly taps <em>Cancel</em>, <em>Dismiss</em>, or successfully completes a <em>Payment</em>.</li>
                    <li><strong>Haptic Feedback:</strong> Critical alerts and payment prompts utilize vibration (buzz effects) to attract the user's attention.</li>
                </ul>
            </div>
        </x-filament::section>

    </div>
</x-filament-panels::page>
