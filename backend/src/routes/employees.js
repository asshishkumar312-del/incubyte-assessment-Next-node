// src/routes/employees.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const employeeRepo = require('../repositories/employeeRepository');
const salaryRepo = require('../repositories/salaryRepository');

const router = express.Router();
router.use(authenticateToken);

// GET /api/employees - list with pagination, search, filter, sort
router.get('/', (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = 'last_name', order = 'ASC', search, department, country, employment_type, currency, salary_min, salary_max } = req.query;
    const result = employeeRepo.findAll({
      page: parseInt(page), limit: Math.min(parseInt(limit), 100),
      sort, order, search, department, country, employment_type, currency, salary_min, salary_max
    });
    res.json({ success: true, ...result, total_pages: Math.ceil(result.total / result.limit) });
  } catch (err) { next(err); }
});

// GET /api/employees/meta - distinct values for filters
router.get('/meta', (req, res, next) => {
  try {
    const meta = employeeRepo.getDistinctValues();
    res.json({ success: true, data: meta });
  } catch (err) { next(err); }
});

// GET /api/employees/:id - single employee with salary history
router.get('/:id', (req, res, next) => {
  try {
    const employee = employeeRepo.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (err) { next(err); }
});

// POST /api/employees - create employee
router.post('/', async (req, res, next) => {
  try {
    const required = ['first_name', 'last_name', 'email', 'department', 'job_title', 'country', 'employment_type', 'hire_date', 'salary_amount', 'salary_currency'];
    for (const field of required) {
      if (!req.body[field]) return res.status(400).json({ success: false, message: `${field} is required` });
    }

    const employee_id = employeeRepo.generateEmployeeId();
    const employee = employeeRepo.create({ ...req.body, employee_id });

    // Add initial salary
    salaryRepo.addSalaryRecord({
      employee_id: employee.id,
      amount: Number(req.body.salary_amount),
      currency: req.body.salary_currency,
      effective_date: req.body.hire_date,
      reason: 'Initial salary on joining',
      changed_by: req.user.username
    });

    res.status(201).json({ success: true, message: 'Employee created successfully', data: employeeRepo.findById(employee.id) });
  } catch (err) { next(err); }
});

// PUT /api/employees/:id - update employee info
router.put('/:id', (req, res, next) => {
  try {
    const employee = employeeRepo.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const updated = employeeRepo.update(req.params.id, req.body);
    res.json({ success: true, message: 'Employee updated successfully', data: updated });
  } catch (err) { next(err); }
});

// DELETE /api/employees/:id - soft delete
router.delete('/:id', (req, res, next) => {
  try {
    const deleted = employeeRepo.softDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee deactivated successfully' });
  } catch (err) { next(err); }
});

// POST /api/employees/:id/salary - add salary record
router.post('/:id/salary', (req, res, next) => {
  try {
    const employee = employeeRepo.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const { amount, currency, effective_date, reason } = req.body;
    if (!amount || !currency || !effective_date) {
      return res.status(400).json({ success: false, message: 'amount, currency, and effective_date are required' });
    }

    const salary = salaryRepo.addSalaryRecord({
      employee_id: req.params.id,
      amount: Number(amount),
      currency,
      effective_date,
      reason,
      changed_by: req.user.username
    });

    res.status(201).json({ success: true, message: 'Salary record added', data: salary });
  } catch (err) { next(err); }
});

// POST /api/employees/bulk-update - bulk salary update
router.post('/bulk-update', (req, res, next) => {
  try {
    const { filters = {}, percentage_change, reason } = req.body;
    if (!percentage_change || isNaN(Number(percentage_change))) {
      return res.status(400).json({ success: false, message: 'Valid percentage_change is required' });
    }

    // Get all matching employee IDs
    const allResult = employeeRepo.findAll({ ...filters, page: 1, limit: 10000 });
    const employee_ids = allResult.data.map(e => e.id);

    if (employee_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No employees matched the given filters' });
    }

    const results = salaryRepo.bulkUpdateSalaries({
      employee_ids,
      percentage_change: Number(percentage_change),
      reason,
      changed_by: req.user.username
    });

    res.json({ success: true, message: `Salary updated for ${results.length} employees`, data: results });
  } catch (err) { next(err); }
});

module.exports = router;
