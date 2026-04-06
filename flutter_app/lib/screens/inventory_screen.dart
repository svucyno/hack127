import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../widgets/app_drawer.dart';
import '../utils/expiry_thresholds.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});
  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final _db = FirebaseFirestore.instance;
  String _search = '';
  String _catFilter = '';
  String _statusFilter = '';
  final _categories = ['Groceries','Dairy','Beverages','Personal Care','Stationery','Electronics','Snacks','Medicines','Cleaning','Other'];
  final _catIcons = {'Groceries':'🌾','Dairy':'🥛','Beverages':'🥤','Personal Care':'🧴','Stationery':'✏️','Electronics':'🔌','Snacks':'🍿','Medicines':'💊','Cleaning':'🧹','Other':'📦'};

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Inventory'), actions: [
        IconButton(icon: const Icon(Icons.qr_code_scanner), onPressed: () => _showSnack('Barcode scanner coming soon')),
      ]),
      drawer: const AppDrawer(),
      floatingActionButton: FloatingActionButton(onPressed: () => _showAddDialog(context), child: const Icon(Icons.add)),
      body: Column(children: [
        // Category chips
        SizedBox(height: 56, child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), children: [
          _catChip('All', '🏷️', '', cs),
          ..._categories.map((c) => _catChip(c, _catIcons[c] ?? '📦', c, cs)),
        ])),
        // Search
        Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: TextField(
          decoration: const InputDecoration(hintText: 'Search products...', prefixIcon: Icon(Icons.search), border: OutlineInputBorder(), isDense: true),
          onChanged: (v) => setState(() => _search = v.toLowerCase()),
        )),
        const SizedBox(height: 8),
        // Status filter
        Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: Row(children: [
          _filterChip('All', '', cs), const SizedBox(width: 6),
          _filterChip('Low Stock', 'low', cs), const SizedBox(width: 6),
          _filterChip('Expiring', 'expiring', cs),
        ])),
        const SizedBox(height: 8),
        // Product list
        Expanded(child: StreamBuilder<QuerySnapshot>(
          stream: _db.collection('products').orderBy('name').snapshots(),
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());
            if (!snap.hasData || snap.data!.docs.isEmpty) return const Center(child: Text('No products yet.'));
            var products = snap.data!.docs.map((d) => {...d.data() as Map<String, dynamic>, 'id': d.id}).toList();
            if (_search.isNotEmpty) products = products.where((p) => (p['name'] ?? '').toString().toLowerCase().contains(_search) || (p['company'] ?? '').toString().toLowerCase().contains(_search)).toList();
            if (_catFilter.isNotEmpty) products = products.where((p) => p['category'] == _catFilter).toList();
            if (_statusFilter == 'low') products = products.where((p) { final q = (p['quantity'] ?? 0) as num; final m = (p['maxStock'] ?? 1) as num; return m > 0 && q / m <= 0.1; }).toList();
            if (_statusFilter == 'expiring') products = products.where((p) { final e = p['expiryDate']; if (e == null) return false; final d = DateTime.tryParse(e); return d != null && ExpiryThresholds.getLevel(p['category'] ?? 'Other', d) != AlertLevel.none; }).toList();
            return ListView.builder(itemCount: products.length, itemBuilder: (ctx, i) => _productTile(products[i], cs));
          },
        )),
      ]),
    );
  }

  Widget _catChip(String label, String icon, String value, ColorScheme cs) {
    final active = _catFilter == value;
    return Padding(padding: const EdgeInsets.only(right: 6), child: ActionChip(
      avatar: Text(icon, style: const TextStyle(fontSize: 16)),
      label: Text(label, style: TextStyle(fontSize: 11, fontWeight: active ? FontWeight.bold : FontWeight.normal)),
      backgroundColor: active ? cs.primaryContainer : null,
      side: active ? BorderSide(color: cs.primary) : null,
      onPressed: () => setState(() => _catFilter = value),
    ));
  }

  Widget _filterChip(String label, String value, ColorScheme cs) {
    final active = _statusFilter == value;
    return ChoiceChip(label: Text(label, style: const TextStyle(fontSize: 11)), selected: active,
      onSelected: (_) => setState(() => _statusFilter = value));
  }

  Widget _productTile(Map<String, dynamic> p, ColorScheme cs) {
    final qty = (p['quantity'] ?? 0) as num;
    final max = (p['maxStock'] ?? 1) as num;
    final pct = max > 0 ? (qty / max * 100) : 100;
    final expiry = p['expiryDate'] != null ? DateTime.tryParse(p['expiryDate']) : null;
    final expiryLevel = ExpiryThresholds.getLevel(p['category'] ?? 'Other', expiry);
    final stockColor = pct <= 10 ? Colors.red : pct <= 30 ? Colors.orange : cs.primary;

    return Card(margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), child: ListTile(
      title: Text(p['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
      subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('${p['company'] ?? ''} · ${p['category'] ?? ''} · ${p['size'] ?? ''}', style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
        const SizedBox(height: 4),
        Row(children: [
          Text('₹${p['costPrice'] ?? 0}', style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
          const Text(' → ', style: TextStyle(fontSize: 11)),
          Text('₹${p['sellingPrice'] ?? 0}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: cs.primary)),
          const Spacer(),
          if (expiryLevel == AlertLevel.urgent) Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(8)), child: Text('Expiring!', style: TextStyle(fontSize: 9, color: Colors.red.shade700, fontWeight: FontWeight.bold))),
          if (expiryLevel == AlertLevel.warning) Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: Colors.orange.shade50, borderRadius: BorderRadius.circular(8)), child: Text('Expiry soon', style: TextStyle(fontSize: 9, color: Colors.orange.shade700))),
        ]),
      ]),
      trailing: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Text('${qty.toInt()}/${max.toInt()}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: stockColor)),
        Text('${pct.toStringAsFixed(0)}%', style: TextStyle(fontSize: 10, color: stockColor)),
      ]),
      onTap: () => _showEditDialog(context, p),
      onLongPress: () => _confirmDelete(p['id'], p['name']),
    ));
  }

  void _showSnack(String msg) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));

  Future<void> _showAddDialog(BuildContext ctx) async {
    final nameCtrl = TextEditingController();
    final companyCtrl = TextEditingController();
    final costCtrl = TextEditingController();
    final sellCtrl = TextEditingController();
    final qtyCtrl = TextEditingController();
    final maxCtrl = TextEditingController(text: '100');
    String cat = 'Groceries';
    int gst = 0;

    await showDialog(context: ctx, builder: (ctx) => AlertDialog(
      title: const Text('Add Product'), scrollable: true,
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Product Name *')),
        TextField(controller: companyCtrl, decoration: const InputDecoration(labelText: 'Company')),
        DropdownButtonFormField<String>(value: cat, items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(), onChanged: (v) => cat = v!, decoration: const InputDecoration(labelText: 'Category')),
        TextField(controller: costCtrl, decoration: const InputDecoration(labelText: 'Cost Price ₹'), keyboardType: TextInputType.number),
        TextField(controller: sellCtrl, decoration: const InputDecoration(labelText: 'Selling Price ₹'), keyboardType: TextInputType.number),
        TextField(controller: qtyCtrl, decoration: const InputDecoration(labelText: 'Quantity'), keyboardType: TextInputType.number),
        TextField(controller: maxCtrl, decoration: const InputDecoration(labelText: 'Max Stock'), keyboardType: TextInputType.number),
        DropdownButtonFormField<int>(value: gst, items: [0,5,12,18,28].map((g) => DropdownMenuItem(value: g, child: Text('$g%'))).toList(), onChanged: (v) => gst = v!, decoration: const InputDecoration(labelText: 'GST Slab')),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
        FilledButton(onPressed: () async {
          if (nameCtrl.text.trim().isEmpty) return;
          await _db.collection('products').add({
            'name': nameCtrl.text.trim(), 'company': companyCtrl.text.trim(), 'brand': companyCtrl.text.trim(),
            'category': cat, 'costPrice': double.tryParse(costCtrl.text) ?? 0, 'sellingPrice': double.tryParse(sellCtrl.text) ?? 0,
            'quantity': int.tryParse(qtyCtrl.text) ?? 0, 'maxStock': int.tryParse(maxCtrl.text) ?? 100,
            'gst': gst, 'salesCount30': 0, 'createdAt': FieldValue.serverTimestamp(), 'updatedAt': FieldValue.serverTimestamp(),
          });
          if (ctx.mounted) Navigator.pop(ctx);
          _showSnack('Product added!');
        }, child: const Text('Save')),
      ],
    ));
  }

  Future<void> _showEditDialog(BuildContext ctx, Map<String, dynamic> p) async {
    final nameCtrl = TextEditingController(text: p['name']);
    final qtyCtrl = TextEditingController(text: '${p['quantity'] ?? 0}');
    final sellCtrl = TextEditingController(text: '${p['sellingPrice'] ?? 0}');
    await showDialog(context: ctx, builder: (ctx) => AlertDialog(
      title: const Text('Edit Product'), scrollable: true,
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
        TextField(controller: qtyCtrl, decoration: const InputDecoration(labelText: 'Quantity'), keyboardType: TextInputType.number),
        TextField(controller: sellCtrl, decoration: const InputDecoration(labelText: 'Selling Price'), keyboardType: TextInputType.number),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
        FilledButton(onPressed: () async {
          await _db.collection('products').doc(p['id']).update({
            'name': nameCtrl.text.trim(), 'quantity': int.tryParse(qtyCtrl.text) ?? 0,
            'sellingPrice': double.tryParse(sellCtrl.text) ?? 0, 'updatedAt': FieldValue.serverTimestamp(),
          });
          if (ctx.mounted) Navigator.pop(ctx);
          _showSnack('Product updated!');
        }, child: const Text('Save')),
      ],
    ));
  }

  Future<void> _confirmDelete(String id, String? name) async {
    final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Delete Product?'), content: Text('Delete "$name"? This cannot be undone.'),
      actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
        FilledButton(onPressed: () => Navigator.pop(ctx, true), style: FilledButton.styleFrom(backgroundColor: Colors.red), child: const Text('Delete'))],
    ));
    if (ok == true) { await _db.collection('products').doc(id).delete(); _showSnack('Deleted.'); }
  }
}
