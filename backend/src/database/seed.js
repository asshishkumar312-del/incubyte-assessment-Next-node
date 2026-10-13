// src/database/seed.js
const { getDb } = require('./db');
const { runMigrations } = require('./migrate');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Marketing', 'Sales',
  'Finance', 'HR', 'Operations', 'Legal', 'Customer Success',
  'Data Science', 'DevOps', 'Security', 'Research', 'Administration'
];

const JOB_TITLES = {
  Engineering: ['Software Engineer I', 'Software Engineer II', 'Senior Software Engineer', 'Staff Engineer', 'Principal Engineer', 'Engineering Manager', 'VP of Engineering'],
  Product: ['Product Manager', 'Senior Product Manager', 'Principal Product Manager', 'Director of Product', 'VP of Product'],
  Design: ['UI Designer', 'UX Designer', 'Senior Designer', 'Lead Designer', 'Design Manager', 'Head of Design'],
  Marketing: ['Marketing Analyst', 'Content Strategist', 'SEO Specialist', 'Marketing Manager', 'Director of Marketing'],
  Sales: ['Sales Representative', 'Account Executive', 'Senior Account Executive', 'Sales Manager', 'Director of Sales', 'VP of Sales'],
  Finance: ['Financial Analyst', 'Senior Financial Analyst', 'Finance Manager', 'Controller', 'CFO'],
  HR: ['HR Coordinator', 'HR Business Partner', 'Talent Acquisition Specialist', 'HR Manager', 'CHRO'],
  Operations: ['Operations Analyst', 'Operations Manager', 'Director of Operations', 'COO'],
  Legal: ['Legal Counsel', 'Senior Legal Counsel', 'General Counsel'],
  'Customer Success': ['Customer Success Manager', 'Senior CSM', 'Head of Customer Success'],
  'Data Science': ['Data Analyst', 'Data Scientist', 'Senior Data Scientist', 'ML Engineer', 'Head of Data'],
  DevOps: ['DevOps Engineer', 'Senior DevOps Engineer', 'SRE', 'Cloud Architect', 'Head of Infrastructure'],
  Security: ['Security Analyst', 'Security Engineer', 'Senior Security Engineer', 'CISO'],
  Research: ['Research Analyst', 'Research Scientist', 'Senior Research Scientist', 'Research Director'],
  Administration: ['Executive Assistant', 'Office Manager', 'Administrative Coordinator', 'Chief of Staff']
};

const COUNTRIES = [
  { name: 'United States', currency: 'USD', salaryMin: 60000, salaryMax: 280000 },
  { name: 'United Kingdom', currency: 'GBP', salaryMin: 40000, salaryMax: 180000 },
  { name: 'India', currency: 'INR', salaryMin: 800000, salaryMax: 5000000 },
  { name: 'Germany', currency: 'EUR', salaryMin: 45000, salaryMax: 180000 },
  { name: 'Canada', currency: 'CAD', salaryMin: 55000, salaryMax: 200000 },
  { name: 'Australia', currency: 'AUD', salaryMin: 65000, salaryMax: 220000 },
  { name: 'Singapore', currency: 'SGD', salaryMin: 60000, salaryMax: 240000 },
  { name: 'Japan', currency: 'JPY', salaryMin: 5000000, salaryMax: 20000000 },
  { name: 'Netherlands', currency: 'EUR', salaryMin: 45000, salaryMax: 170000 },
  { name: 'France', currency: 'EUR', salaryMin: 40000, salaryMax: 160000 },
  { name: 'Brazil', currency: 'BRL', salaryMin: 80000, salaryMax: 400000 },
  { name: 'Mexico', currency: 'MXN', salaryMin: 300000, salaryMax: 1500000 },
  { name: 'Poland', currency: 'PLN', salaryMin: 80000, salaryMax: 350000 },
  { name: 'Ukraine', currency: 'USD', salaryMin: 30000, salaryMax: 120000 },
  { name: 'Romania', currency: 'EUR', salaryMin: 25000, salaryMax: 100000 }
];

const EXCHANGE_RATES = [
  { currency: 'USD', rate_to_usd: 1.0 },
  { currency: 'GBP', rate_to_usd: 1.27 },
  { currency: 'INR', rate_to_usd: 0.012 },
  { currency: 'EUR', rate_to_usd: 1.09 },
  { currency: 'CAD', rate_to_usd: 0.74 },
  { currency: 'AUD', rate_to_usd: 0.65 },
  { currency: 'SGD', rate_to_usd: 0.75 },
  { currency: 'JPY', rate_to_usd: 0.0067 },
  { currency: 'BRL', rate_to_usd: 0.20 },
  { currency: 'MXN', rate_to_usd: 0.058 },
  { currency: 'PLN', rate_to_usd: 0.25 }
];

