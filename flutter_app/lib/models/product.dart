import 'package:cloud_firestore/cloud_firestore.dart';

class Product {
  final String id;
  final String name;
  final String company;
  final String category;
  final double costPrice;
  final double sellingPrice;
  final int gstSlab;
  final DateTime? expiryDate;
  final int stock;
  final String? supplierId;
  final String? barcode;
  final int maxStock;
  final int salesCount30;

  const Product({
    required this.id,
    required this.name,
    this.company = '',
    this.category = 'Other',
    required this.costPrice,
    required this.sellingPrice,
    this.gstSlab = 0,
    this.expiryDate,
    required this.stock,
    this.supplierId,
    this.barcode,
    this.maxStock = 100,
    this.salesCount30 = 0,
  });

  factory Product.fromFirestore(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>? ?? {};
    return Product(
      id: doc.id,
      name: d['name'] ?? '',
      company: d['company'] ?? d['brand'] ?? '',
      category: d['category'] ?? 'Other',
      costPrice: (d['costPrice'] ?? 0).toDouble(),
      sellingPrice: (d['sellingPrice'] ?? 0).toDouble(),
      gstSlab: d['gst'] ?? d['gstSlab'] ?? 0,
      expiryDate: d['expiryDate'] != null ? DateTime.tryParse(d['expiryDate']) : null,
      stock: d['quantity'] ?? d['stock'] ?? 0,
      supplierId: d['supplierId'],
      barcode: d['barcode'],
      maxStock: d['maxStock'] ?? 100,
      salesCount30: d['salesCount30'] ?? 0,
    );
  }

  Map<String, dynamic> toFirestore() => {
    'name': name, 'company': company, 'brand': company,
    'category': category, 'costPrice': costPrice,
    'sellingPrice': sellingPrice, 'gst': gstSlab,
    'expiryDate': expiryDate?.toIso8601String(),
    'quantity': stock, 'maxStock': maxStock,
    'supplierId': supplierId, 'barcode': barcode,
    'salesCount30': salesCount30,
  };
}
