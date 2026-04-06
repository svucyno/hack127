import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../widgets/app_drawer.dart';

class OffersScreen extends StatelessWidget {
  const OffersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final db = FirebaseFirestore.instance;
    final cs = Theme.of(context).colorScheme;
    final todayStr = DateTime.now().toIso8601String().split('T')[0];
    return Scaffold(
      appBar: AppBar(title: const Text('Offers')),
      drawer: const AppDrawer(),
      floatingActionButton: FloatingActionButton(onPressed: () => _showCreateDialog(context, db), child: const Icon(Icons.add)),
      body: StreamBuilder<QuerySnapshot>(
        stream: db.collection('offers').snapshots(),
        builder: (ctx, snap) {
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final offers = snap.data!.docs.map((d) => {...d.data() as Map<String, dynamic>, 'id': d.id}).toList();
          final active = offers.where((o) => o['active'] == true && (o['validUntil'] == null || (o['validUntil'] as String).compareTo(todayStr) >= 0)).toList();
          final inactive = offers.where((o) => o['active'] != true || (o['validUntil'] != null && (o['validUntil'] as String).compareTo(todayStr) < 0)).toList();
          if (offers.isEmpty) return const Center(child: Text('No offers yet. Create your first!'));
          return ListView(padding: const EdgeInsets.all(12), children: [
            if (active.isNotEmpty) ...[
              Text('Active (${active.length})', style: TextStyle(fontWeight: FontWeight.w700, color: cs.primary)),
              const SizedBox(height: 8),
              ...active.map((o) => _offerCard(o, db, cs, context)),
            ],
            if (inactive.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text('Inactive / Expired (${inactive.length})', style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.grey)),
              const SizedBox(height: 8),
              ...inactive.map((o) => _offerCard(o, db, cs, context)),
            ],
          ]);
        },
      ),
    );
  }

  Widget _offerCard(Map<String, dynamic> o, FirebaseFirestore db, ColorScheme cs, BuildContext ctx) {
    final type = o['type'] ?? 'percent';
    final value = (o['value'] ?? 0).toDouble();
    final badge = type == 'percent' ? '${value.toInt()}% OFF' : type == 'flat' ? '₹${value.toInt()} OFF' : 'Buy ${o['buyQty']} Get ${o['getQty']}';
    final active = o['active'] == true;
    final maxQty = o['maxQty'] as int?;
    final soldQty = (o['soldQty'] ?? 0) as int;
    return Card(margin: const EdgeInsets.only(bottom: 8), child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: cs.error, borderRadius: BorderRadius.circular(12)),
          child: Text(badge, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold))),
        const Spacer(),
        Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: active ? Colors.green.shade50 : Colors.grey.shade200, borderRadius: BorderRadius.circular(8)),
          child: Text(active ? 'Active' : 'Inactive', style: TextStyle(fontSize: 10, color: active ? Colors.green : Colors.grey, fontWeight: FontWeight.bold))),
      ]),
      const SizedBox(height: 6),
      Text('Product: ${o['productId'] ?? '—'}', style: const TextStyle(fontSize: 12)),
      if (o['reason'] != null) Text(o['reason'], style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
      if (o['validUntil'] != null) Text('Valid until: ${o['validUntil']}', style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
      if (maxQty != null) ...[
        const SizedBox(height: 6),
        Text('$soldQty / $maxQty sold', style: const TextStyle(fontSize: 10)),
        LinearProgressIndicator(value: maxQty > 0 ? soldQty / maxQty : 0, backgroundColor: cs.surfaceContainerHighest),
      ],
      const SizedBox(height: 8),
      Row(children: [
        TextButton(onPressed: () => db.collection('offers').doc(o['id']).update({'active': !active}), child: Text(active ? 'Deactivate' : 'Activate')),
        const Spacer(),
        IconButton(icon: const Icon(Icons.delete, color: Colors.red, size: 20), onPressed: () => db.collection('offers').doc(o['id']).delete()),
      ]),
    ])));
  }

  Future<void> _showCreateDialog(BuildContext ctx, FirebaseFirestore db) async {
    final prodCtrl = TextEditingController();
    final valueCtrl = TextEditingController();
    String type = 'percent';
    await showDialog(context: ctx, builder: (ctx) => AlertDialog(
      title: const Text('Create Offer'), scrollable: true,
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: prodCtrl, decoration: const InputDecoration(labelText: 'Product ID *')),
        DropdownButtonFormField<String>(value: type, items: const [
          DropdownMenuItem(value: 'percent', child: Text('Percentage Off')),
          DropdownMenuItem(value: 'flat', child: Text('Flat Discount')),
        ], onChanged: (v) => type = v!, decoration: const InputDecoration(labelText: 'Type')),
        TextField(controller: valueCtrl, decoration: const InputDecoration(labelText: 'Value'), keyboardType: TextInputType.number),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
        FilledButton(onPressed: () async {
          await db.collection('offers').add({
            'productId': prodCtrl.text.trim(), 'type': type, 'value': double.tryParse(valueCtrl.text) ?? 0,
            'active': true, 'soldQty': 0, 'createdAt': FieldValue.serverTimestamp(),
          });
          if (ctx.mounted) Navigator.pop(ctx);
        }, child: const Text('Create')),
      ],
    ));
  }
}
