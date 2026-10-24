const request = require('supertest');
const app = require('../src/app');
const { sanitize } = require('../src/middleware/requestLogger');

describe('Server Core & Express Setup', () => {
  test('GET /api/health returns application name, status, and timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('OpportunityX Platform API');
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
    expect(typeof res.body.timestamp).toBe('string');
  });

  test('Undefined route returns structured 404 JSON response', async () => {
    const res = await request(app).get('/api/unknown-endpoint-test');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Endpoint not found');
  });

  test('Root informational endpoint returns status and name', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('OpportunityX Platform API');
    expect(res.body.status).toBe('online');
  });

  test('Request logger sanitizer correctly redacts sensitive fields', () => {
    const sensitivePayload = {
      email: 'user@example.com',
      password: 'supersecretpassword',
      token: 'jwt.token.string',
      nested: {
        currentPassword: 'oldpassword123',
        safeProperty: 'hello world',
        secret: 'shhh'
      },
      list: [
        { apiKey: 'key-12345', name: 'service1' }
      ]
    };

    const sanitized = sanitize(sensitivePayload);

    expect(sanitized.email).toBe('user@example.com');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.token).toBe('[REDACTED]');
    expect(sanitized.nested.currentPassword).toBe('[REDACTED]');
    expect(sanitized.nested.safeProperty).toBe('hello world');
    expect(sanitized.nested.secret).toBe('[REDACTED]');
    expect(sanitized.list[0].apiKey).toBe('[REDACTED]');
    expect(sanitized.list[0].name).toBe('service1');
  });
});
