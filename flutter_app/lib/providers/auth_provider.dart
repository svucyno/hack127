import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _service;
  User? _user;
  String _role = 'User';
  bool _loading = false;
  String? _error;

  AuthProvider(this._service) {
    _service.authStateChanges.listen((user) async {
      _user = user;
      if (user != null) {
        _role = await _service.getUserRole(user.uid);
      } else {
        _role = 'User';
      }
      notifyListeners();
    });
  }

  User? get user => _user;
  String get role => _role;
  bool get loading => _loading;
  String? get error => _error;
  bool get isLoggedIn => _user != null;

  Future<bool> signIn(String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await _service.signIn(email, password);
      return true;
    } catch (e) {
      _error = _service.friendlyError(e);
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await _service.signOut();
    _user = null;
    _role = 'User';
    notifyListeners();
  }
}
