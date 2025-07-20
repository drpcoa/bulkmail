/// <reference types="jest" />

import request from 'supertest';
import { AppDataSource } from '../src/config/database';
import { app } from '../src/index';
import { User } from '../src/models/User';
import { Server } from 'http';

let server: Server;

beforeAll(async () => {
  await AppDataSource.initialize();
  server = app.listen(4000);
});

afterAll(async () => {
  await AppDataSource.destroy();
  server.close();
});

beforeEach(async () => {
  await AppDataSource.getRepository(User).clear();
});

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.data).toHaveProperty('id');
  });

  it('should not register a user with an existing email', async () => {
    await request(server)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password',
      });
    const res = await request(server)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password',
      });
    expect(res.statusCode).toEqual(400);
  });

  it('should login an existing user', async () => {
    await request(server)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password',
      });
    const res = await request(server)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty('token');
  });

  it('should not login with an incorrect password', async () => {
    await request(server)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password',
      });
    const res = await request(server)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });
    expect(res.statusCode).toEqual(401);
  });
});