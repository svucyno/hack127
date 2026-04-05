import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/bill_item.dart';
import '../utils/gst_calculator.dart';
import 'dart:developer';

class BillingService {
  final _sales = FirebaseFirestore.instance.collection('sales');
  final _products = FirebaseFirestore.instance.collection('products');
  final _settings = FirebaseFirestore.instance.collection('settings');

  Future<String> getNextBillNumber() async {
    try {
      final ref = _settings.doc('billCounter');
      final doc = await ref.get();
      final next = (doc.exists ? (doc.data()?['count'] ?? 0) : 0) + 1;
      await ref.set({'count': next});
      return 'BILL-${next.toString().padLeft(5, '0')}';
    } catch (e) {
      return 'BILL-${DateTime.now().millisecondsSinceEpoch}';
    }
  }

  Future<String> confirmBill({
    required List<BillItem> items,
    required String customerName,
  }) async {
    final billId = await getNextBillNumber();
    final now = DateTime.now();
    final dateStr = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';

    double subtotal = 0, totalCgst = 0, totalSgst = 0, totalDiscount = 0, profit = 0;
    for (final item in items) {
      final lineTotal = item.price * item.qty;
      final gst = GstCalculator.calculate(lineTotal, item.gstSlab);
      subtotal += lineTotal;
      totalCgst += gst.cgst;
      totalSgst += gst.sgst;
      totalDiscount += (item.originalPrice - item.price) * item.qty;
      profit += (item.price - item.cost) * item.qty;
    }
    final grandTotal = subtotal + totalCgst + totalSgst;

    final batch = FirebaseFirestore.instance.batch();
    batch.set(_sales.doc(billId), {
      'billId': billId, 'date': dateStr, 'dateObj': now,
      'customerName': customerName,
      'items': items.map((i) => i.toMap()).toList(),
      'subtotal': double.parse(subtotal.toStringAsFixed(2)),
      'totalCGST': double.parse(totalCgst.toStringAsFixed(2)),
      'totalSGST': double.parse(totalSgst.toStringAsFixed(2)),
      'totalDiscount': double.parse(totalDiscount.toStringAsFixed(2)),
      'grandTotal': double.parse(grandTotal.toStringAsFixed(2)),
      'profit': double.parse(profit.toStringAsFixed(2)),
      'createdAt': FieldValue.serverTimestamp(),
    });

    for (final item in items) {
      batch.update(_products.doc(item.productId), {
        'quantity': FieldValue.increment(-item.qty),
        'salesCount30': FieldValue.increment(item.qty),
      });
    }

    await batch.commit();
    log('Bill $billId saved');
    return billId;
  }
}
