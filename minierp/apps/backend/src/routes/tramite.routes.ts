import { Router, Request, Response } from 'express';
import { tipoTramiteService } from '../domains/documental/services/tipo-tramite.service';
import { tramiteService } from '../domains/documental/services/tramite.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadMiddleware, uploadToImgBB } from '../domains/documental/services/upload.service';
import { createTramiteSchema, addDocumentSchema } from '../domains/documental/validators/tramite.validator';

const router = Router();

// GET /api/tramites/tipos - Listar tipos de trámite activos
router.get('/tramites/tipos', authMiddleware, async (req: Request, res: Response) => {
  try {
    const tipos = await tipoTramiteService.getAllActive();

    res.json({ success: true, data: tipos });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/tramites - Crear nuevo trámite
router.post('/tramites', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const validated = createTramiteSchema.parse(req.body);

    const tramite = await tramiteService.create(userId, validated);

    res.status(201).json({
      success: true,
      message: 'Trámite creado exitosamente',
      data: tramite,
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

// GET /api/tramites/me - Listar trámites del apoderado
router.get('/tramites/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const tramites = await tramiteService.getByGuardian(userId);

    res.json({ success: true, data: tramites });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tramites/:id - Detalle de un trámite
router.get('/tramites/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const tramiteId = req.params.id;

    const tramite = await tramiteService.getById(tramiteId, userId);

    if (!tramite) {
      return res.status(404).json({ success: false, message: 'Trámite no encontrado' });
    }

    res.json({ success: true, data: tramite });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/tramites/:id/documentos - Agregar documento adjunto (multipart/form-data)
router.post(
  '/tramites/:id/documentos',
  authMiddleware,
  uploadMiddleware.single('file'),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.sub;
      const tramiteId = req.params.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo',
        });
      }

      const { originalname, mimetype, size, buffer } = req.file;

      const imgResult = await uploadToImgBB(buffer, originalname);

      const documentData = {
        urlArchivo: imgResult.url,
        nombreOriginal: originalname,
        tipoMime: mimetype,
        pesoBytes: size,
      };

      const validated = addDocumentSchema.parse(documentData);

      await tramiteService.addDocument(tramiteId, userId, validated);

      res.status(201).json({
        success: true,
        message: 'Documento agregado exitosamente',
        data: {
          url: imgResult.url,
          filename: originalname,
          mimetype,
          size,
        },
      });
    } catch (error: any) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'El archivo excede el límite de 5MB',
        });
      }

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

// GET /api/tramites/:id/documentos - Listar documentos de un trámite
router.get('/tramites/:id/documentos', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const tramiteId = req.params.id;

    const documentos = await tramiteService.getDocuments(tramiteId, userId);

    res.json({ success: true, data: documentos });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/tramites/:id/documentos/:docId - Info de un documento específico
router.get('/tramites/:id/documentos/:docId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const tramiteId = req.params.id;
    const docId = parseInt(req.params.docId, 10);

    if (isNaN(docId)) {
      return res.status(400).json({ success: false, message: 'ID de documento inválido' });
    }

    const documento = await tramiteService.getDocumentById(tramiteId, docId, userId);

    if (!documento) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }

    res.json({ success: true, data: documento });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/tramites/:id/documentos/:docId - Eliminar un documento
router.delete('/tramites/:id/documentos/:docId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const tramiteId = req.params.id;
    const docId = parseInt(req.params.docId, 10);

    if (isNaN(docId)) {
      return res.status(400).json({ success: false, message: 'ID de documento inválido' });
    }

    await tramiteService.deleteDocument(tramiteId, docId, userId);

    res.json({ success: true, message: 'Documento eliminado exitosamente' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
