const express = require('express');
const dashboardController = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth');
const { resolveTenant } = require('../../middleware/tenant');

const router = express.Router();

router.use(authenticate);
router.use(resolveTenant);

router.get('/summary', (req, res, next) => dashboardController.getSummary(req, res, next));

module.exports = router;
