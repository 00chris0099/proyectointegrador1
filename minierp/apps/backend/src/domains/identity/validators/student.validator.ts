import { z } from 'zod';

const parentescosPermitidos = [
  'Padre',
  'Madre',
  'Abuelo Paterno',
  'Abuela Paterna',
  'Abuelo Materno',
  'Abuela Materna',
  'Tutor',
  'Tía',
  'Tío',
  'Hermano',
  'Hermana',
  'Otro',
] as const;

export const requestLinkingSchema = z
  .object({
    dni: z
      .string()
      .length(8, 'El DNI debe tener 8 dígitos')
      .regex(/^\d+$/, 'El DNI solo debe contener números'),
    parentesco: z.enum(parentescosPermitidos, {
      message: 'Parentesco no válido',
    }),
    parentescoCustom: z.string().max(100, 'Máximo 100 caracteres').optional(),
  })
  .refine(
    (data) => {
      if (data.parentesco === 'Otro') {
        return data.parentescoCustom && data.parentescoCustom.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Si seleccionas "Otro", debes especificar el parentesco',
      path: ['parentescoCustom'],
    }
  );

export const approveRequestSchema = z.object({
  id: z.number().int().positive('ID de solicitud inválido'),
});

export const rejectRequestSchema = z.object({
  id: z.number().int().positive('ID de solicitud inválido'),
  motivo: z
    .string()
    .min(10, 'El motivo debe tener al menos 10 caracteres')
    .max(500, 'Máximo 500 caracteres'),
});

export type RequestLinkingInput = z.infer<typeof requestLinkingSchema>;
export type ApproveRequestInput = z.infer<typeof approveRequestSchema>;
export type RejectRequestInput = z.infer<typeof rejectRequestSchema>;