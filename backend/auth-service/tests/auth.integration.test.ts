import request from 'supertest';
import { createApp } from '../src/app';
import { AppDataSource } from '../src/data-source';
import { User } from '../src/entities/User';
import { Application } from 'express'; // Fixed: Imported Application from express

describe('Auth Service Integration Tests', () => {
  let app: Application; // Fixed: Changed type to Application
  let testUser: User;
  let testTenantId = 'test-tenant-123';

  beforeAll(async () => {
    // Setup test database
    await AppDataSource.initialize();
    app = createApp();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    // Clear database before each test
    await AppDataSource.getRepository(User).clear();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
          firstName: 'John',
          lastName: 'Doe',
          tenantId: testTenantId,
        });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          firstName: 'John',
          lastName: 'Doe',
          tenantId: testTenantId,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should prevent duplicate emails in same tenant', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Test123!@#',
          firstName: 'John',
          lastName: 'Doe',
          tenantId: testTenantId,
        });

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Test123!@#',
          firstName: 'Jane',
          lastName: 'Smith',
          tenantId: testTenantId,
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'Test123!@#',
          firstName: 'Login',
          lastName: 'User',
          tenantId: testTenantId,
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Test123!@#',
          tenantId: testTenantId,
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('login@example.com');
      expect(response.body.tokens.accessToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
          tenantId: testTenantId,
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should lock account after 5 failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'login@example.com',
            password: 'wrongpassword',
            tenantId: testTenantId,
          });
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Test123!@#',
          tenantId: testTenantId,
        });

      expect(response.status).toBe(401);
      expect(response.body.error.message).toContain('locked');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'refresh@example.com',
          password: 'Test123!@#',
          firstName: 'Refresh',
          lastName: 'User',
          tenantId: testTenantId,
        });

      refreshToken = registerResponse.body.tokens.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.refreshToken).not.toBe(refreshToken); // Should rotate
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
    });
  });

  describe('Protected routes', () => {
    let accessToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'protected@example.com',
          password: 'Test123!@#',
          firstName: 'Protected',
          lastName: 'User',
          tenantId: testTenantId,
        });

      accessToken = registerResponse.body.tokens.accessToken;
    });

    it('should access profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('protected@example.com');
    });

    it('should reject profile access without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      // Try to use the same token again
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      // This depends on token blacklisting implementation
      expect(profileResponse.status).toBe(401);
    });
  });
});