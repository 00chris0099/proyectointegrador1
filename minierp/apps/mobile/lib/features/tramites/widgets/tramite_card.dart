import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/services/tramite_service.dart';

class TramiteCard extends StatelessWidget {
  final Tramite tramite;
  final VoidCallback? onTap;

  const TramiteCard({super.key, required this.tramite, this.onTap});

  Color _getStatusColor(String estado) {
    switch (estado) {
      case 'Pendiente':
        return Colors.orange;
      case 'En Proceso':
        return Colors.blue;
      case 'Observado':
        return Colors.red;
      case 'Derivado a Dirección':
        return Colors.purple;
      case 'Finalizado':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String estado) {
    switch (estado) {
      case 'Pendiente':
        return Icons.access_time;
      case 'En Proceso':
        return Icons.autorenew;
      case 'Observado':
        return Icons.warning_amber;
      case 'Derivado a Dirección':
        return Icons.forward;
      case 'Finalizado':
        return Icons.check_circle;
      default:
        return Icons.help_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(tramite.estado);
    final dateFormat = DateFormat('dd/MM/yyyy');

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _getStatusIcon(tramite.estado),
                      color: statusColor,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          tramite.tipo?.nombre ?? 'Trámite',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          'ID: ${tramite.idSeguimiento}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      tramite.estado,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: statusColor,
                      ),
                    ),
                  ),
                ],
              ),
              if (tramite.alumno != null) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(
                      Icons.person_outline,
                      size: 16,
                      color: Colors.grey[500],
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${tramite.alumno!.nombres} ${tramite.alumno!.apellidos}',
                      style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                    ),
                    const SizedBox(width: 12),
                    Icon(
                      Icons.school_outlined,
                      size: 16,
                      color: Colors.grey[500],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${tramite.alumno!.nivel} ${tramite.alumno!.grado}° ${tramite.alumno!.seccion}',
                      style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 14, color: Colors.grey[500]),
                  const SizedBox(width: 8),
                  Text(
                    dateFormat.format(tramite.fechaCreacion),
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                  if (tramite.documentos.isNotEmpty) ...[
                    const SizedBox(width: 16),
                    Icon(Icons.attach_file, size: 14, color: Colors.grey[500]),
                    const SizedBox(width: 4),
                    Text(
                      '${tramite.documentos.length} archivo(s)',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ],
              ),
              if (tramite.comentario != null &&
                  tramite.comentario!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    tramite.comentario!,
                    style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
