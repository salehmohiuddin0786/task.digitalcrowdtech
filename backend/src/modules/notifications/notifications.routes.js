const express = require('express');
const prisma = require('../../config/prisma');
const { apiSuccess, apiError } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { resolveTenant } = require('../../middleware/tenant');

const router = express.Router();

router.use(authenticate);
router.use(resolveTenant);

// List notifications
router.get('/', async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        tenantId: req.tenant.id,
        userId: req.user.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        tenantId: req.tenant.id,
        userId: req.user.id,
        isRead: false,
      },
    });

    return apiSuccess(res, { notifications, unreadCount }, 'Notifications retrieved.');
  } catch (error) {
    next(error);
  }
});

// Mark single as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await prisma.notification.updateMany({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id,
        userId: req.user.id,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return apiSuccess(res, notification, 'Notification marked as read.');
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.post('/mark-all-read', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        tenantId: req.tenant.id,
        userId: req.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return apiSuccess(res, null, 'All notifications marked as read.');
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.notification.deleteMany({
      where: {
        id: req.params.id,
        tenantId: req.tenant.id,
        userId: req.user.id,
      },
    });

    return apiSuccess(res, null, 'Notification removed.');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
