const tasksService = require('./tasks.service');
const { apiSuccess } = require('../../utils/response');

class TasksController {
  async getTasks(req, res, next) {
    try {
      const result = await tasksService.getTasks(req.tenant.id, req.user, req.role, req.query);
      return apiSuccess(res, result, 'Tasks retrieved successfully.');
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
}

module.exports = new TasksController();
