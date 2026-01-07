import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseConfigs } from './database.config';
import * as authEntities from '../../../src/entities'; // Import all entities from the auth service

// Define paths for entities and migrations for each database
const entityPaths = {
  auth: ['SESSION_01_DATABASE_SCHEMA/src/entities/**/*.ts'], // Updated path for auth entities
  tenants: ['src/entities/tenants/**/*.ts'],
  telephony: ['src/entities/telephony/**/*.ts'],
  billing: ['src/entities/billing/**/*.ts'],
  analytics: ['src/entities/analytics/**/*.ts'],
  emergency: ['src/entities/emergency/**/*.ts'],
  voice: ['src/entities/voice/**/*.ts'], // Assuming a voice database for Session 04
};

const migrationPaths = {
  auth: ['SESSION_01_DATABASE_SCHEMA/databases/postgresql/migrations/**/*.ts'], // Updated path for auth migrations
  tenants: ['src/migrations/tenants/**/*.ts'],
  telephony: ['src/migrations/telephony/**/*.ts'],
  billing: ['src/migrations/billing/**/*.ts'],
  analytics: ['src/migrations/analytics/**/*.ts'],
  emergency: ['src/migrations/emergency/**/*.ts'],
  voice: ['src/migrations/voice/**/*.ts'], // Assuming a voice database for Session 04
};

export const createDataSource = (
  databaseKey: keyof typeof databaseConfigs,
  entities: string[],
  migrations: string[]
): DataSource => {
  const config = databaseConfigs[databaseKey];
  
  if (!config) {
    throw new Error(`Database configuration for '${databaseKey}' not found.`);
  }

  return new DataSource({
    type: 'postgres',
    ...config,
    entities: databaseKey === 'auth' ? Object.values(authEntities) : entities, // Use imported auth entities for 'auth'
    migrations,
    synchronize: false, // NEVER true in production
    logging: process.env.NODE_ENV === 'development',
    poolSize: 10,
    maxQueryExecutionTime: 10000, // 10 seconds
    migrationsRun: false,
    migrationsTableName: `typeorm_migrations_${databaseKey}`,
  });
};

// Export individual data sources
export const authDataSource = createDataSource(
  'auth',
  entityPaths.auth,
  migrationPaths.auth
);

export const tenantsDataSource = createDataSource(
  'tenants',
  entityPaths.tenants,
  migrationPaths.tenants
);

export const telephonyDataSource = createDataSource(
  'telephony',
  entityPaths.telephony,
  migrationPaths.telephony
);

export const billingDataSource = createDataSource(
  'billing',
  entityPaths.billing,
  migrationPaths.billing
);

export const analyticsDataSource = createDataSource(
  'analytics',
  entityPaths.analytics,
  migrationPaths.analytics
);

export const emergencyDataSource = createDataSource(
  'emergency',
  entityPaths.emergency,
  migrationPaths.emergency
);

export const voiceDataSource = createDataSource(
  'voice',
  entityPaths.voice,
  migrationPaths.voice
);

// Default export for TypeORM CLI
export default [
  authDataSource,
  tenantsDataSource,
  telephonyDataSource,
  billingDataSource,
  analyticsDataSource,
  emergencyDataSource,
  voiceDataSource,
];