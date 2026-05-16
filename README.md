# Auth Service - Arquitectura Hexagonal

Microservicio de autenticacion y autorizacion para el ecosistema SystemCDA.

Este servicio cubre:
- Login, refresh y logout con JWT.
- Gestion de usuarios operativos (operario e inspector).
- Control de acceso por rol para integracion con API Gateway.
- Validacion de acceso a modulos (recepcion y checklists NTC 5375).

## Stack

- NestJS
- TypeORM
- PostgreSQL
- Redis
- JWT (access + refresh)

## Arquitectura

Estructura por capas (hexagonal):

- Dominio: interfaces, puertos, DTOs y reglas de negocio.
- Aplicacion: casos de uso.
- Infraestructura: controladores, estrategias, persistencia.

## Reglas de negocio clave

- ADMIN: control total sobre usuarios operativos.
- MANAGER: consulta, busqueda e inactivacion operativa.
- OPERARIO e INSPECTOR: acceso funcional por modulo segun permisos.

Restricciones actuales implementadas:
- Solo ADMIN puede registrar usuarios.
- Solo se pueden registrar roles operario e inspector.
- Solo ADMIN puede actualizar y eliminar usuarios.
- ADMIN y MANAGER pueden listar y buscar usuarios.

## Endpoints base

Prefijo global: /api

Publicos:
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/validate-token

Protegidos (JWT + roles):
- POST /api/auth/register
- GET /api/auth/users
- GET /api/auth/users/search?q=texto
- GET /api/auth/users/:id
- PATCH /api/auth/users/:id
- PATCH /api/auth/users/:id/inactivate
- DELETE /api/auth/users/:id

Endpoints para listas desplegables:
- GET /api/auth/users/inspectors
- GET /api/auth/users/operarios
- GET /api/auth/users/options?role=inspector
- GET /api/auth/users/options?role=operario

Acceso a modulos:
- GET /api/auth/modules/ntc-5375/checklists
- GET /api/auth/modules/recepcion

## Integracion con otros microservicios

Para que Lista de Chequeo y Recepcion muestren desplegables:

- Lista de chequeo consume inspectores:
  GET /api/auth/users/inspectors
- Planillas de recepcion consumen operarios:
  GET /api/auth/users/operarios

Respuesta esperada (ambos):

[
  {
    "id": "uuid",
    "label": "Nombre Apellido",
    "role": "inspector"
  }
]

## Ejemplo rapido en Postman

1. Login admin: POST /api/auth/login
2. Registrar inspector/operario: POST /api/auth/register
3. Listar dropdown: GET /api/auth/users/inspectors o GET /api/auth/users/operarios

## Gestión de Base de Datos (Migraciones)

### Configuración de Migraciones TypeORM

Este servicio usa **migraciones versionadas** para gestionar cambios de esquema de forma controlada y reproducible.

**Archivos de configuración:**
- `src/data-source.ts`: Configuración de TypeORM para CLI de migraciones
- `src/migrations/`: Directorio con archivos de migración numerados

**Migraciones implementadas:**
1. `1000-create-initial-schema.ts` - Crea tablas base (roles, users, auth_accounts)
2. `1001-add-deleted-at-audit.ts` - Añade columna deletedAt para auditoría de soft-delete
3. `1002-add-performance-indexes.ts` - Crea índices de optimización

### Comandos de Migraciones

```bash
# Ejecutar migraciones pendientes
npm run migration:run

# Ver estado de migraciones (pendientes y ejecutadas)
npm run migration:show
npm run migration:pending

# Revertir última migración
npm run migration:revert

# Crear nueva migración (después de cambiar entities)
npm run migration:create -- src/migrations/NNNN-descripcion
```

### Workflow en Desarrollo

1. **Cambiar una entidad TypeORM** (agregar/modificar columnas):
   ```typescript
   @Column({ type: 'varchar', length: 100 })
   newField!: string;
   ```

2. **Generar migración automáticamente**:
   ```bash
   npm run migration:create -- src/migrations/1003-add-new-field
   ```

3. **Ejecutar migraciones locales**:
   ```bash
   npm run migration:run
   ```

4. **Probar cambios** en desarrollo:
   ```bash
   npm run start:dev
   ```

5. **Commitear archivos de migración** (importante para reproducibilidad):
   ```bash
   git add src/migrations/1003-*.ts
   git commit -m "feat: add new field with migration"
   ```

### Deployment / Producción

En producción, las migraciones se ejecutan automáticamente:

```bash
# En CI/CD o antes de npm run start:prod:
npm run migration:run

# Luego iniciar el servicio
npm run start:prod
```

**Importante:** NUNCA usar `synchronize: true` en producción. Las migraciones son la única forma segura de actualizar esquema.

### Buenas Prácticas de Migraciones

✅ **Hacer:**
- Crear columnas nuevas con valores DEFAULT
- Hacer migraciones idempotentes (ejecutar 2 veces = mismo resultado)
- Incluir comentarios explicativos en migraciones complejas
- Probar rollback: `npm run migration:revert` antes de commitear
- Una migración = un cambio lógico (no mezclar múltiples cambios)

❌ **Evitar:**
- Eliminar columnas en migraciones (guardar para versión major)
- Cambiar tipos de datos sin migración intermedia
- Usar `synchronize: true` en cualquier entorno que no sea desarrollo local
- Migraciones muy grandes con múltiples cambios sin relación

## Documentacion

- Ver guia funcional completa en USER_MANAGEMENT_GUIDE.md
- Ver instalacion rapida en MIGRATION_SETUP.md
