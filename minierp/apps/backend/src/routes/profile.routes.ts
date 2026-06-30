import { Router, Request, Response } from 'express';
import { profileService } from '../domains/identity/services/profile.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  updateProfileSchema,
  changePasswordSchema,
  verifyEmailSchema,
  confirmEmailSchema,
} from '../domains/identity/validators/profile.validator';

const router = Router();

router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const profile = await profileService.getProfile(userId);

    res.json({ success: true, data: profile });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
});

router.patch('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const validated = updateProfileSchema.parse(req.body);
    const result = await profileService.updateContactInfo(userId, validated);

    res.json({ success: true, data: result });
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

router.post('/profile/verify-email', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const validated = verifyEmailSchema.parse(req.body);
    const result = await profileService.requestEmailChange(userId, validated.email);

    res.json({ success: true, message: result.message });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Email inválido',
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/profile/confirm-email', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const validated = confirmEmailSchema.parse(req.body);
    const result = await profileService.confirmEmailChange(userId, validated.codigo);

    res.json({ success: true, message: result.message });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Código inválido',
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

router.patch('/profile/password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const validated = changePasswordSchema.parse(req.body);
    const result = await profileService.changePassword(
      userId,
      validated.currentPassword,
      validated.newPassword
    );

    res.json({ success: true, message: result.message });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/profile/avatar', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.sub;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'URL de imagen requerida',
      });
    }

    const result = await profileService.uploadAvatar(userId, imageUrl);

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
