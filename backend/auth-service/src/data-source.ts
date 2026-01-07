import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config/config';
import * as entities from './entities';
import * as path from 'path'; // Import path module

export const AppDataSource = new DataSource({
  type: 'postgresql',
  url: config.database.url,
  synchronize: config.env === 'development', // Set to false for production
  logging: config.env === 'development' ? ['query', 'error'] : ['error'],
  entities: Object.values(entities),
  migrations: [path.join(__dirname, 'migrations/*.ts')], // Updated migration path
  subscribers: [],
  poolSize: 10, // Added pool size
  maxQueryExecutionTime: 10000, // Added max query execution time
  migrationsRun: false, // Control migrations manually
  migrationsTableName: `typeorm_migrations_auth`, // Specific table for auth migrations
});

export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connection established');
    }
    
    // Run migrations in production or if explicitly requested
    if (config.env === 'production' || process.env.RUN_MIGRATIONS === 'true') {
      console.log('Running migrations...');
      await AppDataSource.runMigrations();
      console.log('Migrations completed.');
    }
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};