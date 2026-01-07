export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
}

export const databaseConfigs: Record<string, DatabaseConfig> = {
  auth: {
    host: process.env.AUTH_DB_HOST || 'localhost',
    port: parseInt(process.env.AUTH_DB_PORT || '5432'),
    username: process.env.AUTH_DB_USER || 'dukat',
    password: process.env.AUTH_DB_PASSWORD || 'password',
    database: process.env.AUTH_DB_NAME || 'auth',
    ssl: process.env.NODE_ENV === 'production',
  },
  tenants: {
    host: process.env.TENANTS_DB_HOST || 'postgres', // Aligned with docker-compose.yml
    port: parseInt(process.env.TENANTS_DB_PORT || '5432'),
    username: process.env.TENANTS_DB_USER || 'postgres', // Aligned with docker-compose.yml
    password: process.env.TENANTS_DB_PASSWORD || 'postgres', // Aligned with docker-compose.yml
    database: process.env.TENANTS_DB_NAME || 'tenants', // Aligned with docker-compose.yml
    ssl: process.env.NODE_ENV === 'production',
  },
  telephony: {
    host: process.env.TELEPHONY_DB_HOST || 'localhost',
    port: parseInt(process.env.TELEPHONY_DB_PORT || '5432'),
    username: process.env.TELEPHONY_DB_USER || 'dukat',
    password: process.env.TELEPHONY_DB_PASSWORD || 'password',
    database: process.env.TELEPHONY_DB_NAME || 'telephony',
    ssl: process.env.NODE_ENV === 'production',
  },
  billing: {
    host: process.env.BILLING_DB_HOST || 'localhost',
    port: parseInt(process.env.BILLING_DB_PORT || '5432'),
    username: process.env.BILLING_DB_USER || 'dukat',
    password: process.env.BILLING_DB_PASSWORD || 'password',
    database: process.env.BILLING_DB_NAME || 'billing',
    ssl: process.env.NODE_ENV === 'production',
  },
  analytics: {
    host: process.env.ANALYTICS_DB_HOST || 'localhost',
    port: parseInt(process.env.ANALYTICS_DB_PORT || '5432'),
    username: process.env.ANALYTICS_DB_USER || 'dukat',
    password: process.env.ANALYTICS_DB_PASSWORD || 'password',
    database: process.env.ANALYTICS_DB_NAME || 'analytics',
    ssl: process.env.NODE_ENV === 'production',
  },
  emergency: {
    host: process.env.EMERGENCY_DB_HOST || 'localhost',
    port: parseInt(process.env.EMERGENCY_DB_PORT || '5432'),
    username: process.env.EMERGENCY_DB_USER || 'dukat',
    password: process.env.EMERGENCY_DB_PASSWORD || 'password',
    database: process.env.EMERGENCY_DB_NAME || 'emergency',
    ssl: process.env.NODE_ENV === 'production',
  },
  voice: { // New entry for Session 04 Voice Infrastructure
    host: process.env.VOICE_DB_HOST || 'postgres',
    port: parseInt(process.env.VOICE_DB_PORT || '5432'),
    username: process.env.VOICE_DB_USER || 'postgres',
    password: process.env.VOICE_DB_PASSWORD || 'postgres',
    database: process.env.VOICE_DB_NAME || 'voice',
    ssl: process.env.NODE_ENV === 'production',
  },
};