const EMPLOYMENT_TYPES = ['Full-time', 'Full-time', 'Full-time', 'Full-time', 'Part-time', 'Contract'];
const GENDERS = ['Male', 'Female', 'Female', 'Male', 'Non-binary', 'Prefer not to say'];
const FIRST_NAMES_MALE = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Rahul', 'Arjun', 'Vikram', 'Amit', 'Suresh', 'Hans', 'Klaus', 'Luca', 'Pierre', 'Carlos', 'Wei', 'Jin', 'Takeshi', 'Ravi', 'Sanjay', 'Alex', 'Ethan', 'Noah', 'Liam', 'Mason', 'Oliver', 'Lucas', 'Aiden', 'Elijah', 'Jackson'];
const FIRST_NAMES_FEMALE = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Priya', 'Ananya', 'Meera', 'Divya', 'Anjali', 'Sophia', 'Emma', 'Olivia', 'Ava', 'Isabella', 'Yuki', 'Mei', 'Fatima', 'Aisha', 'Layla', 'Zoe', 'Chloe', 'Lily', 'Emily', 'Hannah', 'Amara', 'Nadia', 'Elena', 'Anna', 'Maria'];
const FIRST_NAMES_NB = ['Jordan', 'Alex', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'River'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Sharma', 'Kumar', 'Singh', 'Patel', 'Gupta', 'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Tanaka', 'Suzuki', 'Watanabe', 'Sato', 'Yamamoto', 'Pereira', 'Santos', 'Oliveira', 'Costa', 'Ferreira', 'Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

function getFirstName(gender) {
  if (gender === 'Male') return randomFrom(FIRST_NAMES_MALE);
  if (gender === 'Female') return randomFrom(FIRST_NAMES_FEMALE);
  return randomFrom(FIRST_NAMES_NB);
}

async function seed() {
  runMigrations();
  const db = getDb();

  // Seed exchange rates
  const insertRate = db.prepare(`INSERT OR REPLACE INTO exchange_rates (currency, rate_to_usd) VALUES (?, ?)`);
  const seedRates = db.transaction(() => {
    for (const rate of EXCHANGE_RATES) {
      insertRate.run(rate.currency, rate.rate_to_usd);
    }
  });
  seedRates();
  console.log('✅ Exchange rates seeded');

  // Seed HR Manager user
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existingUser) {
    const passwordHash = await bcrypt.hash('Admin@123', 12);
    db.prepare(`INSERT INTO users (id, username, password_hash, full_name) VALUES (?, ?, ?, ?)`)
      .run(uuidv4(), 'admin', passwordHash, 'HR Manager');
    console.log('✅ Admin user created (username: admin, password: Admin@123)');
  }

  // Check if employees already seeded
  const count = db.prepare('SELECT COUNT(*) as count FROM employees').get();
  if (count.count >= 10000) {
    console.log('✅ Employees already seeded, skipping...');
    return;
  }

  console.log('🌱 Seeding 10,000 employees...');

  const insertEmployee = db.prepare(`
    INSERT INTO employees (id, employee_id, first_name, last_name, email, department, job_title, country, employment_type, gender, hire_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSalary = db.prepare(`
    INSERT INTO salaries (id, employee_id, amount, currency, effective_date, reason, changed_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const emailSet = new Set();

  const seedEmployees = db.transaction(() => {
    for (let i = 1; i <= 10000; i++) {
      const gender = randomFrom(GENDERS);
      const firstName = getFirstName(gender);
      const lastName = randomFrom(LAST_NAMES);
      const department = randomFrom(DEPARTMENTS);
      const titles = JOB_TITLES[department];
      const jobTitle = randomFrom(titles);
      const country = randomFrom(COUNTRIES);
      const employmentType = randomFrom(EMPLOYMENT_TYPES);
      const hireDate = randomDate(new Date('2015-01-01'), new Date('2025-06-30'));

      // Generate unique email
      let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@acme.com`;
      while (emailSet.has(email)) {
        email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}_${randomInt(1, 999)}@acme.com`;
      }
      emailSet.add(email);

      const empId = uuidv4();
      const employeeId = `EMP${String(i).padStart(5, '0')}`;

      insertEmployee.run(empId, employeeId, firstName, lastName, email, department, jobTitle, country.name, employmentType, gender, hireDate);

      // Initial salary
      const salaryAmount = randomInt(country.salaryMin, country.salaryMax);
      insertSalary.run(uuidv4(), empId, salaryAmount, country.currency, hireDate, 'Initial salary on joining', 'System');

      // ~30% employees have had 1-2 salary revisions
      if (Math.random() < 0.3) {
        const revisedAmount = Math.round(salaryAmount * (1 + randomInt(5, 20) / 100));
        const revisionDate = randomDate(new Date(hireDate), new Date('2026-01-01'));
        if (revisionDate > hireDate) {
          insertSalary.run(uuidv4(), empId, revisedAmount, country.currency, revisionDate, 'Annual performance review', 'admin');
        }
      }

      if (i % 1000 === 0) {
        console.log(`  → Seeded ${i}/10000 employees...`);
      }
    }
  });

  seedEmployees();
  console.log('✅ 10,000 employees seeded successfully!');
}

seed().catch(console.error);
