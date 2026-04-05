import 'package:cloud_firestore/cloud_firestore.dart';
import 'bill_item.dart';

class Bill {
  final String id;
  final String billNumber;
  final List<BillItem> items;
  final double subtotal;
  final double cgst;
  final double sgst;
  final double totalGst;
  final double discount;
  final double grandTotal;
  final double profit;
  final String customerName;
  final String date;
  final DateTime? createdAt;

  const Bill({
    required this.id,
    required this.billNumber,
    required this.items,
    required this.subtotal,
    required this.cgst,
    required this.sgst,
    required this.totalGst,
    this.discount = 0,
    required this.grandTotal,
    this.profit = 0,
    this.customerName = 'Walk-in',
    required this.date,
    this.createdAt,
  });

  factory Bill.fromFirestore(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>? ?? {};
    final itemsList = (d['items'] as List? ?? [])
        .map((i) => BillItem.fromMap(i as Map<String, dynamic>))
        .toList();
    return Bill(
      id: doc.id,
      billNumber: d['billId'] ?? d['billNumber'] ?? doc.id,
      items: itemsList,
      subtotal: (d['subtotal'] ?? 0).toDouble(),
      cgst: (d['totalCGST'] ?? 0).toDouble(),
      sgst: (d['totalSGST'] ?? 0).toDouble(),
      totalGst: ((d['totalCGST'] ?? 0) + (d['totalSGST'] ?? 0)).toDouble(),
      discount: (d['totalDiscount'] ?? 0).toDouble(),
      grandTotal: (d['grandTotal'] ?? 0).toDouble(),
      profit: (d['profit'] ?? 0).toDouble(),
      customerName: d['customerName'] ?? 'Walk-in',
      date: d['date'] ?? '',
      createdAt: (d['createdAt'] as Timestamp?)?.toDate(),
    );
  }
}
