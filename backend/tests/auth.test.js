// tests/auth.test.js
require('./setup');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { getDb, closeDb } = require('../src/database/db');

beforeAll(() => {
  const db = getDb();
  const { v4: uuidv4 } = require('uuid');
  const hash = bcrypt.hashSync('testpassword', 10);
  db.prepare(`INSERT INTO users (id, username, password_hash, full_name) VALUES (?, ?, ?, ?)`)
    .run(uuidv4(), 'testadmin', hash, 'Test Admin');
});

afterAll(() => {
  closeDb();
});

describe('POST /api/auth/login', () => {
  it('should login successfully with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'testadmin', password: 'testpassword' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.username).toBe('testadmin');
  });

  it('should return 401 for invalid password', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'testadmin', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for non-existent user', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'nobody', password: 'pass' });
    expect(res.status).toBe(401);
  });

  it('should return 400 when credentials are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should set httpOnly cookie on successful login', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'testadmin', password: 'testpassword' });
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toContain('token=');
    expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
  });
});

describe('POST /api/auth/logout', () => {
  it('should clear the token cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/auth/me', () => {
  it('should return user info with valid token', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ username: 'testadmin', password: 'testpassword' });
    const token = loginRes.body.data.token;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.username).toBe('testadmin');
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
