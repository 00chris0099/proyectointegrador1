import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import { rbacMiddleware } from '../middleware/rbac.middleware';

const router = Router();

const adminRoles = ['Administrador', 'Direccion'];

// GET /api/admin/auditoria - Historial de auditoría documental (con búsqueda y filtros)
router.get(
  '/admin/auditoria',
  authMiddleware,
  rbacMiddleware(adminRoles),
  async (req: Request, res: Response) => {
    try {
      const {
        search,
        fecha_inicio,
        fecha_fin,
        accion,
        page = '1',
        limit = '20',
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      const where: Record<string, unknown> = {};

      // Búsqueda por texto: ID de seguimiento, nombre de alumno, nombre de apoderado
      if (search && typeof search === 'string' && search.trim()) {
        const term = search.trim();
        where.tramite = {
          OR: [
            { idSeguimiento: { contains: term, mode: 'insensitive' } },
            { alumno: { nombres: { contains: term, mode: 'insensitive' } } },
            { alumno: { apellidos: { contains: term, mode: 'insensitive' } } },
            { apoderado: { nombres: { contains: term, mode: 'insensitive' } } },
            { apoderado: { apellidos: { contains: term, mode: 'insensitive' } } },
          ],
        };
      }

      // Filtro por rango de fechas
      if (fecha_inicio || fecha_fin) {
        const fechaHora: Record<string, Date> = {};
        if (fecha_inicio) {
          fechaHora.gte = new Date(fecha_inicio as string);
        }
        if (fecha_fin) {
          const finDate = new Date(fecha_fin as string);
          finDate.setHours(23, 59, 59, 999);
          fechaHora.lte = finDate;
        }
        where.fechaHora = fechaHora;
      }

      // Filtro por tipo de acción
      if (accion && typeof accion === 'string' && accion.trim()) {
        where.accion = accion.trim();
      }

      const [registros, total] = await Promise.all([
        prisma.auditoriaTramite.findMany({
          where,
          include: {
            tramite: {
              select: {
                id: true,
                idSeguimiento: true,
                estado: true,
                alumno: {
                  select: {
                    nombres: true,
                    apellidos: true,
                    nivel: true,
                    grado: true,
                    seccion: true,
                  },
                },
                apoderado: {
                  select: {
                    nombres: true,
                    apellidos: true,
                  },
                },
                tipo: {
                  select: {
                    nombre: true,
                  },
                },
              },
            },
            usuario: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                email: true,
              },
            },
          },
          orderBy: { fechaHora: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.auditoriaTramite.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          registros,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cargar historial de auditoría';
      res.status(500).json({ success: false, message });
    }
  }
);

// GET /api/admin/auditoria/estadisticas - Estadísticas de auditoría
router.get(
  '/admin/auditoria/estadisticas',
  authMiddleware,
  rbacMiddleware(adminRoles),
  async (_req: Request, res: Response) => {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const [totalRegistros, registrosHoy, porAccion] = await Promise.all([
        prisma.auditoriaTramite.count(),
        prisma.auditoriaTramite.count({
          where: { fechaHora: { gte: hoy } },
        }),
        prisma.auditoriaTramite.groupBy({
          by: ['accion'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalRegistros,
          registrosHoy,
          porAccion: porAccion.map((item) => ({
            accion: item.accion,
            count: item._count.id,
          })),
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cargar estadísticas de auditoría';
      res.status(500).json({ success: false, message });
    }
  }
);

// GET /api/admin/auditoria/acciones - Lista de acciones disponibles (para filtro)
router.get(
  '/admin/auditoria/acciones',
  authMiddleware,
  rbacMiddleware(adminRoles),
  async (_req: Request, res: Response) => {
    try {
      const acciones = await prisma.auditoriaTramite.findMany({
        select: { accion: true },
        distinct: ['accion'],
        orderBy: { accion: 'asc' },
      });

      res.json({
        success: true,
        data: acciones.map((a) => a.accion),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cargar acciones';
      res.status(500).json({ success: false, message });
    }
  }
);

export default router;
