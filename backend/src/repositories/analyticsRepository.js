// src/repositories/analyticsRepository.js
const { getDb } = require('../database/db');

const DEFAULT_RATES = {
  USD: 1.0,
  GBP: 1.27,
  INR: 0.012,
  EUR: 1.09,
  CAD: 0.74,
  AUD: 0.65,
  SGD: 0.75,
  JPY: 0.0067,
  BRL: 0.20,
  MXN: 0.058,
  PLN: 0.25
};

function getExchangeRates() {
  const db = getDb();
  try {
    const rates = db.prepare(`SELECT currency, rate_to_usd FROM exchange_rates`).all();
    if (rates && rates.length > 0) {
      return rates.reduce((acc, r) => { acc[r.currency] = r.rate_to_usd; return acc; }, {});
    }
  } catch (err) {
    // fallback if table does not exist
  }
  return { ...DEFAULT_RATES };
}

function getOverviewStats(base_currency = 'USD') {
  const db = getDb();
  const rates = getExchangeRates();
  const baseRate = rates[base_currency] || 1;

  const employees = db.prepare(`
    SELECT e.id, e.gender, e.employment_type, s.amount, s.currency
    FROM employees e
    INNER JOIN (
      SELECT s1.employee_id, s1.amount, s1.currency
      FROM salaries s1
      WHERE s1.id = (
        SELECT s2.id FROM salaries s2
        WHERE s2.employee_id = s1.employee_id
        ORDER BY s2.effective_date DESC, s2.created_at DESC
        LIMIT 1
      )
    ) s ON s.employee_id = e.id
    WHERE e.is_active = 1
  `).all();

  const salariesUSD = employees.map(e => {
    const rate = rates[e.currency] || 1;
    return (e.amount * rate) / baseRate;
  });

  const sorted = [...salariesUSD].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  const totalPayroll = salariesUSD.reduce((a, b) => a + b, 0);
  const avgSalary = totalPayroll / salariesUSD.length;

  const byGender = {};
  employees.forEach((e, i) => {
    if (!byGender[e.gender]) byGender[e.gender] = { count: 0, total: 0 };
    byGender[e.gender].count++;
    byGender[e.gender].total += salariesUSD[i];
  });

  const byEmploymentType = {};
  employees.forEach(e => {
    byEmploymentType[e.employment_type] = (byEmploymentType[e.employment_type] || 0) + 1;
  });

  return {
    total_employees: employees.length,
    total_payroll: Math.round(totalPayroll),
    avg_salary: Math.round(avgSalary),
    median_salary: Math.round(median),
    currency: base_currency,
    by_gender: byGender,
    by_employment_type: byEmploymentType
  };
}

function getSalaryByDepartment(base_currency = 'USD') {
  const db = getDb();
  const rates = getExchangeRates();
  const baseRate = rates[base_currency] || 1;

  const rows = db.prepare(`
    SELECT e.department, s.amount, s.currency, COUNT(*) OVER (PARTITION BY e.department) as headcount
    FROM employees e
    INNER JOIN (
      SELECT s1.employee_id, s1.amount, s1.currency
      FROM salaries s1
      WHERE s1.id = (
        SELECT s2.id FROM salaries s2
        WHERE s2.employee_id = s1.employee_id
        ORDER BY s2.effective_date DESC, s2.created_at DESC
        LIMIT 1
      )
    ) s ON s.employee_id = e.id
    WHERE e.is_active = 1
    ORDER BY e.department
  `).all();

  const deptMap = {};
  rows.forEach(r => {
    if (!deptMap[r.department]) {
      deptMap[r.department] = { total: 0, count: 0, headcount: r.headcount };
    }
    const rate = rates[r.currency] || 1;
    deptMap[r.department].total += (r.amount * rate) / baseRate;
    deptMap[r.department].count++;
  });

  return Object.entries(deptMap).map(([dept, val]) => ({
    department: dept,
    avg_salary: Math.round(val.total / val.count),
    headcount: val.headcount,
    currency: base_currency
  })).sort((a, b) => b.avg_salary - a.avg_salary);
}

