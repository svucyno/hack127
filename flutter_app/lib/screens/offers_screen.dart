import 'package:flutter/material.dart';
import '../services/offer_service.dart';
import '../models/offer.dart';
import '../widgets/app_drawer.dart';

class OffersScreen extends StatelessWidget {
  const OffersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final service = OfferService();
    return Scaffold(
      appBar: AppBar(title: const Text('Offers')),
      drawer: const AppDrawer(),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
      body: StreamBuilder<List<Offer>>(
        stream: service.activeOffersStream(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final offers = snapshot.data ?? [];
          if (offers.isEmpty) {
            return const Center(child: Text('No offers yet. Create your first!'));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: offers.length,
            itemBuilder: (context, i) {
              final o = offers[i];
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  title: Text(o.label, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('Product: ${o.productId}${o.reason != null ? ' · ${o.reason}' : ''}'),
                  trailing: Switch(
                    value: o.active,
                    onChanged: (v) => service.toggleOffer(o.id, v),
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
