# 📘 Guía Completa de Zod — Mini-ERP

## ¿Qué es Zod?

Zod es una librería de validación de esquemas TypeScript-first. Permite definir esquemas de datos y validar automáticamente.

**Ventajas:**
- Type inference automático
- Integración con React Hook Form
- Integración con Express
- Mensajes de error personalizables
- Tiny bundle size

---

## 1. Instalación

```bash
# Backend
npm install zod

# Frontend (React/Next.js)
npm install zod @hookform/resolvers react-hook-form
```

---

## 2. Conceptos Básicos

### 2.1 Tipos de Datos

```typescript
import { z } from 'zod';

// Strings
const name = z.string();
const email = z.string().email();
const age = z.string().min(1).max(100);

// Números
const price = z.number().positive();
const quantity = z.number().int().min(0);

// Booleanos
const isActive = z.boolean();

// Fechas
const createdAt = z.date();

// Arrays
const tags = z.array(z.string());

// Objetos
const user = z.object({
  name: z.string(),
  email: z.string().email()
});
```

### 2.2 Validaciones Comunes de String

```typescript
// Email
z.string().email('Email inválido')

// URL
z.string().url('URL inválida')

// UUID
z.string().uuid('UUID inválido')

// Min/Max
z.string().min(3, 'Mínimo 3 caracteres')
z.string().max(50, 'Máximo 50 caracteres')

// Regex
z.string().regex(/^[A-Z]/, 'Debe empezar con mayúscula')

// Contenido específico
z.string().includes('hello', 'Debe contener "hello"')
z.string().startsWith('Mr.', 'Debe empezar con "Mr."')
z.string().endsWith('.com', 'Debe terminar con ".com"')
```

### 2.3 Validaciones Comunes de Número

```typescript
// Rangos
z.number().min(0, 'Mínimo 0')
z.number().max(100, 'Máximo 100')
z.number().min(0).max(100)

// Enteros
z.number().int('Debe ser entero')

// Positivo/Negativo
z.number().positive('Debe ser positivo')
z.number().negative('Debe ser negativo')
z.number().nonnegative('No puede ser negativo')

// Decimales
z.number().multipleOf(0.01, 'Máximo 2 decimales')
```

---

## 3. Validaciones Avanzadas

### 3.1 Optional y Nullable

```typescript
const schema = z.object({
  nombre: z.string().min(1),                    // Requerido
  telefono: z.string().optional(),              // Opcional
  direccion: z.string().nullable(),             // Puede ser null
  email: z.string().optional().nullable()       // Opcional y nullable
});
```

### 3.2 Refinements (Validaciones Personalizadas)

```typescript
const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'] // Campo donde mostrar el error
});

// Validación condicional
const schema = z.object({
  tipo: z.enum(['factura', 'boleta']),
  ruc: z.string().optional(),
  dni: z.string().optional()
}).refine(data => {
  if (data.tipo === 'factura') {
    return data.ruc !== undefined && data.ruc.length === 11;
  }
  return true;
}, {
  message: 'RUC requerido para facturas',
  path: ['ruc']
});
```

### 3.3 Transformaciones

```typescript
// Transformar a minúsculas
const email = z.string().transform(val => val.toLowerCase());

// Parsear número
const price = z.string().transform(val => parseFloat(val));

// Parsear fecha
const date = z.string().transform(val => new Date(val));
```

### 3.4 Preprocess (Pre-procesamiento)

```typescript
// Aceptar número o string y convertir a número
const price = z.preprocess(
  (val) => typeof val === 'string' ? parseFloat(val) : val,
  z.number().positive()
);

// Aceptar string o Date
const date = z.preprocess(
  (val) => typeof val === 'string' ? new Date(val) : val,
  z.date()
);
```

---

## 4. Integración con React Hook Form

### 4.1 Ejemplo Básico

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Definir esquema
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
});

