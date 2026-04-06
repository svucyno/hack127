import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../widgets/app_drawer.dart';

class OrderMgmtScreen extends StatefulWidget {
  const OrderMgmtScreen({super.key});
  @override
  State<OrderMgmtScreen> createState() => _OrderMgmtScreenState();
}

class _OrderMgmtScreenState extends State<OrderMgmtScreen> {
  final _db = FirebaseFirestore.instance;
  String _filter = 'active';

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Orders')),
      drawer: const AppDrawer(),
      body: Column(children: [
        // Filter chips
        SizedBox(
            height: 50,
            child: ListView(
                scrollDirection: Axis.horizontal,
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                children: [
                  _chip('Active', 'active', cs),
                  const SizedBox(width: 6),
                  _chip('🆕 New', 'New', cs),
                  const SizedBox(width: 6),
                  _chip('📦 Packing', 'Packing', cs),
                  const SizedBox(width: 6),
                  _chip('✅ Ready', 'Ready', cs),
                  const SizedBox(width: 6),
                  _chip('🎉 Done', 'Completed', cs),
                  const SizedBox(width: 6),
                  _chip('All', 'all', cs),
                ])),
        // Orders list
        Expanded(
            child: StreamBuilder<QuerySnapshot>(
          stream: _db.collection('sales').snapshots(),
          builder: (ctx, snap) {
            if (!snap.hasData)
              return const Center(child: CircularProgressIndicator());
            var orders = snap.data!.docs
                .map((d) => {...d.data() as Map<String, dynamic>, 'id': d.id})
                .where((o) => o['userId'] != null)
                .toList();
            // Normalize old status
            for (final o in orders) {
              if (o['status'] == 'Not Started') o['status'] = 'New';
            }
            orders.sort((a, b) {
              final at =
                  (a['createdAt'] as Timestamp?)?.millisecondsSinceEpoch ?? 0;
              final bt =
                  (b['createdAt'] as Timestamp?)?.millisecondsSinceEpoch ?? 0;
              return bt.compareTo(at);
            });
            if (_filter == 'active')
              orders = orders.where((o) => o['status'] != 'Completed').toList();
            else if (_filter != 'all')
              orders = orders.where((o) => o['status'] == _filter).toList();
            if (orders.isEmpty) return const Center(child: Text('No orders.'));
            return ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: orders.length,
                itemBuilder: (ctx, i) => _orderCard(orders[i], cs));
          },
        )),
      ]),
    );
  }

  Widget _chip(String label, String value, ColorScheme cs) {
    final active = _filter == value;
    return ChoiceChip(
        label: Text(label, style: const TextStyle(fontSize: 11)),
        selected: active,
        onSelected: (_) => setState(() => _filter = value));
  }

  Widget _orderCard(Map<String, dynamic> o, ColorScheme cs) {
    final st = o['status'] ?? 'New';
    final statusColors = {
      'New': Colors.red,
      'Packing': Colors.orange,
      'Ready': Colors.green,
      'Completed': Colors.blue
    };
    final statusIcons = {
      'New': '🆕',
      'Packing': '📦',
      'Ready': '✅',
      'Completed': '🎉'
    };
    final items = (o['items'] as List? ?? []);
    final dateTs = o['createdAt'] as Timestamp?;
    final dateStr = dateTs != null
        ? '${dateTs.toDate().day}/${dateTs.toDate().month} ${dateTs.toDate().hour}:${dateTs.toDate().minute.toString().padLeft(2, '0')}'
        : '—';

    // Progress bar
    final steps = ['New', 'Packing', 'Ready', 'Completed'];
    final stepIdx = steps.indexOf(st).clamp(0, 3);

    Widget actionBtn;
    if (st == 'New') {
      actionBtn = FilledButton.icon(
          onPressed: () => _updateStatus(o['id'], 'Packing'),
          icon: const Icon(Icons.check, size: 16),
          label: const Text('Accept', style: TextStyle(fontSize: 12)));
    } else if (st == 'Packing') {
      actionBtn = FilledButton.icon(
          onPressed: () => _updateStatus(o['id'], 'Ready'),
          icon: const Icon(Icons.local_shipping, size: 16),
          label: const Text('Packing Done', style: TextStyle(fontSize: 12)));
    } else if (st == 'Ready') {
      actionBtn = Text('Waiting for pickup…',
          style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant));
    } else {
      actionBtn = Text('${statusIcons[st]} Completed',
          style: TextStyle(
              fontSize: 11, color: cs.primary, fontWeight: FontWeight.bold));
    }

    return Card(
        margin: const EdgeInsets.only(bottom: 10),
        child: Padding(
            padding: const EdgeInsets.all(14),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                      Text(o['orderId'] ?? o['id'] ?? '',
                          style: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 13)),
                      Text(dateStr,
                          style: TextStyle(
                              fontSize: 11, color: cs.onSurfaceVariant)),
                      Text('👤 ${o['customerName'] ?? 'Customer'}',
                          style: TextStyle(
                              fontSize: 11, color: cs.onSurfaceVariant)),
                    ])),
                Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                        color: (statusColors[st] ?? Colors.grey).withAlpha(30),
                        borderRadius: BorderRadius.circular(10)),
                    child: Text('${statusIcons[st] ?? ''} $st',
                        style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: statusColors[st] ?? Colors.grey))),
              ]),
              // Progress
              Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                      children: List.generate(
                          4,
                          (i) => Expanded(
                              child: Container(
                                  height: 4,
                                  margin:
                                      const EdgeInsets.symmetric(horizontal: 2),
                                  decoration: BoxDecoration(
                                      color: i <= stepIdx
                                          ? cs.primary
                                          : cs.surfaceContainerHighest,
                                      borderRadius:
                                          BorderRadius.circular(2))))))),
              // Items
              Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                      color: cs.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(8)),
                  child: Column(children: [
                    ...items.map((item) => Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('${item['name']} × ${item['qty']}',
                                  style: const TextStyle(fontSize: 12)),
                              Text(
                                  '₹${((item['price'] as num? ?? 0) * (item['qty'] as num? ?? 0)).toStringAsFixed(0)}',
                                  style: const TextStyle(fontSize: 12)),
                            ])),
                    const Divider(height: 12),
                    Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 13)),
                          Text('₹${(o['grandTotal'] ?? 0).toStringAsFixed(0)}',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  color: cs.primary)),
                        ]),
                  ])),
              const SizedBox(height: 10),
              Align(alignment: Alignment.centerRight, child: actionBtn),
            ])));
  }

  Future<void> _updateStatus(String id, String status) async {
    final data = <String, dynamic>{'status': status};
    if (status == 'Ready') {
      data['billGenerated'] = true;
      data['readyAt'] = FieldValue.serverTimestamp();
    }
    await _db.collection('sales').doc(id).update(data);
    if (mounted)
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Order updated to $status')));
  }
}
