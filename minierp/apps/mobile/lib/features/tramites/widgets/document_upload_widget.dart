import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';

class DocumentUploadWidget extends StatefulWidget {
  final Function(File file) onUpload;
  final bool disabled;

  const DocumentUploadWidget({
    super.key,
    required this.onUpload,
    this.disabled = false,
  });

  @override
  State<DocumentUploadWidget> createState() => _DocumentUploadWidgetState();
}

class _DocumentUploadWidgetState extends State<DocumentUploadWidget> {
  List<File> _files = [];
  bool _isUploading = false;
  int _uploadingIndex = -1;
  String? _error;

  static const List<String> _allowedExtensions = ['pdf', 'jpg', 'jpeg'];
  static const int _maxFileSize = 5 * 1024 * 1024; // 5MB

  Future<void> _pickFiles() async {
    if (widget.disabled) return;

    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: _allowedExtensions,
        allowMultiple: true,
      );

      if (result != null && result.files.isNotEmpty) {
        final validFiles = <File>[];

        for (final platformFile in result.files) {
          final file = File(platformFile.path!);

          if (platformFile.size > _maxFileSize) {
            setState(() {
              _error =
                  'El archivo ${platformFile.name} excede el límite de 5MB';
            });
            continue;
          }

          validFiles.add(file);
        }

        setState(() {
          _files = [..._files, ...validFiles];
          _error = null;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error al seleccionar archivos';
      });
    }
  }

  void _removeFile(int index) {
    setState(() {
      final newFiles = <File>[];
      for (int i = 0; i < _files.length; i++) {
        if (i != index) newFiles.add(_files[i]);
      }
      _files = newFiles;
    });
  }

  Future<void> _uploadAll() async {
    if (_files.isEmpty) return;

    setState(() {
      _isUploading = true;
      _error = null;
    });

    try {
      for (int i = 0; i < _files.length; i++) {
        setState(() => _uploadingIndex = i);
        await widget.onUpload(_files[i]);
      }
      setState(() => _files = []);
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _isUploading = false;
        _uploadingIndex = -1;
      });
    }
  }

  String _formatSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(2)} MB';
  }

  Widget _getFileIcon(String path) {
    if (path.toLowerCase().endsWith('.pdf')) {
      return const Icon(Icons.picture_as_pdf, color: Colors.red, size: 20);
    }
    return const Icon(Icons.image, color: Colors.blue, size: 20);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: widget.disabled ? null : _pickFiles,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(
                color: widget.disabled ? Colors.grey[300]! : Colors.grey[300]!,
              ),
              borderRadius: BorderRadius.circular(8),
              color: widget.disabled ? Colors.grey[50] : null,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.cloud_upload,
                  color: widget.disabled ? Colors.grey[400] : Colors.blue[600],
                  size: 24,
                ),
                const SizedBox(width: 8),
                Text(
                  widget.disabled
                      ? 'No se pueden agregar documentos'
                      : 'Seleccionar archivos',
                  style: TextStyle(
                    color: widget.disabled
                        ? Colors.grey[500]
                        : Colors.blue[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'PDF o JPG, máximo 5MB por archivo',
          style: TextStyle(fontSize: 12, color: Colors.grey[500]),
        ),
        if (_error != null) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.red[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.red[200]!),
            ),
            child: Text(
              _error!,
              style: TextStyle(color: Colors.red[700], fontSize: 13),
            ),
          ),
        ],
        if (_files.isNotEmpty) ...[
          const SizedBox(height: 12),
          ...List.generate(_files.length, (index) {
            final file = _files[index];
            final fileName = file.path.split('/').last;
            final fileSize = file.lengthSync();

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: _uploadingIndex == index
                    ? Colors.blue[50]
                    : Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  _getFileIcon(file.path),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          fileName,
                          style: const TextStyle(fontSize: 13),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          _formatSize(fileSize),
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (_uploadingIndex == index)
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  else if (!_isUploading)
                    IconButton(
                      icon: const Icon(Icons.close, size: 16),
                      onPressed: () => _removeFile(index),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                ],
              ),
            );
          }),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isUploading ? null : _uploadAll,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: _isUploading
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Text('Subir ${_files.length} archivo(s)'),
            ),
          ),
        ],
      ],
    );
  }
}