// Inferir tipo
type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log(data); // data está tipado automáticamente
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Email</label>
        <input
          type="email"
          {...register('email')}
        />
        {errors.email && (
          <span className="error">{errors.email.message}</span>
        )}
      </div>

      <div>
        <label>Contraseña</label>
        <input
          type="password"
          {...register('password')}
        />
        {errors.password && (
          <span className="error">{errors.password.message}</span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Ingresando...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
}
```

### 4.2 Ejemplo Completo con Validaciones

```typescript
const registerSchema = z.object({
  nombres: z.string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .regex(/^[A-Za-záéíóúñÁÉÍÓÚÑ\s]+$/, 'Solo letras'),
  
  apellidos: z.string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  
  email: z.string()
    .email('Email inválido')
    .max(255),
  
  dni: z.string()
    .regex(/^\d{8}$/, 'DNI debe tener 8 dígitos'),
  
  telefono: z.string()
    .regex(/^9\d{8}$/, 'Teléfono debe tener 9 dígitos y empezar con 9')
    .optional()
    .or(z.literal('')),
  
  password: z.string()
    .min(10, 'Mínimo 10 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos 1 mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos 1 número')
    .regex(/[!@#$%^&*]/, 'Debe contener al menos 1 carácter especial'),
  
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});
```

---

## 5. Integración con Express (Backend)

### 5.1 Middleware de Validación

```typescript
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};
```

### 5.2 Uso en Rutas

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();

// Esquema de validación
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida')
});

// Aplicar middleware
router.post('/login', validate(loginSchema), async (req, res) => {
  // req.body está validado y tipado
  const { email, password } = req.body;
  
  // ... lógica de login
});
```

---

## 6. Mensajes de Error Personalizados

```typescript
const schema = z.object({
  email: z.string({
    required_error: 'El email es requerido',
    invalid_type_error: 'El email debe ser un string'
  }).email('Formato de email inválido'),
  
  age: z.number({
    invalid_type_error: 'La edad debe ser un número'
  }).min(18, 'Debes ser mayor de 18 años').max(120, 'Edad inválida'),
  
  role: z.enum(['admin', 'user', 'guest'], {
    errorMap: () => ({ message: 'Rol inválido' })
  })
});
```

---

## 7. Ejemplos del Proyecto Mini-ERP

### 7.1 Login

```typescript
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
});
```

### 7.2 Registro de Apoderado

```typescript
export const registerApoderadoSchema = z.object({
  nombres: z.string().min(2).max(100),
  apellidos: z.string().min(2).max(100),
  email: z.string().email().max(255),
  dni: z.string().regex(/^\d{8}$/),
  telefono: z.string().regex(/^9\d{8}$/).optional(),
  password: z.string().min(10)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[!@#$%^&*]/)
});
```

### 7.3 Crear Trámite

```typescript
export const crearTramiteSchema = z.object({
  alumnoId: z.string().uuid(),
  tipoId: z.number().int().positive(),
  comentario: z.string().max(500).optional()
});
```

### 7.4 Reportar Pago

```typescript
export const reportarPagoSchema = z.object({
  estadoCuentaId: z.string().uuid(),
  numeroOperacion: z.string().min(1).max(50),
  fechaPago: z.string().refine(val => {
    const date = new Date(val);
    return date <= new Date();
  }, 'La fecha no puede ser futura'),
  montoPago: z.number().positive().multipleOf(0.01)
});
```

### 7.5 Filtros de Búsqueda

```typescript
export const filtrosTramitesSchema = z.object({
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  tipoTramite: z.number().int().optional(),
  estado: z.enum(['Pendiente', 'Derivado', 'Observado', 'Finalizado']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(10)
}).refine(data => {
  if (data.fechaInicio && data.fechaFin) {
    return new Date(data.fechaInicio) <= new Date(data.fechaFin);
  }
  return true;
}, 'La fecha de inicio debe ser anterior a la fecha fin');
```

---

## 8. Tips y Best Practices

### 8.1 Reutilizar Esquemas

```typescript
// Definir una vez
const emailSchema = z.string().email().max(255);

// Reutilizar
const loginSchema = z.object({ email: emailSchema, password: z.string() });
const registerSchema = z.object({ email: emailSchema, name: z.string() });
```

### 8.2 Crear Helpers

```typescript
// Helper para DNI peruano
const dniPeruano = z.string().regex(/^\d{8}$/, 'DNI debe tener 8 dígitos');

// Helper para teléfono peruano
const telefonoPeruano = z.string().regex(/^9\d{8}$/, 'Teléfono inválido');

// Helper para moneda
const moneda = z.number().positive().multipleOf(0.01);
```

### 8.3 Usar .safeParse para No Lanzar Errores

```typescript
const result = schema.safeParse(data);

if (result.success) {
  console.log(result.data); // Datos validados
} else {
  console.log(result.error.errors); // Errores de validación
}
```

### 8.4 Type Inference

```typescript
// Zod infiere el tipo automáticamente
const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  roles: z.array(z.string())
});

// Tipo TypeScript generado automáticamente
type User = z.infer<typeof userSchema>;

// Ahora User es:
// { id: string; email: string; roles: string[] }
```

---

## 9. Recursos Adicionales

- [Documentación oficial](https://zod.dev/)
- [Zod + React Hook Form](https://react-hook-form.com/advanced-usage#Controller)
- [Ejemplos en GitHub](https://github.com/colinhacks/zod/tree/master/examples)
