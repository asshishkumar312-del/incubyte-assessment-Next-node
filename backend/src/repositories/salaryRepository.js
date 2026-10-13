// src/repositories/salaryRepository.js
const { getDb } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

function addSalaryRecord({ employee_id, amount, currency, effective_date, reason, changed_by }) {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO salaries (id, employee_id, amount, currency, effective_date, reason, changed_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, employee_id, amount, currency, effective_date, reason || null, changed_by || 'HR Manager');
  return db.prepare(`SELECT * FROM salaries WHERE id = ?`).get(id);
}

function getLatestSalary(employee_id) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM salaries WHERE employee_id = ? ORDER BY effective_date DESC, created_at DESC LIMIT 1
  `).get(employee_id);
}

function getSalaryHistory(employee_id) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM salaries WHERE employee_id = ? ORDER BY effective_date DESC, created_at DESC
  `).all(employee_id);
}

function bulkUpdateSalaries({ employee_ids, percentage_change, reason, changed_by }) {
  const db = getDb();
  const results = [];

  const bulkUpdate = db.transaction(() => {
    for (const emp_id of employee_ids) {
      const latest = getLatestSalary(emp_id);
      if (!latest) continue;

      const newAmount = Math.round(latest.amount * (1 + percentage_change / 100));
      const today = new Date().toISOString().split('T')[0];
      const id = uuidv4();

      db.prepare(`
        INSERT INTO salaries (id, employee_id, amount, currency, effective_date, reason, changed_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, emp_id, newAmount, latest.currency, today, reason || `Bulk ${percentage_change}% adjustment`, changed_by || 'HR Manager');

      results.push({ employee_id: emp_id, old_amount: latest.amount, new_amount: newAmount, currency: latest.currency });
    }
  });

  bulkUpdate();
  return results;
}

module.exports = { addSalaryRecord, getLatestSalary, getSalaryHistory, bulkUpdateSalaries };
