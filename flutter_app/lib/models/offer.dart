import 'package:cloud_firestore/cloud_firestore.dart';

class Offer {
  final String id;
  final String productId;
  final String type; // percent, flat, bxgy
  final double value;
  final int? buyQty;
  final int? getQty;
  final int? maxQty;
  final int soldQty;
  final String? reason;
  final String? validUntil;
  final bool active;

  const Offer({
    required this.id,
    required this.productId,
    required this.type,
    this.value = 0,
    this.buyQty,
    this.getQty,
    this.maxQty,
    this.soldQty = 0,
    this.reason,
    this.validUntil,
    this.active = true,
  });

  factory Offer.fromFirestore(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>? ?? {};
    return Offer(
      id: doc.id,
      productId: d['productId'] ?? '',
      type: d['type'] ?? 'percent',
      value: (d['value'] ?? 0).toDouble(),
      buyQty: d['buyQty'],
      getQty: d['getQty'],
      maxQty: d['maxQty'],
      soldQty: d['soldQty'] ?? 0,
      reason: d['reason'],
      validUntil: d['validUntil'],
      active: d['active'] ?? true,
    );
  }

  String get label {
    if (type == 'percent') return '${value.toInt()}% OFF';
    if (type == 'flat') return '₹${value.toInt()} OFF';
    if (type == 'bxgy') return 'Buy $buyQty Get $getQty';
    return '';
  }

  double discountedPrice(double originalPrice) {
    if (type == 'percent') return originalPrice * (1 - value / 100);
    if (type == 'flat') return (originalPrice - value).clamp(0, originalPrice);
    return originalPrice;
  }
}
