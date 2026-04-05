import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/product.dart';
import 'dart:developer';

class InventoryService {
  final _col = FirebaseFirestore.instance.collection('products');

  Stream<List<Product>> productsStream() {
    return _col.orderBy('name').snapshots().map(
      (snap) => snap.docs.map((d) => Product.fromFirestore(d)).toList(),
    );
  }

  Future<List<Product>> getProducts() async {
    try {
      final snap = await _col.orderBy('name').get();
      return snap.docs.map((d) => Product.fromFirestore(d)).toList();
    } catch (e) {
      log('Get products error: $e');
      return [];
    }
  }

  Future<void> addProduct(Product p) async {
    await _col.add({
      ...p.toFirestore(),
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  Future<void> updateProduct(String id, Map<String, dynamic> data) async {
    await _col.doc(id).update({
      ...data,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  Future<void> deleteProduct(String id) async {
    await _col.doc(id).delete();
  }

  Future<Product?> findByBarcode(String barcode) async {
    final snap = await _col.where('barcode', isEqualTo: barcode).limit(1).get();
    if (snap.docs.isEmpty) return null;
    return Product.fromFirestore(snap.docs.first);
  }
}
