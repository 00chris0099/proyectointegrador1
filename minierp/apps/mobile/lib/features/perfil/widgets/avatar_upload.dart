import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../core/services/profile_service.dart';

class AvatarUpload extends StatefulWidget {
  final String? currentAvatar;
  final Function(String) onAvatarUpdated;

  const AvatarUpload({
    super.key,
    this.currentAvatar,
    required this.onAvatarUpdated,
  });

  @override
  State<AvatarUpload> createState() => _AvatarUploadState();
}

class _AvatarUploadState extends State<AvatarUpload> {
  bool _isUploading = false;
  String? _preview;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _preview = widget.currentAvatar;
  }

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 80,
    );

    if (image != null) {
      setState(() {
        _preview = image.path;
        _isUploading = true;
      });

      // TODO: Implementar upload a imgBB
      // Por ahora solo mostramos preview
      setState(() => _isUploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Stack(
          children: [
            if (_preview != null)
              CircleAvatar(
                radius: 50,
                backgroundImage: _preview!.startsWith('http')
                    ? NetworkImage(_preview!)
                    : FileImage(File(_preview!)) as ImageProvider,
              )
            else
              CircleAvatar(
                radius: 50,
                backgroundColor: Colors.blue[600],
                child: Text(
                  'U',
                  style: const TextStyle(
                    fontSize: 40,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            if (_isUploading)
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: CircularProgressIndicator(color: Colors.white),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        ElevatedButton.icon(
          onPressed: _isUploading ? null : _pickImage,
          icon: const Icon(Icons.camera_alt),
          label: const Text('Cambiar foto'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.grey[200],
            foregroundColor: Colors.grey[700],
          ),
        ),
      ],
    );
  }
}
