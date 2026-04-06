import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:url_launcher/url_launcher.dart';
import '../widgets/app_drawer.dart';

class SuppliersScreen extends StatelessWidget {
  const SuppliersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final db = FirebaseFirestore.instance;
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Suppliers')),
      drawer: const AppDrawer(),
      floatingActionButton: FloatingActionButton(onPressed: () => _showAddDialog(context, db), child: const Icon(Icons.add)),
      body: StreamBuilder<QuerySnapshot>(
        stream: db.collection('suppliers').orderBy('name').snapshots(),
        builder: (ctx, snap) {
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final suppliers = snap.data!.docs.map((d) => {...d.data() as Map<String, dynamic>, 'id': d.id}).toList();
          if (suppliers.isEmpty) return const Center(child: Text('No suppliers yet.'));
          return ListView.builder(padding: const EdgeInsets.all(12), itemCount: suppliers.length, itemBuilder: (ctx, i) {
            final s = suppliers[i];
            return Card(margin: const EdgeInsets.only(bottom: 10), child: Padding(padding: const EdgeInsets.all(14), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                CircleAvatar(backgroundColor: cs.primaryContainer, child: Text((s['name'] ?? '?')[0].toUpperCase(), style: TextStyle(color: cs.onPrimaryContainer, fontWeight: FontWeight.bold))),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(s['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                  Text('📞 ${s['phone'] ?? '—'}  ·  📧 ${s['email'] ?? '—'}', style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                ])),
              ]),
              if ((s['notes'] ?? '').toString().isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8),
                child: Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: cs.surfaceContainerHighest, borderRadius: BorderRadius.circular(8)),
                  child: Text(s['notes'], style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)))),
              const SizedBox(height: 10),
              Row(children: [
                if ((s['phone'] ?? '').toString().isNotEmpty) ...[
                  FilledButton.icon(onPressed: () => _whatsapp(s['phone'], s['name']),
                    icon: const Icon(Icons.chat, size: 16), label: const Text('WhatsApp', style: TextStyle(fontSize: 12)),
                    style: FilledButton.styleFrom(backgroundColor: const Color(0xFF25D366), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6))),
                  const SizedBox(width: 8),
                ],
                OutlinedButton.icon(onPressed: () => _showEditDialog(context, db, s),
                  icon: const Icon(Icons.edit, size: 16), label: const Text('Edit', style: TextStyle(fontSize: 12)),
                  style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6))),
                const Spacer(),
                IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                  onPressed: () async {
                    final ok = await showDialog<bool>(context: context, builder: (c) => AlertDialog(
                      title: const Text('Delete?'), content: Text('Delete ${s['name']}?'),
                      actions: [TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
                        FilledButton(onPressed: () => Navigator.pop(c, true), style: FilledButton.styleFrom(backgroundColor: Colors.red), child: const Text('Delete'))],
                    ));
                    if (ok == true) await db.collection('suppliers').doc(s['id']).delete();
                  }),
              ]),
            ])));
          });
        },
      ),
    );
  }

  Future<void> _whatsapp(String phone, String name) async {
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    final url = Uri.parse('https://wa.me/91$clean?text=${Uri.encodeComponent('Hi $name, this is a reorder request from ShopSmart.')}');
    if (await canLaunchUrl(url)) await launchUrl(url, mode: LaunchMode.externalApplication);
  }

  Future<void> _showAddDialog(BuildContext ctx, FirebaseFirestore db) async {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    await showDialog(context: ctx, builder: (ctx) => AlertDialog(
      title: const Text('Add Supplier'), scrollable: true,
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name *')),
        TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Phone / WhatsApp'), keyboardType: TextInputType.phone),
        TextField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Email'), keyboardType: TextInputType.emailAddress),
        TextField(controller: notesCtrl, decoration: const InputDecoration(labelText: 'Notes'), maxLines: 2),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
        FilledButton(onPressed: () async {
          if (nameCtrl.text.trim().isEmpty) return;
          await db.collection('suppliers').add({'name': nameCtrl.text.trim(), 'phone': phoneCtrl.text.trim(), 'email': emailCtrl.text.trim(), 'notes': notesCtrl.text.trim(), 'createdAt': FieldValue.serverTimestamp()});
          if (ctx.mounted) Navigator.pop(ctx);
        }, child: const Text('Save')),
      ],
    ));
  }

  Future<void> _showEditDialog(BuildContext ctx, FirebaseFirestore db, Map<String, dynamic> s) async {
    final nameCtrl = TextEditingController(text: s['name']);
    final phoneCtrl = TextEditingController(text: s['phone']);
    final emailCtrl = TextEditingController(text: s['email']);
    final notesCtrl = TextEditingController(text: s['notes']);
    await showDialog(context: ctx, builder: (ctx) => AlertDialog(
      title: const Text('Edit Supplier'), scrollable: true,
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
        TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Phone')),
        TextField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Email')),
        TextField(controller: notesCtrl, decoration: const InputDecoration(labelText: 'Notes'), maxLines: 2),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
        FilledButton(onPressed: () async {
          await db.collection('suppliers').doc(s['id']).update({'name': nameCtrl.text.trim(), 'phone': phoneCtrl.text.trim(), 'email': emailCtrl.text.trim(), 'notes': notesCtrl.text.trim(), 'updatedAt': FieldValue.serverTimestamp()});
          if (ctx.mounted) Navigator.pop(ctx);
        }, child: const Text('Save')),
      ],
    ));
  }
}
