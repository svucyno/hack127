import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import '../widgets/app_drawer.dart';

class UsersScreen extends StatelessWidget {
  const UsersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final db = FirebaseFirestore.instance;
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Manage Users')),
      drawer: const AppDrawer(),
      body: Column(children: [
        Padding(
            padding: const EdgeInsets.all(12),
            child: Row(children: [
              Expanded(
                  child: FilledButton.icon(
                      onPressed: () => _showCreateDialog(context, db, 'Worker'),
                      icon: const Icon(Icons.inventory_2, size: 16),
                      label: const Text('Add Worker'))),
              const SizedBox(width: 10),
              Expanded(
                  child: FilledButton.icon(
                      onPressed: () =>
                          _showCreateDialog(context, db, 'Cashier'),
                      icon: const Icon(Icons.point_of_sale, size: 16),
                      label: const Text('Add Cashier'),
                      style: FilledButton.styleFrom(
                          backgroundColor: cs.tertiary))),
            ])),
        Expanded(
            child: StreamBuilder<QuerySnapshot>(
          stream: db.collection('users').snapshots(),
          builder: (ctx, snap) {
            if (!snap.hasData)
              return const Center(child: CircularProgressIndicator());
            final users = snap.data!.docs
                .map((d) => {...d.data() as Map<String, dynamic>, 'id': d.id})
                .toList();
            final workers = users.where((u) => u['role'] == 'Worker').toList();
            final cashiers =
                users.where((u) => u['role'] == 'Cashier').toList();
            return ListView(padding: const EdgeInsets.all(12), children: [
              _section('📦 Workers (${workers.length})', workers, db, cs),
              const SizedBox(height: 16),
              _section('💳 Cashiers (${cashiers.length})', cashiers, db, cs),
            ]);
          },
        )),
      ]),
    );
  }

  Widget _section(String title, List<Map<String, dynamic>> users,
      FirebaseFirestore db, ColorScheme cs) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title,
          style: TextStyle(
              fontWeight: FontWeight.w700, fontSize: 14, color: cs.primary)),
      const SizedBox(height: 8),
      if (users.isEmpty)
        const Text('None', style: TextStyle(color: Colors.grey, fontSize: 13)),
      ...users.map((u) => Card(
          margin: const EdgeInsets.only(bottom: 6),
          child: ListTile(
            leading: CircleAvatar(
                backgroundColor: cs.primaryContainer,
                child: Text((u['name'] ?? '?')[0].toUpperCase(),
                    style: TextStyle(
                        color: cs.onPrimaryContainer,
                        fontWeight: FontWeight.bold))),
            title: Text(u['name'] ?? '—',
                style:
                    const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            subtitle:
                Text(u['email'] ?? '—', style: const TextStyle(fontSize: 11)),
            trailing: IconButton(
                icon: const Icon(Icons.delete_outline,
                    color: Colors.red, size: 20),
                onPressed: () => db
                    .collection('users')
                    .doc(u['id'])
                    .update({'role': 'User'})),
          ))),
    ]);
  }

  Future<void> _showCreateDialog(
      BuildContext ctx, FirebaseFirestore db, String role) async {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final passCtrl = TextEditingController();
    final accessPages = role == 'Worker'
        ? ['Dashboard', 'Inventory', 'Alerts', 'Suppliers']
        : ['Dashboard', 'Billing', 'Alerts', 'Reports', 'Orders'];

    await showDialog(
        context: ctx,
        builder: (ctx) => AlertDialog(
              title: Text('Create $role Account'),
              scrollable: true,
              content: Column(mainAxisSize: MainAxisSize.min, children: [
                TextField(
                    controller: nameCtrl,
                    decoration:
                        const InputDecoration(labelText: 'Full Name *')),
                TextField(
                    controller: emailCtrl,
                    decoration: const InputDecoration(labelText: 'Email *'),
                    keyboardType: TextInputType.emailAddress),
                TextField(
                    controller: passCtrl,
                    decoration: const InputDecoration(labelText: 'Password *'),
                    obscureText: true),
                const SizedBox(height: 12),
                Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(8)),
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Access:',
                              style: TextStyle(
                                  fontSize: 11, fontWeight: FontWeight.bold)),
                          ...accessPages.map((p) => Row(children: [
                                const Icon(Icons.check_circle,
                                    size: 14, color: Colors.green),
                                const SizedBox(width: 6),
                                Text(p, style: const TextStyle(fontSize: 12))
                              ])),
                        ])),
              ]),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Cancel')),
                FilledButton(
                    onPressed: () async {
                      if (nameCtrl.text.trim().isEmpty ||
                          emailCtrl.text.trim().isEmpty ||
                          passCtrl.text.length < 6) return;
                      try {
                        // Use secondary app to not log out admin
                        FirebaseApp secondaryApp;
                        try {
                          secondaryApp = Firebase.app('secondary');
                        } catch (_) {
                          secondaryApp = await Firebase.initializeApp(
                              name: 'secondary',
                              options: Firebase.app().options);
                        }
                        final secondaryAuth =
                            FirebaseAuth.instanceFor(app: secondaryApp);
                        final cred =
                            await secondaryAuth.createUserWithEmailAndPassword(
                                email: emailCtrl.text.trim(),
                                password: passCtrl.text);
                        await cred.user
                            ?.updateDisplayName(nameCtrl.text.trim());
                        await db.collection('users').doc(cred.user!.uid).set({
                          'uid': cred.user!.uid,
                          'name': nameCtrl.text.trim(),
                          'email': emailCtrl.text.trim(),
                          'role': role,
                          'createdAt': FieldValue.serverTimestamp(),
                        });
                        await secondaryAuth.signOut();
                        if (ctx.mounted) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
                              content: Text('$role account created!')));
                        }
                      } catch (e) {
                        if (ctx.mounted)
                          ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
                              content: Text('Error: ${_friendlyError(e)}'),
                              backgroundColor: Colors.red));
                      }
                    },
                    child: const Text('Create')),
              ],
            ));
  }

  String _friendlyError(dynamic e) {
    if (e is FirebaseAuthException) {
      if (e.code == 'email-already-in-use') return 'Email already registered.';
      if (e.code == 'weak-password') return 'Password too weak.';
      if (e.code == 'invalid-email') return 'Invalid email.';
    }
    return 'Something went wrong.';
  }
}
