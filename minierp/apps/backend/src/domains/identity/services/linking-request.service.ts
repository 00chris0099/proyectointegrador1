import { prisma } from '../../../config/database';

export interface LinkingRequestData {
  id: number;
  apoderadoId: string;
  alumnoId: string;
  parentesco: string;
  parentescoCustom: string | null;
  estado: string;
  motivo: string | null;
  adminId: string | null;
  fechaRespuesta: Date | null;
  createdAt: Date;
  apoderado?: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
  };
  alumno?: {
    id: string;
    dni: string;
    nombres: string;
    apellidos: string;
    nivel: string;
    grado: number;
    seccion: string;
  };
}

export class LinkingRequestService {
  async createRequest(
    guardianId: string,
    studentDni: string,
    parentesco: string,
    parentescoCustom?: string
  ): Promise<LinkingRequestData> {
    const alumno = await prisma.alumno.findUnique({
      where: { dni: studentDni },
    });

    if (!alumno) {
      throw new Error('Alumno no encontrado con ese DNI');
    }

    const existingLink = await prisma.apoderadoAlumno.findUnique({
      where: {
        apoderadoId_alumnoId: {
          apoderadoId: guardianId,
          alumnoId: alumno.id,
        },
      },
    });

    if (existingLink) {
      throw new Error('Ya estás vinculado con este alumno');
    }

    const existingRequest = await prisma.solicitudVinculacion.findFirst({
      where: {
        apoderadoId: guardianId,
        alumnoId: alumno.id,
        estado: 'Pendiente',
      },
    });

    if (existingRequest) {
      throw new Error('Ya existe una solicitud pendiente para este alumno');
    }

    const solicitud = await prisma.solicitudVinculacion.create({
      data: {
        apoderadoId: guardianId,
        alumnoId: alumno.id,
        parentesco,
        parentescoCustom: parentesco === 'Otro' ? parentescoCustom : null,
      },
      include: {
        apoderado: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            email: true,
          },
        },
        alumno: {
          select: {
            id: true,
            dni: true,
            nombres: true,
            apellidos: true,
            nivel: true,
            grado: true,
            seccion: true,
          },
        },
      },
    });

    return solicitud;
  }

  async getRequestsByGuardian(guardianId: string): Promise<LinkingRequestData[]> {
    const solicitudes = await prisma.solicitudVinculacion.findMany({
      where: { apoderadoId: guardianId },
      include: {
        alumno: {
          select: {
            id: true,
            dni: true,
            nombres: true,
            apellidos: true,
            nivel: true,
            grado: true,
            seccion: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return solicitudes;
  }

  async getPendingRequests(): Promise<LinkingRequestData[]> {
    const solicitudes = await prisma.solicitudVinculacion.findMany({
      where: { estado: 'Pendiente' },
      include: {
        apoderado: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            email: true,
          },
        },
        alumno: {
          select: {
            id: true,
            dni: true,
            nombres: true,
            apellidos: true,
            nivel: true,
            grado: true,
            seccion: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return solicitudes;
  }

  async getAllRequests(): Promise<LinkingRequestData[]> {
    const solicitudes = await prisma.solicitudVinculacion.findMany({
      include: {
        apoderado: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            email: true,
          },
        },
        alumno: {
          select: {
            id: true,
            dni: true,
            nombres: true,
            apellidos: true,
            nivel: true,
            grado: true,
            seccion: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return solicitudes;
  }

  async approveRequest(requestId: number, adminId: string): Promise<void> {
    const solicitud = await prisma.solicitudVinculacion.findUnique({
      where: { id: requestId },
    });

    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }

    if (solicitud.estado !== 'Pendiente') {
      throw new Error('La solicitud ya fue procesada');
    }

    await prisma.$transaction(async (tx) => {
      await tx.solicitudVinculacion.update({
        where: { id: requestId },
        data: {
          estado: 'Aprobada',
          adminId,
          fechaRespuesta: new Date(),
        },
      });

      await tx.apoderadoAlumno.create({
        data: {
          apoderadoId: solicitud.apoderadoId,
          alumnoId: solicitud.alumnoId,
          parentesco: solicitud.parentesco,
          esPrincipal: false,
        },
      });
    });
  }

  async rejectRequest(requestId: number, adminId: string, motivo: string): Promise<void> {
    const solicitud = await prisma.solicitudVinculacion.findUnique({
      where: { id: requestId },
    });

    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }

    if (solicitud.estado !== 'Pendiente') {
      throw new Error('La solicitud ya fue procesada');
    }

    await prisma.solicitudVinculacion.update({
      where: { id: requestId },
      data: {
        estado: 'Rechazada',
        adminId,
        motivo,
        fechaRespuesta: new Date(),
      },
    });
  }

  async cancelRequest(requestId: number, guardianId: string): Promise<void> {
    const solicitud = await prisma.solicitudVinculacion.findUnique({
      where: { id: requestId },
    });

    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }

    if (solicitud.apoderadoId !== guardianId) {
      throw new Error('No tienes permiso para cancelar esta solicitud');
    }

    if (solicitud.estado !== 'Pendiente') {
      throw new Error('Solo se pueden cancelar solicitudes pendientes');
    }

    await prisma.solicitudVinculacion.delete({
      where: { id: requestId },
    });
  }

  async getRequestById(requestId: number): Promise<LinkingRequestData | null> {
    const solicitud = await prisma.solicitudVinculacion.findUnique({
      where: { id: requestId },
      include: {
        apoderado: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            email: true,
          },
        },
        alumno: {
          select: {
            id: true,
            dni: true,
            nombres: true,
            apellidos: true,
            nivel: true,
            grado: true,
            seccion: true,
          },
        },
      },
    });

    return solicitud;
  }
}

export const linkingRequestService = new LinkingRequestService();