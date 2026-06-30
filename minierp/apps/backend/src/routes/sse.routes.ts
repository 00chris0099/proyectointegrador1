import { Router, Request, Response } from 'express';
import { tokenService } from '../domains/identity/services/token.service';
import { sseService } from '../services/sse.service';

const router = Router();

router.get('/tramites/stream', (req: Request, res: Response) => {
  try {
    let token = req.cookies?.accessToken;

    if (!token) {
      token = req.query.token as string;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const decoded = tokenService.verifyAccessToken(token);
    const userId = decoded.sub;

    sseService.addClient(userId, res);

    req.on('close', () => {
      sseService.removeClient(userId);
    });
  } catch (error: unknown) {
    const err = error as { name?: string };
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token inválido',
    });
  }
});

export default router;
