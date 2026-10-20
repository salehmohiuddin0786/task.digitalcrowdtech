const express = require('express');
const { z } = require('zod');
const tasksController = require('./tasks.controller');
const { authenticate } = require('../../middleware/auth');
const { resolveTenant, requirePermission } = require('../../middleware/tenant');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(authenticate);
router.use(resolveTenant);

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Task title is required'),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
    category: z.string().optional(),
    branchId: z.string().optional(),
    teamId: z.string().optional(),
    dueDate: z.string().optional(),
    startDate: z.string().optional(),
    requiresProof: z.boolean().optional(),
    proofType: z.enum(['PHOTO', 'VIDEO', 'BOTH', 'OPTIONAL']).optional(),
    assigneeIds: z.array(z.string()).optional(),
    checklistItems: z.array(z.string()).optional(),
  }),
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'CHANGES_REQUESTED', 'COMPLETED', 'CANCELLED']),
  }),
});

router.get('/', (req, res, next) => tasksController.getTasks(req, res, next));
router.get('/:id', (req, res, next) => tasksController.getTaskById(req, res, next));
router.post('/', requirePermission('tasks.create'), validate(createTaskSchema), (req, res, next) =>
  tasksController.createTask(req, res, next)
);
router.patch('/:id/status', validate(updateStatusSchema), (req, res, next) =>
  tasksController.updateStatus(req, res, next)
);

module.exports = router;
