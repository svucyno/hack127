import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/billing_provider.dart';
import '../providers/inventory_provider.dart';
import '../models/bill_item.dart';
import '../widgets/app_drawer.dart';

class BillingScreen extends StatefulWidget {
  const BillingScreen({super.key});
  @override
  State<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends State<BillingScreen> {
  final _custCtrl = TextEditingController(text: 'Walk-in');
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<InventoryProvider>().loadProducts());
  }

  void _addToCart(product) {
    context.read<BillingProvider>().addToCart(BillItem(
      productId: product.id, name: product.name,
      price: product.sellingPrice, originalPrice: product.sellingPrice,
      cost: product.costPrice, qty: 1,
      gstSlab: product.gstSlab, category: product.category,
    ));
  }

  Future<void> _confirm() async {
    final billing = context.read<BillingProvider>();
    final billId = await billing.confirmBill(_custCtrl.text.trim());
    if (billId != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Bill $billId saved!'), backgroundColor: Colors.green),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final inv = context.watch<InventoryProvider>();
    final billing = context.watch<BillingProvider>();
    final q = _searchCtrl.text.toLowerCase();
    final products = inv.allProducts.where((p) =>
        p.stock > 0 && (q.isEmpty || p.name.toLowerCase().contains(q))).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Billing')),
      drawer: const AppDrawer(),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            controller: _searchCtrl,
            decoration: const InputDecoration(
              hintText: 'Search products...', prefixIcon: Icon(Icons.search),
              border: OutlineInputBorder(),
            ),
            onChanged: (_) => setState(() {}),
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: products.length,
            itemBuilder: (context, i) {
              final p = products[i];
              return ListTile(
                title: Text(p.name),
                subtitle: Text('₹${p.sellingPrice} · Stock: ${p.stock}'),
                trailing: IconButton(
                  icon: const Icon(Icons.add_shopping_cart),
                  onPressed: () => _addToCart(p),
                ),
              );
            },
          ),
        ),
        if (billing.cart.isNotEmpty) ...[
          const Divider(),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: TextField(
              controller: _custCtrl,
              decoration: const InputDecoration(labelText: 'Customer Name'),
            ),
          ),
          ...billing.cart.map((item) => ListTile(
            dense: true,
            title: Text('${item.name} × ${item.qty}'),
            trailing: Text('₹${(item.price * item.qty).toStringAsFixed(2)}'),
          )),
          Padding(
            padding: const EdgeInsets.all(12),
            child: SizedBox(
              width: double.infinity, height: 48,
              child: FilledButton(
                onPressed: billing.processing ? null : _confirm,
                child: billing.processing
                    ? const CircularProgressIndicator(strokeWidth: 2, color: Colors.white)
                    : Text('Confirm Bill (${billing.itemCount} items)'),
              ),
            ),
          ),
        ],
      ]),
    );
  }
}
