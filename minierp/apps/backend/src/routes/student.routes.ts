import { Router, Request, Response } from 'express';
import { studentService } from '../domains/identity/services/student.service';
import { linkingRequestService } from '../domains/identity/services/linking-request.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { rbacMiddleware } from '../middleware/rbac.middleware';
import {
  requestLinkingSchema,
  approveRequestSchema,
  rejectRequestSchema,
} from '../domains/identity/validators/student.validator';

const router = Router();

// ==================== APODERADO ENDPOINTS ====================

// GET /api/apoderados/me/alumnos - Listar alumnos vinculados
router.get('/alumnos', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const students = await studentService.getStudentsByGuardian(userId);

    res.json({ success: true, data: students });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/apoderados/me/solicitud - Solicitar vinculación
router.post('/solicitud', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const validated = requestLinkingSchema.parse(req.body);

    const solicitud = await linkingRequestService.createRequest(
      userId,
      validated.dni,
      validated.parentesco,
      validated.parentescoCustom
    );

    res.status(201).json({
      success: true,
      message: 'Solicitud de vinculación enviada exitosamente',
      data: solicitud,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/apoderados/me/solicitudes - Ver mis solicitudes
router.get('/solicitudes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const solicitudes = await linkingRequestService.getRequestsByGuardian(userId);

    res.json({ success: true, data: solicitudes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/apoderados/me/solicitudes/:id - Cancelar solicitud
router.delete('/solicitudes/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const requestId = parseInt(req.params.id);

    if (isNaN(requestId)) {
      return res.status(400).json({ success: false, message: 'ID de solicitud inválido' });
    }

    await linkingRequestService.cancelRequest(requestId, userId);

    res.json({ success: true, message: 'Solicitud cancelada' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ==================== ADMIN ENDPOINTS ====================

// GET /api/admin/solicitudes-vinculacion - Listar todas las solicitudes
router.get(
  '/admin/solicitudes-vinculacion',
  authMiddleware,
  rbacMiddleware(['SUPER_ADMIN', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { estado } = req.query;

      let solicitudes;
      if (estado === 'Pendiente') {
        solicitudes = await linkingRequestService.getPendingRequests();
      } else {
        solicitudes = await linkingRequestService.getAllRequests();
      }

      res.json({ success: true, data: solicitudes });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// PATCH /api/admin/solicitudes-vinculacion/:id/aprobar - Aprobar solicitud
router.patch(
  '/admin/solicitudes-vinculacion/:id/aprobar',
  authMiddleware,
  rbacMiddleware(['SUPER_ADMIN', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const adminId = (req as any).user.sub;
      const requestId = parseInt(req.params.id);

      if (isNaN(requestId)) {
        return res.status(400).json({ success: false, message: 'ID de solicitud inválido' });
      }

      await linkingRequestService.approveRequest(requestId, adminId);

      res.json({ success: true, message: 'Solicitud aprobada y vinculación creada' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// PATCH /api/admin/solicitudes-vinculacion/:id/rechazar - Rechazar solicitud
router.patch(
  '/admin/solicitudes-vinculacion/:id/rechazar',
  authMiddleware,
  rbacMiddleware(['SUPER_ADMIN', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const adminId = (req as any).user.sub;
      const requestId = parseInt(req.params.id);

      if (isNaN(requestId)) {
        return res.status(400).json({ success: false, message: 'ID de solicitud inválido' });
      }

      const validated = rejectRequestSchema.parse({
        id: requestId,
        ...req.body,
      });

      await linkingRequestService.rejectRequest(requestId, adminId, validated.motivo);

      res.json({ success: true, message: 'Solicitud rechazada' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

export default router;