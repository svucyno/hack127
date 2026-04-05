import 'package:cloud_firestore/cloud_firestore.dart';

class ShopAlert {
  final String id;
  final String type;
  final String key;
  final String productId;
  final String productName;
  final String category;
  final String message;
  final bool resolved;
  final DateTime? createdAt;

  const ShopAlert({
    required this.id,
    required this.type,
    this.key = '',
    this.productId = '',
    this.productName = '',
    this.category = '',
    required this.message,
    this.resolved = false,
    this.createdAt,
  });

  factory ShopAlert.fromFirestore(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>? ?? {};
    return ShopAlert(
      id: doc.id,
      type: d['type'] ?? '',
      key: d['key'] ?? '',
      productId: d['productId'] ?? '',
      productName: d['productName'] ?? '',
      category: d['category'] ?? '',
      message: d['message'] ?? '',
      resolved: d['resolved'] ?? false,
      createdAt: (d['createdAt'] as Timestamp?)?.toDate(),
    );
  }
}
