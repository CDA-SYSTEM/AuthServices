# Guía de Configuración de Migraciones - Auth Service

Documento para el equipo de desarrolladores que colabora en el SystemCDA.

## Context

Este servicio mantiene un esquema de base de datos versionado a través de **migraciones TypeORM**. Cada cambio de esquema se controla explícitamente en archivos de migración, permitiendo:

- ✅ Reproducibilidad: Nueva BD = ejecutar migraciones = estado idéntico
- ✅ Auditoría: Cada cambio de esquema es un archivo versionado en Git
- ✅ Reversibilidad: Rollback seguro a versión anterior
- ✅ CI/CD: Automatizar actualización de esquema en deployment

---

## Instalación Inicial

### 1. Clonar repo e instalar dependencias

```bash
git clone https://github.com/CDA-SYSTEM/AuthServices.git
cd "Auth Services"
npm install
```

### 2. Configurar variables de entorno

```bash
# Crear archivo .env en raíz del proyecto
touch .env

# Agregar variables (ejemplo):
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=auth_db
DB_LOGGING=false
NODE_ENV=development
```

### 3. Ejecutar migraciones en BD local

**Importante**: Las migraciones son **idempotentes** - funcionan con BD vacía O con BD existente (creada por synchronize).

```bash
# Opción A: Si PostgreSQL está corriendo localmente
npm run migration:run

# Opción B: Si esta corriendo Docker con PostgreSQL
docker run --name postgres-auth -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
npm run migration:run
```

**Si ya hay tablas en BD** No hay problema. Las migraciones:
- ✅ Detectan si tablas existen
- ✅ Detectan si columnas existen
- ✅ Detectan si índices existen
- ✅ Ignoran lo que ya está en BD
- ✅ Agregan solo lo faltante
```

**Resultado esperado:**
```
QueryRunner: ✓ migración 1000-create-initial-schema
QueryRunner: ✓ migración 1001-add-deleted-at-audit
QueryRunner: ✓ migración 1002-add-performance-indexes
```

### 4. Verificar estado de migraciones

```bash
# Ver todas las migraciones (ejecutadas y pendientes)
npm run migration:show

# Ver solo migraciones pendientes
npm run migration:pending
```

---

## Nota: Producción con BD Existente ⚠️

Si la BD en producción **ya tiene tablas** (creadas por `synchronize: true` en el pasado):

### ✅ Las migraciones funcionan sin problema

Las 3 migraciones implementadas son **idempotentes** y detectan lo que ya existe:

| Migración | BD Vacía | BD Existente |
|-----------|----------|-------------|
| 1000-create-initial-schema | Crea tablas | Detecta tablas existentes, no las crea nuevamente |
| 1001-add-deleted-at-audit | Agrega columnas | Detecta columnas `deleted_at`, solo agrega si faltan |
| 1002-add-performance-indexes | Crea índices | Detecta índices, solo agrega si faltan |

### 🚀 Cómo desplegar en Producción

```bash
# En tu pipeline de deployment:
npm install          # Nueva dependencia: dotenv
npm run build        # Compilar código TypeScript
npm run migration:run # Ejecutar migraciones (seguro: detecta lo existente)
npm start            # Iniciar aplicación
```

**¿Hay errores al ejecutar `npm run migration:run`?** 
→ Consulta sección "Troubleshooting" abajo

---

## Workflow Diario (Desarrollo)

### Cambiar una tabla existente

**Ejemplo:** Agregar campo `departamento` a la tabla `users`

**1. Actualizar la entidad TypeORM:**
```typescript
// src/auth/infrastructure/persistence/entities/user.entity.ts
@Column({ type: 'varchar', length: 50, nullable: true })
departamento?: string;
```

**2. Crear migración:**
```bash
npm run migration:create -- src/migrations/1003-add-departamento-to-users
```

**3. Editar archivo de migración generado:**
El CLI genera un archivo vacío. Se debe llenar:

```typescript
// src/migrations/1003-add-departamento-to-users.ts
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDepartamentoToUsers1003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'departamento',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'departamento');
  }
}
```

**4. Ejecutar migración en local:**
```bash
npm run migration:run
```

**5. Probar en aplicación:**
```bash
npm run start:dev
```

**6. Commitear cambios:**
```bash
git add src/auth/infrastructure/persistence/entities/user.entity.ts
git add src/migrations/1003-add-departamento-to-users.ts
git commit -m "feat(users): add departamento field"
git push
```

---

## Migraciones Implementadas

### 1000-create-initial-schema
Crea las 3 tablas base del sistema:
- **roles**: Catálogo de roles (admin, manager, inspector, operario)
- **users**: Usuarios operativos con datos personales
- **auth_accounts**: Credenciales y hash de contraseña

Incluye indices únicos en email e identification_number.

### 1001-add-deleted-at-audit
Soporta soft-delete audit trail:
- Añade columna `deleted_at` (TIMESTAMP NULL) a users y auth_accounts
- Crea índices compuestos para optimizar queries de usuarios activos

Impacto: Zero-downtime (columna NULLABLE, no afecta código existente)

### 1002-add-performance-indexes
Optimiza queries frecuentes:
- Índice en (role_id, is_active) para listar usuarios por rol
- Índice en is_active para filtros de cuentas activas

Impacto: Solo lectura, no toca datos

---

## Troubleshooting

### "Error: Migraciones pending"

Significa que hay cambios de esquema no aplicados en tu BD local:
```bash
npm run migration:show  # Ver cuáles están pendientes
npm run migration:run   # Ejecutar las pendientes
```

### "Error: Cannot find module 'data-source'"

Asegúrate de que compilaste antes:
```bash
npm run build
```

### "Error: Cannot connect to database"

Verifica variables de entorno en `.env`:
```bash
echo $env:DB_HOST
echo $env:DB_USER
```

Si PostgreSQL no está running:
```bash
# macOS/Linux
brew services start postgresql

