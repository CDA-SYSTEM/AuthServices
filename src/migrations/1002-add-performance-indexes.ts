import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

/**
 * Migración 1002: Añadir índices de performance para queries frecuentes
 * 
 * Análisis de queries frecuentes en Auth Service:
 * - findAll users por role_id
 * - search users por email (login)
 * - findOne user por id + is_active
 * - findByEmail + is_active (común en auth)
 * 
 * Índices añadidos:
 * - users(role_id, is_active): para listar usuarios por rol activos
 * - users(email): ya existe (unique), pero reasegurar
 * - auth_accounts(email): ya existe (unique), pero reasegurar
 * - auth_accounts(is_active): para queries de cuentas activas
 * 
 * Zero-downtime: Índices no modifican datos, solo optimizan lectura
 * Rollback: DROP INDEX (idempotente)
 */
// Timestamp suffix appended to satisfy TypeORM migration class name requirement
export class AddPerformanceIndexes10021763300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si las tablas existen (para BDs existentes)
    const usersTable = await queryRunner.hasTable('users');
    const authAccountsTable = await queryRunner.hasTable('auth_accounts');

    // Índice para listar usuarios por rol + filtro activo
    // Query típica: SELECT * FROM users WHERE role_id = $1 AND is_active = true
    if (usersTable) {
      // Detectar nombre de columna booleano: 'is_active' o 'isActive'
      const hasIsActiveSnake = await queryRunner.hasColumn('users', 'is_active');
      const hasIsActiveCamel = await queryRunner.hasColumn('users', 'isActive');
      const isActiveCol = hasIsActiveSnake ? 'is_active' : hasIsActiveCamel ? 'isActive' : null;
      if (isActiveCol) {
        try {
          await queryRunner.createIndex(
            'users',
            new TableIndex({
              name: 'idx_users_role_id_is_active',
              columnNames: ['role_id', isActiveCol],
            }),
          );
        } catch (err) {
          // Índice ya existe o error no crítico, ignorar
        }
      }
    }

    // Índice para queries de cuentas activas
    // Query típica: SELECT * FROM auth_accounts WHERE is_active = true
    if (authAccountsTable) {
      const hasIsActiveSnakeAcc = await queryRunner.hasColumn('auth_accounts', 'is_active');
      const hasIsActiveCamelAcc = await queryRunner.hasColumn('auth_accounts', 'isActive');
      const isActiveAccCol = hasIsActiveSnakeAcc ? 'is_active' : hasIsActiveCamelAcc ? 'isActive' : null;
      if (isActiveAccCol) {
        try {
          await queryRunner.createIndex(
            'auth_accounts',
            new TableIndex({
              name: 'idx_auth_accounts_is_active',
              columnNames: [isActiveAccCol],
            }),
          );
        } catch (err) {
          // Índice ya existe o error no crítico, ignorar
        }
      }
    }

    // Índice para búsquedas por email en auth_accounts (favorece login)
    // Ya existe como UNIQUE, pero explícitamente documentado aquí
    // Query típica: SELECT * FROM auth_accounts WHERE email = $1 AND is_active = true
    // Nota: Si esta query es frecuente y el UNIQUE no es suficiente, considerar índice compuesto
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices en orden inverso (con manejo de errores)
    try {
      await queryRunner.dropIndex('auth_accounts', 'idx_auth_accounts_is_active');
    } catch (err) {
      // Índice no existe, ignorar
    }

    try {
      await queryRunner.dropIndex('users', 'idx_users_role_id_is_active');
    } catch (err) {
      // Índice no existe, ignorar
    }
  }
}
