import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/services/profile_service.dart';
import '../../../core/services/auth_service.dart';
import '../widgets/avatar_upload.dart';
import '../widgets/edit_contact_form.dart';
import '../widgets/change_password_form.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late ProfileService _profileService;
  ProfileData? _profile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _profileService = ProfileService();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);
    _profile = await _profileService.getProfile();
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mi Perfil'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _profile == null
          ? const Center(child: Text('Error al cargar perfil'))
          : RefreshIndicator(
              onRefresh: _loadProfile,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Avatar y Info
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          AvatarUpload(
                            currentAvatar: _profile!.avatarUrl,
                            onAvatarUpdated: (url) {
                              setState(() {
                                _profile = ProfileData(
                                  id: _profile!.id,
                                  email: _profile!.email,
                                  nombres: _profile!.nombres,
                                  apellidos: _profile!.apellidos,
                                  dni: _profile!.dni,
                                  telefono: _profile!.telefono,
                                  avatarUrl: url,
                                  roles: _profile!.roles,
                                );
                              });
                            },
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _profile!.fullName,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'DNI: ${_profile!.dni}',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            children: _profile!.roles.map((role) {
                              return Chip(
                                label: Text(
                                  role,
                                  style: const TextStyle(fontSize: 12),
                                ),
                                backgroundColor: Colors.blue[100],
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Datos de Contacto
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Datos de Contacto',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          EditContactForm(
                            currentEmail: _profile!.email,
                            currentPhone: _profile!.telefono,
                            onUpdated: _loadProfile,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Cambiar Contraseña
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Cambiar Contraseña',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          ChangePasswordForm(onUpdated: _loadProfile),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
