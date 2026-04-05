import 'package:flutter/material.dart';
import '../models/bill.dart';

class BillReceiptWidget extends StatelessWidget {
  final Bill bill;
  final String shopName;
  final String gstin;

  const BillReceiptWidget({
    super.key,
    required this.bill,
    this.shopName = 'ShopSmart',
    this.gstin = '',
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
          Text(shopName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          if (gstin.isNotEmpty) Text('GSTIN: $gstin', style: const TextStyle(fontSize: 11, color: Colors.grey)),
          const Divider(),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Bill #', style: const TextStyle(fontSize: 12)),
            Text(bill.billNumber, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ]),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Date', style: const TextStyle(fontSize: 12)),
            Text(bill.date, style: const TextStyle(fontSize: 12)),
          ]),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Customer', style: const TextStyle(fontSize: 12)),
            Text(bill.customerName, style: const TextStyle(fontSize: 12)),
          ]),
          const Divider(),
          ...bill.items.map((item) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 2),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Expanded(child: Text('${item.name} x${item.qty}', style: const TextStyle(fontSize: 12))),
              Text('₹${(item.price * item.qty).toStringAsFixed(2)}', style: const TextStyle(fontSize: 12)),
            ]),
          )),
          const Divider(),
          _row('Subtotal', '₹${bill.subtotal.toStringAsFixed(2)}'),
          _row('CGST', '₹${bill.cgst.toStringAsFixed(2)}'),
          _row('SGST', '₹${bill.sgst.toStringAsFixed(2)}'),
          if (bill.discount > 0) _row('Discount', '-₹${bill.discount.toStringAsFixed(2)}'),
          const Divider(),
          _row('TOTAL', '₹${bill.grandTotal.toStringAsFixed(2)}', bold: true),
        ]),
      ),
    );
  }

  Widget _row(String label, String value, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: TextStyle(fontSize: 12, fontWeight: bold ? FontWeight.bold : FontWeight.normal)),
        Text(value, style: TextStyle(fontSize: bold ? 15 : 12, fontWeight: bold ? FontWeight.bold : FontWeight.normal)),
      ]),
    );
  }
}
