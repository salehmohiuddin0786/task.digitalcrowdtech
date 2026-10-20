const tasksService = require('./tasks.service');
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
}

module.exports = new TasksController();
