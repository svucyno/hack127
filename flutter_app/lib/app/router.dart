import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../screens/login_screen.dart';
import '../screens/dashboard_screen.dart';
import '../screens/inventory_screen.dart';
import '../screens/billing_screen.dart';
import '../screens/alerts_screen.dart';
import '../screens/offers_screen.dart';
import '../screens/suppliers_screen.dart';
import '../screens/reports_screen.dart';
import '../screens/users_screen.dart';
import '../screens/customers_screen.dart';
import '../screens/order_mgmt_screen.dart';

final router = GoRouter(
  initialLocation: '/login',
  redirect: (context, state) {
    final loggedIn = FirebaseAuth.instance.currentUser != null;
    final isLogin = state.matchedLocation == '/login';
    if (!loggedIn && !isLogin) return '/login';
    if (loggedIn && isLogin) return '/dashboard';
    return null;
  },
  routes: [
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/dashboard', builder: (_, __) => const DashboardScreen()),
    GoRoute(path: '/inventory', builder: (_, __) => const InventoryScreen()),
    GoRoute(path: '/billing', builder: (_, __) => const BillingScreen()),
    GoRoute(path: '/alerts', builder: (_, __) => const AlertsScreen()),
    GoRoute(path: '/offers', builder: (_, __) => const OffersScreen()),
    GoRoute(path: '/suppliers', builder: (_, __) => const SuppliersScreen()),
    GoRoute(path: '/reports', builder: (_, __) => const ReportsScreen()),
    GoRoute(path: '/users', builder: (_, __) => const UsersScreen()),
    GoRoute(path: '/customers', builder: (_, __) => const CustomersScreen()),
    GoRoute(path: '/orders', builder: (_, __) => const OrderMgmtScreen()),
  ],
);
