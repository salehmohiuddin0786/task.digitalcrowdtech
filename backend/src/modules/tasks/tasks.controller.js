const tasksService = require('./tasks.service');
const recurrenceService = require('./recurrence.service');
const { apiSuccess, apiError } = require('../../utils/response');

class TasksController {
  async getTasks(req, res, next) {
    try {
      const result = await tasksService.getTasks(req.tenant.id, req.user, req.role, req.query);
      return apiSuccess(res, result, 'Tasks retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getMyTasks(req, res, next) {
    try {
      const result = await tasksService.getMyTasks(req.tenant.id, req.user.id, req.query);
      return apiSuccess(res, result, 'Personal assigned tasks retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req, res, next) {
    try {
      const task = await tasksService.getTaskById(req.params.id, req.tenant.id, req.user, req.role);
      return apiSuccess(res, task, 'Task details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async createTask(req, res, next) {
    try {
      const task = await tasksService.createTask(req.tenant.id, req.user.id, req.body);
      return apiSuccess(res, task, 'Task created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req, res, next) {
    try {
      const task = await tasksService.updateTask(req.params.id, req.tenant.id, req.user.id, req.body);
      return apiSuccess(res, task, 'Task updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req, res, next) {
    try {
      await tasksService.deleteTask(req.params.id, req.tenant.id, req.user.id, req.role);
      return apiSuccess(res, null, 'Task deleted successfully.');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const task = await tasksService.updateTaskStatus(
        req.params.id,
        req.tenant.id,
        req.user,
        req.role,
        req.body.status
      );
      return apiSuccess(res, task, 'Task status updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async assignUser(req, res, next) {
    try {
      const { userId } = req.body;
      const assignment = await tasksService.assignUser(req.params.id, req.tenant.id, req.user.id, userId);
      return apiSuccess(res, assignment, 'Staff assigned to task successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async unassignUser(req, res, next) {
    try {
      await tasksService.unassignUser(req.params.id, req.tenant.id, req.user.id, req.params.userId);
      return apiSuccess(res, null, 'Staff unassigned from task.');
    } catch (error) {
      next(error);
    }
  }

  async addChecklistItem(req, res, next) {
    try {
      const { title } = req.body;
      const item = await tasksService.addChecklistItem(req.params.id, req.tenant.id, req.user.id, title);
      return apiSuccess(res, item, 'Checklist item added.', 201);
    } catch (error) {
      next(error);
    }
  }

  async toggleChecklistItem(req, res, next) {
    try {
      const { isCompleted } = req.body;
      const item = await tasksService.toggleChecklistItem(
        req.params.id,
        req.tenant.id,
        req.user.id,
        req.params.itemId,
        isCompleted
      );
      return apiSuccess(res, item, 'Checklist item updated.');
    } catch (error) {
      next(error);
    }
  }

  async deleteChecklistItem(req, res, next) {
    try {
      await tasksService.deleteChecklistItem(req.params.id, req.tenant.id, req.user.id, req.params.itemId);
      return apiSuccess(res, null, 'Checklist item removed.');
    } catch (error) {
      next(error);
    }
  }

  async addComment(req, res, next) {
    try {
      const { content } = req.body;
      const comment = await tasksService.addComment(req.params.id, req.tenant.id, req.user.id, content);
      return apiSuccess(res, comment, 'Comment posted.', 201);
    } catch (error) {
      next(error);
    }
  }

  async getComments(req, res, next) {
    try {
      const comments = await tasksService.getComments(req.params.id, req.tenant.id);
      return apiSuccess(res, comments, 'Task comments retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async getActivityLogs(req, res, next) {
    try {
      const logs = await tasksService.getActivityLogs(req.params.id, req.tenant.id);
      return apiSuccess(res, logs, 'Task activity timeline retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async uploadEvidence(req, res, next) {
    try {
      let fileData = {};
      if (req.file) {
        let detectedType = 'DOCUMENT';
        if (req.file.mimetype.startsWith('image/')) detectedType = 'PHOTO';
        else if (req.file.mimetype.startsWith('video/')) detectedType = 'VIDEO';

        fileData = {
          fileName: req.file.originalname,
          fileUrl: `/uploads/evidence/${req.file.filename}`,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          fileType: req.body.fileType || detectedType,
          caption: req.body.caption,
        };
      } else {
        fileData = {
          fileName: req.body.fileName || 'evidence-file',
          fileUrl: req.body.fileUrl || '/uploads/evidence/sample-evidence.jpg',
          fileSize: req.body.fileSize || 1024,
          mimeType: req.body.mimeType || 'image/jpeg',
          fileType: req.body.fileType || 'PHOTO',
          caption: req.body.caption,
        };
      }

      const evidence = await tasksService.addEvidence(
        req.params.id,
        req.tenant.id,
        req.user.id,
        fileData
      );
      return apiSuccess(res, evidence, 'Evidence proof uploaded successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async getEvidence(req, res, next) {
    try {
      const evidence = await tasksService.getEvidence(req.params.id, req.tenant.id);
      return apiSuccess(res, evidence, 'Task evidence items retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async deleteEvidence(req, res, next) {
    try {
      await tasksService.deleteEvidence(
        req.params.id,
        req.tenant.id,
        req.user.id,
        req.role,
        req.params.evidenceId
      );
      return apiSuccess(res, null, 'Evidence item removed.');
    } catch (error) {
      next(error);
    }
  }

  async submitReview(req, res, next) {
    try {
      const review = await tasksService.submitReview(
        req.params.id,
        req.tenant.id,
        req.user,
        req.role,
        req.body
      );
      return apiSuccess(res, review, 'Task review recorded successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async getReviews(req, res, next) {
    try {
      const reviews = await tasksService.getReviews(req.params.id, req.tenant.id);
      return apiSuccess(res, reviews, 'Task review history retrieved.');
    } catch (error) {
      next(error);
    }
  }

  // Recurrence Management
  async createRecurrenceRule(req, res, next) {
    try {
      const rule = await recurrenceService.createRule(req.tenant.id, req.user.id, req.body);
      return apiSuccess(res, rule, 'Recurrence rule created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async getRecurrenceRules(req, res, next) {
    try {
      const rules = await recurrenceService.getRules(req.tenant.id);
      return apiSuccess(res, rules, 'Recurrence rules retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async updateRecurrenceRule(req, res, next) {
    try {
      const rule = await recurrenceService.updateRule(req.params.ruleId, req.tenant.id, req.body);
      return apiSuccess(res, rule, 'Recurrence rule updated.');
    } catch (error) {
      next(error);
    }
  }

  async deleteRecurrenceRule(req, res, next) {
    try {
      await recurrenceService.deleteRule(req.params.ruleId, req.tenant.id);
      return apiSuccess(res, null, 'Recurrence rule deleted.');
    } catch (error) {
      next(error);
    }
  }

  async generateDueRecurringTasks(req, res, next) {
    try {
      const result = await recurrenceService.generateDueTasks(req.tenant.id, {
        forceAll: req.body?.forceAll || false,
        userId: req.user.id,
      });
      return apiSuccess(res, result, 'Recurring tasks processed.');
    } catch (error) {
      next(error);
    }
  }

  // Dependencies
  async addDependency(req, res, next) {
    try {
      const { prerequisiteTaskId } = req.body;
      const dep = await tasksService.addDependency(
        req.params.id,
        req.tenant.id,
        req.user.id,
        prerequisiteTaskId
      );
      return apiSuccess(res, dep, 'Prerequisite task dependency added.', 201);
    } catch (error) {
      next(error);
    }
  }

  async removeDependency(req, res, next) {
    try {
      await tasksService.removeDependency(
        req.params.id,
        req.tenant.id,
        req.user.id,
        req.params.prereqId
      );
      return apiSuccess(res, null, 'Prerequisite task dependency removed.');
    } catch (error) {
      next(error);
    }
  }

  async overrideDependency(req, res, next) {
    try {
      const { overrideReason } = req.body;
      const dep = await tasksService.overrideDependency(
        req.params.id,
        req.tenant.id,
        req.user.id,
        req.role,
        req.params.prereqId,
        overrideReason
      );
      return apiSuccess(res, dep, 'Prerequisite dependency successfully overridden.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TasksController();
