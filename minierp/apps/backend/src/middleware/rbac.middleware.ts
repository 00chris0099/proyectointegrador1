import { Request, Response, NextFunction } from 'express';

export const rbacMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user || !user.roles) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado'
        });
      }

      const hasRole = user.roles.some((role: string) => allowedRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para esta acción'
        });
      }

      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: 'Error de autorización'
      });
    }
  };
};
