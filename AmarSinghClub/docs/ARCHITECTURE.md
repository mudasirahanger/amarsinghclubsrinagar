# Architecture Overview

## Folder Structure

The application follows a standard React Native modular structure:

```text
AmarSinghClub/
├── src/
│   ├── components/       # Reusable UI components (Modals, Cards, Buttons, etc.)
│   ├── navigation/       # React Navigation stack & tab definitions
│   ├── screens/          # Application views (Home, Scanner, TopUp, etc.)
│   ├── services/         # API and third-party integrations
│   └── __tests__/        # Jest Unit & Integration tests
├── docs/                 # Documentation files
├── patches/              # patch-package native overrides
├── app.json              # Expo configuration
├── tailwind.config.js    # NativeWind/Tailwind styling config
└── index.ts              # Entry point
```

## System Architecture

```mermaid
graph TD
    %% Define layers
    UI[UI Layer / Screens]
    Nav[Navigation Layer]
    Services[Service Layer]
    Store[(Local Storage)]
    Backend[Laravel Backend API]
    External[External Services]

    %% UI Connections
    UI --> Nav
    UI --> Services
    
    %% Services breakdown
    Services --> |Authentication| authService[authService.ts]
    Services --> |API Calls| api[api.ts]
    Services --> |Wallet & Payments| wallet[walletService.ts]
    Services --> |Caching & State| cache[cacheService.ts]
    
    %% Backend & External Connections
    api --> |HTTPS / JSON| Backend
    wallet --> |HTTPS| Backend
    wallet --> |SDK| Razorpay[Razorpay Gateway]
    External --> Razorpay
    
    %% Local Storage
    authService --> |JWT / User Data| Store
    cache --> |Offline Data| Store

    style UI fill:#e1f5fe,stroke:#01579b
    style Services fill:#e8f5e9,stroke:#1b5e20
    style Backend fill:#fff3e0,stroke:#e65100
    style External fill:#f3e5f5,stroke:#4a148c
```

## Core Modules

### 1. `walletService.ts`
Manages all wallet-related operations, including checking balance, fetching transactions, processing QR code scanner payments (`pay()`), creating Razorpay orders, and approving payments (`approveOrder()`).

### 2. `authService.ts`
Handles user login, logout, and token persistence using `@react-native-async-storage/async-storage`.

### 3. `api.ts`
The core Axios instance configured with base URL and interceptors. It automatically injects the Bearer token into outgoing requests and provides structured error handling.
