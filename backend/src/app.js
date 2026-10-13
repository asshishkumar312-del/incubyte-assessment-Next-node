// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { runMigrations } = require('./database/migrate');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/export');

const app = express();

// Run DB migrations on startup
runMigrations();

// Security & Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = [
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(s => s.trim()) : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or matching origins
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.render.com') ||
      origin.endsWith('.railway.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'EMS API is running', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
