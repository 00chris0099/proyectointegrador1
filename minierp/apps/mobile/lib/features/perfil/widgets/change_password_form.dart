import 'package:flutter/material.dart';
import '../../../core/services/profile_service.dart';

class ChangePasswordForm extends StatefulWidget {
  final Function onUpdated;

  const ChangePasswordForm({super.key, required this.onUpdated});

  @override
  State<ChangePasswordForm> createState() => _ChangePasswordFormState();
}

class _ChangePasswordFormState extends State<ChangePasswordForm> {
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isSubmitting = false;
  bool _showCurrent = false;
  bool _showNew = false;
  bool _showConfirm = false;
  String? _message;
  bool _isSuccess = false;

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  int _getStrength(String pwd) {
    int s = 0;
    if (pwd.length >= 10) s++;
    if (RegExp(r'[A-Z]').hasMatch(pwd)) s++;
    if (RegExp(r'[0-9]').hasMatch(pwd)) s++;
    if (RegExp(r'[!@#$%^&*]').hasMatch(pwd)) s++;
    return s;
  }

  Future<void> _onSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
      _message = null;
    });

    try {
      final profileService = ProfileService();
      final res = await profileService.changePassword(
        currentPassword: _currentPasswordController.text,
        newPassword: _newPasswordController.text,
      );

      if (res) {
        setState(() {
          _message = 'Contraseña actualizada exitosamente';
          _isSuccess = true;
        });
        _currentPasswordController.clear();
        _newPasswordController.clear();
        _confirmPasswordController.clear();
        widget.onUpdated();
      } else {
        setState(() {
          _message = profileService.error ?? 'Error al cambiar contraseña';
          _isSuccess = false;
        });
      }
    } catch (e) {
      setState(() {
        _message = 'Error de conexión';
        _isSuccess = false;
      });
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final newPassword = _newPasswordController.text;
    final strength = _getStrength(newPassword);
    final strengthColors = [
      Colors.red,
      Colors.orange,
      Colors.yellow,
      Colors.green,
    ];
    final strengthLabels = ['Débil', 'Regular', 'Buena', 'Fuerte'];

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_message != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: _isSuccess ? Colors.green[50] : Colors.red[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _isSuccess ? Colors.green[200]! : Colors.red[200]!,
                ),
              ),
              child: Text(
                _message!,
                style: TextStyle(
                  color: _isSuccess ? Colors.green[700] : Colors.red[700],
                ),
              ),
            ),
          TextFormField(
            controller: _currentPasswordController,
            decoration: InputDecoration(
              labelText: 'Contraseña actual',
              prefixIcon: const Icon(Icons.lock),
              suffixIcon: IconButton(
                icon: Icon(
                  _showCurrent ? Icons.visibility_off : Icons.visibility,
                ),
                onPressed: () => setState(() => _showCurrent = !_showCurrent),
              ),
            ),
            obscureText: !_showCurrent,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Contraseña actual requerida';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _newPasswordController,
            decoration: InputDecoration(
              labelText: 'Nueva contraseña',
              prefixIcon: const Icon(Icons.lock),
              suffixIcon: IconButton(
                icon: Icon(_showNew ? Icons.visibility_off : Icons.visibility),
                onPressed: () => setState(() => _showNew = !_showNew),
              ),
            ),
            obscureText: !_showNew,
            onChanged: (_) => setState(() {}),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Nueva contraseña requerida';
              }
              if (value.length < 10) {
                return 'Mínimo 10 caracteres';
              }
              if (!RegExp(r'[A-Z]').hasMatch(value)) {
                return 'Debe contener al menos 1 mayúscula';
              }
              if (!RegExp(r'[0-9]').hasMatch(value)) {
                return 'Debe contener al menos 1 número';
              }
              if (!RegExp(r'[!@#$%^&*]').hasMatch(value)) {
                return 'Debe contener al menos 1 carácter especial';
              }
              return null;
            },
          ),
          if (newPassword.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: List.generate(4, (i) {
                      return Expanded(
                        child: Container(
                          height: 4,
                          margin: const EdgeInsets.only(right: 4),
                          decoration: BoxDecoration(
                            color: i < strength
                                ? strengthColors[strength - 1]
                                : Colors.grey[300],
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Fortaleza: ${strength > 0 ? strengthLabels[strength - 1] : 'Muy débil'}',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _confirmPasswordController,
            decoration: InputDecoration(
              labelText: 'Confirmar contraseña',
              prefixIcon: const Icon(Icons.lock),
              suffixIcon: IconButton(
                icon: Icon(
                  _showConfirm ? Icons.visibility_off : Icons.visibility,
                ),
                onPressed: () => setState(() => _showConfirm = !_showConfirm),
              ),
            ),
            obscureText: !_showConfirm,
            validator: (value) {
              if (value != _newPasswordController.text) {
                return 'Las contraseñas no coinciden';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _isSubmitting ? null : _onSubmit,
            child: _isSubmitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Cambiar contraseña'),
          ),
        ],
      ),
    );
  }
}
