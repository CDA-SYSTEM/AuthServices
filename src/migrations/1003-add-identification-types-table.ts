import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddIdentificationTypesTable10031763300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasIdTypesTable = await queryRunner.hasTable('identification_types');
    if (!hasIdTypesTable) {
      await queryRunner.createTable(
        new Table({
          name: 'identification_types',
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
              length: '20',
              isUnique: true,
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

      await queryRunner.query(`
        INSERT INTO identification_types (name) VALUES
          ('CC'), ('CE'), ('TI')
      `);
    }

    const hasUsersTable = await queryRunner.hasTable('users');
    if (hasUsersTable) {
      const hasNewColumn = await queryRunner.hasColumn('users', 'identification_type_id');
      if (!hasNewColumn) {
        const hasOldSnake = await queryRunner.hasColumn('users', 'identification_type');
        const hasOldCamel = await queryRunner.hasColumn('users', 'identificationType');
        const oldCol = hasOldSnake ? 'identification_type' : hasOldCamel ? 'identificationType' : null;

        await queryRunner.addColumn(
          'users',
          new Table({
            name: 'users',
            columns: [
              {
                name: 'identification_type_id',
                type: 'uuid',
                isNullable: true,
              },
            ],
          }).columns.find((c) => c.name === 'identification_type_id')!,
        );

        if (oldCol) {
          await queryRunner.query(`
            UPDATE users
            SET identification_type_id = it.id
            FROM identification_types it
            WHERE it.name = users.${oldCol}
          `);
        }

        await queryRunner.changeColumn(
          'users',
          'identification_type_id',
          new Table({
            name: 'users',
            columns: [
              {
                name: 'identification_type_id',
                type: 'uuid',
                isNullable: false,
              },
            ],
          }).columns.find((c) => c.name === 'identification_type_id')!,
        );

        await queryRunner.createForeignKey(
          'users',
          new TableForeignKey({
            columnNames: ['identification_type_id'],
            referencedTableName: 'identification_types',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
          }),
        );

        if (oldCol) {
          await queryRunner.dropColumn('users', oldCol);
        }

        try {
          await queryRunner.createIndex(
            'users',
            new TableIndex({
              name: 'idx_users_identification_type_id',
              columnNames: ['identification_type_id'],
            }),
          );
        } catch (err) {
          // Índice ya existe, ignorar
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasUsersTable = await queryRunner.hasTable('users');
    if (hasUsersTable) {
      const hasFkColumn = await queryRunner.hasColumn('users', 'identification_type_id');
      if (hasFkColumn) {
        try {
          await queryRunner.dropIndex('users', 'idx_users_identification_type_id');
        } catch (err) {
          // ignorar
        }

        try {
          const table = await queryRunner.getTable('users');
          const foreignKey = table?.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('identification_type_id') !== -1,
          );
          if (foreignKey) {
            await queryRunner.dropForeignKey('users', foreignKey);
          }
        } catch (err) {
          // ignorar
        }

        await queryRunner.dropColumn('users', 'identification_type_id');
      }
    }

    const hasIdTypesTable = await queryRunner.hasTable('identification_types');
    if (hasIdTypesTable) {
      await queryRunner.dropTable('identification_types');
    }
  }
}
