import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../widgets/app_drawer.dart';

class CustomersScreen extends StatelessWidget {
  const CustomersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final db = FirebaseFirestore.instance;
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Customers')),
      drawer: const AppDrawer(),
      body: StreamBuilder<QuerySnapshot>(
        stream: db.collection('customers').snapshots(),
        builder: (ctx, snap) {
          if (!snap.hasData)
            return const Center(child: CircularProgressIndicator());
          final customers = snap.data!.docs
              .map((d) => {...d.data() as Map<String, dynamic>, 'id': d.id})
              .toList();
          if (customers.isEmpty)
            return const Center(
                child: Text(
                    'No customers yet. They appear after completing orders.'));
          return ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: customers.length,
              itemBuilder: (ctx, i) {
                final c = customers[i];
                final tier = c['tier'] ?? 'Bronze';
                final tierColors = {
                  'Bronze': Colors.brown,
                  'Silver': Colors.grey,
                  'Gold': Colors.amber,
                  'Platinum': Colors.blueGrey
                };
                return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(children: [
                                CircleAvatar(
                                    backgroundColor: cs.primaryContainer,
                                    child: Text(
                                        (c['name'] ?? '?')[0].toUpperCase(),
                                        style: TextStyle(
                                            color: cs.onPrimaryContainer,
                                            fontWeight: FontWeight.bold))),
                                const SizedBox(width: 12),
                                Expanded(
                                    child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                      Text(c['name'] ?? '—',
                                          style: const TextStyle(
                                              fontWeight: FontWeight.w700,
                                              fontSize: 14)),
                                      Text(
                                          '${c['email'] ?? '—'} · ${c['phone'] ?? '—'}',
                                          style: TextStyle(
                                              fontSize: 11,
                                              color: cs.onSurfaceVariant)),
                                    ])),
                                Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                        color: (tierColors[tier] ?? Colors.grey)
                                            .withAlpha(30),
                                        borderRadius:
                                            BorderRadius.circular(10)),
                                    child: Text(tier,
                                        style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: tierColors[tier] ??
                                                Colors.grey))),
                              ]),
                              const SizedBox(height: 10),
                              Row(children: [
                                _stat(
                                    'Total Spent',
                                    '₹${(c['totalSpent'] ?? 0).toStringAsFixed(0)}',
                                    cs),
                                _stat('Visits', '${c['totalVisits'] ?? 0}', cs),
                                _stat(
                                    'Points', '${c['loyaltyPoints'] ?? 0}', cs),
                                _stat('Last Visit', c['lastVisit'] ?? '—', cs),
                              ]),
                            ])));
              });
        },
      ),
    );
  }

  Widget _stat(String label, String value, ColorScheme cs) {
    return Expanded(
        child: Column(children: [
      Text(value,
          style: TextStyle(
              fontWeight: FontWeight.w700, fontSize: 13, color: cs.primary)),
      Text(label, style: TextStyle(fontSize: 9, color: cs.onSurfaceVariant)),
    ]));
  }
}
