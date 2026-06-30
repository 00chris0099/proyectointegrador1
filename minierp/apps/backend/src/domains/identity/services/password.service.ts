import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 10) errors.push('Mínimo 10 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('Al menos 1 mayúscula');
    if (!/[0-9]/.test(password)) errors.push('Al menos 1 número');
    if (!/[!@#$%^&*]/.test(password)) errors.push('Al menos 1 carácter especial (!@#$%^&*)');
    
    return { valid: errors.length === 0, errors };
  }
}

export const passwordService = new PasswordService();
