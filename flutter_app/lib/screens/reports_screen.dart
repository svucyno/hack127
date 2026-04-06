import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:fl_chart/fl_chart.dart';
import '../widgets/app_drawer.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});
  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final _db = FirebaseFirestore.instance;
  String _period = 'monthly';
  bool _loading = true;
  int _billCount = 0, _itemCount = 0;
  double _totalRevenue = 0, _totalProfit = 0, _totalGst = 0;
  Map<String, Map<String, double>> _dayMap = {};
  Map<String, int> _prodMap = {};
  Map<int, double> _gstSlabMap = {};
  List<FlSpot> _revSpots = [], _profSpots = [];
  List<String> _chartLabels = [];

  @override
  void initState() {
    super.initState();
    _loadReport();
  }

  int get _days => _period == 'daily' ? 1 : _period == 'weekly' ? 7 : 30;

  Future<void> _loadReport() async {
    setState(() => _loading = true);
    try {
      final since = DateTime.now().subtract(Duration(days: _days));
      final snap = await _db.collection('sales').where('dateObj', isGreaterThanOrEqualTo: since).get();

      int bills = 0, items = 0;
      double rev = 0, prof = 0, gst = 0;
      final dayMap = <String, Map<String, double>>{};
      final prodMap = <String, int>{};
      final gstMap = <int, double>{};

      for (final doc in snap.docs) {
        final d = doc.data();
        bills++;
        rev += (d['grandTotal'] as num?)?.toDouble() ?? 0;
        prof += (d['profit'] as num?)?.toDouble() ?? 0;
        gst += ((d['totalCGST'] as num?)?.toDouble() ?? 0) + ((d['totalSGST'] as num?)?.toDouble() ?? 0);
        final date = d['date'] as String? ?? '';
        dayMap.putIfAbsent(date, () => {'revenue': 0, 'profit': 0, 'bills': 0});
        dayMap[date]!['revenue'] = (dayMap[date]!['revenue'] ?? 0) + ((d['grandTotal'] as num?)?.toDouble() ?? 0);
        dayMap[date]!['profit'] = (dayMap[date]!['profit'] ?? 0) + ((d['profit'] as num?)?.toDouble() ?? 0);
        dayMap[date]!['bills'] = (dayMap[date]!['bills'] ?? 0) + 1;

        for (final item in (d['items'] as List? ?? [])) {
          items += (item['qty'] as num?)?.toInt() ?? 0;
          final name = item['name'] as String? ?? '';
          prodMap[name] = (prodMap[name] ?? 0) + ((item['qty'] as num?)?.toInt() ?? 0);
          final slab = (item['gst'] as num?)?.toInt() ?? 0;
          final lineTotal = ((item['price'] as num?)?.toDouble() ?? 0) * ((item['qty'] as num?)?.toInt() ?? 0);
          final gstAmt = lineTotal * slab / 100;
          gstMap[slab] = (gstMap[slab] ?? 0) + gstAmt;
        }
      }

      // Build chart data
      final labels = <String>[];
      final revSpots = <FlSpot>[];
      final profSpots = <FlSpot>[];
      final now = DateTime.now();
      for (int i = _days - 1; i >= 0; i--) {
        final d = now.subtract(Duration(days: i));
        final key = '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
        final idx = (_days - 1 - i).toDouble();
        revSpots.add(FlSpot(idx, dayMap[key]?['revenue'] ?? 0));
        profSpots.add(FlSpot(idx, dayMap[key]?['profit'] ?? 0));
        if (i % (_days > 7 ? 5 : 1) == 0) labels.add('${d.day}/${d.month}');
      }

      setState(() {
        _billCount = bills; _itemCount = items;
        _totalRevenue = rev; _totalProfit = prof; _totalGst = gst;
        _dayMap = dayMap; _prodMap = prodMap; _gstSlabMap = gstMap;
        _revSpots = revSpots; _profSpots = profSpots; _chartLabels = labels;
        _loading = false;
      });
    } catch (e) {
      debugPrint('Report error: $e');
      setState(() => _loading = false);
    }
  }

  void _setPeriod(String p) {
    _period = p;
    _loadReport();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Reports')),
      drawer: const AppDrawer(),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadReport,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  // Period selector
                  Row(children: [
                    _periodBtn('daily', 'Today', cs),
                    const SizedBox(width: 8),
                    _periodBtn('weekly', '7 Days', cs),
                    const SizedBox(width: 8),
                    _periodBtn('monthly', '30 Days', cs),
                  ]),
                  const SizedBox(height: 16),

                  // KPI Summary
                  GridView.count(
                    crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 2,
                    children: [
                      _kpiTile('Bills', '$_billCount', Icons.receipt, cs),
                      _kpiTile('Items Sold', '$_itemCount', Icons.shopping_bag, cs),
                      _kpiTile('Revenue', '₹${_totalRevenue.toStringAsFixed(0)}', Icons.account_balance_wallet, cs),
                      _kpiTile('Profit', '₹${_totalProfit.toStringAsFixed(0)}', Icons.trending_up, cs),
                      _kpiTile('GST Collected', '₹${_totalGst.toStringAsFixed(0)}', Icons.receipt_long, cs),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Revenue vs Profit chart
                  _buildTrendChart(cs),
                  const SizedBox(height: 20),

                  // GST Breakdown
                  _buildGstChart(cs),
                  const SizedBox(height: 20),

                  // Top Products
                  _buildTopProducts(cs),
                  const SizedBox(height: 20),

                  // Daily Breakdown
                  _buildDailyTable(cs),
                ]),
              ),
            ),
    );
  }

  Widget _periodBtn(String key, String label, ColorScheme cs) {
    final active = _period == key;
    return Expanded(
      child: FilledButton(
        onPressed: () => _setPeriod(key),
        style: FilledButton.styleFrom(
          backgroundColor: active ? cs.primary : cs.surfaceContainerHighest,
          foregroundColor: active ? cs.onPrimary : cs.onSurface,
        ),
        child: Text(label, style: const TextStyle(fontSize: 13)),
      ),
    );
  }

  Widget _kpiTile(String label, String value, IconData icon, ColorScheme cs) {
    return Card(
      child: Padding(padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, size: 20, color: cs.primary),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: cs.primary)),
          Text(label, style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
        ])),
    );
  }

  Widget _buildTrendChart(ColorScheme cs) {
    return Card(
      child: Padding(padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Revenue vs Profit', style: TextStyle(fontWeight: FontWeight.w700, color: cs.primary)),
          const SizedBox(height: 16),
          SizedBox(height: 200,
            child: LineChart(LineChartData(
              lineBarsData: [
                LineChartBarData(spots: _revSpots, color: Colors.blue, barWidth: 2, isCurved: true,
                  belowBarData: BarAreaData(show: true, color: Colors.blue.withAlpha(25)), dotData: const FlDotData(show: false)),
                LineChartBarData(spots: _profSpots, color: cs.primary, barWidth: 2, isCurved: true,
                  belowBarData: BarAreaData(show: true, color: cs.primary.withAlpha(25)), dotData: const FlDotData(show: false)),
              ],
              titlesData: FlTitlesData(
                bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 24,
                  getTitlesWidget: (v, _) {
                    final step = _days > 7 ? 5 : 1;
                    if (v.toInt() % step == 0) {
                      final idx = v.toInt() ~/ step;
                      if (idx < _chartLabels.length) return Text(_chartLabels[idx], style: const TextStyle(fontSize: 9));
                    }
                    return const SizedBox.shrink();
                  })),
                leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 40,
                  getTitlesWidget: (v, _) => Text('₹${v.toInt()}', style: const TextStyle(fontSize: 9)))),
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              ),
              gridData: const FlGridData(show: true, drawVerticalLine: false),
              borderData: FlBorderData(show: false),
            )),
          ),
          const SizedBox(height: 8),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Container(width: 12, height: 3, color: Colors.blue),
            const SizedBox(width: 4),
            const Text('Revenue', style: TextStyle(fontSize: 11)),
            const SizedBox(width: 16),
            Container(width: 12, height: 3, color: Colors.green),
            const SizedBox(width: 4),
            const Text('Profit', style: TextStyle(fontSize: 11)),
          ]),
        ])),
    );
  }

  Widget _buildGstChart(ColorScheme cs) {
    if (_gstSlabMap.isEmpty) return const SizedBox.shrink();
    final colors = [Colors.green, Colors.blue, Colors.orange, Colors.purple, Colors.red];
    final entries = _gstSlabMap.entries.toList()..sort((a, b) => a.key.compareTo(b.key));
    return Card(
      child: Padding(padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('GST Breakdown', style: TextStyle(fontWeight: FontWeight.w700, color: cs.primary)),
          const SizedBox(height: 16),
          SizedBox(height: 160,
            child: PieChart(PieChartData(
              sections: entries.asMap().entries.map((e) => PieChartSectionData(
                value: e.value.value, title: '${e.value.key}%',
                color: colors[e.key % colors.length], radius: 50,
                titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
              )).toList(),
              centerSpaceRadius: 30,
            )),
          ),
          const SizedBox(height: 8),
          ...entries.map((e) => Padding(padding: const EdgeInsets.symmetric(vertical: 2),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('GST ${e.key}%', style: const TextStyle(fontSize: 12)),
              Text('₹${e.value.toStringAsFixed(2)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            ]))),
        ])),
    );
  }

  Widget _buildTopProducts(ColorScheme cs) {
    final sorted = _prodMap.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    final top = sorted.take(10).toList();
    if (top.isEmpty) return const SizedBox.shrink();
    return Card(
      child: Padding(padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('🏆 Top Products', style: TextStyle(fontWeight: FontWeight.w700, color: cs.primary)),
          const SizedBox(height: 12),
          ...top.map((e) => Padding(padding: const EdgeInsets.symmetric(vertical: 3),
            child: Row(children: [
              Expanded(child: Text(e.key, style: const TextStyle(fontSize: 13))),
              Text('${e.value} units', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: cs.primary)),
            ]))),
        ])),
    );
  }

  Widget _buildDailyTable(ColorScheme cs) {
    final sorted = _dayMap.entries.toList()..sort((a, b) => b.key.compareTo(a.key));
    if (sorted.isEmpty) return const SizedBox.shrink();
    return Card(
      child: Padding(padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Daily Breakdown', style: TextStyle(fontWeight: FontWeight.w700, color: cs.primary)),
          const SizedBox(height: 12),
          Table(
            columnWidths: const {0: FlexColumnWidth(2), 1: FlexColumnWidth(1), 2: FlexColumnWidth(2), 3: FlexColumnWidth(2)},
            children: [
              TableRow(children: ['Date', 'Bills', 'Revenue', 'Profit'].map((h) =>
                Padding(padding: const EdgeInsets.only(bottom: 8),
                  child: Text(h, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: cs.primary)))).toList()),
              ...sorted.map((e) => TableRow(children: [
                Text(_formatDate(e.key), style: const TextStyle(fontSize: 12)),
                Text('${e.value['bills']?.toInt() ?? 0}', style: const TextStyle(fontSize: 12)),
                Text('₹${(e.value['revenue'] ?? 0).toStringAsFixed(0)}', style: const TextStyle(fontSize: 12)),
                Text('₹${(e.value['profit'] ?? 0).toStringAsFixed(0)}',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: cs.primary)),
              ])),
            ],
          ),
        ])),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final d = DateTime.parse(dateStr);
      final months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${d.day} ${months[d.month]}';
    } catch (_) { return dateStr; }
  }
}
