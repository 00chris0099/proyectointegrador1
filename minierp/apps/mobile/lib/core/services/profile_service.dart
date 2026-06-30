import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class ProfileService extends ChangeNotifier {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final http.Client _httpClient = http.Client();

  ProfileData? _profile;
  bool _isLoading = false;
  String? _error;

  ProfileData? get profile => _profile;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<String?> _getAccessToken() async {
    return await _storage.read(key: 'access_token');
  }

  Future<ProfileData?> getProfile() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final token = await _getAccessToken();
      if (token == null) {
        _error = 'No hay token de acceso';
        _isLoading = false;
        notifyListeners();
        return null;
      }

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/users/profile'),
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'accessToken=$token',
        },
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success']) {
        _profile = ProfileData.fromJson(data['data']);
        _isLoading = false;
        notifyListeners();
        return _profile;
      } else {
        _error = data['message'] ?? 'Error al cargar perfil';
        _isLoading = false;
        notifyListeners();
        return null;
      }
    } catch (e) {
      _error = 'Error de conexión';
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  Future<bool> updateContactInfo({String? email, String? telefono}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final token = await _getAccessToken();
      if (token == null) {
        _error = 'No hay token de acceso';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final body = <String, String>{};
      if (email != null) body['email'] = email;
      if (telefono != null) body['telefono'] = telefono;

      final response = await http.patch(
        Uri.parse('${ApiConfig.baseUrl}/api/users/profile'),
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'accessToken=$token',
        },
        body: json.encode(body),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success']) {
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = data['message'] ?? 'Error al actualizar perfil';
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

  Future<bool> verifyEmail(String email) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final token = await _getAccessToken();
      if (token == null) {
        _error = 'No hay token de acceso';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/users/profile/verify-email'),
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'accessToken=$token',
        },
        body: json.encode({'email': email}),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success']) {
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = data['message'] ?? 'Error al verificar email';
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

  Future<bool> confirmEmail(String codigo) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final token = await _getAccessToken();
      if (token == null) {
        _error = 'No hay token de acceso';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/users/profile/confirm-email'),
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'accessToken=$token',
        },
        body: json.encode({'codigo': codigo}),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success']) {
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = data['message'] ?? 'Error al confirmar email';
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

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final token = await _getAccessToken();
      if (token == null) {
        _error = 'No hay token de acceso';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final response = await http.patch(
        Uri.parse('${ApiConfig.baseUrl}/api/users/profile/password'),
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'accessToken=$token',
        },
        body: json.encode({
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        }),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success']) {
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = data['message'] ?? 'Error al cambiar contraseña';
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

  Future<bool> uploadAvatar(String imageUrl) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final token = await _getAccessToken();
      if (token == null) {
        _error = 'No hay token de acceso';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/users/profile/avatar'),
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'accessToken=$token',
        },
        body: json.encode({'imageUrl': imageUrl}),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success']) {
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = data['message'] ?? 'Error al subir avatar';
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
}

class ProfileData {
  final String id;
  final String email;
  final String nombres;
  final String apellidos;
  final String dni;
  final String? telefono;
  final String? avatarUrl;
  final List<String> roles;

  ProfileData({
    required this.id,
    required this.email,
    required this.nombres,
    required this.apellidos,
    required this.dni,
    this.telefono,
    this.avatarUrl,
    required this.roles,
  });

  String get fullName => '$nombres $apellidos';

  factory ProfileData.fromJson(Map<String, dynamic> json) {
    return ProfileData(
      id: json['id'],
      email: json['email'],
      nombres: json['nombres'],
      apellidos: json['apellidos'],
      dni: json['dni'],
      telefono: json['telefono'],
      avatarUrl: json['avatarUrl'],
      roles: List<String>.from(json['roles'] ?? []),
    );
  }
}
