# 👤 IMPLEMENTACIÓN HU-03: Gestión de Perfil y Datos Personales

## Mini-ERP I.E.P. La Asunción — Guía de Implementación

---

## 📋 Resumen de Decisiones Técnicas

| Componente | Decisión | Justificación |
|------------|----------|---------------|
| Campos editables | Email + Teléfono | Para que alertas n8n/WhatsApp funcionen |
| Cambio de email | Verificación con código de 6 dígitos | Seguridad, evitar cuentas comprometidas |
| Avatar | imgBB API | Reutilizar API key existente |
| Auditoría | Nueva tabla `PerfilAuditoria` | Log inmutable de cambios |
| Cambio de contraseña | Incluir en HU-03 | Comodidad del usuario |
| Validación | Zod | Consistencia con HUs anteriores |
| Teléfono válido | 9 dígitos, empieza con 9 | Formato peruano estándar |

---

## 🗂️ FASE 1: Backend Core

### Paso 1.1: Migración — Tablas nuevas
**Estado:** ✅ Completado
**Archivo:** `apps/backend/prisma/schema.prisma`

**Acciones:**
- [ ] Crear modelo `PerfilAuditoria`
- [ ] Crear modelo `EmailVerification`
- [ ] Generar migración

**Schema:**
```prisma
model PerfilAuditoria {
  id            Int      @id @default(autoincrement())
  usuarioId     String   @map("usuario_id") @db.Uuid
  campo         String   @db.VarChar(50)
  valorAnterior String?  @map("valor_anterior") @db.Text
  valorNuevo    String?  @map("valor_nuevo") @db.Text
  fechaCambio   DateTime @default(now()) @map("fecha_cambio")

  usuario Usuario @relation(fields: [usuarioId], references: [id])

  @@index([usuarioId])
  @@index([fechaCambio(sort: Desc)])
  @@map("perfil_auditoria")
}

model EmailVerification {
  id        Int      @id @default(autoincrement())
  usuarioId String   @map("usuario_id") @db.Uuid
  codigo    String   @db.VarChar(6)
  emailNuevo String  @map("email_nuevo") @db.VarChar(255)
  expiresAt DateTime @map("expires_at")
  used      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  usuario Usuario @relation(fields: [usuarioId], references: [id], onDelete: Cascade)

  @@index([usuarioId])
  @@index([codigo])
  @@map("email_verifications")
}
```

---

### Paso 1.2: Profile Service
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/domains/identity/services/profile.service.ts`

**Acciones:**
- [ ] Implementar `getProfile(userId)`
- [ ] Implementar `updateContactInfo(userId, email, telefono)`
- [ ] Implementar `changePassword(userId, currentPassword, newPassword)`
- [ ] Implementar `uploadAvatar(userId, imageUrl)`

---

### Paso 1.3: Email Verification Service
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/domains/identity/services/email-verification.service.ts`

**Acciones:**
- [ ] Generar código de 6 dígitos aleatorio
- [ ] Guardar en BD con TTL de 15 minutos
- [ ] Enviar código por email
- [ ] Verificar código
- [ ] Invalidar códigos anteriores

---

### Paso 1.4: Profile Validator (Zod)
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/domains/identity/validators/profile.validator.ts`

**Acciones:**
- [ ] Esquema `updateProfileSchema` (email, telefono)
- [ ] Esquema `changePasswordSchema` (currentPassword, newPassword, confirmPassword)
- [ ] Esquema `verifyEmailSchema` (codigo)
- [ ] Esquema `confirmEmailSchema` (codigo)

---

### Paso 1.5: Profile Routes
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/routes/profile.routes.ts`

**Endpoints:**
- [ ] GET /api/users/profile
- [ ] PATCH /api/users/profile
- [ ] POST /api/users/profile/verify-email
- [ ] POST /api/users/profile/confirm-email
- [ ] PATCH /api/users/profile/password
- [ ] POST /api/users/profile/avatar

---

