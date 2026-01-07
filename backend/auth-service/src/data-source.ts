import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config/config';
import * as entities from './entities';

export const AppDataSource = new DataSource({
  type: 'postgresql',
  url: config.database.url,
  synchronize: config.env === 'development',
  logging: config.env === 'development',
  entities: Object.values(entities),
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');
    
    // Run migrations in production
    if (config.env === 'production') {
      await AppDataSource.runMigrations();
    }
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};