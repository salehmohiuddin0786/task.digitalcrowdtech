const authService = require('./auth.service');
const { apiSuccess, apiError } = require('../../utils/response');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);

      // Set HTTP-only cookie for secure refresh token
      res.cookie('tdc_refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return apiSuccess(res, result, 'Company and account registered successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await authService.login({
        email,
        password,
        userAgent,
        ipAddress,
      });

      res.cookie('tdc_refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return apiSuccess(res, result, 'Logged in successfully.');
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const requestedTenantId = req.headers['x-tenant-id'] || req.query.tenantId;
      const result = await authService.getCurrentSession(req.user.id, requestedTenantId);
      return apiSuccess(res, result, 'Current session retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies?.tdc_refresh_token || req.body?.refreshToken;
      if (!refreshToken) {
        return apiError(res, 'Refresh token required', 401);
      }

      const result = await authService.refreshTokens(refreshToken);

      res.cookie('tdc_refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return apiSuccess(res, result, 'Tokens refreshed successfully.');
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies?.tdc_refresh_token || req.body?.refreshToken;
      await authService.logout(refreshToken);

      res.clearCookie('tdc_refresh_token');
      return apiSuccess(res, null, 'Logged out successfully.');
    } catch (error) {
      next(error);
    }
  }

  async switchTenant(req, res, next) {
    try {
      const { tenantId } = req.body;
      if (!tenantId) {
        return apiError(res, 'Target tenantId is required', 400);
      }

      const result = await authService.getCurrentSession(req.user.id, tenantId);
      return apiSuccess(res, result, 'Switched tenant workspace successfully.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
