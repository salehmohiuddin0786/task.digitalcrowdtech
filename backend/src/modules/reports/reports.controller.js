const reportsService = require('./reports.service');
const { apiSuccess } = require('../../utils/response');

class ReportsController {
  async getOverviewReport(req, res, next) {
    try {
      const data = await reportsService.getOverviewReport(req.tenant.id, req.query);
      return apiSuccess(res, data, 'Overview analytics report retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeLeaderboard(req, res, next) {
    try {
      const data = await reportsService.getEmployeeLeaderboard(req.tenant.id, req.query);
      return apiSuccess(res, data, 'Employee performance leaderboard retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async exportReportsCSV(req, res, next) {
    try {
      const csv = await reportsService.exportReportsCSV(req.tenant.id);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="taskdigitalcrowd-report-${Date.now()}.csv"`);
      return res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportsController();
