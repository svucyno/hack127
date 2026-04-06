import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/app_drawer.dart';
import '../widgets/stat_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _db = FirebaseFirestore.instance;
  bool _loading = true;
  int _customers = 0, _itemsSold = 0, _alertCount = 0, _lowStock = 0;
  double _revenue = 0, _profit = 0;
  Map<String, double> _profitByDay = {};
  Map<String, double> _salesByCategory = {};
  List<Map<String, dynamic>> _topSellers = [];

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    setState(() => _loading = true);
    try {
      final now = DateTime.now();
      final todayStr = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
      final thirtyDaysAgo = now.subtract(const Duration(days: 30));

      // Today's sales
      final todaySales = await _db.collection('sales').where('date', isEqualTo: todayStr).get();
      final customers = <String>{};
      int items = 0;
      double rev = 0, prof = 0;
      for (final doc in todaySales.docs) {
        final d = doc.data();
        customers.add(d['billId'] ?? doc.id);
        for (final item in (d['items'] as List? ?? [])) {
          items += (item['qty'] as num?)?.toInt() ?? 0;
        }
        rev += (d['grandTotal'] as num?)?.toDouble() ?? 0;
        prof += (d['profit'] as num?)?.toDouble() ?? 0;
      }

      // 30-day sales for chart
      final histSales = await _db.collection('sales').where('dateObj', isGreaterThanOrEqualTo: thirtyDaysAgo).get();
      final dayMap = <String, double>{};
      final catMap = <String, double>{};
      for (final doc in histSales.docs) {
        final d = doc.data();
        final date = d['date'] as String? ?? '';
        dayMap[date] = (dayMap[date] ?? 0) + ((d['profit'] as num?)?.toDouble() ?? 0);
        for (final item in (d['items'] as List? ?? [])) {
          final cat = item['category'] as String? ?? 'Other';
          final amount = ((item['price'] as num?)?.toDouble() ?? 0) * ((item['qty'] as num?)?.toInt() ?? 0);
          catMap[cat] = (catMap[cat] ?? 0) + amount;
        }
      }

      // Top sellers
      final prodSnap = await _db.collection('products').orderBy('salesCount30', descending: true).limit(5).get();
      final topSellers = prodSnap.docs.map((d) => {'name': d.data()['name'] ?? '', 'count': d.data()['salesCount30'] ?? 0}).toList();

      // Alerts count
      final alertSnap = await _db.collection('alerts').where('resolved', isEqualTo: false).get();

      // Low stock
      final prodAll = await _db.collection('products').get();
      int lowStockCount = 0;
      for (final doc in prodAll.docs) {
        final d = doc.data();
        final qty = (d['quantity'] as num?)?.toInt() ?? 0;
        final max = (d['maxStock'] as num?)?.toInt() ?? 1;
        if (max > 0 && (qty / max * 100) <= 10) lowStockCount++;
      }

      setState(() {
        _customers = customers.length;
        _itemsSold = items;
        _revenue = rev;
        _profit = prof;
        _profitByDay = dayMap;
        _salesByCategory = catMap;
        _topSellers = topSellers;
        _alertCount = alertSnap.size;
        _lowStock = lowStockCount;
        _loading = false;
      });
    } catch (e) {
      debugPrint('Dashboard error: $e');
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard'), actions: [
        IconButton(icon: const Icon(Icons.refresh), onPressed: _loadDashboard),
      ]),
      drawer: const AppDrawer(),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadDashboard,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Welcome, ${auth.user?.displayName ?? 'Owner'}',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 16),

                  // KPI Cards
                  GridView.count(
                    crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 1.6,
                    children: [
                      StatCard(label: 'Customers Today', value: '$_customers', icon: Icons.people),
                      StatCard(label: 'Items Sold', value: '$_itemsSold', icon: Icons.shopping_bag),
                      StatCard(label: 'Revenue', value: '₹${_revenue.toStringAsFixed(0)}', icon: Icons.receipt_long),
                      StatCard(label: 'Profit', value: '₹${_profit.toStringAsFixed(0)}', icon: Icons.trending_up),
                      StatCard(label: 'Active Alerts', value: '$_alertCount', icon: Icons.notifications_active),
                      StatCard(label: 'Low Stock', value: '$_lowStock', icon: Icons.warning_amber),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Profit Trend Chart
                  _buildProfitChart(cs),
                  const SizedBox(height: 20),

                  // Category Pie Chart
                  _buildCategoryChart(cs),
                  const SizedBox(height: 20),

                  // Top Sellers
                  _buildTopSellers(cs),
                ]),
              ),
            ),
    );
  }

  Widget _buildProfitChart(ColorScheme cs) {
    final now = DateTime.now();
    final spots = <FlSpot>[];
    final labels = <String>[];
    for (int i = 29; i >= 0; i--) {
      final d = now.subtract(Duration(days: i));
      final key = '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
      spots.add(FlSpot((29 - i).toDouble(), _profitByDay[key] ?? 0));
      if (i % 5 == 0) labels.add('${d.day}/${d.month}');
    }
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('30-Day Profit Trend', style: TextStyle(fontWeight: FontWeight.w700, color: cs.primary)),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: BarChart(BarChartData(
              barGroups: spots.map((s) => BarChartGroupData(x: s.x.toInt(), barRods: [
                BarChartRodData(toY: s.y, color: cs.primary, width: 6, borderRadius: BorderRadius.circular(3)),
              ])).toList(),
              titlesData: FlTitlesData(
                bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 28,
                  getTitlesWidget: (v, _) {
                    if (v.toInt() % 5 == 0 && v.toInt() ~/ 5 < labels.length) {
                      return Text(labels[v.toInt() ~/ 5], style: const TextStyle(fontSize: 9));
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
        ]),
      ),
    );
  }

  Widget _buildCategoryChart(ColorScheme cs) {
    if (_salesByCategory.isEmpty) {
      return Card(child: Padding(padding: const EdgeInsets.all(16),
        child: Text('No category data yet.', style: TextStyle(color: cs.onSurfaceVariant))));
    }
    final colors = [cs.primary, cs.tertiary, cs.error, Colors.orange, Colors.purple, Colors.teal, Colors.pink];
    final entries = _salesByCategory.entries.toList();
    final total = entries.fold<double>(0, (s, e) => s + e.value);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Sales by Category', style: TextStyle(fontWeight: FontWeight.w700, color: cs.primary)),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: PieChart(PieChartData(
              sections: entries.asMap().entries.map((e) {
                final pct = total > 0 ? (e.value.value / total * 100) : 0;
                return PieChartSectionData(
                  value: e.value.value, title: '${pct.toStringAsFixed(0)}%',
                  color: colors[e.key % colors.length], radius: 60,
                  titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                );
              }).toList(),
              centerSpaceRadius: 40,
            )),
          ),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 4, children: entries.asMap().entries.map((e) =>
            Row(mainAxisSize: MainAxisSize.min, children: [
              Container(width: 10, height: 10, decoration: BoxDecoration(
                color: colors[e.key % colors.length], borderRadius: BorderRadius.circular(2))),
              const SizedBox(width: 4),
              Text(e.value.key, style: const TextStyle(fontSize: 11)),
            ])).toList()),
        ]),
      ),
    );
  }

  Widget _buildTopSellers(ColorScheme cs) {
    final medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('🏆 Top Sellers', style: TextStyle(fontWeight: FontWeight.w700, color: cs.primary)),
          const SizedBox(height: 12),
          if (_topSellers.isEmpty)
            const Text('No sales data yet.', style: TextStyle(color: Colors.grey))
          else
            ...List.generate(_topSellers.length, (i) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(children: [
                Text(medals[i], style: const TextStyle(fontSize: 18)),
                const SizedBox(width: 10),
                Expanded(child: Text(_topSellers[i]['name'], style: const TextStyle(fontWeight: FontWeight.w600))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(color: cs.primaryContainer, borderRadius: BorderRadius.circular(12)),
                  child: Text('${_topSellers[i]['count']} sold', style: TextStyle(fontSize: 11, color: cs.onPrimaryContainer)),
                ),
              ]),
            )),
        ]),
      ),
    );
  }
}
