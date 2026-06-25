# Development Log / Changelog

## [Current Version / June 2026]

### Highlights
- **Framework Upgrade:** Migrated React Native app to `0.81.5` and Expo SDK `54`. 
- **Build Fixes:** 
  - Resolved Android Gradle failure by bumping Android `targetSdkVersion` and `compileSdkVersion` to `35` via Expo `app.json`.
  - Removed `useFrameworks: static` in iOS to resolve Folly `Coroutine.h` compilation errors.
  - Set `ccxxLanguageStandard: "c++20"` for iOS to properly build the latest RN C++ turbomodules.
- **Native Dependencies Patched:**
  - `react-native-razorpay@3.0.0`: Updated Android `build.gradle` to compile with SDK 35 (via `patch-package`).
  - `react-native-reanimated@3.16.7`: Patched `BorderRadiiDrawableUtils.java` to support the new `LengthPercentage` signature in RN 0.81 and removed the deprecated `Systrace.TRACE_TAG_REACT_JAVA_BRIDGE` constant inside `ReanimatedPackage.java`.

### Features & UI Fixes
- **Scanner Flow:** 
  - Handled 400 backend errors specifically (e.g. "Order is not in pending state or already paid"). 
  - Scanner now displays the error in a Toast message and automatically re-activates the camera via `setTimeout(() => setScanned(false), 2500)` so users are not blocked on subsequent scans.
- **Payment Success Screen:** 
  - Restructured to take an explicit `type` parameter (`'payment'` vs `'topup'`) rather than guessing based on the `method` string.
  - Implemented dynamic headings: displays **"Top-up Successful"** for wallet recharges and **"Payment Successful"** for QR KOT payments.
  - Added a floating animation for "🎉 Cheers!" text specifically for successful payments.
- **Testing environment:** 
  - Jest was logging large `[DEP0040] DeprecationWarning: The punycode module is deprecated` outputs due to Node 21+. Suppressed them via `NODE_OPTIONS="--no-warnings"` in `package.json` for cleaner test runs. All tests passing cleanly.

## Where to start next?
- The backend handles QR payloads and returns standard JSON responses. Next developers should ensure the `ScannerScreen.tsx` is kept in sync with any API payload changes for QR structures.
- Review `PaymentSuccessScreen.tsx` if additional success types or receipt structures are added.
- Always run `npx expo prebuild --clean` if modifying any native dependencies and check if existing `patch-package` patches are still necessary before upgrading packages!
