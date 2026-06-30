import { sseService } from './sse.service';
import { prisma } from '../config/database';

export type TramiteEventType =
  | 'tramite:created'
  | 'tramite:estado'
  | 'tramite:observado'
  | 'tramite:derivado'
  | 'tramite:aprobado'
  | 'tramite:documento'
  | 'tramite:finalizado'
  | 'admin:tramite:nuevo'
  | 'admin:tramite:actualizado';

export interface TramiteEventData {
  tramiteId: string;
  idSeguimiento: string;
  estado: string;
  fecha: string;
  detalles?: Record<string, unknown>;
}

export class EventBusService {
  async emitTramiteEvent(
    event: TramiteEventType,
    tramiteId: string,
    detalles?: Record<string, unknown>
  ): Promise<void> {
    try {
      const tramite = await prisma.tramite.findUnique({
        where: { id: tramiteId },
        select: {
          id: true,
          idSeguimiento: true,
          apoderadoId: true,
          estado: true,
        },
      });

      if (!tramite) {
        console.error(`EventBus: Trámite ${tramiteId} not found`);
        return;
      }

      const eventData: TramiteEventData = {
        tramiteId: tramite.id,
        idSeguimiento: tramite.idSeguimiento,
        estado: tramite.estado,
        fecha: new Date().toISOString(),
        detalles,
      };

      sseService.sendEvent(tramite.apoderadoId, event, eventData);

      console.log(`📢 Event emitted: ${event} for tramite ${tramite.idSeguimiento}`);
    } catch (error) {
      console.error(`EventBus error emitting ${event}:`, error);
    }
  }

  async emitDocumentoEvent(
    tramiteId: string,
    accion: 'added' | 'deleted',
    documento?: Record<string, unknown>
  ): Promise<void> {
    await this.emitTramiteEvent('tramite:documento', tramiteId, {
      accion,
      documento,
    });
  }

  async notifySecretaria(
    event: 'admin:tramite:nuevo' | 'admin:tramite:actualizado',
    tramiteId: string,
    detalles?: Record<string, unknown>
  ): Promise<void> {
    try {
      const tramite = await prisma.tramite.findUnique({
        where: { id: tramiteId },
        select: {
          id: true,
          idSeguimiento: true,
          estado: true,
        },
      });

      if (!tramite) return;

      const secretariaRoles = await prisma.rol.findMany({
        where: { nombre: { in: ['Secretaria', 'Administrador'] } },
        select: { id: true },
      });

      const roleIds = secretariaRoles.map((r) => r.id);

      const usuariosConRoles = await prisma.usuarioRol.findMany({
        where: { rolId: { in: roleIds } },
        select: { usuarioId: true },
      });

      const userIds = [...new Set(usuariosConRoles.map((ur) => ur.usuarioId))];

      const eventData = {
        tramiteId: tramite.id,
        idSeguimiento: tramite.idSeguimiento,
        estado: tramite.estado,
        fecha: new Date().toISOString(),
        detalles,
      };

      for (const userId of userIds) {
        sseService.sendEvent(userId, event, eventData);
      }

      console.log(`📢 Admin event ${event} sent to ${userIds.length} secretaria users`);
    } catch (error) {
      console.error(`EventBus error notifying secretaria:`, error);
    }
  }

  async notifyDireccion(
    event: 'tramite:derivado',
    tramiteId: string,
    detalles?: Record<string, unknown>
  ): Promise<void> {
    try {
      const tramite = await prisma.tramite.findUnique({
        where: { id: tramiteId },
        select: {
          id: true,
          idSeguimiento: true,
          estado: true,
        },
      });

      if (!tramite) return;

      const direccionRoles = await prisma.rol.findMany({
        where: { nombre: { in: ['Direccion', 'Administrador'] } },
        select: { id: true },
      });

      const roleIds = direccionRoles.map((r) => r.id);

      const usuariosConRoles = await prisma.usuarioRol.findMany({
        where: { rolId: { in: roleIds } },
        select: { usuarioId: true },
      });

      const userIds = [...new Set(usuariosConRoles.map((ur) => ur.usuarioId))];

      const eventData = {
        tramiteId: tramite.id,
        idSeguimiento: tramite.idSeguimiento,
        estado: tramite.estado,
        fecha: new Date().toISOString(),
        detalles,
      };

      for (const userId of userIds) {
        sseService.sendEvent(userId, event, eventData);
      }

      console.log(`📢 Dirección event ${event} sent to ${userIds.length} users`);
    } catch (error) {
      console.error(`EventBus error notifying dirección:`, error);
    }
  }
}

export const eventBusService = new EventBusService();
