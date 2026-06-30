import { prisma } from '../../../config/database';

interface GetLoginLogsParams {
  page?: number;
  limit?: number;
  email?: string;
  exitoso?: boolean;
  startDate?: string;
  endDate?: string;
}

export class LoginLogService {
  async getLoginLogs(params: GetLoginLogsParams) {
    const {
      page = 1,
      limit = 20,
      email,
      exitoso,
      startDate,
      endDate
    } = params;

    const where: any = {};

    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }

    if (exitoso !== undefined) {
      where.exitoso = exitoso;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.loginLog.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              email: true,
              nombres: true,
              apellidos: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.loginLog.count({ where })
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getStats() {
    const totalLogins = await prisma.loginLog.count();
    const successfulLogins = await prisma.loginLog.count({ where: { exitoso: true } });
    const failedLogins = await prisma.loginLog.count({ where: { exitoso: false } });

    const recentFailedAttempts = await prisma.loginLog.findMany({
      where: {
        exitoso: false,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      },
      select: {
        email: true,
        ipAddress: true
      }
    });

    return {
      totalLogins,
      successfulLogins,
      failedLogins,
      successRate: totalLogins > 0 ? (successfulLogins / totalLogins) * 100 : 0,
      recentFailedAttempts
    };
  }
}

export const loginLogService = new LoginLogService();
