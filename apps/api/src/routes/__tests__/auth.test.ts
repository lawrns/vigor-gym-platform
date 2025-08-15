import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes, { setPrismaInstance } from '../auth.js';

// Mock Prisma client for testing
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  company: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
};

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Set mock prisma instance
setPrismaInstance(mockPrisma);
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  beforeAll(() => {
    // Set required environment variables for testing
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation error');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('GET /auth/me', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/auth/me');

      expect(response.status).toBe(401);
    });
  });
});