### Paso 1.6: Actualizar Server.ts
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/server.ts`

**Acciones:**
- [ ] Importar profile routes
- [ ] Registrar rutas

---

### Paso 1.7: Profile Audit Service
**Estado:** ✅ Completado
**Archivo:** `apps/backend/src/domains/identity/services/profile-audit.service.ts`

**Acciones:**
- [ ] Registrar cambios de email
- [ ] Registrar cambios de teléfono

---

### Paso 1.8: Variables de Entorno
**Estado:** ✅ Completado
**Archivo:** `apps/backend/.env`

**Acciones:**
- [ ] Agregar EMAIL_VERIFICATION_EXPIRY=15

---

## 🗂️ FASE 2: Frontend Admin

### Paso 2.1: Página de Perfil
**Estado:** ✅ Completado
**Archivo:** `apps/admin/src/app/dashboard/profile/page.tsx`

### Paso 2.2: Formulario Editar Contacto
**Estado:** ✅ Completado
**Archivo:** `apps/admin/src/app/dashboard/profile/components/edit-contact-form.tsx`

### Paso 2.3: Formulario Cambiar Contraseña
**Estado:** ✅ Completado
**Archivo:** `apps/admin/src/app/dashboard/profile/components/change-password-form.tsx`

### Paso 2.4: Avatar Upload
**Estado:** ✅ Completado
**Archivo:** `apps/admin/src/app/dashboard/profile/components/avatar-upload.tsx`

### Paso 2.5: Layout del Perfil
**Estado:** ⬜ Pendiente
**Archivo:** `apps/admin/src/app/dashboard/profile/layout.tsx`

### Paso 2.6: Sidebar/Menu
**Estado:** ✅ Completado
**Archivo:** `apps/admin/src/app/dashboard/layout.tsx` + `apps/admin/src/components/sidebar.tsx`

---

## 🗂️ FASE 3: Frontend Móvil

### Paso 3.1: Profile Screen
**Estado:** ✅ Completado
**Archivo:** `apps/mobile/lib/features/perfil/screens/profile_screen.dart`

### Paso 3.2: Editar Contacto
**Estado:** ✅ Completado
**Archivo:** `apps/mobile/lib/features/perfil/widgets/edit_contact_form.dart`

### Paso 3.3: Cambiar Contraseña
**Estado:** ✅ Completado
**Archivo:** `apps/mobile/lib/features/perfil/widgets/change_password_form.dart`

### Paso 3.4: Avatar Upload
**Estado:** ✅ Completado
**Archivo:** `apps/mobile/lib/features/perfil/widgets/avatar_upload.dart`

### Paso 3.5: Actualizar Rutas y Home
**Estado:** ✅ Completado
**Archivo:** `apps/mobile/lib/main.dart` + `apps/mobile/lib/features/home/screens/home_screen.dart`

---

## 🗂️ FASE 4: Documentación

### Paso 4.1: Documentación de Endpoints
**Estado:** ✅ Completado
**Archivo:** `docs/AUTH.md`

### Paso 4.2: Service Profile para Móvil
**Estado:** ✅ Completado
**Archivo:** `apps/mobile/lib/core/services/profile_service.dart`

---

## ✅ Checklist de Verificación

### Backend
- [x] GET /api/users/profile retorna datos correctos
- [x] PATCH /api/users/profile actualiza email/teléfono
- [x] POST /api/users/profile/verify-email envía código
- [x] POST /api/users/profile/confirm-email verifica código
- [x] PATCH /api/users/profile/password cambia contraseña
- [x] POST /api/users/profile/avatar sube imagen
- [x] Auditoría registra cada cambio
- [x] Validación Zod en todos los endpoints

### Frontend Admin
- [x] Página de perfil funcional
- [x] Edición de contacto con verificación
- [x] Cambio de contraseña
- [x] Upload de avatar

### Frontend Móvil
- [x] Profile screen funcional
- [x] Edición de contacto
- [x] Cambio de contraseña
- [x] Upload de avatar

### Documentación
- [x] Endpoints documentados en AUTH.md
- [x] Profile service implementado para móvil

---

**Última actualización:** 2026-06-29
