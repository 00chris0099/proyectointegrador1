import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    // Verificar PostgreSQL
    await prisma.$queryRaw`SELECT 1`;

    // Verificar Redis
    await redisClient.ping();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: error instanceof Error ? 'disconnected' : 'unknown',
        redis: 'unknown'
      }
    });
  }
});

export default router;
