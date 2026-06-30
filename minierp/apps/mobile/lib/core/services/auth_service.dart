import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class AuthService extends ChangeNotifier {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final http.Client _httpClient = http.Client();

  String? _accessToken;
  String? _refreshToken;
  User? _user;
  bool _isLoading = true;
  String? _error;

  bool get isAuthenticated => _accessToken != null;
  bool get isLoading => _isLoading;
  String? get error => _error;
  User? get user => _user;

  AuthService() {
    _loadTokens();
  }

  Future<void> _loadTokens() async {
    try {
      _accessToken = await _storage.read(key: 'access_token');
      _refreshToken = await _storage.read(key: 'refresh_token');

      if (_accessToken != null) {
        await _loadUser();
      }
    } catch (e) {
      debugPrint('Error cargando tokens: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _loadUser() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/auth/me'),
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'accessToken=$_accessToken',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success']) {
          _user = User.fromJson(data['data']);
        }
      }
    } catch (e) {
      debugPrint('Error cargando perfil: $e');
    }
  }

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
        // Extraer tokens de las cookies
        final cookies = response.headers['set-cookie'];
        if (cookies != null) {
          final cookieList = cookies.split(',');
          for (var cookie in cookieList) {
            final parts = cookie.split(';')[0].trim().split('=');
            if (parts.length == 2) {
              if (parts[0] == 'accessToken') {
                _accessToken = parts[1];
              } else if (parts[0] == 'refreshToken') {
                _refreshToken = parts[1];
              }
            }
          }
        }

        // Guardar tokens
        if (_accessToken != null) {
          await _storage.write(key: 'access_token', value: _accessToken);
        }
        if (_refreshToken != null) {
          await _storage.write(key: 'refresh_token', value: _refreshToken);
        }

        // Guardar datos del usuario
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
      _error = 'Error de conexión';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      if (_accessToken != null) {
        await http.post(
          Uri.parse('${ApiConfig.baseUrl}/api/auth/logout'),
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'accessToken=$_accessToken',
          },
        );
      }
    } catch (e) {
      debugPrint('Error en logout: $e');
    } finally {
      _accessToken = null;
      _refreshToken = null;
      _user = null;
      await _storage.delete(key: 'access_token');
      await _storage.delete(key: 'refresh_token');
      notifyListeners();
    }
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
        final cookies = response.headers['set-cookie'];
        if (cookies != null) {
          final cookieList = cookies.split(',');
          for (var cookie in cookieList) {
            final parts = cookie.split(';')[0].trim().split('=');
            if (parts.length == 2) {
              if (parts[0] == 'accessToken') {
                _accessToken = parts[1];
              } else if (parts[0] == 'refreshToken') {
                _refreshToken = parts[1];
              }
            }
          }
        }

        if (_accessToken != null) {
          await _storage.write(key: 'access_token', value: _accessToken);
        }
        if (_refreshToken != null) {
          await _storage.write(key: 'refresh_token', value: _refreshToken);
        }

        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('Error refrescando token: $e');
    }

    return false;
  }

  String? get accessToken => _accessToken;
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
