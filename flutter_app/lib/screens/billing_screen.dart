import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../widgets/app_drawer.dart';
import '../utils/gst_calculator.dart';

class BillingScreen extends StatefulWidget {
  const BillingScreen({super.key});
  @override
  State<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends State<BillingScreen> {
  final _db = FirebaseFirestore.instance;
  final _searchCtrl = TextEditingController();
  final _custCtrl = TextEditingController(text: 'Walk-in');
  final List<Map<String, dynamic>> _cart = [];
  bool _processing = false;

  void _addToCart(Map<String, dynamic> product) {
    final idx = _cart.indexWhere((c) => c['id'] == product['id']);
    if (idx >= 0) {
      if (_cart[idx]['qty'] >= (product['quantity'] ?? 999)) { _snack('Max stock reached.'); return; }
      setState(() => _cart[idx]['qty']++);
    } else {
      setState(() => _cart.add({
        'id': product['id'], 'name': product['name'], 'price': (product['sellingPrice'] as num).toDouble(),
        'cost': (product['costPrice'] as num).toDouble(), 'qty': 1, 'gst': product['gst'] ?? 0,
        'category': product['category'] ?? '', 'maxQty': product['quantity'] ?? 999,
      }));
    }
  }

  void _changeQty(int idx, int delta) {
    setState(() {
      _cart[idx]['qty'] += delta;
      if (_cart[idx]['qty'] <= 0) _cart.removeAt(idx);
      else if (_cart[idx]['qty'] > _cart[idx]['maxQty']) { _cart[idx]['qty'] = _cart[idx]['maxQty']; _snack('Max stock.'); }
    });
  }

  double get _subtotal => _cart.fold(0, (s, i) => s + (i['price'] as double) * (i['qty'] as int));
  double get _totalCgst => _cart.fold(0, (s, i) { final g = GstCalculator.calculate((i['price'] as double) * (i['qty'] as int), i['gst'] as int); return s + g.cgst; });
  double get _totalSgst => _cart.fold(0, (s, i) { final g = GstCalculator.calculate((i['price'] as double) * (i['qty'] as int), i['gst'] as int); return s + g.sgst; });
  double get _grandTotal => _subtotal + _totalCgst + _totalSgst;

  Future<void> _confirmBill() async {
    if (_cart.isEmpty) return;
    setState(() => _processing = true);
    try {
      // Get next bill number
      final counterRef = _db.collection('settings').doc('billCounter');
      final counterDoc = await counterRef.get();
      final nextNum = (counterDoc.exists ? (counterDoc.data()?['count'] ?? 0) : 0) + 1;
      await counterRef.set({'count': nextNum});
      final billId = 'BILL-${nextNum.toString().padLeft(5, '0')}';
      final now = DateTime.now();
      final dateStr = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
      final profit = _cart.fold<double>(0, (s, i) => s + ((i['price'] as double) - (i['cost'] as double)) * (i['qty'] as int));

      final batch = _db.batch();
      batch.set(_db.collection('sales').doc(billId), {
        'billId': billId, 'date': dateStr, 'dateObj': now, 'customerName': _custCtrl.text.trim(),
        'items': _cart.map((i) => {'id': i['id'], 'name': i['name'], 'price': i['price'], 'cost': i['cost'], 'qty': i['qty'], 'gst': i['gst'], 'category': i['category']}).toList(),
        'subtotal': double.parse(_subtotal.toStringAsFixed(2)), 'totalCGST': double.parse(_totalCgst.toStringAsFixed(2)),
        'totalSGST': double.parse(_totalSgst.toStringAsFixed(2)), 'grandTotal': double.parse(_grandTotal.toStringAsFixed(2)),
        'profit': double.parse(profit.toStringAsFixed(2)), 'createdAt': FieldValue.serverTimestamp(),
      });
      for (final item in _cart) {
        batch.update(_db.collection('products').doc(item['id']), {
          'quantity': FieldValue.increment(-(item['qty'] as int)), 'salesCount30': FieldValue.increment(item['qty'] as int),
        });
      }
      await batch.commit();
      setState(() { _cart.clear(); _custCtrl.text = 'Walk-in'; });
      _snack('Bill $billId saved! ✅');
    } catch (e) { _snack('Error: $e'); }
    finally { setState(() => _processing = false); }
  }

  void _snack(String msg) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final q = _searchCtrl.text.toLowerCase();
    return Scaffold(
      appBar: AppBar(title: const Text('Billing')),
      drawer: const AppDrawer(),
      body: Column(children: [
        // Search
        Padding(padding: const EdgeInsets.all(12), child: TextField(controller: _searchCtrl,
          decoration: const InputDecoration(hintText: 'Search products...', prefixIcon: Icon(Icons.search), border: OutlineInputBorder(), isDense: true),
          onChanged: (_) => setState(() {}),
        )),
        // Product list
        Expanded(child: StreamBuilder<QuerySnapshot>(
          stream: _db.collection('products').orderBy('name').snapshots(),
          builder: (ctx, snap) {
            if (!snap.hasData) return const Center(child: CircularProgressIndicator());
            var prods = snap.data!.docs.map((d) => {...d.data() as Map<String, dynamic>, 'id': d.id}).where((p) => (p['quantity'] ?? 0) > 0).toList();
            if (q.isNotEmpty) prods = prods.where((p) => (p['name'] ?? '').toString().toLowerCase().contains(q)).toList();
            return ListView.builder(itemCount: prods.length, itemBuilder: (ctx, i) {
              final p = prods[i];
              return ListTile(dense: true,
                title: Text(p['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                subtitle: Text('₹${p['sellingPrice']} · Stock: ${p['quantity']}', style: const TextStyle(fontSize: 11)),
                trailing: IconButton(icon: Icon(Icons.add_circle, color: cs.primary), onPressed: () => _addToCart(p)),
              );
            });
          },
        )),
        // Cart
        if (_cart.isNotEmpty) ...[
          const Divider(height: 1),
          Container(color: cs.surfaceContainerHighest, padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Column(children: [
              TextField(controller: _custCtrl, decoration: const InputDecoration(labelText: 'Customer', isDense: true, border: OutlineInputBorder()), style: const TextStyle(fontSize: 13)),
              const SizedBox(height: 8),
              ...List.generate(_cart.length, (i) {
                final item = _cart[i];
                return Row(children: [
                  Expanded(child: Text('${item['name']} × ${item['qty']}', style: const TextStyle(fontSize: 12))),
                  Text('₹${((item['price'] as double) * (item['qty'] as int)).toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  IconButton(icon: const Icon(Icons.remove_circle_outline, size: 18), onPressed: () => _changeQty(i, -1)),
                  IconButton(icon: const Icon(Icons.add_circle_outline, size: 18), onPressed: () => _changeQty(i, 1)),
                ]);
              }),
              const Divider(),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('CGST', style: TextStyle(fontSize: 11)), Text('₹${_totalCgst.toStringAsFixed(2)}', style: const TextStyle(fontSize: 11))]),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('SGST', style: TextStyle(fontSize: 11)), Text('₹${_totalSgst.toStringAsFixed(2)}', style: const TextStyle(fontSize: 11))]),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('TOTAL', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: cs.primary)),
                Text('₹${_grandTotal.toStringAsFixed(2)}', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: cs.primary)),
              ]),
              const SizedBox(height: 8),
              SizedBox(width: double.infinity, height: 44, child: FilledButton(
                onPressed: _processing ? null : _confirmBill,
                child: _processing ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : Text('✅ Confirm Bill (${_cart.length} items)'),
              )),
            ]),
          ),
        ],
      ]),
    );
  }
}
