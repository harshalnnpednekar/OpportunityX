const express = require('express');
const request = require('supertest');
const { createRateLimiter } = require('../src/middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  let testApp;

  beforeAll(() => {
    testApp = express();
    testApp.use(express.json());

    const limiter = createRateLimiter({
      windowMs: 60 * 1000,
      max: 3,
      message: 'Too many attempts, please slow down.'
    });

    testApp.post('/api/test-limit', limiter, (req, res) => {
      res.json({ success: true });
    });
  });

  test('allows requests up to configured limit, then blocks with 429 Too Many Requests', async () => {
    // Requests 1, 2, 3 should succeed
    for (let i = 1; i <= 3; i++) {
      const res = await request(testApp)
        .post('/api/test-limit')
        .set('x-test-rate-limit', 'true')
        .send({});
      expect(res.status).toBe(200);
      expect(res.headers['ratelimit-limit']).toBe('3');
      expect(res.headers['ratelimit-remaining']).toBe(String(3 - i));
    }

    // 4th request should be blocked with 429
    const blockedRes = await request(testApp)
      .post('/api/test-limit')
      .set('x-test-rate-limit', 'true')
      .send({});

    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error).toMatch(/too many attempts/i);
    expect(blockedRes.headers['retry-after']).toBeDefined();
    expect(blockedRes.headers['ratelimit-remaining']).toBe('0');
  });
});
