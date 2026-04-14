import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { dataStore } from '../services/dataStore';

const router: Router = Router();

router.use(authMiddleware);

/**
 * GET /api/tasks
 * Get all tasks for authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId, status } = req.query;
    const filteredTasks = await dataStore.listTasks(req.user!.userId, {
      projectId: projectId ? String(projectId) : undefined,
      status: status ? String(status) : undefined,
    });

    res.json({ success: true, data: filteredTasks });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'TASK_FETCH_ERROR',
        message: 'Failed to fetch tasks',
      },
    });
  }
});

/**
 * GET /api/tasks/:id
 * Get a specific task
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await dataStore.getTask(req.user!.userId, id);

    if (!task) {
      res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found',
        },
      });
      return;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'TASK_FETCH_ERROR',
        message: 'Failed to fetch task',
      },
    });
  }
});

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { projectId, title, description, priority, dueDate } = req.body;

    if (!projectId || !title) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Project ID and title are required',
        },
      });
      return;
    }

    const project = await dataStore.getProject(req.user!.userId, projectId);

    if (!project) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found',
        },
      });
      return;
    }

    const newTask = await dataStore.createTask(req.user!.userId, {
      projectId,
      title,
      description,
      priority: priority || 'medium',
      dueDate: dueDate || '',
    });

    if (!newTask) {
      res.status(500).json({
        success: false,
        error: {
          code: 'TASK_CREATE_ERROR',
          message: 'Failed to create task',
        },
      });
      return;
    }

    res.status(201).json({ success: true, data: newTask });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'TASK_CREATE_ERROR',
        message: 'Failed to create task',
      },
    });
  }
});

/**
 * PATCH /api/tasks/:id
 * Update a task
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await dataStore.updateTask(req.user!.userId, id, req.body);

    if (!task) {
      res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found',
        },
      });
      return;
    }

    res.json({ success: true, data: task, message: 'Task updated' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'TASK_UPDATE_ERROR',
        message: 'Failed to update task',
      },
    });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await dataStore.deleteTask(req.user!.userId, id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found',
        },
      });
      return;
    }

    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'TASK_DELETE_ERROR',
        message: 'Failed to delete task',
      },
    });
  }
});

export default router;
