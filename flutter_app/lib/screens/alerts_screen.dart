import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../widgets/app_drawer.dart';

class AlertsScreen extends StatefulWidget {
  const AlertsScreen({super.key});
  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  final _db = FirebaseFirestore.instance;
  String _typeFilter = 'all';
  String _statusFilter = 'unresolved';
  final _icons = {'lowstock': '⚠️', 'expiry30': '🟡', 'expiry15': '🔴', 'deadstock': '💤', 'bestseller': '⭐'};
  final _labels = {'lowstock': 'Low Stock', 'expiry30': 'Expiry (30d)', 'expiry15': 'Expiry (15d)', 'deadstock': 'Dead Stock', 'bestseller': 'Best Seller'};
  final _colors = {'lowstock': Colors.orange, 'expiry30': Colors.amber, 'expiry15': Colors.red, 'deadstock': Colors.grey, 'bestseller': Colors.green};

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Alerts'), actions: [
        IconButton(icon: const Icon(Icons.check_circle), tooltip: 'Resolve All', onPressed: _resolveAll),
        IconButton(icon: const Icon(Icons.delete_sweep), tooltip: 'Delete Resolved', onPressed: _deleteResolved),
      ]),
      drawer: const AppDrawer(),
      body: Column(children: [
        // Filters
        Padding(padding: const EdgeInsets.all(12), child: Row(children: [
          Expanded(child: DropdownButtonFormField<String>(value: _typeFilter, isDense: true, decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
            items: [const DropdownMenuItem(value: 'all', child: Text('All Types', style: TextStyle(fontSize: 12))),
              ...['lowstock','expiry15','expiry30','deadstock','bestseller'].map((t) => DropdownMenuItem(value: t, child: Text(_labels[t] ?? t, style: const TextStyle(fontSize: 12))))],
            onChanged: (v) => setState(() => _typeFilter = v!),
          )),
          const SizedBox(width: 8),
          Expanded(child: DropdownButtonFormField<String>(value: _statusFilter, isDense: true, decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
            items: const [DropdownMenuItem(value: 'unresolved', child: Text('Unresolved', style: TextStyle(fontSize: 12))),
              DropdownMenuItem(value: 'resolved', child: Text('Resolved', style: TextStyle(fontSize: 12))),
              DropdownMenuItem(value: 'all', child: Text('All', style: TextStyle(fontSize: 12)))],
            onChanged: (v) => setState(() => _statusFilter = v!),
          )),
        ])),
        // Alert list
        Expanded(child: StreamBuilder<QuerySnapshot>(
          stream: _db.collection('alerts').orderBy('createdAt', descending: true).limit(100).snapshots(),
          builder: (ctx, snap) {
            if (!snap.hasData) return const Center(child: CircularProgressIndicator());
            var alerts = snap.data!.docs.map((d) => {...d.data() as Map<String, dynamic>, 'id': d.id}).toList();
            if (_typeFilter != 'all') alerts = alerts.where((a) => a['type'] == _typeFilter).toList();
            if (_statusFilter == 'unresolved') alerts = alerts.where((a) => a['resolved'] != true).toList();
            if (_statusFilter == 'resolved') alerts = alerts.where((a) => a['resolved'] == true).toList();
            if (alerts.isEmpty) return Center(child: Text(_statusFilter == 'unresolved' ? 'No active alerts ✅' : 'No alerts.', style: TextStyle(color: cs.onSurfaceVariant)));
            return ListView.builder(padding: const EdgeInsets.symmetric(horizontal: 12), itemCount: alerts.length, itemBuilder: (ctx, i) {
              final a = alerts[i];
              final type = a['type'] ?? '';
              final color = _colors[type] ?? cs.primary;
              final resolved = a['resolved'] == true;
              return Card(margin: const EdgeInsets.only(bottom: 8), child: ListTile(
                leading: CircleAvatar(backgroundColor: color.withAlpha(30), child: Text(_icons[type] ?? '🔔', style: const TextStyle(fontSize: 18))),
                title: Text(a['message'] ?? '', style: TextStyle(fontSize: 12, decoration: resolved ? TextDecoration.lineThrough : null, color: resolved ? cs.onSurfaceVariant : cs.onSurface)),
                subtitle: Text(_labels[type] ?? type, style: TextStyle(fontSize: 10, color: color)),
                trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                  if (!resolved) IconButton(icon: Icon(Icons.check, color: cs.primary, size: 20), onPressed: () => _resolve(a['id'])),
                  IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20), onPressed: () => _delete(a['id'])),
                ]),
              ));
            });
          },
        )),
      ]),
    );
  }

  Future<void> _resolve(String id) async { await _db.collection('alerts').doc(id).update({'resolved': true}); }
  Future<void> _delete(String id) async { await _db.collection('alerts').doc(id).delete(); }
  Future<void> _resolveAll() async {
    final snap = await _db.collection('alerts').where('resolved', isEqualTo: false).get();
    final batch = _db.batch();
    for (final d in snap.docs) batch.update(d.reference, {'resolved': true});
    await batch.commit();
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${snap.size} alerts resolved.')));
  }
  Future<void> _deleteResolved() async {
    final snap = await _db.collection('alerts').where('resolved', isEqualTo: true).get();
    final batch = _db.batch();
    for (final d in snap.docs) batch.delete(d.reference);
    await batch.commit();
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${snap.size} resolved alerts deleted.')));
  }
}