function getSalaryByCountry(base_currency = 'USD') {
  const db = getDb();
  const rates = getExchangeRates();
  const baseRate = rates[base_currency] || 1;

  const rows = db.prepare(`
    SELECT e.country, s.amount, s.currency
    FROM employees e
    INNER JOIN (
      SELECT s1.employee_id, s1.amount, s1.currency
      FROM salaries s1
      WHERE s1.id = (
        SELECT s2.id FROM salaries s2
        WHERE s2.employee_id = s1.employee_id
        ORDER BY s2.effective_date DESC, s2.created_at DESC
        LIMIT 1
      )
    ) s ON s.employee_id = e.id
    WHERE e.is_active = 1
  `).all();

  const countryMap = {};
  rows.forEach(r => {
    if (!countryMap[r.country]) countryMap[r.country] = { total: 0, count: 0, native_currency: r.currency };
    const rate = rates[r.currency] || 1;
    countryMap[r.country].total += (r.amount * rate) / baseRate;
    countryMap[r.country].count++;
  });

  return Object.entries(countryMap).map(([country, val]) => ({
    country,
    avg_salary: Math.round(val.total / val.count),
    headcount: val.count,
    currency: base_currency
  })).sort((a, b) => b.avg_salary - a.avg_salary);
}

function getSalaryDistribution(base_currency = 'USD', buckets = 10) {
  const db = getDb();
  const rates = getExchangeRates();
  const baseRate = rates[base_currency] || 1;

  const rows = db.prepare(`
    SELECT s.amount, s.currency
    FROM employees e
    INNER JOIN (
      SELECT s1.employee_id, s1.amount, s1.currency
      FROM salaries s1
      WHERE s1.id = (
        SELECT s2.id FROM salaries s2
        WHERE s2.employee_id = s1.employee_id
        ORDER BY s2.effective_date DESC, s2.created_at DESC
        LIMIT 1
      )
    ) s ON s.employee_id = e.id
    WHERE e.is_active = 1
  `).all();

  const salariesUSD = rows.map(r => {
    const rate = rates[r.currency] || 1;
    return (r.amount * rate) / baseRate;
  });

  const min = Math.min(...salariesUSD);
  const max = Math.max(...salariesUSD);
  const step = (max - min) / buckets;

  const distribution = Array.from({ length: buckets }, (_, i) => ({
    range_start: Math.round(min + i * step),
    range_end: Math.round(min + (i + 1) * step),
    label: `${formatCurrency(Math.round(min + i * step), base_currency)} - ${formatCurrency(Math.round(min + (i + 1) * step), base_currency)}`,
    count: 0
  }));

  salariesUSD.forEach(s => {
    const idx = Math.min(Math.floor((s - min) / step), buckets - 1);
    distribution[idx].count++;
  });

  return distribution;
}

function getTopEarners(limit = 10, base_currency = 'USD') {
  const db = getDb();
  const rates = getExchangeRates();
  const baseRate = rates[base_currency] || 1;

  const rows = db.prepare(`
    SELECT e.id, e.employee_id, e.first_name, e.last_name, e.department, e.job_title, e.country, s.amount, s.currency
    FROM employees e
    INNER JOIN (
      SELECT s1.employee_id, s1.amount, s1.currency
      FROM salaries s1
      WHERE s1.id = (
        SELECT s2.id FROM salaries s2
        WHERE s2.employee_id = s1.employee_id
        ORDER BY s2.effective_date DESC, s2.created_at DESC
        LIMIT 1
      )
    ) s ON s.employee_id = e.id
    WHERE e.is_active = 1
  `).all();

  return rows
    .map(r => ({
      ...r,
      salary_usd: (r.amount * (rates[r.currency] || 1)) / baseRate
    }))
    .sort((a, b) => b.salary_usd - a.salary_usd)
    .slice(0, limit)
    .map(r => ({ ...r, salary_in_base: Math.round(r.salary_usd), currency: base_currency }));
}

function formatCurrency(val, currency) {
  const symbols = { USD: '$', GBP: '£', EUR: '€', INR: '₹', JPY: '¥', CAD: 'CA$', AUD: 'AU$', SGD: 'S$', BRL: 'R$', MXN: 'MX$', PLN: 'PLN' };
  const sym = symbols[currency] || currency;
  if (val >= 1000000) return `${sym}${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${sym}${(val / 1000).toFixed(0)}K`;
  return `${sym}${val}`;
}

module.exports = { getOverviewStats, getSalaryByDepartment, getSalaryByCountry, getSalaryDistribution, getTopEarners, getExchangeRates };
