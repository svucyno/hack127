import 'package:flutter/material.dart';
import '../services/billing_service.dart';
import '../models/bill_item.dart';

class BillingProvider extends ChangeNotifier {
  final BillingService _service;
  final List<BillItem> _cart = [];
  bool _processing = false;
  String? _lastBillId;

  BillingProvider(this._service);

  List<BillItem> get cart => List.unmodifiable(_cart);
  bool get processing => _processing;
  String? get lastBillId => _lastBillId;
  int get itemCount => _cart.fold(0, (s, i) => s + i.qty);

  void addToCart(BillItem item) {
    final idx = _cart.indexWhere((c) => c.productId == item.productId);
    if (idx >= 0) {
      final old = _cart[idx];
      _cart[idx] = BillItem(
        productId: old.productId, name: old.name,
        price: old.price, originalPrice: old.originalPrice,
        cost: old.cost, qty: old.qty + 1,
        gstSlab: old.gstSlab, category: old.category,
        offerId: old.offerId, offerLabel: old.offerLabel,
      );
    } else {
      _cart.add(item);
    }
    notifyListeners();
  }

  void removeFromCart(String productId) {
    _cart.removeWhere((c) => c.productId == productId);
    notifyListeners();
  }

  void updateQty(String productId, int qty) {
    if (qty <= 0) { removeFromCart(productId); return; }
    final idx = _cart.indexWhere((c) => c.productId == productId);
    if (idx >= 0) {
      final old = _cart[idx];
      _cart[idx] = BillItem(
        productId: old.productId, name: old.name,
        price: old.price, originalPrice: old.originalPrice,
        cost: old.cost, qty: qty,
        gstSlab: old.gstSlab, category: old.category,
        offerId: old.offerId, offerLabel: old.offerLabel,
      );
      notifyListeners();
    }
  }

  void clearCart() { _cart.clear(); notifyListeners(); }

  Future<String?> confirmBill(String customerName) async {
    if (_cart.isEmpty) return null;
    _processing = true; notifyListeners();
    try {
      _lastBillId = await _service.confirmBill(
        items: _cart, customerName: customerName,
      );
      _cart.clear();
      return _lastBillId;
    } catch (e) {
      return null;
    } finally {
      _processing = false; notifyListeners();
    }
  }
}
