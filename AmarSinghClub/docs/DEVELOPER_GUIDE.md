# Developer Guide

## Amar Singh Club App

Welcome to the Amar Singh Club React Native App repository. This guide provides all necessary instructions for setting up the development environment, running the project, and understanding its core dependencies.

### Environment Setup

1. **Prerequisites**
   - Node.js (v20+ recommended)
   - pnpm (`npm install -g pnpm`)
   - Watchman (macOS: `brew install watchman`)
   - Expo CLI (`npm install -g expo-cli`)
   - Android Studio (for Android Emulator)
   - Xcode (for iOS Simulator - macOS only)

2. **Installation**
   ```bash
   # Clone the repository and navigate to the mobile app directory
   cd AmarSinghClub

   # Install dependencies using pnpm
   pnpm install
   ```

3. **Environment Variables**
   Create a `.env` file in the root directory (`AmarSinghClub/`) with the following variables:
   ```env
   EXPO_PUBLIC_API_URL=https://your-laravel-backend-url.com/api
   EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_here
   ```

### Running the App Locally

Start the Expo Development Server:
```bash
npx expo start
```

Run on iOS Simulator:
```bash
npx expo run:ios
```

Run on Android Emulator:
```bash
npx expo run:android
```

### Core Technologies

- **Framework:** React Native (0.81.5) via Expo SDK 54
- **Styling:** Tailwind CSS (via NativeWind v4)
- **Navigation:** React Navigation v7
- **Payments:** Razorpay (`react-native-razorpay`)
- **Camera/Scanner:** `expo-camera`
- **Animations:** `react-native-reanimated`
- **State & Storage:** Context API & `@react-native-async-storage/async-storage`

### Common Commands

- **Testing:** `npm run test` (Runs Jest test suite)
- **Clear Cache:** `npx expo start -c`
- **Prebuild:** `npx expo prebuild --clean` (Generates native `/ios` and `/android` folders - DO NOT commit these folders!)

### Troubleshooting

- **Watchman Warning during Tests:** 
  If Jest complains about Watchman drops, run:
  `watchman watch-del-all`
- **React Native Reanimated Build Failure (Android):**
  If you run a local gradle build and `react-native-reanimated` fails to compile with `LengthPercentage` errors, ensure the custom `patch-package` patches are applied:
  `npx patch-package`
- **Razorpay Android SDK 35 Build Failure:**
  The `react-native-razorpay` patch in `patches/` upgrades the compilation target to SDK 35. Make sure the patch is applied.
