// tests/employees.test.js
require('./setup');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const app = require('../src/app');
const { getDb, closeDb } = require('../src/database/db');

let token;
let createdEmployeeId;

beforeAll(async () => {
  const db = getDb();
  const hash = bcrypt.hashSync('testpass', 10);
  db.prepare(`INSERT INTO users (id, username, password_hash, full_name) VALUES (?, ?, ?, ?)`)
    .run(uuidv4(), 'hrmanager', hash, 'HR Manager');

  const loginRes = await request(app).post('/api/auth/login').send({ username: 'hrmanager', password: 'testpass' });
  token = loginRes.body.data.token;
});

afterAll(() => {
  closeDb();
});

const newEmployee = {
  first_name: 'John', last_name: 'Doe', email: 'john.doe@acme.com',
  department: 'Engineering', job_title: 'Software Engineer I',
  country: 'United States', employment_type: 'Full-time',
  gender: 'Male', hire_date: '2024-01-15',
  salary_amount: 90000, salary_currency: 'USD'
};

describe('POST /api/employees - Create Employee', () => {
  it('should create a new employee with salary', async () => {
    const res = await request(app).post('/api/employees').set('Authorization', `Bearer ${token}`).send(newEmployee);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('john.doe@acme.com');
    expect(res.body.data.salary_history).toHaveLength(1);
    createdEmployeeId = res.body.data.id;
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/employees').set('Authorization', `Bearer ${token}`).send({ first_name: 'Only' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app).post('/api/employees').send(newEmployee);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/employees - List Employees', () => {
  it('should return paginated employee list', async () => {
    const res = await request(app).get('/api/employees').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.total_pages).toBeGreaterThan(0);
  });

  it('should filter by department', async () => {
    const res = await request(app).get('/api/employees?department=Engineering').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.data.forEach(e => expect(e.department).toBe('Engineering'));
  });

  it('should search by name', async () => {
    const res = await request(app).get('/api/employees?search=John').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should respect pagination', async () => {
    const res = await request(app).get('/api/employees?page=1&limit=5').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });
});

describe('GET /api/employees/:id - Get Employee', () => {
  it('should return employee with salary history', async () => {
    const res = await request(app).get(`/api/employees/${createdEmployeeId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdEmployeeId);
    expect(Array.isArray(res.body.data.salary_history)).toBe(true);
  });

  it('should return 404 for non-existent employee', async () => {
    const res = await request(app).get('/api/employees/nonexistent-id').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/employees/:id - Update Employee', () => {
  it('should update employee details', async () => {
    const res = await request(app).put(`/api/employees/${createdEmployeeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ job_title: 'Senior Software Engineer' });
    expect(res.status).toBe(200);
    expect(res.body.data.job_title).toBe('Senior Software Engineer');
  });
});

describe('POST /api/employees/:id/salary - Add Salary Record', () => {
  it('should add a new salary record', async () => {
    const res = await request(app).post(`/api/employees/${createdEmployeeId}/salary`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 100000, currency: 'USD', effective_date: '2025-01-01', reason: 'Promotion' });
    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe(100000);
  });

  it('should have 2 records in history now', async () => {
    const res = await request(app).get(`/api/employees/${createdEmployeeId}`).set('Authorization', `Bearer ${token}`);
    expect(res.body.data.salary_history.length).toBe(2);
  });

  it('should return 400 when salary fields are missing', async () => {
    const res = await request(app).post(`/api/employees/${createdEmployeeId}/salary`)
      .set('Authorization', `Bearer ${token}`).send({ amount: 50000 });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/employees/:id - Soft Delete', () => {
  it('should soft delete an employee', async () => {
    const res = await request(app).delete(`/api/employees/${createdEmployeeId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should not find a deleted employee', async () => {
    const res = await request(app).get(`/api/employees/${createdEmployeeId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
