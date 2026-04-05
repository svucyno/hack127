class GstResult {
  final double cgst;
  final double sgst;
  final double total;
  const GstResult({required this.cgst, required this.sgst, required this.total});
}

class GstCalculator {
  static const Map<int, double> slabs = {0: 0, 5: 5, 12: 12, 18: 18, 28: 28};

  static GstResult calculate(double amount, int slab) {
    final rate = slabs[slab] ?? 0;
    final gstAmount = amount * rate / 100;
    final half = double.parse((gstAmount / 2).toStringAsFixed(2));
    return GstResult(cgst: half, sgst: half, total: gstAmount);
  }
}
