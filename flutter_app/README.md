# ShopSmart Flutter App

Flutter Android app for ShopSmart — connects to the same Firebase project as the web app.

## Setup

### Prerequisites
1. Install [Flutter SDK](https://flutter.dev/docs/get-started/install/windows)
2. Install [Android Studio](https://developer.android.com/studio) (for emulator)
3. Install Firebase CLI: `npm install -g firebase-tools`
4. Install FlutterFire CLI: `dart pub global activate flutterfire_cli`

### Steps
```bash
# 1. Clone and enter project
cd flutter_app

# 2. Install dependencies
flutter pub get

# 3. Configure Firebase (generates firebase_options.dart)
flutterfire configure --project=shopsmart-0001

# 4. Run on emulator or device
flutter run
```

### Default Admin
- Email: admin@gmail.com
- Password: Admin123

## Tech Stack
- Flutter + Dart
- Firebase Auth + Firestore (same project as web app)
- Provider for state management
- go_router for navigation
- sqflite for offline cache
- mobile_scanner for barcode
- fl_chart for charts
