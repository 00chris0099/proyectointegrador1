import 'package:flutter/material.dart';
import '../../../core/services/profile_service.dart';

class EditContactForm extends StatefulWidget {
  final String currentEmail;
  final String? currentPhone;
  final Function onUpdated;

  const EditContactForm({
    super.key,
    required this.currentEmail,
    this.currentPhone,
    required this.onUpdated,
  });

  @override
  State<EditContactForm> createState() => _EditContactFormState();
}

class _EditContactFormState extends State<EditContactForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _verifyCodeController = TextEditingController();

  bool _isSubmitting = false;
  bool _showVerify = false;
  String _newEmail = '';
  String? _message;
  bool _isSuccess = false;

  @override
  void initState() {
    super.initState();
    _emailController.text = widget.currentEmail;
    _phoneController.text = widget.currentPhone ?? '';
  }

  @override
  void dispose() {
    _emailController.dispose();
    _phoneController.dispose();
    _verifyCodeController.dispose();
    super.dispose();
  }

  Future<void> _onSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
      _message = null;
    });

    try {
      final profileService = ProfileService();

      // Si el email cambió, verificar
      if (_emailController.text != widget.currentEmail) {
        final verifyRes = await profileService.verifyEmail(
          _emailController.text,
        );
        if (!verifyRes) {
          setState(() {
            _message = profileService.error ?? 'Error al verificar email';
            _isSuccess = false;
            _isSubmitting = false;
          });
          return;
        }
        _newEmail = _emailController.text;
        setState(() {
          _showVerify = true;
          _isSubmitting = false;
        });
        return;
      }

      // Actualizar teléfono
      if (_phoneController.text != widget.currentPhone) {
        final updateRes = await profileService.updateContactInfo(
          telefono: _phoneController.text,
        );
        if (updateRes) {
          setState(() {
            _message = 'Teléfono actualizado';
            _isSuccess = true;
          });
          widget.onUpdated();
        } else {
          setState(() {
            _message = profileService.error ?? 'Error al actualizar';
            _isSuccess = false;
          });
        }
      } else {
        setState(() {
          _message = 'No hay cambios para guardar';
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

  Future<void> _handleVerifyCode() async {
    if (_verifyCodeController.text.length != 6) return;

    setState(() => _isSubmitting = true);

    try {
      final profileService = ProfileService();
      final res = await profileService.confirmEmail(_verifyCodeController.text);

      if (res) {
        setState(() {
          _message = 'Correo actualizado exitosamente';
          _isSuccess = true;
          _showVerify = false;
        });
        widget.onUpdated();
      } else {
        setState(() {
          _message = profileService.error ?? 'Error al confirmar';
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
    if (_showVerify) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.blue[200]!),
            ),
            child: Text(
              'Se envió un código de 6 dígitos a $_newEmail',
              style: TextStyle(color: Colors.blue[700]),
            ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _verifyCodeController,
            decoration: const InputDecoration(
              labelText: 'Código de verificación',
              hintText: '000000',
            ),
            keyboardType: TextInputType.number,
            maxLength: 6,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              ElevatedButton(
                onPressed:
                    _isSubmitting || _verifyCodeController.text.length != 6
                    ? null
                    : _handleVerifyCode,
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Confirmar'),
              ),
              const SizedBox(width: 12),
              TextButton(
                onPressed: () {
                  setState(() {
                    _showVerify = false;
                    _verifyCodeController.clear();
                  });
                },
                child: const Text('Cancelar'),
              ),
            ],
          ),
        ],
      );
    }

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
            controller: _emailController,
            decoration: const InputDecoration(
              labelText: 'Correo electrónico',
              prefixIcon: Icon(Icons.email),
            ),
            keyboardType: TextInputType.emailAddress,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Email requerido';
              }
              if (!value.contains('@')) {
                return 'Email inválido';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _phoneController,
            decoration: const InputDecoration(
              labelText: 'Teléfono',
              prefixIcon: Icon(Icons.phone),
              hintText: '912345678',
            ),
            keyboardType: TextInputType.phone,
            validator: (value) {
              if (value != null && value.isNotEmpty) {
                if (!RegExp(r'^9\d{8}$').hasMatch(value)) {
                  return 'Teléfono debe tener 9 dígitos y empezar con 9';
                }
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
                : const Text('Guardar cambios'),
          ),
        ],
      ),
    );
  }
}
