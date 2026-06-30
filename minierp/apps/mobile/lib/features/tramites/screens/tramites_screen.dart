import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/services/tramite_service.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/sse_service.dart';
import '../widgets/tramite_card.dart';
import 'new_tramite_screen.dart';

class TramitesScreen extends StatefulWidget {
  const TramitesScreen({super.key});

  @override
  State<TramitesScreen> createState() => _TramitesScreenState();
}

class _TramitesScreenState extends State<TramitesScreen> {
  final TramiteService _tramiteService = TramiteService();
  final SSEService _sseService = SSEService();
  List<Tramite> _tramites = [];
  bool _isLoading = true;
  String? _error;
  String _filter = 'Todas';
  bool _isSSEConnected = false;

  @override
  void initState() {
    super.initState();
    _loadTramites();
    _connectSSE();
  }

  @override
  void dispose() {
    _sseService.disconnect();
    super.dispose();
  }

  void _connectSSE() {
    _sseService.connect();
    _sseService.eventStream?.listen(
      (event) {
        if (mounted) {
          setState(() {
            _isSSEConnected = true;
          });
          _handleSSEEvent(event);
        }
      },
      onError: (error) {
        if (mounted) {
          setState(() {
            _isSSEConnected = false;
          });
        }
      },
      onDone: () {
        if (mounted) {
          setState(() {
            _isSSEConnected = false;
          });
        }
      },
    );
  }

  void _handleSSEEvent(SSEEvent event) {
    switch (event.event) {
      case 'tramite:created':
      case 'tramite:documento':
        _loadTramites();
        break;
      case 'tramite:estado':
      case 'tramite:observado':
      case 'tramite:derivado':
      case 'tramite:aprobado':
      case 'tramite:finalizado':
        final tramiteId = event.data['tramiteId'] as String?;
        final nuevoEstado = event.data['estado'] as String?;
        if (tramiteId != null && nuevoEstado != null) {
          setState(() {
            _tramites = _tramites.map((t) {
              if (t.id == tramiteId) {
                return Tramite(
                  id: t.id,
                  idSeguimiento: t.idSeguimiento,
                  estado: nuevoEstado,
                  comentario: t.comentario,
                  fechaCreacion: t.fechaCreacion,
                  fechaCulminacion: t.fechaCulminacion,
                  alumno: t.alumno,
                  tipo: t.tipo,
                  documentos: t.documentos,
                );
              }
              return t;
            }).toList();
          });
        }
        break;
    }
  }

  Future<void> _loadTramites() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final tramites = await _tramiteService.getMisTramites();
      setState(() {
        _tramites = tramites;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  List<Tramite> get _filteredTramites {
    if (_filter == 'Todas') return _tramites;
    return _tramites.where((t) => t.estado == _filter).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Trámites'),
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _isSSEConnected ? Icons.wifi : Icons.wifi_off,
                  size: 16,
                  color: _isSSEConnected ? Colors.greenAccent : Colors.white70,
                ),
                const SizedBox(width: 4),
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: _loadTramites,
                ),
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.grey[100],
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _FilterChip('Todas', _filter == 'Todas', () {
                    setState(() => _filter = 'Todas');
                  }),
                  const SizedBox(width: 8),
                  _FilterChip('Pendiente', _filter == 'Pendiente', () {
                    setState(() => _filter = 'Pendiente');
                  }),
                  const SizedBox(width: 8),
                  _FilterChip('En Proceso', _filter == 'En Proceso', () {
                    setState(() => _filter = 'En Proceso');
                  }),
                  const SizedBox(width: 8),
                  _FilterChip('Observado', _filter == 'Observado', () {
                    setState(() => _filter = 'Observado');
                  }),
                  const SizedBox(width: 8),
                  _FilterChip('Finalizado', _filter == 'Finalizado', () {
                    setState(() => _filter = 'Finalizado');
                  }),
                ],
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 48,
                          color: Colors.red[400],
                        ),
                        const SizedBox(height: 16),
                        Text(_error!, style: TextStyle(color: Colors.red[700])),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadTramites,
                          child: const Text('Reintentar'),
                        ),
                      ],
                    ),
                  )
                : _filteredTramites.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.description_outlined,
                          size: 48,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _filter == 'Todas'
                              ? 'No tienes trámites creados'
                              : 'No hay trámites ${_filter.toLowerCase()}',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _loadTramites,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _filteredTramites.length,
                      itemBuilder: (context, index) {
                        return TramiteCard(
                          tramite: _filteredTramites[index],
                          onTap: () {
                            Navigator.pushNamed(
                              context,
                              '/tramite-detail',
                              arguments: _filteredTramites[index].id,
                            );
                          },
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const NewTramiteScreen()),
          );
          if (result == true) {
            _loadTramites();
          }
        },
        backgroundColor: const Color(0xFF2563EB),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip(this.label, this.isSelected, this.onTap);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF2563EB) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF2563EB) : Colors.grey[300]!,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.grey[700],
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
