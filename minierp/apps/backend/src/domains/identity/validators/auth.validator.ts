import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(255),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
});

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token requerido')
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
