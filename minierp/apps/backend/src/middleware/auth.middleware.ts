import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../domains/identity/services/token.service';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    // Verificar token
    const decoded = tokenService.verifyAccessToken(token);
    
    // Adjuntar usuario al request
    (req as any).user = decoded;

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};
