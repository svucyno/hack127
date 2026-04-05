import 'package:flutter/material.dart';
import '../services/alert_service.dart';
import '../models/alert.dart';
import '../widgets/app_drawer.dart';

class AlertsScreen extends StatelessWidget {
  const AlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final service = AlertService();
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Alerts')),
      drawer: const AppDrawer(),
      body: StreamBuilder<List<ShopAlert>>(
        stream: service.alertsStream(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final alerts = snapshot.data ?? [];
          if (alerts.isEmpty) {
            return const Center(child: Text('No alerts. Everything looks good! ✅'));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: alerts.length,
            itemBuilder: (context, i) {
              final a = alerts[i];
              final color = a.type.contains('expiry') ? cs.error
                  : a.type == 'lowstock' ? Colors.orange
                  : a.type == 'deadstock' ? Colors.grey : cs.primary;
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: CircleAvatar(backgroundColor: color.withAlpha(30),
                    child: Icon(a.resolved ? Icons.check : Icons.warning, color: color, size: 20)),
                  title: Text(a.message, style: TextStyle(fontSize: 13,
                    decoration: a.resolved ? TextDecoration.lineThrough : null)),
                  subtitle: Text(a.type, style: const TextStyle(fontSize: 11)),
                  trailing: a.resolved ? null : IconButton(
                    icon: const Icon(Icons.check_circle_outline),
                    onPressed: () => service.resolveAlert(a.id),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
