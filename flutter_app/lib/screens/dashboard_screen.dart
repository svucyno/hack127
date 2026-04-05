import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/app_drawer.dart';
import '../widgets/stat_card.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard')),
      drawer: const AppDrawer(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Welcome, ${auth.user?.displayName ?? 'Owner'}',
              style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 16),
          const Row(children: [
            Expanded(child: StatCard(label: 'Products', value: '—', icon: Icons.inventory_2)),
            SizedBox(width: 12),
            Expanded(child: StatCard(label: 'Today Sales', value: '₹0', icon: Icons.receipt_long)),
          ]),
          const SizedBox(height: 12),
          const Row(children: [
            Expanded(child: StatCard(label: 'Alerts', value: '0', icon: Icons.notifications_active)),
            SizedBox(width: 12),
            Expanded(child: StatCard(label: 'Low Stock', value: '0', icon: Icons.warning_amber)),
          ]),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('AI Predictions', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                const Text('Predictions will appear here once you have sales data.',
                    style: TextStyle(color: Colors.grey)),
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}
