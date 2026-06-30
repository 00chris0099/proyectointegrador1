import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';

const MAX_REQUESTS = 5;
const WINDOW_SECONDS = 60; // 1 minuto
const LOCKOUT_SECONDS = 900; // 15 minutos

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `rate_limit:${ip}`;

    // Verificar si está bloqueado
    const isLocked = await redisClient.get(`locked:${key}`);
    if (isLocked) {
      return res.status(429).json({
        success: false,
        message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.'
      });
    }

    // Obtener contador actual
    const current = await redisClient.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= MAX_REQUESTS) {
      // Bloquear IP
      await redisClient.set(`locked:${key}`, '1', 'EX', LOCKOUT_SECONDS);
      await redisClient.del(key);

      return res.status(429).json({
        success: false,
        message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.'
      });
    }

    // Incrementar contador
    await redisClient.multi()
      .incr(key)
      .expire(key, WINDOW_SECONDS)
      .exec();

    next();
  } catch (error) {
    // Si Redis falla, permitir request
    next();
  }
};
