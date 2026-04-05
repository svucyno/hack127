import 'package:flutter/material.dart';
import '../services/inventory_service.dart';
import '../models/product.dart';

class InventoryProvider extends ChangeNotifier {
  final InventoryService _service;
  List<Product> _products = [];
  bool _loading = false;
  String? _error;
  String _searchQuery = '';
  String _categoryFilter = '';

  InventoryProvider(this._service);

  List<Product> get products {
    var list = _products;
    if (_categoryFilter.isNotEmpty) {
      list = list.where((p) => p.category == _categoryFilter).toList();
    }
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      list = list.where((p) =>
          p.name.toLowerCase().contains(q) ||
          p.company.toLowerCase().contains(q)).toList();
    }
    return list;
  }

  List<Product> get allProducts => _products;
  bool get loading => _loading;
  String? get error => _error;
  String get categoryFilter => _categoryFilter;

  void setSearch(String q) { _searchQuery = q; notifyListeners(); }
  void setCategory(String c) { _categoryFilter = c; notifyListeners(); }

  Future<void> loadProducts() async {
    _loading = true; notifyListeners();
    try {
      _products = await _service.getProducts();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false; notifyListeners();
    }
  }

  Future<void> addProduct(Product p) async {
    await _service.addProduct(p);
    await loadProducts();
  }

  Future<void> deleteProduct(String id) async {
    await _service.deleteProduct(id);
    await loadProducts();
  }
}