# Windows (WSL)
sudo service postgresql start

# Docker
docker ps | grep postgres
```

### "Error: Relation 'users' already exists"

**Esto NO debería ocurrir** con las migraciones actuales (son idempotentes).

Si aún ocurre, probablemente tienes:
1. Una versión antigua de las migraciones (antes de hacerlas idempotentes)
2. Una migración personalizada que no verifica si la tabla existe

**Solución**: Asegúrate de que el repositorio está actualizado:
```bash
git pull
npm install
npm run migration:run
```

### "Error: Column 'deleted_at' already exists"

**Esto NO debería ocurrir** (la migración 1001 verifica antes de agregar).

Si ocurre, probablemente tienes una versión antigua. Solución: 
```bash
git pull
npm install
npm run migration:run  # Ahora detecta la columna existente
```

### "Error: Duplicate key value violates unique constraint"

Las migraciones son read-only y no modifican datos existentes. Este error typically viene de operaciones manuales. Verifica:
- ¿Hay datos duplicados en la BD?
- ¿Ejecutaste una migración dos veces en forma manual?


---

## Notas adicionales importantes

- **Nombres de clase de migración:** El CLI de TypeORM valida el nombre de la clase. Las migraciones que generamos incluyen un sufijo de tipo timestamp en la clase (ej. `CreateInitialSchema10001763300000000`) — mantén ese sufijo al renombrar o crear migraciones.
- **Casing de columnas (camelCase vs snake_case):** En algunos despliegues previos las entidades pudieron haberse sincronizado generando nombres en `camelCase` (ej. `isActive`, `identificationNumber`) en lugar de `snake_case`. Las migraciones incluidas detectan ambos formatos y crean índices/columnas sólo si la columna correspondiente existe.
- **Producción - checklist mínimo antes de ejecutar migraciones:**
  - Hacer backup completo de la base de datos.
  - Probar `npm run build` y `npm run migration:run` en una copia (staging) de la BD.
  - Revisar `npm run migration:show` y confirmar migraciones pendientes.
 
---

## Buenas Prácticas

### ✅ Hacer

1. **Una migración = un cambio lógico**
   ```bash
   # ✅ Bien: Una migración para un cambio
   npm run migration:create -- src/migrations/1004-add-status-to-users
   
   # ❌ Mal: No mezclar cambios sin relación
   # 1005-add-status-and-department.ts  # Evitar esto
   ```

2. **Siempre incluir `down()`**
   - Permite rollback seguro
   - Útil para revertir en caso de error

3. **Probar rollback antes de commitear**
   ```bash
   npm run migration:run     # Ejecutar
   npm run migration:revert  # Revertir
   npm run migration:run     # Ejecutar de nuevo
   ```

4. **Usar valores DEFAULT en nuevas columnas**
   ```typescript
   isNullable: true,
   default: null,  // ✅ Compatible con datos existentes
   ```

5. **Incluir comentarios en migraciones complejas**
   ```typescript
   /**
    * Migración 1004: Add status field for user lifecycle
    * 
    * Contexto:
    * - Implementa distinción entre activo/suspendido/archived
    * - No afecta queries existentes (null-friendly default)
    * - Compatible con soft-delete existente
    */
   ```

### ❌ Evitar

1. **NO usar `synchronize: true` en producción**
   - TypeORM auto-genera cambios sin control
   - Pierde auditoría de quién/cuándo cambió schema
   - Riesgo de datos inconsistentes

2. **NO eliminar columnas en migraciones normales**
   ```typescript
   // ❌ Evitar esto en desarrollo normal
   dropColumn('users', 'deprecated_field');
   
   // ✅ Mejor: Deprecar para major version
   // Documentar como obsoleta y remover en v2.0
   ```

3. **NO commitear sin probar rollback**
   ```bash
   # Antes de push:
   npm run migration:run
   npm run migration:revert  # ← IMPORTANTE
   npm run migration:run
   git push
   ```

4. **NO cambiar migraciones ejecutadas**
   - Una vez ejecutada en producción, es inmutable
   - Si hay error, crear nueva migración correctora

---

## Integración con CI/CD

En tu pipeline de deployment (GitHub Actions, GitLab CI, etc.):

```yaml
# Ejemplo: .github/workflows/deploy.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Run migrations
        run: npm run migration:run
        env:
          DB_HOST: ${{ secrets.DB_HOST }}
          DB_USER: ${{ secrets.DB_USER }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
          DB_NAME: ${{ secrets.DB_NAME }}
      - name: Start service
        run: npm run start:prod
```
