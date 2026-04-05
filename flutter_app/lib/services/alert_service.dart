import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/alert.dart';

class AlertService {
  final _col = FirebaseFirestore.instance.collection('alerts');

  Stream<List<ShopAlert>> alertsStream() {
    return _col.snapshots().map(
      (snap) => snap.docs.map((d) => ShopAlert.fromFirestore(d)).toList()
        ..sort((a, b) {
          final at = a.createdAt ?? DateTime(2000);
          final bt = b.createdAt ?? DateTime(2000);
          return bt.compareTo(at);
        }),
    );
  }

  Future<void> resolveAlert(String id) async {
    await _col.doc(id).update({'resolved': true});
  }

  Future<void> deleteAlert(String id) async {
    await _col.doc(id).delete();
  }

  Future<void> resolveAll() async {
    final snap = await _col.where('resolved', isEqualTo: false).get();
    final batch = FirebaseFirestore.instance.batch();
    for (final doc in snap.docs) {
      batch.update(doc.reference, {'resolved': true});
    }
    await batch.commit();
  }
}
