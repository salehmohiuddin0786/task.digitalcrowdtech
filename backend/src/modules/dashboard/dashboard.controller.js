const dashboardService = require('./dashboard.service');
const { apiSuccess } = require('../../utils/response');

class DashboardController {
  async getSummary(req, res, next) {
    try {
      const tenantId = req.tenant.id;
      const branchId = req.query.branchId || null;

      const summary = await dashboardService.getMetrics(tenantId, req.user, req.role, branchId);
      return apiSuccess(res, summary, 'Dashboard summary loaded successfully.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
