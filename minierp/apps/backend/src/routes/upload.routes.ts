import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadMiddleware, uploadToImgBB } from '../domains/documental/services/upload.service';

const router = Router();

router.post(
  '/upload',
  authMiddleware,
  uploadMiddleware.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo',
        });
      }

      const { originalname, mimetype, size, buffer } = req.file;

      const result = await uploadToImgBB(buffer, originalname);

      res.json({
        success: true,
        data: {
          url: result.url,
          deleteUrl: result.deleteUrl,
          filename: originalname,
          mimetype,
          size,
        },
      });
    } catch (error: any) {
      console.error('Upload error:', error);

      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'El archivo excede el límite de 5MB',
        });
      }

      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Se pueden subir máximo 5 archivos a la vez',
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Error al subir archivo',
      });
    }
  }
);

export default router;
