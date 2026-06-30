import PDFDocument from 'pdfkit';
import { prisma } from '../config/database';

interface ConstanciaData {
  idSeguimiento: string;
  tipoNombre: string;
  tipoDescripcion: string | null;
  alumnoNombres: string;
  alumnoApellidos: string;
  alumnoDni: string;
  alumnoNivel: string;
  alumnoGrado: number;
  alumnoSeccion: string;
  apoderadoNombres: string;
  apoderadoApellidos: string;
  apoderadoDni: string;
  estado: string;
  fechaCreacion: Date;
  fechaCulminacion: Date | null;
  aprobadoPor: string;
  comentario: string | null;
}

export async function generarConstancia(tramiteId: string): Promise<Buffer> {
  const tramite = await prisma.tramite.findUnique({
    where: { id: tramiteId },
    include: {
      apoderado: {
        select: { nombres: true, apellidos: true, dni: true },
      },
      alumno: {
        select: { nombres: true, apellidos: true, dni: true, nivel: true, grado: true, seccion: true },
      },
      tipo: {
        select: { nombre: true, descripcion: true },
      },
    },
  });

  if (!tramite) {
    throw new Error('Trámite no encontrado');
  }

  if (tramite.estado !== 'Finalizado') {
    throw new Error('Solo se puede generar constancia de trámites finalizados');
  }

  const auditoria = await prisma.auditoriaTramite.findFirst({
    where: {
      tramiteId,
      accion: 'Aprobación',
    },
    orderBy: { fechaHora: 'desc' },
    include: {
      usuario: {
        select: { nombres: true, apellidos: true },
      },
    },
  });

  const aprobadoPor = auditoria?.usuario
    ? `${auditoria.usuario.nombres} ${auditoria.usuario.apellidos}`
    : 'Directora';

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 60, bottom: 60, left: 72, right: 72 },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - 144;

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('I.E.P. LA ASUNCIÓN', { align: 'center' })
      .fontSize(10)
      .font('Helvetica')
      .text('Institución Educativa Privada', { align: 'center' })
      .moveDown(0.5);

    doc.moveTo(72, doc.y).lineTo(72 + pageWidth, doc.y).stroke();
    doc.moveDown(1);

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('CONSTANCIA DE TRÁMITE FINALIZADO', { align: 'center' })
      .moveDown(1.5);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Número de Seguimiento: ', { continued: true })
      .font('Helvetica')
      .text(tramite.idSeguimiento)
      .moveDown(0.5);

    doc
      .font('Helvetica-Bold')
      .text('Tipo de Trámite: ', { continued: true })
      .font('Helvetica')
      .text(tramite.tipo.nombre)
      .moveDown(0.5);

    if (tramite.tipo.descripcion) {
      doc
        .font('Helvetica')
        .text(tramite.tipo.descripcion)
        .moveDown(0.5);
    }

    doc.moveDown(0.5);
    doc.moveTo(72, doc.y).lineTo(72 + pageWidth, doc.y).stroke();
    doc.moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('DATOS DEL ALUMNO', { underline: true })
      .moveDown(0.5);

    doc
      .font('Helvetica-Bold')
      .text('Nombre completo: ', { continued: true })
      .font('Helvetica')
      .text(`${tramite.alumno.nombres} ${tramite.alumno.apellidos}`)
      .moveDown(0.3);

    doc
      .font('Helvetica-Bold')
      .text('DNI: ', { continued: true })
      .font('Helvetica')
      .text(tramite.alumno.dni)
      .moveDown(0.3);

    doc
      .font('Helvetica-Bold')
      .text('Nivel / Grado / Sección: ', { continued: true })
      .font('Helvetica')
      .text(`${tramite.alumno.nivel} - ${tramite.alumno.grado}° ${tramite.alumno.seccion}`)
      .moveDown(0.8);

    doc
      .font('Helvetica-Bold')
      .text('DATOS DEL APODERADO', { underline: true })
      .moveDown(0.5);

    doc
      .font('Helvetica-Bold')
      .text('Nombre completo: ', { continued: true })
      .font('Helvetica')
      .text(`${tramite.apoderado.nombres} ${tramite.apoderado.apellidos}`)
      .moveDown(0.3);

    doc
      .font('Helvetica-Bold')
      .text('DNI: ', { continued: true })
      .font('Helvetica')
      .text(tramite.apoderado.dni)
      .moveDown(0.8);

    doc.moveTo(72, doc.y).lineTo(72 + pageWidth, doc.y).stroke();
    doc.moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('DETALLE DEL TRÁMITE', { underline: true })
      .moveDown(0.5);

    doc
      .font('Helvetica-Bold')
      .text('Estado: ', { continued: true })
      .font('Helvetica')
      .text('Finalizado (Aprobado)')
      .moveDown(0.3);

    doc
      .font('Helvetica-Bold')
      .text('Fecha de solicitud: ', { continued: true })
      .font('Helvetica')
      .text(formatFecha(tramite.fechaCreacion))
      .moveDown(0.3);

    doc
      .font('Helvetica-Bold')
      .text('Fecha de aprobación: ', { continued: true })
      .font('Helvetica')
      .text(tramite.fechaCulminacion ? formatFecha(tramite.fechaCulminacion) : 'N/A')
      .moveDown(0.3);

    doc
      .font('Helvetica-Bold')
      .text('Aprobado por: ', { continued: true })
      .font('Helvetica')
      .text(aprobadoPor)
      .moveDown(0.8);

    if (tramite.comentario) {
      doc
        .font('Helvetica-Bold')
        .text('Observación del apoderado: ', { continued: true })
        .font('Helvetica')
        .text(tramite.comentario)
        .moveDown(0.5);
    }

    doc.moveTo(72, doc.y).lineTo(72 + pageWidth, doc.y).stroke();
    doc.moveDown(2);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Constancia generada el ${formatFecha(new Date())}`, { align: 'center' })
      .moveDown(0.3)
      .text('Este documento certifica que el trámite ha sido revisado y aprobado por la Dirección.', { align: 'center' })
      .moveDown(0.3)
      .text('I.E.P. La Asunción - Sistema de Gestión Documental', { align: 'center' });

    doc.end();
  });
}

function formatFecha(date: Date): string {
  return new Date(date).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
