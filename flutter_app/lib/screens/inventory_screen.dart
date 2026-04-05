import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/inventory_provider.dart';
import '../widgets/app_drawer.dart';
import '../utils/expiry_thresholds.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});
  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<InventoryProvider>().loadProducts());
  }

  @override
  Widget build(BuildContext context) {
    final inv = context.watch<InventoryProvider>();
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory'),
        actions: [
          IconButton(icon: const Icon(Icons.qr_code_scanner), onPressed: () {}),
        ],
      ),
      drawer: const AppDrawer(),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            decoration: const InputDecoration(
              hintText: 'Search products...', prefixIcon: Icon(Icons.search),
              border: OutlineInputBorder(),
            ),
            onChanged: (q) => inv.setSearch(q),
          ),
        ),
        if (inv.loading)
          const Expanded(child: Center(child: CircularProgressIndicator()))
        else if (inv.products.isEmpty)
          const Expanded(child: Center(child: Text('No products found.')))
        else
          Expanded(
            child: ListView.builder(
              itemCount: inv.products.length,
              itemBuilder: (context, i) {
                final p = inv.products[i];
                final stockPct = p.maxStock > 0 ? (p.stock / p.maxStock * 100) : 100;
                final expiryLevel = ExpiryThresholds.getLevel(p.category, p.expiryDate);
                return ListTile(
                  title: Text(p.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text('${p.company} · ${p.category} · ₹${p.sellingPrice}'),
                  trailing: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text('${p.stock}/${p.maxStock}', style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: stockPct <= 10 ? cs.error : stockPct <= 30 ? Colors.orange : cs.primary,
                    )),
                    if (expiryLevel == AlertLevel.urgent)
                      Text('Expiring!', style: TextStyle(fontSize: 10, color: cs.error)),
                  ]),
                );
              },
            ),
          ),
      ]),
    );
  }
}
