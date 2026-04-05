import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/offer.dart';

class OfferService {
  final _col = FirebaseFirestore.instance.collection('offers');

  Stream<List<Offer>> activeOffersStream() {
    return _col.snapshots().map((snap) => snap.docs
        .map((d) => Offer.fromFirestore(d))
        .where((o) => o.active)
        .toList());
  }

  Future<void> createOffer(Map<String, dynamic> data) async {
    await _col.add({...data, 'createdAt': FieldValue.serverTimestamp()});
  }

  Future<void> toggleOffer(String id, bool active) async {
    await _col.doc(id).update({'active': active});
  }

  Future<void> deleteOffer(String id) async {
    await _col.doc(id).delete();
  }

  Offer? getOfferForProduct(List<Offer> offers, String productId) {
    final now = DateTime.now().toIso8601String().split('T')[0];
    try {
      return offers.firstWhere((o) =>
          o.productId == productId &&
          o.active &&
          (o.validUntil == null || o.validUntil!.compareTo(now) >= 0) &&
          (o.maxQty == null || o.soldQty < o.maxQty!));
    } catch (_) {
      return null;
    }
  }
}
