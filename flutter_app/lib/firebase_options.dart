import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return web;
      case TargetPlatform.macOS:
        return web;
      case TargetPlatform.windows:
        return web;
      case TargetPlatform.linux:
        return web;
      case TargetPlatform.fuchsia:
        return web;
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyCA8UxrzFVh7LF4d5ZG8PNrEx8f3VdpwX0',
    appId: '1:539744292760:web:4c8dc1c7993c9cbb63e5ed',
    messagingSenderId: '539744292760',
    projectId: 'shopsmart-0001',
    authDomain: 'shopsmart-0001.firebaseapp.com',
    storageBucket: 'shopsmart-0001.firebasestorage.app',
    measurementId: 'G-NCQSK4LGHP',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCA8UxrzFVh7LF4d5ZG8PNrEx8f3VdpwX0',
    appId: '1:539744292760:web:4c8dc1c7993c9cbb63e5ed',
    messagingSenderId: '539744292760',
    projectId: 'shopsmart-0001',
    storageBucket: 'shopsmart-0001.firebasestorage.app',
  );
}
