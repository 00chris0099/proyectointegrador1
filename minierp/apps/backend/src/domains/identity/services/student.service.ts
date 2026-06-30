import { prisma } from '../../../config/database';

export interface StudentData {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  nivel: string;
  grado: number;
  seccion: string;
  estado: boolean;
  fechaNac: Date | null;
  parentesco: string;
  parentescoCustom: string | null;
  esPrincipal: boolean;
}

export class StudentService {
  async getStudentsByGuardian(guardianId: string): Promise<StudentData[]> {
    const vinculaciones = await prisma.apoderadoAlumno.findMany({
      where: { apoderadoId: guardianId },
      include: {
        alumno: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return vinculaciones.map((v) => ({
      id: v.alumno.id,
      dni: v.alumno.dni,
      nombres: v.alumno.nombres,
      apellidos: v.alumno.apellidos,
      nivel: v.alumno.nivel,
      grado: v.alumno.grado,
      seccion: v.alumno.seccion,
      estado: v.alumno.estado,
      fechaNac: v.alumno.fechaNac,
      parentesco: v.parentesco,
      parentescoCustom: null,
      esPrincipal: v.esPrincipal,
    }));
  }

  async getStudentById(studentId: string) {
    const alumno = await prisma.alumno.findUnique({
      where: { id: studentId },
    });

    if (!alumno) {
      throw new Error('Alumno no encontrado');
    }

    return alumno;
  }

  async getStudentByDni(dni: string) {
    const alumno = await prisma.alumno.findUnique({
      where: { dni },
    });

    return alumno;
  }

  async checkAlreadyLinked(guardianId: string, studentId: string): Promise<boolean> {
    const vinculacion = await prisma.apoderadoAlumno.findUnique({
      where: {
        apoderadoId_alumnoId: {
          apoderadoId: guardianId,
          alumnoId: studentId,
        },
      },
    });

    return vinculacion !== null;
  }

  async linkStudent(guardianId: string, studentId: string, parentesco: string, esPrincipal: boolean = false) {
    const vinculacion = await prisma.apoderadoAlumno.create({
      data: {
        apoderadoId: guardianId,
        alumnoId: studentId,
        parentesco,
        esPrincipal,
      },
    });

    return vinculacion;
  }

  async unlinkStudent(guardianId: string, studentId: string) {
    await prisma.apoderadoAlumno.delete({
      where: {
        apoderadoId_alumnoId: {
          apoderadoId: guardianId,
          alumnoId: studentId,
        },
      },
    });
  }

  async getLinkedStudentsCount(guardianId: string): Promise<number> {
    const count = await prisma.apoderadoAlumno.count({
      where: { apoderadoId: guardianId },
    });

    return count;
  }

  async createStudent(data: {
    dni: string;
    nombres: string;
    apellidos: string;
    nivel: string;
    grado: number;
    seccion: string;
    fechaNac?: string;
  }) {
    const existing = await prisma.alumno.findUnique({ where: { dni: data.dni } });
    if (existing) {
      throw new Error('Ya existe un alumno con ese DNI');
    }

    return prisma.alumno.create({
      data: {
        dni: data.dni,
        nombres: data.nombres,
        apellidos: data.apellidos,
        nivel: data.nivel,
        grado: data.grado,
        seccion: data.seccion,
        fechaNac: data.fechaNac ? new Date(data.fechaNac) : null,
        estado: true,
      },
    });
  }

  async getAllStudents() {
    return prisma.alumno.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteStudent(studentId: string) {
    await prisma.apoderadoAlumno.deleteMany({ where: { alumnoId: studentId } });
    return prisma.alumno.delete({ where: { id: studentId } });
  }
}

export const studentService = new StudentService();