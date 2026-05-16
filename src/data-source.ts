import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno para migraciones
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Data Source para TypeORM CLI (migraciones)
 * Usado por: npm run migration:create, migration:run, migration:revert
 * 
 * Nota: Esta configuración es paralela a app.module.ts y se usa solo
 * para las herramientas CLI de migraciones. La aplicación NestJS
 * continúa usando TypeOrmModule.forRootAsync() en app.module.ts
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'auth_db',
  entities: [path.join(__dirname, '/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '/migrations/*{.ts,.js}')],
  logging: process.env.DB_LOGGING === 'true',
  synchronize: false, // ⚠️ NUNCA usar synchronize en producción. Siempre usar migraciones.
  migrationsRun: process.env.NODE_ENV === 'production', // Auto-run migrations en deploy
});

/**
 * Inicializar data source para migraciones
 * Se ejecuta automáticamente cuando se llama desde CLI
 */
if (!AppDataSource.isInitialized) {
  AppDataSource.initialize()
    .then(() => {
      console.log('✅ Data Source initialized for migrations');
    })
    .catch((error) => {
      console.error('❌ Error initializing Data Source:', error);
      process.exit(1);
    });
}
