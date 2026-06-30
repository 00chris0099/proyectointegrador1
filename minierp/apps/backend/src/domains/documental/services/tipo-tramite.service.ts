import { prisma } from '../../../config/database';

export interface TipoTramiteData {
  id: number;
  nombre: string;
  descripcion: string | null;
  requisitos: any;
  activo: boolean;
}

export class TipoTramiteService {
  async getAllActive(): Promise<TipoTramiteData[]> {
    const tipos = await prisma.tipoTramite.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });

    return tipos;
  }

  async getById(id: number): Promise<TipoTramiteData | null> {
    const tipo = await prisma.tipoTramite.findUnique({
      where: { id },
    });

    return tipo;
  }
}

export const tipoTramiteService = new TipoTramiteService();
