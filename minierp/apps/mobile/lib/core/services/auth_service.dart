import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class AuthService extends ChangeNotifier {
  String? _accessToken;
  String? _refreshToken;
  User? _user;
  bool _isLoading = true;
  String? _error;

  bool get isAuthenticated => _accessToken != null;
  bool get isLoading => _isLoading;
  String? get error => _error;
  User? get user => _user;
  String? get accessToken => _accessToken;

  AuthService() {
    _loadTokens();
  }

  Future<void> _loadTokens() async {
    try {
      // For web, try to get from localStorage equivalent
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      debugPrint('Error cargando tokens: $e');
      _isLoading = false;
      notifyListeners();
    }
  }

  Map<String, String> get authHeaders => {
    'Content-Type': 'application/json',
    if (_accessToken != null) 'Authorization': 'Bearer $_accessToken',
  };

  Future<bool> login(String email, String password) async {
    _error = null;
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email, 'password': password}),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success']) {
        _accessToken = data['data']['accessToken'];
        _refreshToken = data['data']['refreshToken'];
        _user = User.fromJson(data['data']);

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = data['message'] ?? 'Error al iniciar sesión';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error de conexión: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _accessToken = null;
    _refreshToken = null;
    _user = null;
    notifyListeners();
  }

  Future<bool> refreshToken() async {
    if (_refreshToken == null) return false;

    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'refreshToken': _refreshToken}),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success']) {
        _accessToken = data['data']?['accessToken'] ?? _accessToken;
        _refreshToken = data['data']?['refreshToken'] ?? _refreshToken;
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('Error refrescando token: $e');
    }

    return false;
  }

  Future<Map<String, dynamic>?> getProfile() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/auth/me'),
        headers: authHeaders,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success']) {
          return data['data'];
        }
      } else if (response.statusCode == 401) {
        final refreshed = await refreshToken();
        if (refreshed) {
          return getProfile();
        }
      }
    } catch (e) {
      debugPrint('Error obteniendo perfil: $e');
    }
    return null;
  }
}

class User {
  final String id;
  final String email;
  final String nombres;
  final String apellidos;
  final List<String> roles;

  User({
    required this.id,
    required this.email,
    required this.nombres,
    required this.apellidos,
    required this.roles,
  });

  String get fullName => '$nombres $apellidos';

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      email: json['email'],
      nombres: json['nombres'],
      apellidos: json['apellidos'],
      roles: List<String>.from(json['roles'] ?? []),
    );
  }
}
