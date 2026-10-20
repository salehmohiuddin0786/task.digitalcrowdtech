const express = require('express');
const reportsController = require('./reports.controller');
const { authenticate } = require('../../middleware/auth');
const { resolveTenant } = require('../../middleware/tenant');

const router = express.Router();

router.use(authenticate);
router.use(resolveTenant);

router.get('/overview', (req, res, next) => reportsController.getOverviewReport(req, res, next));
router.get('/employees', (req, res, next) => reportsController.getEmployeeLeaderboard(req, res, next));
router.get('/export', (req, res, next) => reportsController.exportReportsCSV(req, res, next));

module.exports = router;
