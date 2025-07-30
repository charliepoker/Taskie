import request from 'supertest';
import express from 'express';
import {
  sanitizeInput,
  securityHeaders,
  sqlInjectionProtection,
  requestSizeLimit,
} from '../middlewares/security';

describe('Security Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Input Sanitization', () => {
    it('should sanitize XSS attempts in request body', async () => {
      app.use(sanitizeInput);
      app.post('/test', (req, res) => res.json(req.body));

      const maliciousInput = {
        name: '<script>alert("xss")</script>John',
        description: '<iframe src="evil.com"></iframe>Safe content',
        email: 'javascript:alert("xss")@example.com',
      };

      const response = await request(app).post('/test').send(maliciousInput);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('John');
      expect(response.body.description).toBe('Safe content');
      expect(response.body.email).toBe('@example.com');
    });

    it('should sanitize nested objects', async () => {
      app.use(sanitizeInput);
      app.post('/test', (req, res) => res.json(req.body));

      const maliciousInput = {
        user: {
          profile: {
            bio: '<script>alert("nested xss")</script>Clean bio',
          },
        },
      };

      const response = await request(app).post('/test').send(maliciousInput);

      expect(response.status).toBe(200);
      expect(response.body.user.profile.bio).toBe('Clean bio');
    });
  });

  describe('SQL Injection Protection', () => {
    it('should block SQL injection attempts', async () => {
      app.use(sqlInjectionProtection);
      app.post('/test', (req, res) => res.json({ success: true }));

      const sqlInjectionAttempts = [
        { query: "'; DROP TABLE users; --" },
        { search: "admin' OR '1'='1" },
        { filter: 'UNION SELECT * FROM passwords' },
        { id: '1; DELETE FROM projects' },
      ];

      for (const payload of sqlInjectionAttempts) {
        const response = await request(app).post('/test').send(payload);

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('INVALID_INPUT');
      }
    });

    it('should allow safe input', async () => {
      app.use(sqlInjectionProtection);
      app.post('/test', (req, res) => res.json({ success: true }));

      const safeInput = {
        name: 'John Doe',
        email: 'john@example.com',
        description: 'This is a safe description with normal text.',
      };

      const response = await request(app).post('/test').send(safeInput);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Security Headers', () => {
    it('should set security headers', async () => {
      app.use(securityHeaders);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');

      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe(
        'strict-origin-when-cross-origin'
      );
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Request Size Limiting', () => {
    it('should reject requests that are too large', async () => {
      app.use(requestSizeLimit('1kb'));
      app.post('/test', (req, res) => res.json({ success: true }));

      // Create a payload larger than 1KB
      const largePayload = {
        data: 'x'.repeat(2000), // 2KB of data
      };

      const response = await request(app).post('/test').send(largePayload);

      expect(response.status).toBe(413);
      expect(response.body.code).toBe('REQUEST_TOO_LARGE');
    });

    it('should allow requests within size limit', async () => {
      app.use(requestSizeLimit('10mb'));
      app.post('/test', (req, res) => res.json({ success: true }));

      const normalPayload = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const response = await request(app).post('/test').send(normalPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe('Security Configuration', () => {
  it('should have proper rate limit configurations', () => {
    const securityConfig = require('../config/security').default;

    expect(securityConfig.rateLimits.auth.max).toBe(5);
    expect(securityConfig.rateLimits.api.max).toBe(100);
    expect(securityConfig.rateLimits.strict.max).toBe(10);
  });

  it('should have XSS protection patterns', () => {
    const securityConfig = require('../config/security').default;

    expect(securityConfig.xssPatterns).toHaveLength(4);
    expect(securityConfig.xssPatterns[0]).toBeInstanceOf(RegExp);
  });

  it('should have SQL injection protection patterns', () => {
    const securityConfig = require('../config/security').default;

    expect(securityConfig.sqlInjectionPatterns).toHaveLength(4);
    expect(securityConfig.sqlInjectionPatterns[0]).toBeInstanceOf(RegExp);
  });
});
