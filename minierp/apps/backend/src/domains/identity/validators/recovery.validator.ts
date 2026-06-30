import { z } from 'zod';

export const requestRecoverySchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(255),
});

export const resetPasswordSchema = z
  .object({
    token: z
      .string()
      .uuid('Token inválido'),
    password: z
      .string()
      .min(10, 'Mínimo 10 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos 1 mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos 1 número')
      .regex(/[!@#$%^&*]/, 'Debe contener al menos 1 carácter especial'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const validateTokenSchema = z.object({
  token: z
    .string()
    .uuid('Token inválido'),
});

export type RequestRecoveryInput = z.infer<typeof requestRecoverySchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ValidateTokenInput = z.infer<typeof validateTokenSchema>;
