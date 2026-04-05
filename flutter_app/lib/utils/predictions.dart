import '../models/product.dart';

class PredictionResult {
  final String productId;
  final String name;
  final double dailyRate;
  final int stockoutDays;
  final int reorderQty;
  final String trend;
  final String confidence;

  const PredictionResult({
    required this.productId, required this.name,
    required this.dailyRate, required this.stockoutDays,
    required this.reorderQty, required this.trend,
    required this.confidence,
  });
}

class DemandPredictor {
  static List<PredictionResult> predict(
    List<Product> products,
    Map<String, int> salesLast30, // productId -> total qty sold
  ) {
    final results = <PredictionResult>[];
    for (final p in products) {
      final totalSold = salesLast30[p.id] ?? 0;
      final dailyRate = totalSold / 30.0;
      final stockoutDays = dailyRate > 0 ? (p.stock / dailyRate).floor() : 999;
      final reorderQty = ((dailyRate * 30) - p.stock).ceil().clamp(0, p.maxStock);
      final trend = totalSold > 20 ? 'increasing' : totalSold > 5 ? 'stable' : 'low';
      final confidence = totalSold > 15 ? 'High' : totalSold > 5 ? 'Medium' : 'Low';

      results.add(PredictionResult(
        productId: p.id, name: p.name,
        dailyRate: double.parse(dailyRate.toStringAsFixed(2)),
        stockoutDays: stockoutDays, reorderQty: reorderQty,
        trend: trend, confidence: confidence,
      ));
    }
    results.sort((a, b) => a.stockoutDays.compareTo(b.stockoutDays));
    return results;
  }
}
