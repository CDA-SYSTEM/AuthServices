# AUTH Microservice - NestJS + Redis + JWT

Microservicio de autenticación y autorización con gestión de roles, construido con NestJS, JWT y Redis.

## 📋 Contenido

- [Características](#características)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Endpoints](#endpoints)
- [Roles y Protección](#roles-y-protección)
- [Gestión de Contraseñas](#gestión-de-contraseñas)
- [Pruebas](#pruebas)
- [Redis](#redis)

---

## ✨ Características

- ✅ **Autenticación JWT**: Access Token + Refresh Token
- ✅ **Almacenamiento en Redis**: Sesiones y blacklist de tokens
- ✅ **Gestión de Roles**: ADMIN, MANAGER, USER, VIEWER con jerarquía
- ✅ **Protección de Rutas**: Guards basados en roles
- ✅ **CRUD de Usuarios**: Crear, listar, actualizar roles, resetear contraseñas
- ✅ **Clean Architecture**: Separación clara de capas (dominio, aplicación, infraestructura)
- ✅ **Validación con DTOs**: Class-validator para validaciones automáticas

---

## 📁 Estructura del Proyecto

```
src/
├── app.module.ts
├── main.ts
├── config/
│   └── env.validation.ts           # Validación de variables de entorno
├── common/
│   ├── domain/
│   │   ├── dto/                    # DTOs compartidos
│   │   ├── enums/
│   │   │   └── user-role.enum.ts  # Enum de roles
│   │   └── interfaces/
│   └── infrastructure/
│       ├── decorators/
│       │   └── roles.decorator.ts  # Decorador @Roles()
│       └── guards/
│           ├── jwt-auth.guard.ts
│           └── roles.guard.ts      # Guard de protección por roles
├── auth/
│   ├── application/
│   │   └── services/
│   │       └── auth.service.ts     # Lógica de autenticación y gestión de usuarios
│   ├── domain/
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user-role.dto.ts
│   │   │   └── reset-password.dto.ts
│   │   └── interfaces/
│   │       └── mock-user.interface.ts
│   ├── infrastructure/
│   │   ├── controllers/
│   │   │   └── auth.controller.ts  # Endpoints REST
│   │   └── strategies/
│   │       └── jwt.strategy.ts      # Estrategia Passport JWT
│   └── auth.module.ts
└── redis/
    ├── redis.module.ts             # Módulo reutilizable de Redis
    ├── redis.service.ts            # Servicio para operaciones Redis
    └── tokens/
        └── redis.tokens.ts         # Tokens de inyección
```

---

## 🛠️ Instalación

### Prerequisites

- Node.js 20+ 
- npm 11+
- Docker (para Redis)

### Pasos

1. **Instalar dependencias:**
```bash
cd Auth Services
npm.cmd install
```

2. **Crear archivo .env:**
```bash
copy .env.example .env
```

3. **Levantar contenedor Redis:**
```bash
docker run -d --name redis-auth -p 6379:6379 redis:alpine
```

4. **Compilar:**
```bash
npm.cmd run build
```

5. **Ejecutar en desarrollo:**
```bash
npm.cmd run start:dev
```

El servicio escuchará en `http://localhost:3001/api` (puerto configurarle en `.env`).

---

## 🔧 Configuración

### Variables de Entorno (.env)

```env
# Puerto de escucha
PORT=3001
NODE_ENV=development

# JWT Secrets (cambiar en producción)
JWT_ACCESS_SECRET=access-secret-change-me
JWT_REFRESH_SECRET=refresh-secret-change-me

# TTL de tokens
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# Redis (contenedor Docker)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS_ENABLED=false
```

### ⚠️ IMPORTANTE en Producción

- Cambiar `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` por valores aleatorios seguros.
- Usar HTTPS/TLS en Redis si está remoto.
- Proteger el archivo `.env` con permisos de archivo restringidos.
- Habilitar autenticación en Redis mediante `REDIS_PASSWORD`.

---

## 🔌 Endpoints

### Públicos (sin autenticación)

#### POST /api/auth/login
**Obtener tokens de acceso y refresh.**

Request:
```json
{
  "email": "admin@example.com",
  "password": "P@ssw0rd!"
}
```

Response (200):
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

#### POST /api/auth/refresh
**Rotar tokens usando refresh token.**

Request:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

Response (200):
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

#### POST /api/auth/logout
**Cerrar sesión y revocar refresh token.**

Request:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

Response (200):
```json
{
  "message": "Sesion cerrada correctamente"
}
```

---

### Protegidos (requieren JWT + Rol)

#### POST /api/auth/users
**Crear nuevo usuario (Solo ADMIN).**

Headers:
```
Authorization: Bearer <accessToken>
```

Request:
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "role": "manager"
}
```

Response (201):
```json
{
  "id": "usr-1234567890",
  "email": "newuser@example.com",
  "role": "manager"
}
```

---

#### GET /api/auth/users
**Listar todos los usuarios (ADMIN o MANAGER).**

Headers:
```
Authorization: Bearer <accessToken>
```

Response (200):
```json
[
  {
    "id": "usr-001",
    "email": "admin@example.com",
    "role": "admin"
  },
  {
    "id": "usr-002",
    "email": "manager@example.com",
    "role": "manager"
  }
]
```

---

#### PATCH /api/auth/users/role
**Actualizar rol de usuario (Solo ADMIN).**

Headers:
```
Authorization: Bearer <accessToken>
```

Request:
```json
{
  "email": "newuser@example.com",
  "role": "user"
}
```

Response (200):
```json
{
  "message": "Rol actualizado a user"
}
```

---

#### POST /api/auth/users/reset-password
**Resetear contraseña de usuario (Solo ADMIN).**

Headers:
```
Authorization: Bearer <accessToken>
```

Request:
```json
{
  "email": "user@example.com",
  "newPassword": "NewDefault123!"
}
```

Response (200):
```json
{
  "message": "Contraseña reiniciada correctamente"
}
```

---

#### DELETE /api/auth/users/:email
**Eliminar usuario (Solo ADMIN).**

Headers:
```
Authorization: Bearer <accessToken>
```

Request Body:
```json
{
  "email": "user@example.com"
}
```

Response (200):
```json
{
  "message": "Usuario eliminado correctamente"
}
```

---

## 👥 Roles y Protección

### Jerarquía de Roles

```
ADMIN (4)      → Acceso total a CRUD de usuarios y roles
  ↓
MANAGER (3)    → Puede ver usuarios, no puede crear/eliminar
  ↓
USER (2)       → Solo lectura de su propia sesión
  ↓
VIEWER (1)     → Acceso de solo lectura limitado
```

### Uso del Decorador @Roles()

```typescript
@Post('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)  // Solo ADMIN
async createUser(@Body() dto: CreateUserDto) {
  return this.authService.createUser(dto);
}

@Get('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)  // ADMIN o MANAGER
async getAllUsers() {
  return this.authService.getAllUsers();
}
```

---

## 🔐 Gestión de Contraseñas

### Decisión Arquitectónica: ¿Recuperación vs Reset?

#### **RECOMENDADO: Admin Reset (Modelo Actual)**

✅ **Ventajas:**
- Mayor seguridad: el usuario no elige una contraseña débil
- Auditable: registras quién reseteó el password
- Controlado: el admin ve quién cambió qué
- Compatible con 2FA y sistemas de verificación

❌ **Desventajas:**
- Requiere que el usuario contacte conAdmin/Soporte
- Mayor latencia en caso de olvido

**Implementación:**
```bash
POST /api/auth/users/reset-password
{
  "email": "usuario@example.com",
  "newPassword": "TempPassword123!"
}
```

El usuario recibe el password temporal y debe cambiarlo en el login. Implementaremos esto en fase 2.

---

#### **Alternativa: Self-Service Recovery (Futuro)**

❌ **Desventajas de esta opción:**
- Token de recuperación se pueden interceptar
- Email puede ser phishing
- Mayor superficie de ataque

Si implementas esto en futuro:
1. Crear endpoint POST /api/auth/forgot-password
2. Generar token único guardado en Redis con TTL (5-10 minutos)
3. Enviar email con link (o usar integración mandrill/sendgrid)
4. Validar token antes de permitir reset

---

### Recomendación para el Proyecto

1. **Corto plazo**: Mantener reset por admin (está implementado)
2. **Mediano plazo**: Agregar endpoint de self-service con validación OTP
3. **Largo plazo**: Integrar 2FA y autenticación multifactor

---

## 🧪 Pruebas

### Con Postman

1. Importar colección: `postman/Auth Service.postman_collection.json`
2. Importar environment: `postman/Auth Service.local.postman_environment.json`
3. Ejecutar secuencia: Login → Refresh → Logout

### Con PowerShell

**Login:**
```powershell
$body = @{ email='admin@example.com'; password='P@ssw0rd!' } | ConvertTo-Json
$resp = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/auth/login" -ContentType "application/json" -Body $body
$resp | ConvertTo-Json
```

**Crear usuario (como ADMIN):**
```powershell
$body = @{ 
  email='newadmin@example.com'
  password='Admin123!'
  role='admin'
} | ConvertTo-Json
$headers = @{ Authorization="Bearer $($resp.accessToken)" }
Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/auth/users" -ContentType "application/json" -Body $body -Headers $headers
```

**Reset de contraseña (como ADMIN):**
```powershell
$body = @{ 
  email='admin@example.com'
  newPassword='NewPass456!'
} | ConvertTo-Json
$headers = @{ Authorization="Bearer $($resp.accessToken)" }
Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/auth/users/reset-password" -ContentType "application/json" -Body $body -Headers $headers
```

---

## 🐳 Redis

### Verificar Contenedor

```bash
docker ps
docker exec redis-auth redis-cli ping
```

Debe responder **PONG**.

### Datos Almacenados en Redis

- **Sessions**: `auth:session:user:{userId}` → refresh token activo (TTL: 7 días)
- **Blacklist**: `auth:blacklist:refresh:{tokenHash}` → tokens revocados (TTL: igual al exp del token)

### Limpiar Redis

```bash
docker exec redis-auth redis-cli FLUSHALL
```

---

## 📚 Dependencias Principales

- **@nestjs/common**: Framework base
- **@nestjs/jwt**: JWT signing/verification
- **@nestjs/passport**: Integración Passport.js
- **@nestjs/config**: Variables de entorno con validación Joi
- **ioredis**: Cliente Redis
- **class-validator**: Validación de DTOs
- **passport-jwt**: Estrategia JWT para Passport

---

## 🚀 Próximos Pasos Sugeridos

1. **Integración con Base de Datos Real**
   - Reemplazar `mockUsers` con repositorio de MongoDB/PostgreSQL
   - Agregar encriptación de contraseñas con bcrypt en BD

2. **Self-Service Password Recovery**
   - Endpoint POST /api/auth/forgot-password
   - Token de recuperación en Redis (TTL 10 min)
   - Notificación por email

3. **2FA/MFA**
   - Integración con Google Authenticator
   - Envío de OTP por SMS

4. **Auditoría**
   - Logging de intentos de login fallidos
   - Registro de cambios de rol y contraseña

5. **Rate Limiting**
   - Proteger endpoints de fuerza bruta

---

## 📝 Licencia

UNLICENSED

---

**Última actualización:** Marzo 2026

**Autor:** Arquitecto de Software Senior - NestJS/Microservicios
