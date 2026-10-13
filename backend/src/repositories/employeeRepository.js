// src/repositories/employeeRepository.js
const { getDb } = require('../database/db');

function buildWhereClause(filters) {
  const conditions = ['e.is_active = 1'];
  const params = [];

  if (filters.search) {
    conditions.push(`(e.first_name || ' ' || e.last_name LIKE ? OR e.email LIKE ? OR e.employee_id LIKE ?)`);
    const s = `%${filters.search}%`;
    params.push(s, s, s);
  }
  if (filters.department) {
    conditions.push('e.department = ?');
    params.push(filters.department);
  }
  if (filters.country) {
    conditions.push('e.country = ?');
    params.push(filters.country);
  }
  if (filters.employment_type) {
    conditions.push('e.employment_type = ?');
    params.push(filters.employment_type);
  }
  if (filters.currency) {
    conditions.push('s.currency = ?');
    params.push(filters.currency);
  }
  if (filters.salary_min) {
    conditions.push('s.amount >= ?');
    params.push(Number(filters.salary_min));
  }
  if (filters.salary_max) {
    conditions.push('s.amount <= ?');
    params.push(Number(filters.salary_max));
  }

  return { where: conditions.join(' AND '), params };
}

function findAll({ page = 1, limit = 20, sort = 'e.last_name', order = 'ASC', ...filters } = {}) {
  const db = getDb();
  const offset = (page - 1) * limit;
  const { where, params } = buildWhereClause(filters);

  const ALLOWED_SORTS = {
    'first_name': 'e.first_name', 'last_name': 'e.last_name', 'email': 'e.email',
    'department': 'e.department', 'country': 'e.country', 'employee_id': 'e.employee_id',
    'hire_date': 'e.hire_date', 'salary': 's.amount', 'job_title': 'e.job_title',
    'employment_type': 'e.employment_type'
  };
  const sortCol = ALLOWED_SORTS[sort] || 'e.last_name';
  const sortDir = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const baseQuery = `
    FROM employees e
    LEFT JOIN (
      SELECT employee_id, amount, currency, effective_date
      FROM salaries
      WHERE id IN (
        SELECT id FROM salaries s2
        WHERE s2.employee_id = salaries.employee_id
        ORDER BY effective_date DESC, created_at DESC
        LIMIT 1
      )
    ) s ON s.employee_id = e.id
    WHERE ${where}
  `;

  const countRow = db.prepare(`SELECT COUNT(*) as total ${baseQuery}`).get(...params);
  const rows = db.prepare(`
    SELECT e.*, s.amount as current_salary, s.currency as salary_currency, s.effective_date as salary_effective_date
    ${baseQuery}
    ORDER BY ${sortCol} ${sortDir}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  return { data: rows, total: countRow.total, page, limit };
}

function findById(id) {
  const db = getDb();
  const employee = db.prepare(`SELECT * FROM employees WHERE id = ? AND is_active = 1`).get(id);
  if (!employee) return null;

  const salaryHistory = db.prepare(`
    SELECT * FROM salaries WHERE employee_id = ? ORDER BY effective_date DESC, created_at DESC
  `).all(id);

  return { ...employee, salary_history: salaryHistory };
}

function create(data) {
  const db = getDb();
  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO employees (id, employee_id, first_name, last_name, email, department, job_title, country, employment_type, gender, hire_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.employee_id, data.first_name, data.last_name, data.email,
    data.department, data.job_title, data.country, data.employment_type, data.gender, data.hire_date);

  return findById(id);
}

function update(id, data) {
  const db = getDb();
  const now = new Date().toISOString();
  const fields = ['first_name', 'last_name', 'email', 'department', 'job_title', 'country', 'employment_type', 'gender', 'hire_date'];
  const updates = [];
  const params = [];

  for (const field of fields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(data[field]);
    }
  }

  if (updates.length === 0) return findById(id);

  updates.push('updated_at = ?');
  params.push(now, id);

  db.prepare(`UPDATE employees SET ${updates.join(', ')} WHERE id = ? AND is_active = 1`).run(...params);
  return findById(id);
}

function softDelete(id) {
  const db = getDb();
  const result = db.prepare(`UPDATE employees SET is_active = 0, updated_at = ? WHERE id = ? AND is_active = 1`)
    .run(new Date().toISOString(), id);
  return result.changes > 0;
}

function getDistinctValues() {
  const db = getDb();
  return {
    departments: db.prepare(`SELECT DISTINCT department FROM employees WHERE is_active=1 ORDER BY department`).all().map(r => r.department),
    countries: db.prepare(`SELECT DISTINCT country FROM employees WHERE is_active=1 ORDER BY country`).all().map(r => r.country),
    currencies: db.prepare(`SELECT DISTINCT currency FROM salaries ORDER BY currency`).all().map(r => r.currency),
    employment_types: ['Full-time', 'Part-time', 'Contract']
  };
}

function generateEmployeeId() {
  const db = getDb();
  const last = db.prepare(`SELECT employee_id FROM employees ORDER BY employee_id DESC LIMIT 1`).get();
  if (!last) return 'EMP00001';
  const num = parseInt(last.employee_id.replace('EMP', '')) + 1;
  return `EMP${String(num).padStart(5, '0')}`;
}

module.exports = { findAll, findById, create, update, softDelete, getDistinctValues, generateEmployeeId };
