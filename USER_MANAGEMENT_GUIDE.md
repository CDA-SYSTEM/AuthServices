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

## Decisiones de documentacion

Para mantener el repositorio limpio:
- Mantener: README.md, QUICK_START.md, USER_MANAGEMENT_GUIDE.md, DOCUMENTATION_INDEX.md
- Opcionales: EXECUTIVE_SUMMARY.md, IMPLEMENTATION_SUMMARY.md, PASSWORD_MANAGEMENT_GUIDE.md

Si el equipo prefiere simplicidad, se pueden eliminar los opcionales.
