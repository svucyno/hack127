import 'package:flutter/material.dart';
import '../services/supplier_service.dart';
import '../models/supplier.dart';

class SupplierProvider extends ChangeNotifier {
  final SupplierService _service;
  List<Supplier> _suppliers = [];
  bool _loading = false;

  SupplierProvider(this._service);

  List<Supplier> get suppliers => _suppliers;
  bool get loading => _loading;

  void listenToSuppliers() {
    _service.suppliersStream().listen((list) {
      _suppliers = list;
      notifyListeners();
    });
  }
}
