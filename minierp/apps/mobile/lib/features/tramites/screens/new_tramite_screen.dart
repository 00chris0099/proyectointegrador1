import 'dart:io';
import 'package:flutter/material.dart';
import '../../../core/services/tramite_service.dart';
import '../widgets/document_upload_widget.dart';

class NewTramiteScreen extends StatefulWidget {
  const NewTramiteScreen({super.key});

  @override
  State<NewTramiteScreen> createState() => _NewTramiteScreenState();
}

class _NewTramiteScreenState extends State<NewTramiteScreen> {
  final TramiteService _tramiteService = TramiteService();
  final TextEditingController _comentarioController = TextEditingController();

  List<TipoTramite> _tipos = [];
  List<AlumnoInfo> _alumnos = [];
  List<File> _pendingFiles = [];
  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _error;
  String? _success;

  int? _selectedTipoId;
  String? _selectedAlumnoId;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _comentarioController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        _tramiteService.getTipos(),
        _tramiteService.getMisAlumnos(),
      ]);

      setState(() {
        _tipos = results[0] as List<TipoTramite>;
        _alumnos = results[1] as List<AlumnoInfo>;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _submit() async {
    if (_selectedTipoId == null) {
      setState(() => _error = 'Selecciona un tipo de trámite');
      return;
    }
    if (_selectedAlumnoId == null) {
      setState(() => _error = 'Selecciona un alumno');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final tramite = await _tramiteService.createTramite(
        alumnoId: _selectedAlumnoId!,
        tipoId: _selectedTipoId!,
        comentario: _comentarioController.text.isNotEmpty
            ? _comentarioController.text
            : null,
      );

      for (final file in _pendingFiles) {
        await _tramiteService.uploadDocumento(
          tramiteId: tramite.id,
          file: file,
        );
      }

      setState(() {
        _success = 'Trámite creado exitosamente\nID: ${tramite.idSeguimiento}';
        _isSubmitting = false;
      });

      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          Navigator.pop(context, true);
        }
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nuevo Trámite'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _success != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.check_circle, size: 64, color: Colors.green[500]),
                  const SizedBox(height: 16),
                  Text(
                    _success!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_error != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red[200]!),
                      ),
                      child: Text(
                        _error!,
                        style: TextStyle(color: Colors.red[700]),
                      ),
                    ),
                  const Text(
                    'Tipo de Trámite *',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<int>(
                    value: _selectedTipoId,
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 12,
                      ),
                    ),
                    hint: const Text('Seleccionar tipo...'),
                    items: _tipos.map((tipo) {
                      return DropdownMenuItem<int>(
                        value: tipo.id,
                        child: Text(tipo.nombre),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() => _selectedTipoId = value);
                    },
                  ),
                  if (_selectedTipoId != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      _tipos
                              .firstWhere((t) => t.id == _selectedTipoId)
                              .descripcion ??
                          '',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                  const SizedBox(height: 16),
                  const Text(
                    'Alumno *',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _selectedAlumnoId,
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 12,
                      ),
                    ),
                    hint: const Text('Seleccionar alumno...'),
                    items: _alumnos.map((alumno) {
                      return DropdownMenuItem<String>(
                        value: alumno.id,
                        child: Text(
                          '${alumno.nombres} ${alumno.apellidos} - ${alumno.nivel} ${alumno.grado}°${alumno.seccion}',
                        ),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() => _selectedAlumnoId = value);
                    },
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Observaciones',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _comentarioController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      hintText: 'Describe brevemente el motivo...',
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Documentos Adjuntos',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 8),
                  DocumentUploadWidget(
                    onUpload: (file) async {
                      setState(() => _pendingFiles.add(file));
                    },
                    disabled: _isSubmitting,
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.white,
                                ),
                              ),
                            )
                          : const Text(
                              'Crear Trámite',
                              style: TextStyle(fontSize: 16),
                            ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
