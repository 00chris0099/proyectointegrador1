import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // ==================== ROLES ====================
  console.log('📝 Creando roles...');

  const roles = await Promise.all([
    prisma.rol.upsert({
      where: { nombre: 'Apoderado' },
      update: {},
      create: {
        nombre: 'Apoderado',
        descripcion: 'Padre/Tutor del alumno',
        permisos: ['tramites.create', 'tramites.read', 'pagos.reportar', 'perfil.read', 'perfil.update'],
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'Secretaria' },
      update: {},
      create: {
        nombre: 'Secretaria',
        descripcion: 'Personal administrativo',
        permisos: ['tramites.read', 'tramites.derivar', 'tramites.observar', 'alumnos.read'],
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'Direccion' },
      update: {},
      create: {
        nombre: 'Direccion',
        descripcion: 'Directora de la institución',
        permisos: ['tramites.read', 'tramites.aprobar', 'reportes.financiero', 'auditoria.read'],
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'Tesoreria' },
      update: {},
      create: {
        nombre: 'Tesoreria',
        descripcion: 'Personal financiero',
        permisos: ['pagos.validar', 'pagos.rechazar', 'dashboard.read', 'reportes.financiero'],
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'Administrador' },
      update: {},
      create: {
        nombre: 'Administrador',
        descripcion: 'Super usuario del sistema',
        permisos: ['*'],
      },
    }),
  ]);

  console.log(`✅ ${roles.length} roles creados`);

  // ==================== USUARIOS ====================
  console.log('👤 Creando usuarios...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@laasuncion.edu.pe' },
    update: {},
    create: {
      email: 'admin@laasuncion.edu.pe',
      passwordHash,
      nombres: 'Administrador',
      apellidos: 'Sistema',
      dni: '00000001',
      telefono: '999999999',
      estado: true,
    },
  });

  const secretariaUser = await prisma.usuario.upsert({
    where: { email: 'secretaria@laasuncion.edu.pe' },
    update: {},
    create: {
      email: 'secretaria@laasuncion.edu.pe',
      passwordHash,
      nombres: 'María',
      apellidos: 'García López',
      dni: '12345678',
      telefono: '987654321',
      estado: true,
    },
  });

  const directoraUser = await prisma.usuario.upsert({
    where: { email: 'direccion@laasuncion.edu.pe' },
    update: {},
    create: {
      email: 'direccion@laasuncion.edu.pe',
      passwordHash,
      nombres: 'Rosa',
      apellidos: 'Martínez Sánchez',
      dni: '87654321',
      telefono: '912345678',
      estado: true,
    },
  });

  const tesoreroUser = await prisma.usuario.upsert({
    where: { email: 'tesoreria@laasuncion.edu.pe' },
    update: {},
    create: {
      email: 'tesoreria@laasuncion.edu.pe',
      passwordHash,
      nombres: 'Carlos',
      apellidos: 'Rodríguez Díaz',
      dni: '11223344',
      telefono: '945612378',
      estado: true,
    },
  });

  const apoderadoUser = await prisma.usuario.upsert({
    where: { email: 'apoderado@test.com' },
    update: {},
    create: {
      email: 'apoderado@test.com',
      passwordHash,
      nombres: 'Juan',
      apellidos: 'Pérez García',
      dni: '44332211',
      telefono: '978456123',
      estado: true,
    },
  });

  console.log('✅ 5 usuarios creados');

  // ==================== ASIGNAR ROLES ====================
  console.log('🔗 Asignando roles...');

  await prisma.usuarioRol.createMany({
    data: [
      { usuarioId: adminUser.id, rolId: roles.find(r => r.nombre === 'Administrador')!.id },
      { usuarioId: secretariaUser.id, rolId: roles.find(r => r.nombre === 'Secretaria')!.id },
      { usuarioId: directoraUser.id, rolId: roles.find(r => r.nombre === 'Direccion')!.id },
      { usuarioId: tesoreroUser.id, rolId: roles.find(r => r.nombre === 'Tesoreria')!.id },
      { usuarioId: apoderadoUser.id, rolId: roles.find(r => r.nombre === 'Apoderado')!.id },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Roles asignados');

  // ==================== ALUMNOS ====================
  console.log('📚 Creando alumnos...');

  const alumnos = await Promise.all([
    prisma.alumno.upsert({
      where: { dni: '11111111' },
      update: {},
      create: {
        dni: '11111111',
        nombres: 'Ana María',
        apellidos: 'Pérez López',
        fechaNac: new Date('2015-03-15'),
        nivel: 'Primaria',
        grado: 4,
        seccion: 'A',
        estado: true,
      },
    }),
    prisma.alumno.upsert({
      where: { dni: '22222222' },
      update: {},
      create: {
        dni: '22222222',
        nombres: 'Luis Carlos',
        apellidos: 'Pérez López',
        fechaNac: new Date('2012-07-22'),
        nivel: 'Secundaria',
        grado: 1,
        seccion: 'B',
        estado: true,
      },
    }),
  ]);

  console.log('✅ 2 alumnos creados');

  // ==================== VINCULAR APODERADO-ALUMNOS ====================
  console.log('🔗 Vinculando apoderado con alumnos...');

  await prisma.apoderadoAlumno.createMany({
    data: [
      {
        apoderadoId: apoderadoUser.id,
        alumnoId: alumnos[0].id,
        parentesco: 'Padre',
        esPrincipal: true,
      },
      {
        apoderadoId: apoderadoUser.id,
        alumnoId: alumnos[1].id,
        parentesco: 'Padre',
        esPrincipal: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Apoderado vinculado con 2 alumnos');

  // ==================== TIPOS DE TRÁMITE ====================
  console.log('📋 Creando tipos de trámite...');

  const tiposTramite = await Promise.all([
    prisma.tipoTramite.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        nombre: 'Constancia de Vacante',
        descripcion: 'Certificado de vacante escolar para transferencia',
        requisitos: ['DNI del alumno', 'Partida de nacimiento'],
        activo: true,
      },
    }),
    prisma.tipoTramite.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        nombre: 'Justificación de Inasistencia',
        descripcion: 'Justificación médica o personal por faltas',
        requisitos: ['Certificado médico', 'DNI del apoderado'],
        activo: true,
      },
    }),
    prisma.tipoTramite.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        nombre: 'Certificado de Estudios',
        descripcion: 'Comprobante de matrícula activa y cursado',
        requisitos: ['DNI del alumno'],
        activo: true,
      },
    }),
    prisma.tipoTramite.upsert({
      where: { id: 4 },
      update: {},
      create: {
        id: 4,
        nombre: 'Carta de Presentación',
        descripcion: 'Carta para instituciones externas',
        requisitos: ['DNI del apoderado', 'Motivo de la carta'],
        activo: true,
      },
    }),
    prisma.tipoTramite.upsert({
      where: { id: 5 },
      update: {},
      create: {
        id: 5,
        nombre: 'Declaración Jurada',
        descripcion: 'Declaración bajo juramento para fines académicos',
        requisitos: ['DNI del apoderado', 'Documento sustento'],
        activo: true,
      },
    }),
    prisma.tipoTramite.upsert({
      where: { id: 6 },
      update: {},
      create: {
        id: 6,
        nombre: 'Constancia de Notas',
        descripcion: 'Reporte oficial de calificaciones',
        requisitos: ['DNI del alumno'],
        activo: true,
      },
    }),
    prisma.tipoTramite.upsert({
      where: { id: 7 },
      update: {},
      create: {
        id: 7,
        nombre: 'Historial Académico',
        descripcion: 'Historial completo de estudios realizados',
        requisitos: ['DNI del alumno', 'Solicitud formal'],
        activo: true,
      },
    }),
    prisma.tipoTramite.upsert({
      where: { id: 8 },
      update: {},
      create: {
        id: 8,
        nombre: 'Solicitud Especial',
        descripcion: 'Cualquier otra solicitud no estandarizada',
        requisitos: ['DNI del apoderado', 'Documento sustento'],
        activo: true,
      },
    }),
  ]);

  console.log('✅ 8 tipos de trámite creados');

  // ==================== CONCEPTOS DE PAGO ====================
  console.log('💰 Creando conceptos de pago...');

  const conceptosPago = await Promise.all([
    prisma.conceptoPago.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        nombre: 'Matrícula 2026',
        descripcion: 'Pago de matrícula del año escolar 2026',
        monto: 350.00,
        activo: true,
      },
    }),
    prisma.conceptoPago.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        nombre: 'Pensión Enero 2026',
        descripcion: 'Mensualidad de enero',
        monto: 250.00,
        activo: true,
      },
    }),
    prisma.conceptoPago.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        nombre: 'Pensión Febrero 2026',
        descripcion: 'Mensualidad de febrero',
        monto: 250.00,
        activo: true,
      },
    }),
    prisma.conceptoPago.upsert({
      where: { id: 4 },
      update: {},
      create: {
        id: 4,
        nombre: 'Pensión Marzo 2026',
        descripcion: 'Mensualidad de marzo',
        monto: 250.00,
        activo: true,
      },
    }),
    prisma.conceptoPago.upsert({
      where: { id: 5 },
      update: {},
      create: {
        id: 5,
        nombre: 'Pensión Abril 2026',
        descripcion: 'Mensualidad de abril',
        monto: 250.00,
        activo: true,
      },
    }),
    prisma.conceptoPago.upsert({
      where: { id: 6 },
      update: {},
      create: {
        id: 6,
        nombre: 'Pensión Mayo 2026',
        descripcion: 'Mensualidad de mayo',
        monto: 250.00,
        activo: true,
      },
    }),
    prisma.conceptoPago.upsert({
      where: { id: 7 },
      update: {},
      create: {
        id: 7,
        nombre: 'Pensión Junio 2026',
        descripcion: 'Mensualidad de junio',
        monto: 250.00,
        activo: true,
      },
    }),
  ]);

  console.log('✅ 7 conceptos de pago creados');

  // ==================== ESTADO DE CUENTA ====================
  console.log('📊 Creando estado de cuenta...');

  const hoy = new Date();
  const estadoCuentas = [];

  for (const alumno of alumnos) {
    for (const concepto of conceptosPago) {
      const fechaVencimiento = new Date(hoy.getFullYear(), conceptosPago.indexOf(concepto), 15);

      estadoCuentas.push({
        alumnoId: alumno.id,
        conceptoId: concepto.id,
        montoTotal: concepto.monto,
        montoPagado: 0,
        fechaVencimiento,
        estado: 'Pendiente',
        diasMora: 0,
      });
    }
  }

  await prisma.estadoCuenta.createMany({
    data: estadoCuentas,
    skipDuplicates: true,
  });

  console.log(`✅ ${estadoCuentas.length} registros de estado de cuenta creados`);

  // ==================== CONFIGURACIÓN DE NOTIFICACIONES ====================
  console.log('🔔 Creando configuración de notificaciones...');

  await prisma.configuracionNotificacion.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      tipoAlerta: 'PREVENTIVA',
      cuerpoMensaje: 'Estimado {nombre_apoderado}, le recordamos que la pensión de {nombre_alumno} por S/{monto_deuda} vence el {fecha_vencimiento}. Gracias.',
      activo: true,
    },
  });

  await prisma.configuracionNotificacion.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      tipoAlerta: 'MOROSIDAD',
      cuerpoMensaje: 'Estimado {nombre_apoderado}, la pensión de {nombre_alumno} por S/{monto_deuda} se encuentra vencida desde hace {dias_mora} días. Le solicitamos regularizar a la brevedad.',
      activo: true,
    },
  });

  console.log('✅ 2 configuraciones de notificación creadas');

  console.log('');
  console.log('🎉 ¡Seed completado exitosamente!');
  console.log('');
  console.log('📧 Usuarios creados:');
  console.log('   - admin@laasuncion.edu.pe / Password123!');
  console.log('   - secretaria@laasuncion.edu.pe / Password123!');
  console.log('   - direccion@laasuncion.edu.pe / Password123!');
  console.log('   - tesoreria@laasuncion.edu.pe / Password123!');
  console.log('   - apoderado@test.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
