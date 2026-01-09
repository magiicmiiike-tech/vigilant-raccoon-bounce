import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as entities from './entities/all-entities'; // Import all entities

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'dukat_voice_saas',
  synchronize: false, // Never true in production
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  entities: Object.values(entities), // Use all imported entities
  migrations: [path.join(__dirname, '../migrations/*.ts')],
  subscribers: [],
  poolSize: 10,
  maxQueryExecutionTime: 10000, // 10 seconds
  migrationsRun: false,
  migrationsTableName: `typeorm_migrations`,
});

export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connection established');
    }
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};