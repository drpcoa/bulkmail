import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './index';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  synchronize: config.env === 'development',
  logging: config.env === 'development',
  entities: [__dirname + '/../models/**/*.ts'],
  migrations: [__dirname + '/../database/migrations/**/*.ts'],
  subscribers: [__dirname + '/../subscribers/**/*.ts'],
});
