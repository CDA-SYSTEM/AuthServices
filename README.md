# Auth Service - Arquitectura Hexagonal

Microservicio de autenticacion y autorizacion para el ecosistema SystemCDA.

## Stack

- NestJS + TypeScript
- TypeORM + PostgreSQL
- Redis (sesiones)
- JWT (access + refresh tokens)
- bcrypt (hash de contraseñas)
- Swagger (OpenAPI)

## Arquitectura Hexagonal

```
src/
├── auth/
│   ├── domain/
│   │   ├── dto/          → DTOs de entrada/salida
│   │   ├── interfaces/   → Interfaces de dominio (User, AuthAccount, Role)
│   │   └── ports/        → Puertos de repositorio (contratos)
│   ├── application/
│   │   ├── services/     → Servicios de aplicacion (AuthService)
│   │   └── use-cases/    → Casos de uso
│   └── infrastructure/
│       ├── controllers/  → Controladores REST
│       ├── persistence/  → Adaptadores de repositorio (TypeORM)
│       └── seeds/        → Semillas de datos iniciales
├── common/               → Codigo compartido (guards, decorators, enums)
├── redis/                → Modulo Redis
├── cache/                → Modulo Cache
└── migrations/           → Migraciones versionadas
```

## Reglas de negocio

| Rol | Nivel | Permisos |
|-----|-------|----------|
| SUPERADMIN | 5 | Control total del sistema: gestion de administradores, configuracion global, auditoria completa |
| ADMIN | 4 | Control total: CRUD usuarios, reset passwords, registro personal |
| MANAGER | 3 | Consulta, busqueda, inactivacion, reset passwords |
| INSPECTOR | 2 | Acceso a modulo checklists NTC 5375 |
| OPERARIO | 1 | Acceso a modulo recepcion |

Los roles heredan permisos de niveles inferiores via `ROLE_HIERARCHY`.

Restricciones:
- Solo ADMIN puede registrar personal y actualizar/eliminar usuarios
- ADMIN y MANAGER pueden listar, buscar, inactivar y resetear passwords
- Solo se pueden registrar roles `inspector` y `operario`
- Toda request externa requiere header `x-api-key` (validado por `ApiKeyGuard` global)

## Endpoints

Prefijo global: `/api`

### Autenticación (públicos)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Iniciar sesion (email + password) |
| POST | `/auth/oauth/google` | Iniciar sesion o registrarse con Google (ID token) |
| POST | `/auth/refresh` | Refrescar token JWT |
| POST | `/auth/logout` | Cerrar sesion (invalida refresh token) |
| POST | `/auth/validate-token` | Validar access token |

### Perfil y Contraseña (JWT)

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/auth/me` | Perfil del usuario autenticado | Cualquiera autenticado |
| PATCH | `/auth/change-password` | Cambiar propia contraseña | Cualquiera autenticado |

### Gestión de Usuarios (JWT + roles)

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/auth/users` | Listar usuarios operativos | ADMIN, MANAGER |
| GET | `/auth/users/search?q=` | Buscar usuarios por nombre/doc/email | ADMIN, MANAGER |
| GET | `/auth/users/:id` | Detalle de usuario | ADMIN, MANAGER |
| PATCH | `/auth/users/:id` | Actualizar usuario | ADMIN |
| PATCH | `/auth/users/:id/inactivate` | Desactivar usuario | ADMIN, MANAGER |
| PATCH | `/auth/users/:id/role` | Cambiar rol de usuario | SUPERADMIN |
| DELETE | `/auth/users/:id` | Soft-delete usuario | SUPERADMIN, ADMIN, MANAGER |

### Dropdowns (JWT)

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/auth/users/inspectors` | Inspectores para selectores | ADMIN, MANAGER, OPERARIO, INSPECTOR |
| GET | `/auth/users/operarios` | Operarios para selectores | ADMIN, MANAGER, OPERARIO, INSPECTOR |
| GET | `/auth/users/options?role=` | Opciones por rol | ADMIN, MANAGER, OPERARIO, INSPECTOR |

### Administración (JWT + roles)

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| POST | `/admin/personnel/register` | Registrar inspector/operario | ADMIN |
| PATCH | `/admin/personnel/:id/reset-password` | Resetear password de auth_account | ADMIN, MANAGER |
| GET | `/admin/personnel/auth-accounts` | Listar cuentas de autenticacion | ADMIN, MANAGER |

### Listados de Referencia (JWT + roles)

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/auth/roles` | Listar roles del sistema | SUPERADMIN, ADMIN, MANAGER |
| PATCH | `/auth/roles/:code` | Actualizar alcance y permisos de un rol | SUPERADMIN |
| GET | `/auth/identification-types` | Listar tipos de identificacion | SUPERADMIN, ADMIN, MANAGER |

