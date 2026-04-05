import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/supplier_service.dart';
import '../models/supplier.dart';
import '../widgets/app_drawer.dart';

class SuppliersScreen extends StatelessWidget {
  const SuppliersScreen({super.key});

  Future<void> _whatsapp(Supplier s) async {
    final url = Uri.parse('https://wa.me/91${s.phone.replaceAll(RegExp(r'\D'), '')}');
    if (await canLaunchUrl(url)) await launchUrl(url, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final service = SupplierService();
    return Scaffold(
      appBar: AppBar(title: const Text('Suppliers')),
      drawer: const AppDrawer(),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
      body: StreamBuilder<List<Supplier>>(
        stream: service.suppliersStream(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final suppliers = snapshot.data ?? [];
          if (suppliers.isEmpty) {
            return const Center(child: Text('No suppliers yet.'));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: suppliers.length,
            itemBuilder: (context, i) {
              final s = suppliers[i];
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: CircleAvatar(child: Text(s.name.isNotEmpty ? s.name[0] : '?')),
                  title: Text(s.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text('📞 ${s.phone.isNotEmpty ? s.phone : '—'}\n📧 ${s.email.isNotEmpty ? s.email : '—'}'),
                  isThreeLine: true,
                  trailing: s.phone.isNotEmpty
                      ? IconButton(icon: const Icon(Icons.chat, color: Color(0xFF25D366)), onPressed: () => _whatsapp(s))
                      : null,
                ),
              );
            },
          );
        },
      ),
    );
  }
}
