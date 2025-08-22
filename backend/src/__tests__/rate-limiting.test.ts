import request from 'supertest';
import app from '../app';

describe('Rate Limiting Configuration', () => {
  describe('Test Environment Rate Limiting', () => {
    it('should allow multiple rapid requests in test environment', async () => {
      // Make multiple rapid requests to auth endpoint
      const promises = Array.from({ length: 10 }, () =>
        request(app).post('/api/auth/login').send({
          email: 'test@example.com',
          password: 'password123',
        })
      );

      const responses = await Promise.all(promises);

      // In test environment, none should be rate limited (429)
      const rateLimitedResponses = responses.filter(
        (response) => response.status === 429
      );

      expect(rateLimitedResponses).toHaveLength(0);
    });

    it('should allow multiple rapid requests to API endpoints', async () => {
      // Make multiple rapid requests to API endpoint
      const promises = Array.from({ length: 20 }, () =>
        request(app).get('/api/users')
      );

      const responses = await Promise.all(promises);

      // In test environment, none should be rate limited (429)
      const rateLimitedResponses = responses.filter(
        (response) => response.status === 429
      );

      expect(rateLimitedResponses).toHaveLength(0);
    });

    it('should allow multiple rapid requests to strict endpoints', async () => {
      // Make multiple rapid requests to strict rate limited endpoint
      const promises = Array.from({ length: 15 }, () =>
        request(app).post('/api/auth/refresh').send({
          refreshToken: 'invalid-token',
        })
      );

      const responses = await Promise.all(promises);

      // In test environment, none should be rate limited (429)
      const rateLimitedResponses = responses.filter(
        (response) => response.status === 429
      );

      expect(rateLimitedResponses).toHaveLength(0);
    });
  });

  describe('Rate Limiting Configuration Detection', () => {
    it('should detect test environment and disable rate limiting', () => {
      // Check that NODE_ENV is set to test
      expect(process.env.NODE_ENV).toBe('test');

      // Check that DISABLE_RATE_LIMIT is set to true
      expect(process.env.DISABLE_RATE_LIMIT).toBe('true');
    });
  });
});
