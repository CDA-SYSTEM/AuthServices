# Guia de Gestion de Usuarios - Auth Service

Documento funcional para el equipo que integra API Gateway, Lista de Chequeo, Recepcion y UI.

## Objetivo

Centralizar autenticacion y autorizacion de usuarios operativos del CDA:
- Inspector
- Operario

Con reglas:
- ADMIN crea, actualiza y elimina usuarios operativos.
- MANAGER consulta, busca e inactiva usuarios.

## Roles del sistema

- admin
- manager
- inspector
- operario

Nota importante: los valores de rol se manejan en minuscula.

## Endpoints y permisos

### Publicos

- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/validate-token

### Protegidos

- POST /api/auth/register
  - Roles: admin
  - Crea solo operario o inspector.

- GET /api/auth/users
  - Roles: admin, manager
  - Query opcional: role=operario|inspector

- GET /api/auth/users/search?q=texto
  - Roles: admin, manager
  - Busca por nombre, apellido o identificacion.

- GET /api/auth/users/:id
  - Roles: admin, manager

- PATCH /api/auth/users/:id
  - Roles: admin

- PATCH /api/auth/users/:id/inactivate
  - Roles: admin, manager

- DELETE /api/auth/users/:id
  - Roles: admin

### Endpoints para listas desplegables

- GET /api/auth/users/inspectors
  - Roles: admin, manager, operario, inspector
  - Devuelve opciones para seleccionar inspector.

- GET /api/auth/users/operarios
  - Roles: admin, manager, operario, inspector
  - Devuelve opciones para seleccionar operario.

- GET /api/auth/users/options?role=inspector
- GET /api/auth/users/options?role=operario
  - Roles: admin, manager, operario, inspector
  - Endpoint generico para dropdown por rol.

Respuesta de endpoints dropdown:

[
  {
    "id": "9d0c6f9b-2f35-4b70-9f17-fd48c13c3e1a",
    "label": "Laura Inspectora",
    "role": "inspector"
  }
]

## Integracion entre microservicios

### Lista de Chequeo (Django)

Para mostrar inspectores en un select:
- Consumir GET /api/auth/users/inspectors
- Guardar el id del inspector en la planilla.

### Recepcion / Planillas

Para mostrar operarios en un select:
- Consumir GET /api/auth/users/operarios
- Guardar el id del operario responsable.

### API Gateway

El gateway debe:
- Reenviar Authorization Bearer token.
- No transformar los valores de role.
- Mantener el prefijo /api.

## Flujos recomendados en Postman

1. Login admin
- POST /api/auth/login

2. Crear inspector
- POST /api/auth/register
- Body role: inspector

3. Crear operario
- POST /api/auth/register
- Body role: operario

4. Probar dropdown inspectores
- GET /api/auth/users/inspectors

5. Probar dropdown operarios
- GET /api/auth/users/operarios

6. Probar listado filtrado
- GET /api/auth/users?role=inspector
- GET /api/auth/users?role=operario

## Buenas practicas para UI

- Usar id como value en el select.
- Usar label como texto visible.
- Cachear listas de dropdown por corto tiempo.
- Manejar 401/403 para refrescar token o mostrar permiso insuficiente.

## Persistencia y Base de Datos

### Esquema de Base de Datos

El Auth Service utiliza tres tablas principales, gestionadas por migraciones TypeORM:

**roles**
```
id (UUID, PK)
name (VARCHAR, UNIQUE)
description (TEXT, nullable)
created_at, updated_at (TIMESTAMPS)
```

**users** (tabla central de usuarios operativos)
```
id (UUID, PK)
identification_type (VARCHAR)
identification_number (VARCHAR, UNIQUE)
first_name, last_name (VARCHAR)
phone_number (VARCHAR)
email (VARCHAR, UNIQUE)
role_id (UUID, FK -> roles)
is_active (BOOLEAN, default: true) -- Soft-delete control
deleted_at (TIMESTAMP, nullable) -- Auditoría de eliminación
created_at, updated_at (TIMESTAMPS)
```

**auth_accounts** (credenciales + hashing)
```
id (UUID, PK)
email (VARCHAR, UNIQUE)
password_hash (VARCHAR)
is_active (BOOLEAN, default: true)
role_id (UUID, FK -> roles)
deleted_at (TIMESTAMP, nullable)
created_at, updated_at (TIMESTAMPS)
```

### Soft-Delete Implementation

El Delete de usuarios NO elimina registros de la BD. En su lugar:

1. **DeleteUserUseCase** marca el usuario como inactivo:
   ```typescript
   // En lugar de DELETE:
   await userRepository.update(id, { isActive: false, deletedAt: new Date() });
   ```

2. **Todas las queries filtran automáticamente**:
   ```typescript
   // Los repositorios siempre filtran:
   findAll() -> WHERE is_active = true
   search() -> WHERE is_active = true AND ...
   ```

3. **Auditoría preservada**:
   - El registro sigue en la BD con `deleted_at` timestamp
   - Reversible: cambiar `is_active = true, deleted_at = null` si es necesario
   - Cumple GDPR parcialmente: datos no completamente eliminados

### Migraciones de Base de Datos

Para detalles sobre cómo ejecutar migraciones y cambiar esquema, ver sección **"Gestión de Base de Datos (Migraciones)"** en `README.md`.

**Resumen rápido:**
- Migraciones se guardan en `src/migrations/`
- Se ejecutan automáticamente en deployment
- Los cambios de schema se deben hacer a través de migraciones, NO `synchronize: true`

**Notas importantes:**
- Antes de ejecutar migraciones en producción, realiza un backup y prueba el flujo en staging. Don't fucky the project!!
