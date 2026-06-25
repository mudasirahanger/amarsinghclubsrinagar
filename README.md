# Amar Singh Club App

This repository contains the complete source code for the Amar Singh Club Application, including both the backend (Laravel) and frontend (Expo/React Native).

## Project Structure

- **`amar-club-backend/`**: Laravel 13 based API and admin panel backend.
  - Built with PHP 8.3+ and Laravel 13.
  - Uses Filament Admin Panel for backend management.
  - Provides REST APIs for the mobile app.
- **`AmarSinghClub/`**: Expo/React Native based mobile application.
  - Built with React Native 0.81 and Expo SDK 54.
  - Frontend app for club members/staff.

## Database Structure (Backend)

The backend uses a relational database with the following core entities:

- **Users**: Members and Staff. Stores authentication details, membership info, and role (`is_staff`).
- **Personal Access Tokens**: API tokens for mobile app authentication (Sanctum).
- **Categories**: Food/Beverage categories for menu items.
- **Menu Items**: Items available for order, linked to Categories. Includes pricing and tax info.
- **Orders**: Orders placed by users. Tracks total amount, taxes, status (e.g. drafts), and timestamps.
- **Order Items**: Individual items within an order (pivot/detail table).
- **Order Histories**: Logs state changes for orders.
- **Transactions**: Payment transactions linked to users or orders.
- **Notifications**: System and push notifications for users.
- **App Settings**: Global application configuration.
- **Roles & Permissions**: (Spatie Permission) Access control for Filament Admin.

## Getting Started for Developers

### Prerequisites
- PHP 8.3+
- Composer
- Node.js & npm/yarn
- Expo CLI

### Backend Setup (`amar-club-backend`)
1. Navigate to the backend directory: `cd amar-club-backend`
2. Install PHP dependencies: `composer install`
3. Install JS dependencies (for Filament): `npm install`
4. Copy environment file: `cp .env.example .env`
5. Generate app key: `php artisan key:generate`
6. Configure your database in the `.env` file.
7. Run migrations and seeders: `php artisan migrate --seed`
8. Start the local development server and queue (concurrently): `composer run dev`
   *(Alternatively: use `php artisan serve` and `npm run dev` in separate terminals)*

### Frontend Setup (`AmarSinghClub`)
1. Navigate to the frontend directory: `cd AmarSinghClub`
2. Install dependencies: `npm install`
3. Configure environment variables in `.env` (API URLs, etc.).
4. Start the Expo development server: `npx expo start`
   - Press `i` to run on iOS Simulator
   - Press `a` to run on Android Emulator
