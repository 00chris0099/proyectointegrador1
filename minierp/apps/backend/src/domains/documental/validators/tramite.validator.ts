import { z } from 'zod';

export const createTramiteSchema = z.object({
  alumnoId: z.string().uuid('ID de alumno inválido'),
  tipoId: z.number().int().positive('Tipo de trámite inválido'),
  comentario: z.string().max(1000, 'El comentario no puede exceder 1000 caracteres').optional(),
});

export const addDocumentSchema = z.object({
  urlArchivo: z.string().url('URL de archivo inválida'),
  nombreOriginal: z.string().max(255, 'Nombre de archivo muy largo'),
  tipoMime: z.enum(['application/pdf', 'image/jpeg', 'image/jpg'], {
    errorMap: () => ({ message: 'Solo se permiten archivos PDF o JPG' }),
  }),
  pesoBytes: z.number().int().positive().max(5 * 1024 * 1024, 'El archivo no puede exceder 5MB'),
});

export type CreateTramiteInput = z.infer<typeof createTramiteSchema>;
export type AddDocumentInput = z.infer<typeof addDocumentSchema>;
