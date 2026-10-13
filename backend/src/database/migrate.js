// src/database/migrate.js
const { getDb } = require('./db');

function runMigrations() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      employee_id TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      job_title TEXT NOT NULL,
      country TEXT NOT NULL,
      employment_type TEXT NOT NULL CHECK(employment_type IN ('Full-time', 'Part-time', 'Contract')),
      gender TEXT CHECK(gender IN ('Male', 'Female', 'Non-binary', 'Prefer not to say')),
      hire_date DATE NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salaries (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      effective_date DATE NOT NULL,
      reason TEXT,
      changed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exchange_rates (
      currency TEXT PRIMARY KEY,
      rate_to_usd REAL NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
    CREATE INDEX IF NOT EXISTS idx_employees_country ON employees(country);
    CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);
    CREATE INDEX IF NOT EXISTS idx_salaries_employee_id ON salaries(employee_id);
    CREATE INDEX IF NOT EXISTS idx_salaries_effective_date ON salaries(effective_date);
  `);

  console.log('✅ Database migrations completed');
}

module.exports = { runMigrations };