### Acceso a Módulos (JWT)

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/auth/modules/ntc-5375/checklists` | Verificar acceso a checklists | ADMIN, MANAGER, INSPECTOR |
| GET | `/auth/modules/recepcion` | Verificar acceso a recepcion | ADMIN, MANAGER, OPERARIO, INSPECTOR |

### Cache (JWT + ADMIN)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/cache` | Guardar lista en cache |
| GET | `/cache/:key` | Obtener lista de cache |
| DELETE | `/cache/:key` | Eliminar lista de cache |

## Autenticación y Seguridad

### API Key Global
- Header requerido en TODAS las requests: `x-api-key`
- Configurado via variable de entorno `API_KEY`
- Excepcion: rutas de Swagger docs (`/api/docs`, `/api/swagger-ui/*`, `/api/swagger-json`)

### JWT
- Access token: corta duracion (configurable via `JWT_ACCESS_EXPIRATION`)
- Refresh token: larga duracion, almacenado en Redis
- Envio via header: `Authorization: Bearer <token>`

### Sesiones en Redis
- Almacenadas con prefijo `auth:session:user:<userId>`
- Invalidacion automatica al cambiar/resetear password
- Estructura: `{ refreshToken, role, email }`

## Base de Datos

### Tablas principales
- `users` — Personal operativo registrado (inspectors/operarios)
- `auth_accounts` — Cuentas de autenticacion (admin, manager, seed accounts)
- `roles` — Roles del sistema (admin, manager, inspector, operario)
- `identification_types` — Tipos de identificacion (CC, CE, TI)

### Cuentas semilla
| Email | Password | Rol |
|-------|----------|-----|
| superadmin@example.com | 1234 | SUPERADMIN |
| admin@example.com | 1234 | ADMIN |
| manager@example.com | 1234 | MANAGER |
| inspector@example.com | 1234 | INSPECTOR |
| operario@example.com | 1234 | OPERARIO |

### Migraciones
```
src/migrations/
├── 1000-create-initial-schema.ts
├── 1001-add-deleted-at-audit.ts
├── 1002-add-performance-indexes.ts
└── 1003-add-identification-types-table.ts
```

Comandos:
```bash
npm run migration:run    # Ejecutar pendientes
npm run migration:show   # Ver estado
npm run migration:revert # Revertir ultima
```

## Variables de Entorno (.env)

```
NODE_ENV=development
PORT=3001
API_KEY=change-me-to-a-secure-api-key
JWT_ACCESS_SECRET=access-secret-change-me-minimum-16-characters
JWT_REFRESH_SECRET=refresh-secret-change-me-minimum-16-characters
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS_ENABLED=false
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=auth_db
DB_LOGGING=false
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## OAuth 2.0 con Google

### Flujo
1. El frontend obtiene un `credential` (ID token) via Google Sign-In (GIS/GSI)
2. Envia `POST /auth/oauth/google` con `{ "id_token": "<token>" }`
3. El backend verifica el token con `google-auth-library` (firma, audiencia, expiracion)
4. **Usuario nuevo**: crea `AuthAccount` + `User` con rol OPERARIO y datos del perfil de Google
5. **Usuario existente**: emite JWT directamente (respeta el rol actual)
6. Devuelve el mismo `{ accessToken, refreshToken }` que el login con password

### Desarrollo local
En `NODE_ENV=development`, si el `id_token` contiene un `@`, se trata como email directo (sin verificar con Google). Ejemplo:
```json
{ "id_token": "superadmin@example.com" }
```

### Requisitos
- `GOOGLE_CLIENT_ID` configurado en `.env`
- El cliente OAuth debe estar configurado en Google Cloud Console y verificado (o usar cuentas de prueba)

## Documentacion

- `USER_MANAGEMENT_GUIDE.md` — Guia funcional de gestion de usuarios
- `MIGRATION_SETUP.md` — Instalacion rapida de migraciones
- `postman/Auth Service.postman_collection.json` — Coleccion Postman (33 endpoints)
