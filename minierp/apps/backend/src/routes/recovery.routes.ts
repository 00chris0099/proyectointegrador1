import { Router, Request, Response } from 'express';
import { passwordRecoveryService } from '../domains/identity/services/password-recovery.service';
import {
  requestRecoverySchema,
  resetPasswordSchema,
  validateTokenSchema,
} from '../domains/identity/validators/recovery.validator';
import { rateLimiter } from '../middleware/rate-limiter';

const router = Router();

router.post('/recover', rateLimiter, async (req: Request, res: Response) => {
  try {
    const validated = requestRecoverySchema.parse(req.body);
    
    const result = await passwordRecoveryService.requestRecovery(validated.email);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Email inválido',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error procesando la solicitud',
    });
  }
});

router.post('/validate-token', async (req: Request, res: Response) => {
  try {
    const validated = validateTokenSchema.parse(req.body);
    
    const result = await passwordRecoveryService.validateToken(validated.token);

    res.json({
      success: true,
      data: { valid: result.valid },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Token inválido',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error validando token',
    });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const validated = resetPasswordSchema.parse(req.body);
    
    const result = await passwordRecoveryService.resetPassword(
      validated.token,
      validated.password
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error restableciendo contraseña',
    });
  }
});

export default router;
