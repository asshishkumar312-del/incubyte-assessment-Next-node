// src/routes/analytics.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const analyticsRepo = require('../repositories/analyticsRepository');

const router = express.Router();
router.use(authenticateToken);

router.get('/summary', (req, res, next) => {
  try {
    const { currency = 'USD' } = req.query;
    const data = analyticsRepo.getOverviewStats(currency);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/by-department', (req, res, next) => {
  try {
    const { currency = 'USD' } = req.query;
    const data = analyticsRepo.getSalaryByDepartment(currency);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/by-country', (req, res, next) => {
  try {
    const { currency = 'USD' } = req.query;
    const data = analyticsRepo.getSalaryByCountry(currency);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/distribution', (req, res, next) => {
  try {
    const { currency = 'USD', buckets = 10 } = req.query;
    const data = analyticsRepo.getSalaryDistribution(currency, parseInt(buckets));
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/top-earners', (req, res, next) => {
  try {
    const { currency = 'USD', limit = 10 } = req.query;
    const data = analyticsRepo.getTopEarners(parseInt(limit), currency);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/exchange-rates', (req, res, next) => {
  try {
    const rates = analyticsRepo.getExchangeRates();
    res.json({ success: true, data: rates });
  } catch (err) { next(err); }
});

module.exports = router;
