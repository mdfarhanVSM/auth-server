const request = require('supertest');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const authRoutes = require('../src/routes/authRoutes');
const model = require('../src/models/oauthModel');

function createTestApp(oauthMock = {}, modelMock = {}) {
  const app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(session({
    secret: 'test_secret',
    resave: false,
    saveUninitialized: false,
  }));

  app.locals.oauth = oauthMock;
  Object.assign(model, modelMock);

  app.use('/', authRoutes);
  return app;
}

// Reset all  before each test
beforeEach(() => {
  jest.resetAllMocks();
});

describe('Auth Routes', () => {
  // /oauth/revoke
  describe('/oauth/revoke', () => {
    it('returns 400 if refresh_token is missing', async () => {
      const app = createTestApp();
      const res = await request(app).post('/oauth/revoke').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Missing refresh_token');
    });

    it('returns success if revokeToken succeeds', async () => {
      const app = createTestApp({}, { revokeToken: jest.fn().mockResolvedValue(true) });
      const res = await request(app).post('/oauth/revoke').send({ refresh_token: 'mock-refresh-token' });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns error if revokeToken fails', async () => {
      const app = createTestApp({}, { revokeToken: jest.fn().mockResolvedValue(false) });
      const res = await request(app).post('/oauth/revoke').send({ refresh_token: 'invalid-refresh-token' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Failed to revoke token');
    });
  });

  // oauth/introspect
  describe('/oauth/introspect', () => {
    it('returns 400 if token is missing', async () => {
      const app = createTestApp();
      const res = await request(app).post('/oauth/introspect').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.active).toBe(false);
    });

    it('returns active true for valid access token', async () => {
      const app = createTestApp({}, {
        getAccessToken: jest.fn().mockResolvedValue({
          accessToken: 'valid-token',
          accessTokenExpiresAt: new Date(Date.now() + 60000),
          user: { id: 1 },
          client: { id: 'client-id' },
          scope: 'read',
        })
      });

      const res = await request(app).post('/oauth/introspect').send({ token: 'valid-token' });
      expect(res.statusCode).toBe(200);
      expect(res.body.active).toBe(true);
      expect(res.body.user_id).toBe(1);
      expect(res.body.client_id).toBe('client-id');
      expect(res.body.scope).toBe('read');
    });

    it('returns active false for expired token', async () => {
      const app = createTestApp({}, {
        getAccessToken: jest.fn().mockResolvedValue({
          accessToken: 'expired-token',
          accessTokenExpiresAt: new Date(Date.now() - 10000),
        })
      });

      const res = await request(app).post('/oauth/introspect').send({ token: 'expired-token' });
      expect(res.statusCode).toBe(200);
      expect(res.body.active).toBe(false);
    });

    it('returns active false if token not found', async () => {
      const app = createTestApp({}, { getAccessToken: jest.fn().mockResolvedValue(null) });
      const res = await request(app).post('/oauth/introspect').send({ token: 'missing' });
      expect(res.statusCode).toBe(200);
      expect(res.body.active).toBe(false);
    });
  });



  // oauth/token
  describe('/oauth/token', () => {
    it('returns tokens on valid credentials', async () => {
      const oauthMock = {
        token: jest.fn().mockResolvedValue({
          accessToken: 'mock-access-token',
          accessTokenExpiresAt: new Date(Date.now() + 60 * 1000),
          refreshToken: 'mock-refresh-token',
          refreshTokenExpiresAt: new Date(Date.now() + 3600 * 1000),
          user: { id: 1, username: 'testuser' }
        })
      };

      const app = createTestApp(oauthMock);
      const res = await request(app).post('/oauth/token').send({
        grant_type: 'password',
        username: 'testuser',
        password: 'testpass',
        client_id: 'client-id',
        client_secret: 'client-secret'
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.access_token).toBe('mock-access-token');
      expect(res.body.refresh_token).toBe('mock-refresh-token');
      expect(res.body.user.username).toBe('testuser');
    });

    it('returns new access token on refresh flow', async () => {
      const oauthMock = {
        token: jest.fn().mockResolvedValue({
          accessToken: 'new-access-token',
          accessTokenExpiresAt: new Date(Date.now() + 60 * 1000),
          refreshToken: 'new-refresh-token',
          refreshTokenExpiresAt: new Date(Date.now() + 3600 * 1000),
          user: { id: 1, username: 'testuser' }
        })
      };

      const app = createTestApp(oauthMock);
      const res = await request(app).post('/oauth/token').send({
        grant_type: 'refresh_token',
        refresh_token: 'valid-refresh-token',
        client_id: 'client-id',
        client_secret: 'client-secret'
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.access_token).toBe('new-access-token');
      expect(res.body.refresh_token).toBe('new-refresh-token');
    });

    it('returns error if oauth.token throws', async () => {
      const oauthMock = {
        token: jest.fn().mockRejectedValue({
          name: 'invalid_grant',
          message: 'Invalid username or password',
          code: 400
        })
      };

      const app = createTestApp(oauthMock);
      const res = await request(app).post('/oauth/token').send({
        grant_type: 'password',
        username: 'wronguser',
        password: 'wrongpass',
        client_id: 'client-id',
        client_secret: 'client-secret'
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('invalid_grant');
      expect(res.body.error_description).toBe('Invalid username or password');
    });
  });

  // validate-token
  describe('/validate-token', () => {
    it('returns user + client if token is valid', async () => {
      const oauthMock = {
        authenticate: jest.fn().mockResolvedValue({
          user: { id: 1, username: 'validuser' },
          client: { id: 'client-id' }
        })
      };

      const app = createTestApp(oauthMock);
      const res = await request(app)
        .post('/validate-token')
        .set('Authorization', 'Bearer valid-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Token is valid');
      expect(res.body.user.username).toBe('validuser');
      expect(res.body.client.id).toBe('client-id');
    });

    it('returns 401 for invalid/expired tokens', async () => {
      const oauthMock = {
        authenticate: jest.fn().mockRejectedValue({
          name: 'invalid_token',
          message: 'Token expired or invalid',
          code: 401
        })
      };

      const app = createTestApp(oauthMock);
      const res = await request(app)
        .post('/validate-token')
        .set('Authorization', 'Bearer fake-token');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('invalid_token');
      expect(res.body.error_description).toBe('Token expired or invalid');
    });

    it.each([
      ['revoked', 'Token has been revoked'],
      ['expired', 'Access token expired'],
      ['fake', 'Invalid or malformed token']
    ])('rejects %s token with 401', async (_label, msg) => {
      const oauthMock = {
        authenticate: jest.fn().mockRejectedValue({
          name: 'invalid_token',
          message: msg,
          code: 401
        })
      };

      const app = createTestApp(oauthMock);
      const res = await request(app)
        .post('/validate-token')
        .set('Authorization', 'Bearer some-token');

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('invalid_token');
      expect(res.body.error_description).toBe(msg);
    });
  });
});
