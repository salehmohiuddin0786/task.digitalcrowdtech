const { verifyAccessToken } = require('../utils/jwt');
const { apiError } = require('../utils/response');
const prisma = require('../config/prisma');

async function authenticate(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    } else if (req.cookies && req.cookies.tdc_access_token) {
      token = req.cookies.tdc_access_token;
    }

    if (!token) {
      return apiError(res, 'Authentication required. No token provided.', 401);
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return apiError(res, 'Session expired or invalid token. Please log in again.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        isPlatformAdmin: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return apiError(res, 'User account is inactive or not found.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]', error);
    return apiError(res, 'Authentication failed', 401);
  }
}

module.exports = {
  authenticate,
};
