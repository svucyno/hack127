import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsProvider extends ChangeNotifier {
  String _shopName = 'ShopSmart';
  String _gstin = '';
  String _upiId = '';
  String _language = 'en';

  String get shopName => _shopName;
  String get gstin => _gstin;
  String get upiId => _upiId;
  String get language => _language;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    _shopName = prefs.getString('shopName') ?? 'ShopSmart';
    _gstin = prefs.getString('gstin') ?? '';
    _upiId = prefs.getString('upiId') ?? '';
    _language = prefs.getString('language') ?? 'en';
    notifyListeners();
  }

  Future<void> save({String? shopName, String? gstin, String? upiId, String? language}) async {
    final prefs = await SharedPreferences.getInstance();
    if (shopName != null) { _shopName = shopName; prefs.setString('shopName', shopName); }
    if (gstin != null) { _gstin = gstin; prefs.setString('gstin', gstin); }
    if (upiId != null) { _upiId = upiId; prefs.setString('upiId', upiId); }
    if (language != null) { _language = language; prefs.setString('language', language); }
    notifyListeners();
  }
}
