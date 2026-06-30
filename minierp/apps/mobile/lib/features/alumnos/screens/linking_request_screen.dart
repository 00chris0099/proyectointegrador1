import 'package:flutter/material.dart';
import '../../../core/services/student_service.dart';

class LinkingRequestScreen extends StatefulWidget {
  const LinkingRequestScreen({super.key});

  @override
  State<LinkingRequestScreen> createState() => _LinkingRequestScreenState();
}

class _LinkingRequestScreenState extends State<LinkingRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _dniController = TextEditingController();
  final _customParentescoController = TextEditingController();
  String? _selectedParentesco;
  bool _isSubmitting = false;

  final List<String> _parentescos = [
    'Padre',
    'Madre',
    'Abuelo Paterno',
    'Abuela Paterna',
    'Abuelo Materno',
    'Abuela Materna',
    'Tutor',
    'Tía',
    'Tío',
    'Hermano',
    'Hermana',
    'Otro',
  ];

  @override
  void dispose() {
    _dniController.dispose();
    _customParentescoController.dispose();
    super.dispose();
  }

  Future<void> _onSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      final studentService = StudentService();
      final success = await studentService.requestLinking(
        dni: _dniController.text,
        parentesco: _selectedParentesco!,
        parentescoCustom: _selectedParentesco == 'Otro'
            ? _customParentescoController.text
            : null,
      );

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Solicitud de vinculación enviada exitosamente'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(studentService.error ?? 'Error al enviar solicitud'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error de conexión'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Solicitar Vinculación'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Info card
              Card(
                color: Colors.blue[50],
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.blue[700]),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Ingresa el DNI del alumno que deseas vincular. La solicitud será revisada por un administrador.',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.blue[700],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // DNI field
              TextFormField(
                controller: _dniController,
                decoration: const InputDecoration(
                  labelText: 'DNI del Alumno',
                  hintText: '12345678',
                  prefixIcon: Icon(Icons.badge),
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                maxLength: 8,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'El DNI es requerido';
                  }
                  if (value.length != 8) {
                    return 'El DNI debe tener 8 dígitos';
                  }
                  if (!RegExp(r'^\d+$').hasMatch(value)) {
                    return 'El DNI solo debe contener números';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Parentesco dropdown
              DropdownButtonFormField<String>(
                value: _selectedParentesco,
                decoration: const InputDecoration(
                  labelText: 'Parentesco',
                  prefixIcon: Icon(Icons.people),
                  border: OutlineInputBorder(),
                ),
                items: _parentescos.map((String parentesco) {
                  return DropdownMenuItem<String>(
                    value: parentesco,
                    child: Text(parentesco),
                  );
                }).toList(),
                onChanged: (String? newValue) {
                  setState(() {
                    _selectedParentesco = newValue;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Selecciona un parentesco';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Custom parentesco field (if "Otro" is selected)
              if (_selectedParentesco == 'Otro') ...[
                TextFormField(
                  controller: _customParentescoController,
                  decoration: const InputDecoration(
                    labelText: 'Especificar parentesco',
                    hintText: 'Ej: Padrino, Hermano mayor, etc.',
                    prefixIcon: Icon(Icons.edit),
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (_selectedParentesco == 'Otro' &&
                        (value == null || value.trim().isEmpty)) {
                      return 'Especifica el parentesco';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
              ],

              // Submit button
              ElevatedButton(
                onPressed: _isSubmitting ? null : _onSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Enviar Solicitud',
                        style: TextStyle(fontSize: 16),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
