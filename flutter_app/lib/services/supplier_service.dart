import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/supplier.dart';

class SupplierService {
  final _col = FirebaseFirestore.instance.collection('suppliers');

  Stream<List<Supplier>> suppliersStream() {
    return _col.orderBy('name').snapshots().map(
      (snap) => snap.docs.map((d) => Supplier.fromFirestore(d)).toList(),
    );
  }

  Future<void> addSupplier(Supplier s) async {
    await _col.add({...s.toFirestore(), 'createdAt': FieldValue.serverTimestamp()});
  }

  Future<void> updateSupplier(String id, Map<String, dynamic> data) async {
    await _col.doc(id).update({...data, 'updatedAt': FieldValue.serverTimestamp()});
  }

  Future<void> deleteSupplier(String id) async {
    await _col.doc(id).delete();
  }
}
