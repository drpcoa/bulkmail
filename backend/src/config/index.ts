import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'bulkmail',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Email Providers
  mailcow: {
    apiKey: process.env.MAILCOW_API_KEY || '',
    apiUrl: process.env.MAILCOW_API_URL || '',
  },
  smtpcom: {
    apiKey: process.env.SMTPCOM_API_KEY || '',
    sender: process.env.SMTPCOM_SENDER || '',
  },
  elasticEmail: {
    apiKey: process.env.ELASTIC_EMAIL_API_KEY || '',
    from: process.env.ELASTIC_EMAIL_FROM || '',
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
} as const;

export type Config = typeof config;
