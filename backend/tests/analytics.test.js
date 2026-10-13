// tests/analytics.test.js
require('./setup');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const app = require('../src/app');
const { getDb, closeDb } = require('../src/database/db');

let token;

beforeAll(async () => {
  const db = getDb();
  const hash = bcrypt.hashSync('testpass', 10);
  db.prepare(`INSERT INTO users (id, username, password_hash, full_name) VALUES (?, ?, ?, ?)`)
    .run(uuidv4(), 'hranalytics', hash, 'Analytics HR');

  // Seed some employees for analytics
  const empId1 = uuidv4(), empId2 = uuidv4(), empId3 = uuidv4();
  db.prepare(`INSERT INTO employees (id, employee_id, first_name, last_name, email, department, job_title, country, employment_type, gender, hire_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(empId1, 'TEST001', 'Alice', 'A', 'alice@test.com', 'Engineering', 'SWE', 'United States', 'Full-time', 'Female', '2023-01-01');
  db.prepare(`INSERT INTO employees (id, employee_id, first_name, last_name, email, department, job_title, country, employment_type, gender, hire_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(empId2, 'TEST002', 'Bob', 'B', 'bob@test.com', 'Engineering', 'SWE', 'United States', 'Full-time', 'Male', '2023-01-01');
  db.prepare(`INSERT INTO employees (id, employee_id, first_name, last_name, email, department, job_title, country, employment_type, gender, hire_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(empId3, 'TEST003', 'Carol', 'C', 'carol@test.com', 'Marketing', 'Manager', 'United Kingdom', 'Full-time', 'Female', '2023-01-01');

  db.prepare(`INSERT INTO salaries (id, employee_id, amount, currency, effective_date) VALUES (?, ?, ?, ?, ?)`).run(uuidv4(), empId1, 100000, 'USD', '2023-01-01');
  db.prepare(`INSERT INTO salaries (id, employee_id, amount, currency, effective_date) VALUES (?, ?, ?, ?, ?)`).run(uuidv4(), empId2, 120000, 'USD', '2023-01-01');
  db.prepare(`INSERT INTO salaries (id, employee_id, amount, currency, effective_date) VALUES (?, ?, ?, ?, ?)`).run(uuidv4(), empId3, 60000, 'GBP', '2023-01-01');

  const loginRes = await request(app).post('/api/auth/login').send({ username: 'hranalytics', password: 'testpass' });
  token = loginRes.body.data.token;
});

afterAll(() => {
  closeDb();
});

describe('GET /api/analytics/summary', () => {
  it('should return overview statistics', async () => {
    const res = await request(app).get('/api/analytics/summary').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total_employees).toBeGreaterThan(0);
    expect(res.body.data.total_payroll).toBeGreaterThan(0);
    expect(res.body.data.avg_salary).toBeGreaterThan(0);
    expect(res.body.data.median_salary).toBeGreaterThan(0);
  });

  it('should support currency parameter', async () => {
    const usdRes = await request(app).get('/api/analytics/summary?currency=USD').set('Authorization', `Bearer ${token}`);
    const gbpRes = await request(app).get('/api/analytics/summary?currency=GBP').set('Authorization', `Bearer ${token}`);
    expect(usdRes.body.data.currency).toBe('USD');
    expect(gbpRes.body.data.currency).toBe('GBP');
    // Different currencies should give different payroll numbers
    expect(usdRes.body.data.total_payroll).not.toBe(gbpRes.body.data.total_payroll);
  });
});

describe('GET /api/analytics/by-department', () => {
  it('should return salary data grouped by department', async () => {
    const res = await request(app).get('/api/analytics/by-department').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('department');
    expect(res.body.data[0]).toHaveProperty('avg_salary');
    expect(res.body.data[0]).toHaveProperty('headcount');
  });

  it('should be sorted by avg salary descending', async () => {
    const res = await request(app).get('/api/analytics/by-department').set('Authorization', `Bearer ${token}`);
    const salaries = res.body.data.map(d => d.avg_salary);
    for (let i = 1; i < salaries.length; i++) {
      expect(salaries[i - 1]).toBeGreaterThanOrEqual(salaries[i]);
    }
  });
});

describe('GET /api/analytics/by-country', () => {
  it('should return salary data grouped by country', async () => {
    const res = await request(app).get('/api/analytics/by-country').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach(d => {
      expect(d).toHaveProperty('country');
      expect(d).toHaveProperty('avg_salary');
      expect(d).toHaveProperty('headcount');
    });
  });
});

describe('GET /api/analytics/distribution', () => {
  it('should return salary distribution buckets', async () => {
    const res = await request(app).get('/api/analytics/distribution?buckets=5').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(5);
    res.body.data.forEach(b => {
      expect(b).toHaveProperty('range_start');
      expect(b).toHaveProperty('range_end');
      expect(b).toHaveProperty('count');
    });
  });

  it('total count in distribution should equal total employees', async () => {
    const summaryRes = await request(app).get('/api/analytics/summary').set('Authorization', `Bearer ${token}`);
    const distRes = await request(app).get('/api/analytics/distribution').set('Authorization', `Bearer ${token}`);
    const totalInDist = distRes.body.data.reduce((s, b) => s + b.count, 0);
    expect(totalInDist).toBe(summaryRes.body.data.total_employees);
  });
});

describe('GET /api/analytics/top-earners', () => {
  it('should return top earners sorted by salary', async () => {
    const res = await request(app).get('/api/analytics/top-earners?limit=3').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(3);
    const salaries = res.body.data.map(e => e.salary_in_base);
    for (let i = 1; i < salaries.length; i++) {
      expect(salaries[i - 1]).toBeGreaterThanOrEqual(salaries[i]);
    }
  });
});
