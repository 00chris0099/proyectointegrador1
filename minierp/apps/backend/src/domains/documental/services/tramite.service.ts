import { prisma } from '../../../config/database';
import { generateTrackingId } from '../utils/tracking-id';
import { eventBusService } from '../../../services/event-bus.service';

export interface CreateTramiteData {
  alumnoId: string;
  tipoId: number;
  comentario?: string;
}

export interface TramiteResponse {
  id: string;
  idSeguimiento: string;
  apoderadoId: string;
  alumnoId: string;
  tipoId: number;
  estado: string;
  comentario: string | null;
  fechaCreacion: Date;
  fechaCulminacion: Date | null;
  alumno?: {
    id: string;
    dni: string;
    nombres: string;
    apellidos: string;
    nivel: string;
    grado: number;
    seccion: string;
  };
  tipo?: {
    id: number;
    nombre: string;
    descripcion: string | null;
  };
  documentos?: {
    id: number;
    urlArchivo: string;
    nombreOriginal: string;
    tipoMime: string;
    pesoBytes: number;
  }[];
}

export class TramiteService {
  async create(guardianId: string, data: CreateTramiteData): Promise<TramiteResponse> {
    const alumno = await prisma.alumno.findUnique({
      where: { id: data.alumnoId },
    });

    if (!alumno) {
      throw new Error('Alumno no encontrado');
    }

    const vinculo = await prisma.apoderadoAlumno.findUnique({
      where: {
        apoderadoId_alumnoId: {
          apoderadoId: guardianId,
          alumnoId: data.alumnoId,
        },
      },
    });

    if (!vinculo) {
      throw new Error('No estás vinculado con este alumno');
    }

    const tipo = await prisma.tipoTramite.findUnique({
      where: { id: data.tipoId },
    });

    if (!tipo || !tipo.activo) {
      throw new Error('Tipo de trámite no válido');
    }

    const idSeguimiento = await generateTrackingId();

    const tramite = await prisma.tramite.create({
      data: {
        idSeguimiento,
        apoderadoId: guardianId,
        alumnoId: data.alumnoId,
        tipoId: data.tipoId,
        comentario: data.comentario,
      },
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
        tipo: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
      },
    });

    eventBusService.emitTramiteEvent('tramite:created', tramite.id);
    eventBusService.notifySecretaria('admin:tramite:nuevo', tramite.id);

    return tramite;
  }

  async getByGuardian(guardianId: string): Promise<TramiteResponse[]> {
    const tramites = await prisma.tramite.findMany({
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
        tipo: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
        documentos: {
          select: {
            id: true,
            urlArchivo: true,
            nombreOriginal: true,
            tipoMime: true,
            pesoBytes: true,
          },
        },
      },
      orderBy: { fechaCreacion: 'desc' },
    });

    return tramites;
  }

  async getById(tramiteId: string, guardianId: string): Promise<TramiteResponse | null> {
    const tramite = await prisma.tramite.findUnique({
      where: { id: tramiteId },
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
        tipo: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
        documentos: {
          select: {
            id: true,
            urlArchivo: true,
            nombreOriginal: true,
            tipoMime: true,
            pesoBytes: true,
          },
        },
      },
    });

    if (!tramite) {
      return null;
    }

    if (tramite.apoderadoId !== guardianId) {
      throw new Error('No tienes acceso a este trámite');
    }

    return tramite;
  }

  async addDocument(
    tramiteId: string,
    guardianId: string,
    documentData: {
      urlArchivo: string;
      nombreOriginal: string;
      tipoMime: string;
      pesoBytes: number;
    }
  ): Promise<void> {
    const tramite = await prisma.tramite.findUnique({
      where: { id: tramiteId },
    });

    if (!tramite) {
      throw new Error('Trámite no encontrado');
    }

    if (tramite.apoderadoId !== guardianId) {
      throw new Error('No tienes acceso a este trámite');
    }

    if (tramite.estado !== 'Pendiente') {
      throw new Error('No se pueden agregar documentos a un trámite que no está pendiente');
    }

    await prisma.documentoAdjunto.create({
      data: {
        tramiteId,
        ...documentData,
      },
    });

    eventBusService.emitDocumentoEvent(tramiteId, 'added', documentData);
  }

  async getDocuments(
    tramiteId: string,
    guardianId: string
  ): Promise<{
    id: number;
    urlArchivo: string;
    nombreOriginal: string;
    tipoMime: string;
    pesoBytes: number;
    createdAt: Date;
  }[]> {
    const tramite = await prisma.tramite.findUnique({
      where: { id: tramiteId },
    });

    if (!tramite) {
      throw new Error('Trámite no encontrado');
    }

    if (tramite.apoderadoId !== guardianId) {
      throw new Error('No tienes acceso a este trámite');
    }

    const documentos = await prisma.documentoAdjunto.findMany({
      where: { tramiteId },
      select: {
        id: true,
        urlArchivo: true,
        nombreOriginal: true,
        tipoMime: true,
        pesoBytes: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return documentos;
  }

  async getDocumentById(
    tramiteId: string,
    docId: number,
    guardianId: string
  ): Promise<{
    id: number;
    urlArchivo: string;
    nombreOriginal: string;
    tipoMime: string;
    pesoBytes: number;
    createdAt: Date;
  } | null> {
    const tramite = await prisma.tramite.findUnique({
      where: { id: tramiteId },
    });

    if (!tramite) {
      throw new Error('Trámite no encontrado');
    }

    if (tramite.apoderadoId !== guardianId) {
      throw new Error('No tienes acceso a este trámite');
    }

    const documento = await prisma.documentoAdjunto.findFirst({
      where: {
        id: docId,
        tramiteId,
      },
      select: {
        id: true,
        urlArchivo: true,
        nombreOriginal: true,
        tipoMime: true,
        pesoBytes: true,
        createdAt: true,
      },
    });

    return documento;
  }

  async deleteDocument(
    tramiteId: string,
    docId: number,
    guardianId: string
  ): Promise<void> {
    const tramite = await prisma.tramite.findUnique({
      where: { id: tramiteId },
    });

    if (!tramite) {
      throw new Error('Trámite no encontrado');
    }

    if (tramite.apoderadoId !== guardianId) {
      throw new Error('No tienes acceso a este trámite');
    }

    if (tramite.estado !== 'Pendiente') {
      throw new Error('No se pueden eliminar documentos de un trámite que no está pendiente');
    }

    const documento = await prisma.documentoAdjunto.findFirst({
      where: {
        id: docId,
        tramiteId,
      },
    });

    if (!documento) {
      throw new Error('Documento no encontrado');
    }

    await prisma.documentoAdjunto.delete({
      where: { id: docId },
    });

    eventBusService.emitDocumentoEvent(tramiteId, 'deleted', {
      id: docId,
      nombreOriginal: documento.nombreOriginal,
    });
  }
}

export const tramiteService = new TramiteService();
