import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'firebase_options.dart';
import 'app/router.dart';
import 'app/theme.dart';
import 'services/auth_service.dart';
import 'services/inventory_service.dart';
import 'services/billing_service.dart';
import 'services/supplier_service.dart';
import 'services/offer_service.dart';
import 'services/alert_service.dart';
import 'services/offline_service.dart';
import 'providers/auth_provider.dart';
import 'providers/inventory_provider.dart';
import 'providers/billing_provider.dart';
import 'providers/supplier_provider.dart';
import 'providers/settings_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const ShopSmartApp());
}

class ShopSmartApp extends StatelessWidget {
  const ShopSmartApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider(AuthService())),
        ChangeNotifierProvider(create: (_) => InventoryProvider(InventoryService())),
        ChangeNotifierProvider(create: (_) => BillingProvider(BillingService())),
        ChangeNotifierProvider(create: (_) => SupplierProvider(SupplierService())),
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
      ],
      child: MaterialApp.router(
        title: 'ShopSmart',
        debugShowCheckedModeBanner: false,
        theme: lightTheme,
        darkTheme: darkTheme,
        themeMode: ThemeMode.system,
        routerConfig: router,
      ),
    );
  }
}
