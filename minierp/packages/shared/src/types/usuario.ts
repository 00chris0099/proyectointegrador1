export interface Usuario {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono?: string;
  estado: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
  permisos: string[];
}

export interface UsuarioRol {
  id: number;
  usuarioId: string;
  rolId: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    nombres: string;
    apellidos: string;
    roles: string[];
  };
  message?: string;
}
