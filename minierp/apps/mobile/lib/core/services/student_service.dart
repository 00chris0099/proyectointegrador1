import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class StudentService extends ChangeNotifier {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final http.Client _httpClient = http.Client();

  List<StudentData> _students = [];
  bool _isLoading = false;
  String? _error;

  List<StudentData> get students => _students;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<String?> _getAccessToken() async {
    return await _storage.read(key: 'access_token');
  }

  Future<List<StudentData>> getStudentsByGuardian() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final token = await _getAccessToken();
      if (token == null) {
        _error = 'No hay token de acceso';
        _isLoading = false;
        notifyListeners();
        return [];
      }

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/apoderados/me/alumnos'),
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'accessToken=$token',
        },
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success']) {
        _students = (data['data'] as List)
            .map((item) => StudentData.fromJson(item))
            .toList();
        _isLoading = false;
        notifyListeners();
        return _students;
      } else {
        _error = data['message'] ?? 'Error al cargar alumnos';
        _isLoading = false;
        notifyListeners();
        return [];
      }
    } catch (e) {
      _error = 'Error de conexión';
      _isLoading = false;
      notifyListeners();
      return [];
    }
  }

  Future<bool> requestLinking({
    required String dni,
    required String parentesco,
    String? parentescoCustom,
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

      final body = {'dni': dni, 'parentesco': parentesco};

      if (parentesco == 'Otro' && parentescoCustom != null) {
        body['parentescoCustom'] = parentescoCustom;
      }

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/apoderados/me/solicitud'),
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'accessToken=$token',
        },
        body: json.encode(body),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 201 && data['success']) {
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = data['message'] ?? 'Error al enviar solicitud';
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

  Future<bool> cancelRequest(int requestId) async {
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

      final response = await http.delete(
        Uri.parse(
          '${ApiConfig.baseUrl}/api/apoderados/me/solicitudes/$requestId',
        ),
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'accessToken=$token',
        },
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success']) {
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = data['message'] ?? 'Error al cancelar solicitud';
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

class StudentData {
  final String id;
  final String dni;
  final String nombres;
  final String apellidos;
  final String nivel;
  final int grado;
  final String seccion;
  final bool estado;
  final String? fechaNac;
  final String parentesco;
  final bool esPrincipal;

  StudentData({
    required this.id,
    required this.dni,
    required this.nombres,
    required this.apellidos,
    required this.nivel,
    required this.grado,
    required this.seccion,
    required this.estado,
    this.fechaNac,
    required this.parentesco,
    required this.esPrincipal,
  });

  String get fullName => '$nombres $apellidos';
  String get gradoSeccion => '${grado}° $seccion';

  factory StudentData.fromJson(Map<String, dynamic> json) {
    return StudentData(
      id: json['id'],
      dni: json['dni'],
      nombres: json['nombres'],
      apellidos: json['apellidos'],
      nivel: json['nivel'],
      grado: json['grado'],
      seccion: json['seccion'],
      estado: json['estado'],
      fechaNac: json['fechaNac'],
      parentesco: json['parentesco'],
      esPrincipal: json['esPrincipal'] ?? false,
    );
  }
}
