import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import { rbacMiddleware } from '../middleware/rbac.middleware';
import { generarConstancia } from '../services/constancia.service';

const router = Router();

const direccionRoles = ['Direccion', 'Administrador'];

// GET /api/direccion/tramites/derivados - Listar trámites derivados a Dirección
router.get(
  '/direccion/tramites/derivados',
  authMiddleware,
  rbacMiddleware(direccionRoles),
  async (req: Request, res: Response) => {
    try {
      const { fecha_inicio, fecha_fin, tipo_tramite, search, page = '1', limit = '20' } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      const where: Record<string, unknown> = {
        estado: 'Derivado a Dirección',
      };

      if (fecha_inicio || fecha_fin) {
        const fechaCreacion: Record<string, Date> = {};
        if (fecha_inicio) {
          fechaCreacion.gte = new Date(fecha_inicio as string);
        }
        if (fecha_fin) {
          const fin = new Date(fecha_fin as string);
          fin.setHours(23, 59, 59, 999);
          fechaCreacion.lte = fin;
        }
        where.fechaCreacion = fechaCreacion;
      }

      if (tipo_tramite) {
        where.tipoId = parseInt(tipo_tramite as string, 10);
      }

      if (search) {
        where.OR = [
          { idSeguimiento: { contains: search as string, mode: 'insensitive' } },
          { apoderado: { nombres: { contains: search as string, mode: 'insensitive' } } },
          { apoderado: { apellidos: { contains: search as string, mode: 'insensitive' } } },
          { alumno: { nombres: { contains: search as string, mode: 'insensitive' } } },
          { alumno: { apellidos: { contains: search as string, mode: 'insensitive' } } },
        ];
      }

      const [tramites, total] = await Promise.all([
        prisma.tramite.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { fechaCreacion: 'asc' },
          include: {
            apoderado: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                email: true,
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
                urlArchivo: true,
              },
            },
          },
        }),
        prisma.tramite.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        data: {
          tramites,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
          },
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener trámites derivados';
      res.status(500).json({ success: false, message });
    }
  }
);

// GET /api/direccion/tramites/estadisticas - Estadísticas para Dirección
router.get(
  '/direccion/tramites/estadisticas',
  authMiddleware,
  rbacMiddleware(direccionRoles),
  async (_req: Request, res: Response) => {
    try {
      const [totalDerivados, antiguos] = await Promise.all([
        prisma.tramite.count({ where: { estado: 'Derivado a Dirección' } }),
        prisma.tramite.count({
          where: {
            estado: 'Derivado a Dirección',
            fechaCreacion: {
              lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalDerivados,
          antiguos,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener estadísticas';
      res.status(500).json({ success: false, message });
    }
  }
);

// GET /api/direccion/tramites/:id/detalle - Detalle completo de trámite derivado
router.get(
  '/direccion/tramites/:id/detalle',
  authMiddleware,
  rbacMiddleware(direccionRoles),
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
              telefono: true,
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
              urlArchivo: true,
              createdAt: true,
            },
          },
          auditoria: {
            orderBy: { fechaHora: 'desc' },
            include: {
              usuario: {
                select: {
                  id: true,
                  nombres: true,
                  apellidos: true,
                },
              },
            },
          },
        },
      });

      if (!tramite) {
        return res.status(404).json({ success: false, message: 'Trámite no encontrado' });
      }

      res.json({ success: true, data: tramite });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener detalle';
      res.status(500).json({ success: false, message });
    }
  }
);

// GET /api/direccion/tramites/:id/constancia - Generar constancia PDF
router.get(
  '/direccion/tramites/:id/constancia',
  authMiddleware,
  rbacMiddleware(direccionRoles),
  async (req: Request, res: Response) => {
    try {
      const tramiteId = req.params.id;

      const pdfBuffer = await generarConstancia(tramiteId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="constancia-${tramiteId.slice(0, 8)}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al generar constancia';
      res.status(500).json({ success: false, message });
    }
  }
);

export default router;
