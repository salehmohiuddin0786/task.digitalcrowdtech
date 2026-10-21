const express = require('express');
const { z } = require('zod');
const tasksController = require('./tasks.controller');
const { authenticate } = require('../../middleware/auth');
const { resolveTenant, requirePermission } = require('../../middleware/tenant');
const validate = require('../../middleware/validate');

const { uploadEvidence } = require('../../middleware/upload');

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

const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
    category: z.string().optional().nullable(),
    branchId: z.string().optional().nullable(),
    teamId: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    requiresProof: z.boolean().optional(),
    proofType: z.enum(['PHOTO', 'VIDEO', 'BOTH', 'OPTIONAL']).optional().nullable(),
  }),
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'CHANGES_REQUESTED', 'COMPLETED', 'CANCELLED']),
  }),
});

const assignUserSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'Target userId is required'),
  }),
});

const addChecklistSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Checklist item title is required'),
  }),
});

const toggleChecklistSchema = z.object({
  body: z.object({
    isCompleted: z.boolean(),
  }),
});

const addCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment content cannot be empty'),
  }),
});

const reviewSchema = z.object({
  body: z.object({
    decision: z.enum(['APPROVED', 'CHANGES_REQUESTED']),
    feedback: z.string().optional(),
  }),
});

const recurrenceSchema = z.object({
  body: z.object({
    frequency: z.enum(['DAILY', 'WEEKDAYS', 'WEEKLY', 'MONTHLY', 'CUSTOM']),
    intervalDays: z.number().optional(),
    daysOfWeek: z.string().optional(),
    dayOfMonth: z.number().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional().nullable(),
    titleTemplate: z.string().min(2, 'Title template is required'),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
    branchId: z.string().optional().nullable(),
    teamId: z.string().optional().nullable(),
  }),
});

// Collection routes
router.get('/categories', requirePermission('tasks.view'), (req, res, next) => tasksController.getCategories(req, res, next));
router.get('/', requirePermission('tasks.view'), (req, res, next) => tasksController.getTasks(req, res, next));
router.get('/my-tasks', requirePermission('tasks.view'), (req, res, next) => tasksController.getMyTasks(req, res, next));
router.post('/', requirePermission('tasks.create'), validate(createTaskSchema), (req, res, next) =>
  tasksController.createTask(req, res, next)
);

// Recurrence Routes
router.get('/recurrence', requirePermission('tasks.view'), (req, res, next) => tasksController.getRecurrenceRules(req, res, next));
router.get('/recurrence/rules', requirePermission('tasks.view'), (req, res, next) => tasksController.getRecurrenceRules(req, res, next));
router.post(
  '/recurrence',
  requirePermission('tasks.create'),
  validate(recurrenceSchema),
  (req, res, next) => tasksController.createRecurrenceRule(req, res, next)
);
router.post(
  '/recurrence/rules',
  requirePermission('tasks.create'),
  validate(recurrenceSchema),
  (req, res, next) => tasksController.createRecurrenceRule(req, res, next)
);
router.patch('/recurrence/:ruleId', requirePermission('tasks.edit'), (req, res, next) =>
  tasksController.updateRecurrenceRule(req, res, next)
);
router.delete('/recurrence/:ruleId', requirePermission('tasks.delete'), (req, res, next) =>
  tasksController.deleteRecurrenceRule(req, res, next)
);
router.post('/recurrence/generate', requirePermission('tasks.create'), (req, res, next) =>
  tasksController.generateDueRecurringTasks(req, res, next)
);

// Single task item routes
router.get('/:id', requirePermission('tasks.view'), (req, res, next) => tasksController.getTaskById(req, res, next));
router.patch(
  '/:id',
  requirePermission('tasks.edit'),
  validate(updateTaskSchema),
  (req, res, next) => tasksController.updateTask(req, res, next)
);
router.delete(
  '/:id',
  requirePermission('tasks.delete'),
  (req, res, next) => tasksController.deleteTask(req, res, next)
);
router.patch('/:id/status', validate(updateStatusSchema), (req, res, next) =>
  tasksController.updateStatus(req, res, next)
);

// Assignments
router.post(
  '/:id/assignments',
  requirePermission('tasks.assign'),
  validate(assignUserSchema),
  (req, res, next) => tasksController.assignUser(req, res, next)
);
router.delete(
  '/:id/assignments/:userId',
  requirePermission('tasks.assign'),
  (req, res, next) => tasksController.unassignUser(req, res, next)
);

// Checklists
router.post('/:id/checklists', validate(addChecklistSchema), (req, res, next) =>
  tasksController.addChecklistItem(req, res, next)
);
router.patch('/:id/checklists/:itemId', validate(toggleChecklistSchema), (req, res, next) =>
  tasksController.toggleChecklistItem(req, res, next)
);
router.delete('/:id/checklists/:itemId', requirePermission('tasks.edit'), (req, res, next) =>
  tasksController.deleteChecklistItem(req, res, next)
);

// Comments & Activity
router.post('/:id/comments', validate(addCommentSchema), (req, res, next) =>
  tasksController.addComment(req, res, next)
);
router.get('/:id/comments', requirePermission('tasks.view'), (req, res, next) => tasksController.getComments(req, res, next));
router.get('/:id/activity', requirePermission('tasks.view'), (req, res, next) => tasksController.getActivityLogs(req, res, next));

// Evidence & Proof of Execution
router.post(
  '/:id/evidence',
  (req, res, next) => {
    uploadEvidence.single('file')(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  },
  (req, res, next) => tasksController.uploadEvidence(req, res, next)
);
router.get('/:id/evidence', requirePermission('tasks.view'), (req, res, next) => tasksController.getEvidence(req, res, next));
router.delete('/:id/evidence/:evidenceId', (req, res, next) =>
  tasksController.deleteEvidence(req, res, next)
);

// Reviews & Approvals
router.post(
  '/:id/reviews',
  requirePermission('tasks.review'),
  validate(reviewSchema),
  (req, res, next) => tasksController.submitReview(req, res, next)
);
router.get('/:id/reviews', requirePermission('tasks.view'), (req, res, next) => tasksController.getReviews(req, res, next));

// Task Dependencies
const addDependencySchema = z.object({
  body: z.object({
    prerequisiteTaskId: z.string().min(1, 'Prerequisite task ID is required'),
  }),
});

const overrideDependencySchema = z.object({
  body: z.object({
    overrideReason: z.string().min(2, 'Override reason is required'),
  }),
});

router.post('/:id/dependencies', requirePermission('tasks.edit'), validate(addDependencySchema), (req, res, next) =>
  tasksController.addDependency(req, res, next)
);
router.delete('/:id/dependencies/:prereqId', requirePermission('tasks.edit'), (req, res, next) =>
  tasksController.removeDependency(req, res, next)
);
router.post(
  '/:id/dependencies/:prereqId/override',
  requirePermission('tasks.review'),
  validate(overrideDependencySchema),
  (req, res, next) => tasksController.overrideDependency(req, res, next)
);

module.exports = router;
