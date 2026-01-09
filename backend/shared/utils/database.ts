import { DataSource } from 'typeorm';
import { BaseEntity } from '../models/BaseEntity';

export const createDatabaseConfig = (entities: any[]): DataSource => {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'dukat',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'dukat',
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    entities: [BaseEntity, ...entities],
    migrations: [],
    subscribers: [],
  });
};
