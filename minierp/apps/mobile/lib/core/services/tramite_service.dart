import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'auth_service.dart';

class TipoTramite {
  final int id;
  final String nombre;
  final String? descripcion;
  final List<String> requisitos;

  TipoTramite({
    required this.id,
    required this.nombre,
    this.descripcion,
    this.requisitos = const [],
  });

  factory TipoTramite.fromJson(Map<String, dynamic> json) {
    return TipoTramite(
      id: json['id'],
      nombre: json['nombre'],
      descripcion: json['descripcion'],
      requisitos: json['requisitos'] != null
          ? List<String>.from(json['requisitos'])
          : [],
    );
  }
}

class AlumnoInfo {
  final String id;
  final String dni;
  final String nombres;
  final String apellidos;
  final String nivel;
  final int grado;
  final String seccion;

  AlumnoInfo({
    required this.id,
    required this.dni,
    required this.nombres,
    required this.apellidos,
    required this.nivel,
    required this.grado,
    required this.seccion,
  });

  factory AlumnoInfo.fromJson(Map<String, dynamic> json) {
    return AlumnoInfo(
      id: json['id'],
      dni: json['dni'],
      nombres: json['nombres'],
      apellidos: json['apellidos'],
      nivel: json['nivel'],
      grado: json['grado'],
      seccion: json['seccion'],
    );
  }
}

class DocumentoInfo {
  final int id;
  final String? urlArchivo;
  final String nombreOriginal;
  final String tipoMime;
  final int pesoBytes;

  DocumentoInfo({
    required this.id,
    this.urlArchivo,
    required this.nombreOriginal,
    required this.tipoMime,
    required this.pesoBytes,
  });

  factory DocumentoInfo.fromJson(Map<String, dynamic> json) {
    return DocumentoInfo(
      id: json['id'],
      urlArchivo: json['urlArchivo'],
      nombreOriginal: json['nombreOriginal'],
      tipoMime: json['tipoMime'],
      pesoBytes: json['pesoBytes'],
    );
  }
}

class Tramite {
  final String id;
  final String idSeguimiento;
  final String estado;
  final String? comentario;
  final DateTime fechaCreacion;
  final DateTime? fechaCulminacion;
  final AlumnoInfo? alumno;
  final TipoTramite? tipo;
  final List<DocumentoInfo> documentos;

  Tramite({
    required this.id,
    required this.idSeguimiento,
    required this.estado,
    this.comentario,
    required this.fechaCreacion,
    this.fechaCulminacion,
    this.alumno,
    this.tipo,
    this.documentos = const [],
  });

  factory Tramite.fromJson(Map<String, dynamic> json) {
    return Tramite(
      id: json['id'],
      idSeguimiento: json['idSeguimiento'],
      estado: json['estado'],
      comentario: json['comentario'],
      fechaCreacion: DateTime.parse(json['fechaCreacion']),
      fechaCulminacion: json['fechaCulminacion'] != null
          ? DateTime.parse(json['fechaCulminacion'])
          : null,
      alumno: json['alumno'] != null
          ? AlumnoInfo.fromJson(json['alumno'])
          : null,
      tipo: json['tipo'] != null ? TipoTramite.fromJson(json['tipo']) : null,
      documentos: json['documentos'] != null
          ? (json['documentos'] as List)
                .map((d) => DocumentoInfo.fromJson(d))
                .toList()
          : [],
    );
  }
}

class TramiteService {
  String? _accessToken;

  void setToken(String? token) {
    _accessToken = token;
  }

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_accessToken != null) 'Authorization': 'Bearer $_accessToken',
  };

  Future<List<TipoTramite>> getTipos() async {
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/api/tramites/tipos'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List<dynamic> tiposJson = data['data'];
      return tiposJson.map((json) => TipoTramite.fromJson(json)).toList();
    } else {
      throw Exception('Error al cargar tipos de trámite');
    }
  }

  Future<List<AlumnoInfo>> getMisAlumnos() async {
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/api/apoderados/me/alumnos'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List<dynamic> alumnosJson = data['data'];
      return alumnosJson.map((json) => AlumnoInfo.fromJson(json)).toList();
    } else {
      throw Exception('Error al cargar alumnos');
    }
  }

  Future<Tramite> createTramite({
    required String alumnoId,
    required int tipoId,
    String? comentario,
  }) async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/api/tramites'),
      headers: _headers,
      body: json.encode({
        'alumnoId': alumnoId,
        'tipoId': tipoId,
        if (comentario != null) 'comentario': comentario,
      }),
    );

    if (response.statusCode == 201) {
      final data = json.decode(response.body);
      return Tramite.fromJson(data['data']);
    } else {
      final error = json.decode(response.body);
      throw Exception(error['message'] ?? 'Error al crear trámite');
    }
  }

  Future<List<Tramite>> getMisTramites() async {
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/api/tramites/me'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List<dynamic> tramitesJson = data['data'];
      return tramitesJson.map((json) => Tramite.fromJson(json)).toList();
    } else {
      throw Exception('Error al cargar trámites');
    }
  }

  Future<Tramite> getTramiteById(String id) async {
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/api/tramites/$id'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return Tramite.fromJson(data['data']);
    } else {
      throw Exception('Error al cargar trámite');
    }
  }

  Future<void> uploadDocumento({
    required String tramiteId,
    required File file,
  }) async {
    final uri = Uri.parse(
      '${ApiConfig.baseUrl}/api/tramites/$tramiteId/documentos',
    );
    final request = http.MultipartRequest('POST', uri);

    request.headers['Cookie'] = 'accessToken=$_accessToken';

    final fileBytes = await file.readAsBytes();
    final fileName = file.path.split('/').last;

    request.files.add(
      http.MultipartFile.fromBytes('file', fileBytes, filename: fileName),
    );

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode != 201) {
      final error = json.decode(response.body);
      throw Exception(error['message'] ?? 'Error al subir documento');
    }
  }

  Future<List<DocumentoInfo>> getDocumentos(String tramiteId) async {
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/api/tramites/$tramiteId/documentos'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List<dynamic> docsJson = data['data'];
      return docsJson.map((json) => DocumentoInfo.fromJson(json)).toList();
    } else {
      throw Exception('Error al cargar documentos');
    }
  }

  Future<void> deleteDocumento(String tramiteId, int docId) async {
    final response = await http.delete(
      Uri.parse(
        '${ApiConfig.baseUrl}/api/tramites/$tramiteId/documentos/$docId',
      ),
      headers: _headers,
    );

    if (response.statusCode != 200) {
      final error = json.decode(response.body);
      throw Exception(error['message'] ?? 'Error al eliminar documento');
    }
  }
}
