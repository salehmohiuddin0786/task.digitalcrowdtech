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

// Collection routes
router.get('/', (req, res, next) => tasksController.getTasks(req, res, next));
router.get('/my-tasks', (req, res, next) => tasksController.getMyTasks(req, res, next));
router.post('/', requirePermission('tasks.create'), validate(createTaskSchema), (req, res, next) =>
  tasksController.createTask(req, res, next)
);

// Single task item routes
router.get('/:id', (req, res, next) => tasksController.getTaskById(req, res, next));
router.patch('/:id', validate(updateTaskSchema), (req, res, next) => tasksController.updateTask(req, res, next));
router.delete('/:id', (req, res, next) => tasksController.deleteTask(req, res, next));
router.patch('/:id/status', validate(updateStatusSchema), (req, res, next) =>
  tasksController.updateStatus(req, res, next)
);

// Assignments
router.post('/:id/assignments', validate(assignUserSchema), (req, res, next) =>
  tasksController.assignUser(req, res, next)
);
router.delete('/:id/assignments/:userId', (req, res, next) =>
  tasksController.unassignUser(req, res, next)
);

// Checklists
router.post('/:id/checklists', validate(addChecklistSchema), (req, res, next) =>
  tasksController.addChecklistItem(req, res, next)
);
router.patch('/:id/checklists/:itemId', validate(toggleChecklistSchema), (req, res, next) =>
  tasksController.toggleChecklistItem(req, res, next)
);
router.delete('/:id/checklists/:itemId', (req, res, next) =>
  tasksController.deleteChecklistItem(req, res, next)
);

// Comments & Activity
router.post('/:id/comments', validate(addCommentSchema), (req, res, next) =>
  tasksController.addComment(req, res, next)
);
router.get('/:id/comments', (req, res, next) => tasksController.getComments(req, res, next));
router.get('/:id/activity', (req, res, next) => tasksController.getActivityLogs(req, res, next));

module.exports = router;
