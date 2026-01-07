import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { databaseConfigs } from './database.config';

export const createDataSource = (
  databaseName: string,
  entities: string[],
  migrations: string[]
): DataSource => {
  const config = databaseConfigs[databaseName];
  
  return new DataSource({
    type: 'postgres',
    ...config,
    entities,
    migrations,
    synchronize: false, // NEVER true in production
    logging: process.env.NODE_ENV === 'development',
    poolSize: 10,
    maxQueryExecutionTime: 10000, // 10 seconds
    migrationsRun: false,
    migrationsTableName: `typeorm_migrations_${databaseName}`,
  });
};

// Export individual data sources
export const authDataSource = createDataSource(
  'auth',
  [__dirname + '/../entities/auth/**/*.ts', __dirname + '/../entities/shared/**/*.ts'],
  [__dirname + '/../migrations/auth/**/*.sql']
);

export const tenantsDataSource = createDataSource(
  'tenants',
  [__dirname + '/../entities/tenants/**/*.ts', __dirname + '/../entities/shared/**/*.ts'],
  [__dirname + '/../migrations/tenants/**/*.sql']
);

export const telephonyDataSource = createDataSource(
  'telephony',
  [__dirname + '/../entities/telephony/**/*.ts', __dirname + '/../entities/shared/**/*.ts'],
  [__dirname + '/../migrations/telephony/**/*.sql']
);

export const billingDataSource = createDataSource(
  'billing',
  [__dirname + '/../entities/billing/**/*.ts', __dirname + '/../entities/shared/**/*.ts'],
  [__dirname + '/../migrations/billing/**/*.sql']
);

export const analyticsDataSource = createDataSource(
  'analytics',
  [__dirname + '/../entities/analytics/**/*.ts', __dirname + '/../entities/shared/**/*.ts'],
  [__dirname + '/../migrations/analytics/**/*.sql']
);

export const emergencyDataSource = createDataSource(
  'emergency',
  [__dirname + '/../entities/emergency/**/*.ts', __dirname + '/../entities/shared/**/*.ts'],
  [__dirname + '/../migrations/emergency/**/*.sql']
);

// For TypeORM CLI to pick up a default data source (e.g., for `migration:generate`)
// You might need to specify the data source explicitly for multi-database setups:
// `npx typeorm migration:generate src/migrations/auth/MyMigration -d src/config/typeorm.config.ts#authDataSource`
export default authDataSource;