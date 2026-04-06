import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final cs = Theme.of(context).colorScheme;
    return Drawer(
      child: Column(children: [
        DrawerHeader(
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [cs.primary, cs.tertiary]),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              const Text('🛒 ShopSmart', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text(auth.user?.email ?? '', style: const TextStyle(color: Colors.white70, fontSize: 12)),
            ],
          ),
        ),
        _tile(context, 'Dashboard', Icons.dashboard, '/dashboard'),
        _tile(context, 'Inventory', Icons.inventory_2, '/inventory'),
        _tile(context, 'Billing', Icons.receipt_long, '/billing'),
        _tile(context, 'Alerts', Icons.notifications, '/alerts'),
        _tile(context, 'Offers', Icons.local_offer, '/offers'),
        _tile(context, 'Reports', Icons.bar_chart, '/reports'),
        _tile(context, 'Suppliers', Icons.store, '/suppliers'),
        _tile(context, 'Customers', Icons.people, '/customers'),
        _tile(context, 'Users', Icons.admin_panel_settings, '/users'),
        _tile(context, 'Orders', Icons.shopping_bag, '/orders'),
        const Spacer(),
        const Divider(),
        ListTile(
          leading: const Icon(Icons.logout),
          title: const Text('Sign Out'),
          onTap: () async {
            await auth.signOut();
            if (context.mounted) context.go('/login');
          },
        ),
        const SizedBox(height: 8),
      ]),
    );
  }

  Widget _tile(BuildContext context, String title, IconData icon, String path) {
    final current = GoRouterState.of(context).matchedLocation;
    final active = current == path;
    return ListTile(
      leading: Icon(icon, color: active ? Theme.of(context).colorScheme.primary : null),
      title: Text(title, style: TextStyle(fontWeight: active ? FontWeight.bold : FontWeight.normal)),
      selected: active,
      onTap: () {
        Navigator.pop(context);
        context.go(path);
      },
    );
  }
}
