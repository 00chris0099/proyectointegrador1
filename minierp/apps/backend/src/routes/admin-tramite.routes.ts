import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import { rbacMiddleware } from '../middleware/rbac.middleware';
import { eventBusService } from '../services/event-bus.service';

const router = Router();

const adminRoles = ['Secretaria', 'Administrador'];

// GET /api/admin/tramites/pendientes - Listar trámites pendientes (FIFO)
router.get(
  '/admin/tramites/pendientes',
  authMiddleware,
  rbacMiddleware(adminRoles),
  async (req: Request, res: Response) => {
    try {
      const { fecha_inicio, fecha_fin, tipo_tramite, search, page = '1', limit = '20' } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      const where: Record<string, unknown> = {
        estado: { in: ['Pendiente', 'Observado'] },
      };

      if (fecha_inicio || fecha_fin) {
        const fechaCreacion: Record<string, Date> = {};
        if (fecha_inicio) {
          fechaCreacion.gte = new Date(fecha_inicio as string);
        }
        if (fecha_fin) {
          const finDate = new Date(fecha_fin as string);
          finDate.setHours(23, 59, 59, 999);
          fechaCreacion.lte = finDate;
        }
        where.fechaCreacion = fechaCreacion;
      }

      if (tipo_tramite) {
        where.tipoId = parseInt(tipo_tramite as string, 10);
      }

      if (search) {
        where.OR = [
          { idSeguimiento: { contains: search as string, mode: 'insensitive' } },
          { alumno: { nombres: { contains: search as string, mode: 'insensitive' } } },
          { alumno: { apellidos: { contains: search as string, mode: 'insensitive' } } },
          { apoderado: { nombres: { contains: search as string, mode: 'insensitive' } } },
          { apoderado: { apellidos: { contains: search as string, mode: 'insensitive' } } },
        ];
      }

      const [tramites, total] = await Promise.all([
        prisma.tramite.findMany({
          where,
          include: {
            apoderado: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                email: true,
                dni: true,
              },
            },
            alumno: {
              select: {
                id: true,
                dni: true,
                nombres: true,
                apellidos: true,
                nivel: true,
                grado: true,
                seccion: true,
              },
            },
            tipo: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
              },
            },
            documentos: {
              select: {
                id: true,
                nombreOriginal: true,
                tipoMime: true,
                pesoBytes: true,
              },
            },
          },
          orderBy: { fechaCreacion: 'asc' },
          skip,
          take: limitNum,
        }),
        prisma.tramite.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          tramites,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cargar trámites pendientes';
      res.status(500).json({ success: false, message });
    }
  }
);

