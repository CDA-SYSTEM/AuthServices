import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

/**
 * Migración 1001: Añadir columna deletedAt para soft-delete audit
 * 
 * Context:
 * - DeleteUserUseCase ya implementa soft-delete (setea isActive=false)
 * - Esta migración añade deletedAt NULLABLE para auditoría
 * - Los queries existentes que filtran isActive=true NO cambian
 * 
 * Cambios:
 * - users: añade deleted_at (NULL por defecto - compatible con usuarios activos)
 * - auth_accounts: añade deleted_at (NULL por defecto)
 * - Índice compuesto para queries soft-deleted: (is_active, deleted_at)
 * 
 * Zero-downtime: 
 * - Columna NULLABLE no afecta queries existentes
 * - DELETE ... sigue funcionando
 * - UPDATE ... WHERE is_active=false sigue funcionando
 * - Rollback: DROP COLUMN deleted_at (simple)
 */
// Timestamp suffix appended to satisfy TypeORM migration class name requirement
export class AddDeletedAtAudit10011763300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si las tablas existen (para BDs existentes)
    const usersTable = await queryRunner.hasTable('users');
    const authAccountsTable = await queryRunner.hasTable('auth_accounts');

    // Añadir columna deleted_at a users (si existe tabla y no existe columna)
    if (usersTable) {
      const hasDeletedAtColumn = await queryRunner.hasColumn('users', 'deleted_at');
      if (!hasDeletedAtColumn) {
        await queryRunner.addColumn(
          'users',
          new TableColumn({
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
            default: null,
            comment:
              'Timestamp de soft-delete. NULL = usuario activo. SET = usuario inactivo/eliminado.',
          }),
        );
      }
    }

    // Añadir columna deleted_at a auth_accounts (si existe tabla y no existe columna)
    if (authAccountsTable) {
      const hasDeletedAtColumn = await queryRunner.hasColumn('auth_accounts', 'deleted_at');
      if (!hasDeletedAtColumn) {
        await queryRunner.addColumn(
          'auth_accounts',
          new TableColumn({
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
            default: null,
            comment:
              'Timestamp de soft-delete. NULL = cuenta activa. SET = cuenta inactiva/eliminada.',
          }),
        );
      }
    }

    // Índice compuesto para soft-delete queries (mejora performance)
    if (usersTable) {
      const hasIsActiveSnake = await queryRunner.hasColumn('users', 'is_active');
      const hasIsActiveCamel = await queryRunner.hasColumn('users', 'isActive');
      const isActiveCol = hasIsActiveSnake ? 'is_active' : hasIsActiveCamel ? 'isActive' : null;
      if (isActiveCol) {
        try {
          await queryRunner.createIndex(
            'users',
            new TableIndex({
              name: 'idx_users_is_active_deleted_at',
              columnNames: [isActiveCol, 'deleted_at'],
            }),
          );
        } catch (err) {
          // Índice ya existe, ignorar
        }
      }
    }

    if (authAccountsTable) {
      const hasIsActiveSnakeAcc = await queryRunner.hasColumn('auth_accounts', 'is_active');
      const hasIsActiveCamelAcc = await queryRunner.hasColumn('auth_accounts', 'isActive');
      const isActiveAccCol = hasIsActiveSnakeAcc ? 'is_active' : hasIsActiveCamelAcc ? 'isActive' : null;
      if (isActiveAccCol) {
        try {
          await queryRunner.createIndex(
            'auth_accounts',
            new TableIndex({
              name: 'idx_auth_accounts_is_active_deleted_at',
              columnNames: [isActiveAccCol, 'deleted_at'],
            }),
          );
        } catch (err) {
          // Índice ya existe, ignorar
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.dropIndex('auth_accounts', 'idx_auth_accounts_is_active_deleted_at');
    await queryRunner.dropIndex('users', 'idx_users_is_active_deleted_at');

    // Eliminar columnas
    await queryRunner.dropColumn('auth_accounts', 'deleted_at');
    await queryRunner.dropColumn('users', 'deleted_at');
  }
}
