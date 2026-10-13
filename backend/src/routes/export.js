// src/routes/export.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const employeeRepo = require('../repositories/employeeRepository');

const router = express.Router();
router.use(authenticateToken);

router.get('/csv', (req, res, next) => {
  try {
    const { search, department, country, employment_type, currency, salary_min, salary_max } = req.query;
    const result = employeeRepo.findAll({
      page: 1, limit: 10000,
      search, department, country, employment_type, currency, salary_min, salary_max
    });

    const headers = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Department', 'Job Title', 'Country', 'Employment Type', 'Gender', 'Hire Date', 'Current Salary', 'Salary Currency'];
    const rows = result.data.map(e => [
      e.employee_id, e.first_name, e.last_name, e.email,
      e.department, e.job_title, e.country, e.employment_type,
      e.gender || '', e.hire_date,
      e.current_salary || '', e.salary_currency || ''
    ]);

    const csv = [headers, ...rows].map(row =>
      row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const filename = `ems-employees-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) { next(err); }
});

module.exports = router;
