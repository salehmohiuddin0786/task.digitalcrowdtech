const express = require('express');
const reportsController = require('./reports.controller');
const { authenticate } = require('../../middleware/auth');
const { resolveTenant, requirePermission } = require('../../middleware/tenant');

const router = express.Router();

router.use(authenticate);
router.use(resolveTenant);

router.get('/overview', requirePermission('reports.view'), (req, res, next) =>
  reportsController.getOverviewReport(req, res, next)
);
router.get('/employees', requirePermission('reports.view'), (req, res, next) =>
  reportsController.getEmployeeLeaderboard(req, res, next)
);
router.get('/export', requirePermission('reports.export'), (req, res, next) =>
  reportsController.exportReportsCSV(req, res, next)
);

module.exports = router;
