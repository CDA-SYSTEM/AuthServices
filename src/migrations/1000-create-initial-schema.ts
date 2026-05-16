import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migración 1000: Crear esquema inicial
 * 
 * Crea las tablas base del Auth Service:
 * - roles: Catálogo de roles del sistema (admin, manager, inspector, operario)
 * - users: Usuarios operativos con info personal
 * - auth_accounts: Credenciales (email + hashed password) vinculadas a usuarios
 * 
 * Incluye:
 * - Foreign keys entre tablas
 * - Índices únicos para búsquedas frecuentes
 * - Timestamps de auditoría (createdAt, updatedAt)
 * - Columna isActive para soft-delete
 * 
 * Zero-downtime: Esta migración crea estructuras nuevas sin modificar datos existentes
 * Rollback: Eliminar las tres tablas (drop, si es necesario)
 */
// Timestamp suffix appended to satisfy TypeORM migration class name requirement
export class CreateInitialSchema10001763300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabla 1: Roles (crear sólo si no existe)
    const hasRoles = await queryRunner.hasTable('roles');
    if (!hasRoles) {
      await queryRunner.createTable(
        new Table({
          name: 'roles',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'gen_random_uuid()',
            },
            {
              name: 'name',
              type: 'varchar',
              length: '50',
              isUnique: true,
            },
            {
              name: 'description',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
        true,
      );
    }

    // Tabla 2: Users (crear sólo si no existe)
    const hasUsers = await queryRunner.hasTable('users');
    if (!hasUsers) {
      await queryRunner.createTable(
        new Table({
          name: 'users',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'gen_random_uuid()',
            },
            {
              name: 'identification_type',
              type: 'varchar',
              length: '20',
            },
            {
              name: 'identification_number',
              type: 'varchar',
              length: '20',
              isUnique: true,
            },
            {
              name: 'first_name',
              type: 'varchar',
              length: '100',
            },
            {
              name: 'last_name',
              type: 'varchar',
              length: '100',
            },
            {
              name: 'phone_number',
              type: 'varchar',
              length: '20',
            },
            {
              name: 'email',
              type: 'varchar',
              length: '255',
              isUnique: true,
            },
            {
              name: 'role_id',
              type: 'uuid',
            },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
          foreignKeys: [
            {
              columnNames: ['role_id'],
              referencedTableName: 'roles',
              referencedColumnNames: ['id'],
              onDelete: 'RESTRICT',
              onUpdate: 'CASCADE',
            },
          ],
        }),
        true,
      );
    }

    // Índices en users (solo si tabla existe y índices no existen)
    const usersTable = await queryRunner.hasTable('users');
    if (usersTable) {
      try {
        await queryRunner.createIndex(
          'users',
          new TableIndex({
            name: 'idx_users_email',
            columnNames: ['email'],
            isUnique: true,
          }),
        );
      } catch (err) {
        // Índice ya existe, ignorar
      }

      try {
        // identification_number may be snake_case or camelCase
        const hasIdentificationSnake = await queryRunner.hasColumn('users', 'identification_number');
        const hasIdentificationCamel = await queryRunner.hasColumn('users', 'identificationNumber');
        const identificationCol = hasIdentificationSnake ? 'identification_number' : hasIdentificationCamel ? 'identificationNumber' : null;
        if (identificationCol) {
          await queryRunner.createIndex(
            'users',
            new TableIndex({
              name: 'idx_users_identification_number',
              columnNames: [identificationCol],
              isUnique: true,
            }),
          );
        }
      } catch (err) {
        // Índice ya existe, ignorar
      }

      try {
        await queryRunner.createIndex(
          'users',
          new TableIndex({
            name: 'idx_users_role_id',
            columnNames: ['role_id'],
          }),
        );
      } catch (err) {
        // Índice ya existe, ignorar
      }
    }

    // Tabla 3: Auth Accounts (credenciales) - crear sólo si no existe
    const hasAuthAccounts = await queryRunner.hasTable('auth_accounts');
    if (!hasAuthAccounts) {
      await queryRunner.createTable(
        new Table({
          name: 'auth_accounts',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'gen_random_uuid()',
            },
            {
              name: 'email',
              type: 'varchar',
              length: '255',
              isUnique: true,
            },
            {
              name: 'password_hash',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
            },
            {
              name: 'role_id',
              type: 'uuid',
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
          foreignKeys: [
            {
              columnNames: ['role_id'],
              referencedTableName: 'roles',
              referencedColumnNames: ['id'],
              onDelete: 'RESTRICT',
              onUpdate: 'CASCADE',
            },
          ],
        }),
        true,
      );
    }

    // Índices en auth_accounts (solo si tabla existe y índices no existen)
    const authAccountsTable = await queryRunner.hasTable('auth_accounts');
    if (authAccountsTable) {
      try {
        await queryRunner.createIndex(
          'auth_accounts',
          new TableIndex({
            name: 'idx_auth_accounts_email',
            columnNames: ['email'],
            isUnique: true,
          }),
        );
      } catch (err) {
        // Índice ya existe, ignorar
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tablas en orden inverso (respetando FKs)
    await queryRunner.dropTable('auth_accounts', true);
    await queryRunner.dropTable('users', true);
    await queryRunner.dropTable('roles', true);
  }
}
