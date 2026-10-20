const express = require('express');
const { z } = require('zod');
const authController = require('./auth.controller');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');

const router = express.Router();

const registerSchema = z.object({
  body: z.object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid business email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    phone: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const switchTenantSchema = z.object({
  body: z.object({
    tenantId: z.string().uuid('Invalid tenant identifier format'),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().optional(),
    avatarUrl: z.string().url().optional().or(z.literal('')),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
  }),
});

router.post('/register', validate(registerSchema), (req, res, next) => authController.register(req, res, next));
router.post('/login', validate(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));
router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));
router.post('/switch-tenant', authenticate, validate(switchTenantSchema), (req, res, next) =>
  authController.switchTenant(req, res, next)
);
router.get('/sessions', authenticate, (req, res, next) => authController.getSessions(req, res, next));
router.delete('/sessions/:sessionId', authenticate, (req, res, next) => authController.revokeSession(req, res, next));
router.patch('/profile', authenticate, validate(updateProfileSchema), (req, res, next) =>
  authController.updateProfile(req, res, next)
);
router.post('/change-password', authenticate, validate(changePasswordSchema), (req, res, next) =>
  authController.changePassword(req, res, next)
);

module.exports = router;
