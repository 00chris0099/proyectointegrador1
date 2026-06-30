import { prisma } from '../../../config/database';

export class ProfileAuditService {
  async logChange(
    usuarioId: string,
    campo: string,
    valorAnterior: string | null,
    valorNuevo: string | null
  ): Promise<void> {
    await prisma.perfilAuditoria.create({
      data: {
        usuarioId,
        campo,
        valorAnterior: valorAnterior || '(vacío)',
        valorNuevo: valorNuevo || '(vacío)',
      },
    });
  }

  async getAuditLog(usuarioId: string, page = 1, limit = 20) {
    const [logs, total] = await Promise.all([
      prisma.perfilAuditoria.findMany({
        where: { usuarioId },
        orderBy: { fechaCambio: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.perfilAuditoria.count({ where: { usuarioId } }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const profileAuditService = new ProfileAuditService();