// GET /api/admin/tramites/estadisticas - Estadísticas de trámites pendientes
router.get(
  '/admin/tramites/estadisticas',
  authMiddleware,
  rbacMiddleware(adminRoles),
  async (_req: Request, res: Response) => {
    try {
      const [totalPendientes, porTipo, antiguos] = await Promise.all([
        prisma.tramite.count({ where: { estado: { in: ['Pendiente', 'Observado'] } } }),
        prisma.tramite.groupBy({
          by: ['tipoId'],
          where: { estado: { in: ['Pendiente', 'Observado'] } },
          _count: { id: true },
        }),
        prisma.tramite.count({
          where: {
            estado: { in: ['Pendiente', 'Observado'] },
            fechaCreacion: {
              lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      const tiposConCount = await Promise.all(
        porTipo.map(async (item) => {
          const tipo = await prisma.tipoTramite.findUnique({
            where: { id: item.tipoId },
            select: { id: true, nombre: true },
          });
          return {
            tipo,
            count: item._count.id,
          };
        })
      );

      res.json({
        success: true,
        data: {
          totalPendientes,
          antiguos,
          porTipo: tiposConCount,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cargar estadísticas';
      res.status(500).json({ success: false, message });
    }
  }
);

// GET /api/admin/tramites/:id/detalle - Detalle completo de un trámite
router.get(
  '/admin/tramites/:id/detalle',
  authMiddleware,
  rbacMiddleware(adminRoles),
  async (req: Request, res: Response) => {
    try {
      const tramiteId = req.params.id;

      const tramite = await prisma.tramite.findUnique({
        where: { id: tramiteId },
        include: {
          apoderado: {
            select: {
              id: true,
              nombres: true,
              apellidos: true,
              email: true,
              dni: true,
              telefono: true,
            },
          },
          alumno: {
            select: {
              id: true,
              dni: true,
              nombres: true,
              apellidos: true,
              nivel: true,
              grado: true,
              seccion: true,
              fechaNac: true,
            },
          },
          tipo: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              requisitos: true,
            },
          },
          documentos: {
            select: {
              id: true,
              urlArchivo: true,
              nombreOriginal: true,
              tipoMime: true,
              pesoBytes: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          auditoria: {
            select: {
              id: true,
              fechaHora: true,
              estadoAnterior: true,
              estadoNuevo: true,
              accion: true,
              detalles: true,
              usuario: {
                select: {
                  nombres: true,
                  apellidos: true,
                },
              },
            },
            orderBy: { fechaHora: 'desc' },
          },
        },
      });

      if (!tramite) {
        return res.status(404).json({ success: false, message: 'Trámite no encontrado' });
      }

      res.json({ success: true, data: tramite });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cargar detalle del trámite';
      res.status(500).json({ success: false, message });
    }
  }
);

// PATCH /api/tramites/:id/derivar - Derivar trámite a Dirección
router.patch(
  '/tramites/:id/derivar',
  authMiddleware,
  rbacMiddleware(adminRoles),
  async (req: Request, res: Response) => {
    try {
      const tramiteId = req.params.id;
      const userId = (req as any).user.sub;

      const tramite = await prisma.tramite.findUnique({
        where: { id: tramiteId },
        select: {
          id: true,
          idSeguimiento: true,
          estado: true,
          apoderadoId: true,
        },
      });

      if (!tramite) {
        return res.status(404).json({ success: false, message: 'Trámite no encontrado' });
      }

      const estadosValidosParaDerivar = ['Pendiente', 'Observado'];

      if (!estadosValidosParaDerivar.includes(tramite.estado)) {
        return res.status(409).json({
          success: false,
          message: `No se puede derivar un trámite en estado '${tramite.estado}'`,
        });
      }

      const nuevoEstado = 'Derivado a Dirección';
      const estadoAnterior = tramite.estado;

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.tramite.update({
          where: { id: tramiteId },
          data: {
            estado: nuevoEstado,
          },
          select: {
            id: true,
            idSeguimiento: true,
            estado: true,
            updatedAt: true,
          },
        });

        await tx.$executeRaw`UPDATE tramites SET updated_by = ${userId}::uuid WHERE id = ${tramiteId}::uuid`;

        // Auditoría fuera de transacción para no bloquear
        return updated;
      });

      // Crear auditoría separadamente (no bloqueante)
      try {
        const userExists = await prisma.usuario.findUnique({ where: { id: userId } });
        if (userExists) {
          await prisma.auditoriaTramite.create({
            data: {
              tramiteId,
              usuarioId: userId,
              estadoAnterior,
              estadoNuevo: nuevoEstado,
              accion: 'Derivación',
              detalles: { motivo: 'Derivado a Dirección desde secretaría' },
            },
          });
        }
      } catch { /* auditoría es best-effort */ }

      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { nombres: true, apellidos: true },
      });

      const derivadoPor = user ? `${user.nombres} ${user.apellidos}` : 'Desconocido';

      await eventBusService.emitTramiteEvent('tramite:derivado', tramiteId, {
        estadoAnterior,
        estadoNuevo: nuevoEstado,
        derivadoPor,
      });

      await eventBusService.notifyDireccion('tramite:derivado', tramiteId, {
        estadoAnterior,
        estadoNuevo: nuevoEstado,
        derivadoPor,
        accion: 'Derivación',
      });

      res.json({
        success: true,
        message: 'Trámite derivado a Dirección exitosamente',
        data: {
          tramiteId: result.id,
          idSeguimiento: result.idSeguimiento,
          estadoAnterior,
          estadoNuevo: result.estado,
          derivadoPor,
          fechaDerivacion: result.updatedAt,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al derivar trámite';
      res.status(500).json({ success: false, message });
    }
  }
);

// PATCH /api/tramites/:id/observar - Observar trámite (enviar a corrección)
router.patch(
  '/tramites/:id/observar',
  authMiddleware,
  rbacMiddleware(adminRoles),
  async (req: Request, res: Response) => {
    try {
      const tramiteId = req.params.id;
      const userId = (req as any).user.sub;
      const { motivo } = req.body;

      if (!motivo || typeof motivo !== 'string' || motivo.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'El motivo de observación es obligatorio (mínimo 10 caracteres)',
        });
      }

      if (motivo.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message: 'El motivo no debe exceder los 500 caracteres',
        });
      }

      const tramite = await prisma.tramite.findUnique({
        where: { id: tramiteId },
        select: {
          id: true,
          idSeguimiento: true,
          estado: true,
          apoderadoId: true,
        },
      });

      if (!tramite) {
        return res.status(404).json({ success: false, message: 'Trámite no encontrado' });
      }

      if (tramite.estado !== 'Pendiente') {
        return res.status(409).json({
          success: false,
          message: `No se puede observar un trámite en estado '${tramite.estado}'`,
        });
      }

      const nuevoEstado = 'Observado';
      const estadoAnterior = tramite.estado;
      const motivoLimpio = motivo.trim();

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.tramite.update({
          where: { id: tramiteId },
          data: {
            estado: nuevoEstado,
          },
          select: {
            id: true,
            idSeguimiento: true,
            estado: true,
            updatedAt: true,
          },
        });

        await tx.$executeRaw`UPDATE tramites SET comentario_observacion = ${motivoLimpio}, updated_by = ${userId}::uuid WHERE id = ${tramiteId}::uuid`;

        return updated;
      });

      // Auditoría no bloqueante
      try {
        const userExists = await prisma.usuario.findUnique({ where: { id: userId } });
        if (userExists) {
          await prisma.auditoriaTramite.create({
            data: {
              tramiteId,
              usuarioId: userId,
              estadoAnterior,
              estadoNuevo: nuevoEstado,
              accion: 'Observación',
              detalles: { motivo: motivoLimpio },
            },
          });
        }
      } catch { /* auditoría best-effort */ }

      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { nombres: true, apellidos: true },
      });

      const observadoPor = user ? `${user.nombres} ${user.apellidos}` : 'Desconocido';

      await eventBusService.emitTramiteEvent('tramite:observado', tramiteId, {
        estadoAnterior,
        estadoNuevo: nuevoEstado,
        observadoPor,
        motivo: motivoLimpio,
      });

      res.json({
        success: true,
        message: 'Trámite observado exitosamente',
        data: {
          tramiteId: result.id,
          idSeguimiento: result.idSeguimiento,
          estadoAnterior,
          estadoNuevo: result.estado,
          observadoPor,
          motivo: motivoLimpio,
          fechaObservacion: result.updatedAt,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al observar trámite';
      res.status(500).json({ success: false, message });
    }
  }
);

// PATCH /api/tramites/:id/aprobar - Aprobar y finalizar trámite
router.patch(
  '/tramites/:id/aprobar',
  authMiddleware,
  rbacMiddleware(['Direccion', 'Administrador']),
  async (req: Request, res: Response) => {
    try {
      const tramiteId = req.params.id;
      const userId = (req as any).user.sub;

      const { comentario } = req.body;

      const tramite = await prisma.tramite.findUnique({
        where: { id: tramiteId },
        select: {
          id: true,
          idSeguimiento: true,
          estado: true,
          apoderadoId: true,
        },
      });

      if (!tramite) {
        return res.status(404).json({ success: false, message: 'Trámite no encontrado' });
      }

      if (tramite.estado === 'Finalizado') {
        return res.status(200).json({
          success: true,
          message: 'El trámite ya fue aprobado y finalizado',
          data: {
            tramiteId: tramite.id,
            idSeguimiento: tramite.idSeguimiento,
            estadoAnterior: tramite.estado,
            estadoNuevo: tramite.estado,
          },
        });
      }

      if (tramite.estado !== 'Derivado a Dirección') {
        return res.status(409).json({
          success: false,
          message: `No se puede aprobar un trámite en estado '${tramite.estado}'`,
        });
      }

      const nuevoEstado = 'Finalizado';
      const estadoAnterior = tramite.estado;
      const ahora = new Date();

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.tramite.update({
          where: { id: tramiteId },
          data: {
            estado: nuevoEstado,
            fechaCulminacion: ahora,
          },
          select: {
            id: true,
            idSeguimiento: true,
            estado: true,
            fechaCulminacion: true,
            updatedAt: true,
          },
        });

        await tx.$executeRaw`UPDATE tramites SET updated_by = ${userId}::uuid WHERE id = ${tramiteId}::uuid`;

        return updated;
      });

      // Auditoría no bloqueante
      try {
        const userExists = await prisma.usuario.findUnique({ where: { id: userId } });
        if (userExists) {
          await prisma.auditoriaTramite.create({
            data: {
              tramiteId,
              usuarioId: userId,
              estadoAnterior,
              estadoNuevo: nuevoEstado,
              accion: 'Aprobación',
              detalles: { motivo: comentario || 'Trámite aprobado y finalizado' },
            },
          });
        }
      } catch { /* auditoría best-effort */ }

      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { nombres: true, apellidos: true },
      });

      const aprobadoPor = user ? `${user.nombres} ${user.apellidos}` : 'Desconocido';

      await eventBusService.emitTramiteEvent('tramite:aprobado', tramiteId, {
        estadoAnterior,
        estadoNuevo: nuevoEstado,
        aprobadoPor,
        comentario: comentario || 'Trámite aprobado y finalizado',
      });

      await eventBusService.emitTramiteEvent('tramite:finalizado', tramiteId, {
        estadoAnterior,
        estadoNuevo: nuevoEstado,
        aprobadoPor,
        fechaCulminacion: ahora.toISOString(),
      });

      res.json({
        success: true,
        message: 'Trámite aprobado y finalizado exitosamente',
        data: {
          tramiteId: result.id,
          idSeguimiento: result.idSeguimiento,
          estadoAnterior,
          estadoNuevo: result.estado,
          aprobadoPor,
          fechaCulminacion: result.fechaCulminacion,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al aprobar trámite';
      res.status(500).json({ success: false, message });
    }
  }
);

export default router;
