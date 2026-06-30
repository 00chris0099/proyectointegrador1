import { z } from 'zod';

export const updateProfileSchema = z.object({
  email: z.string().email('Email inválido').max(255).optional(),
  telefono: z
    .string()
    .regex(/^9\d{8}$/, 'Teléfono debe tener 9 dígitos y empezar con 9')
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z
    .string()
    .min(10, 'Mínimo 10 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos 1 mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos 1 número')
    .regex(/[!@#$%^&*]/, 'Debe contener al menos 1 carácter especial'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const confirmEmailSchema = z.object({
  codigo: z
    .string()
    .length(6, 'El código debe tener 6 dígitos')
    .regex(/^\d+$/, 'El código solo debe contener números'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ConfirmEmailInput = z.infer<typeof confirmEmailSchema>;
