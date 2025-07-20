import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.join(process.cwd(), '.env.test') });
} else {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
}

// Helper to get environment variable or throw error
const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

// Define the schema for environment variables
const envVarsSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'] as const)
    .default('development'),
  PORT: z.string().default('3000'),
  API_PREFIX: z.string().default('/api'),
  CORS_ORIGIN: z.string().default('*'),
  
  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default(5432),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_SYNC: z.string().default('false'),
  DB_LOGGING: z.string().default('false'),
  
  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('24h'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),
  
  // Email Providers
  // Mailcow
  MAILCOW_API_KEY: z.string().optional(),
  MAILCOW_API_URL: z.string().url().optional(),
  MAILCOW_SENDER: z.string().email().optional(),
  
  // SMTP.com
  SMTPCOM_API_KEY: z.string().optional(),
  SMTPCOM_SENDER: z.string().email().optional(),
  SMTPCOM_DEFAULT_FROM_NAME: z.string().optional(),
  
  // ElasticEmail
  ELASTIC_EMAIL_API_KEY: z.string().optional(),
  ELASTIC_EMAIL_FROM: z.string().email().optional(),
  ELASTIC_EMAIL_FROM_NAME: z.string().optional(),
  
  // Webhook
  WEBHOOK_SECRET: z.string().optional(),
  ENABLE_WEBHOOKS: z
    .string()
    .transform(val => val === 'true')
    .default(false),
  
  // Logging
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'] as const)
    .default('info'),
  
  // Other
  NODE_TLS_REJECT_UNAUTHORIZED: z.string().default('0'),
});

// Validate environment variables
const envVars = envVarsSchema.safeParse(process.env);

if (!envVars.success) {
  throw new Error(`Config validation error: ${envVars.error.message}`);
}

// Export the validated environment variables
export const config = {
  env: envVars.data.NODE_ENV,
  port: parseInt(envVars.data.PORT, 10),
  api: {
    prefix: envVars.data.API_PREFIX,
    cors: {
      origin: envVars.data.CORS_ORIGIN,
    },
  },
  database: {
    host: envVars.data.DB_HOST,
    port: envVars.data.DB_PORT,
    name: envVars.data.DB_NAME,
    username: envVars.data.DB_USER,
    password: envVars.data.DB_PASSWORD,
    synchronize: envVars.data.DB_SYNC === 'true',
    logging: envVars.data.DB_LOGGING === 'true',
  },
  redis: {
    host: envVars.data.REDIS_HOST,
    port: envVars.data.REDIS_PORT,
    password: envVars.data.REDIS_PASSWORD,
  },
  jwt: {
    secret: envVars.data.JWT_SECRET,
    expiresIn: envVars.data.JWT_EXPIRES_IN,
    refreshExpiresIn: envVars.data.REFRESH_TOKEN_EXPIRES_IN,
  },
  rateLimit: {
    windowMs: envVars.data.RATE_LIMIT_WINDOW_MS,
    max: envVars.data.RATE_LIMIT_MAX_REQUESTS,
  },
  email: {
    mailcow: {
      apiKey: envVars.data.MAILCOW_API_KEY,
      apiUrl: envVars.data.MAILCOW_API_URL,
      sender: envVars.data.MAILCOW_SENDER,
    },
    smtpcom: {
      apiKey: envVars.data.SMTPCOM_API_KEY,
      sender: envVars.data.SMTPCOM_SENDER,
      defaultFromName: envVars.data.SMTPCOM_DEFAULT_FROM_NAME,
    },
    elasticEmail: {
      apiKey: envVars.data.ELASTIC_EMAIL_API_KEY,
      from: envVars.data.ELASTIC_EMAIL_FROM,
      fromName: envVars.data.ELASTIC_EMAIL_FROM_NAME,
    },
  },
  webhook: {
    secret: envVars.data.WEBHOOK_SECRET,
    enabled: envVars.data.ENABLE_WEBHOOKS,
  },
  logger: {
    level: envVars.data.LOG_LEVEL,
  },
} as const;

export type Config = typeof config;
