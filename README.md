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

## Documentacion

- Ver guia funcional completa en USER_MANAGEMENT_GUIDE.md
- Ver instalacion rapida en QUICK_START.md
- Ver indice en DOCUMENTATION_INDEX.md
