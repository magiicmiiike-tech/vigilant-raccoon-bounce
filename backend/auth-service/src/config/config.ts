import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  
  // Database
  AUTH_DB_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  
  // JWT
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRY: Joi.string().default('24h'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
  
  // Security
  BCRYPT_ROUNDS: Joi.number().default(12),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  // MFA
  MFA_APP_NAME: Joi.string().default('Dukat Voice'),
  
  // Email (for password reset)
  SMTP_HOST: Joi.string(),
  SMTP_PORT: Joi.number(),
  SMTP_USER: Joi.string(),
  SMTP_PASS: Joi.string(),
  
  // Tenant
  TENANT_ID_HEADER: Joi.string().default('x-tenant-id'),
  
  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  
  database: {
    url: envVars.AUTH_DB_URL,
  },
  
  redis: {
    url: envVars.REDIS_URL,
  },
  
  jwt: {
    accessSecret: envVars.JWT_ACCESS_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    accessExpiry: envVars.JWT_ACCESS_EXPIRY,
    refreshExpiry: envVars.JWT_REFRESH_EXPIRY,
  },
  
  security: {
    bcryptRounds: parseInt(envVars.BCRYPT_ROUNDS, 10),
    rateLimit: {
      windowMs: envVars.RATE_LIMIT_WINDOW_MS,
      max: envVars.RATE_LIMIT_MAX_REQUESTS,
    },
  },
  
  mfa: {
    appName: envVars.MFA_APP_NAME,
  },
  
  email: {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASS,
  },
  
  tenant: {
    header: envVars.TENANT_ID_HEADER,
  },
  
  logging: {
    level: envVars.LOG_LEVEL,
  },
};