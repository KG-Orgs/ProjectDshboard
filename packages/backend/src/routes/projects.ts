import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { dataStore } from '../services/dataStore';

const router: Router = Router();

router.use(authMiddleware);

/**
 * GET /api/projects
 * Get all projects for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await dataStore.listProjects(req.user!.userId);
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PROJECT_FETCH_ERROR',
        message: 'Failed to fetch projects',
      },
    });
  }
});

/**
 * GET /api/projects/:id
 * Get a specific project by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await dataStore.getProject(req.user!.userId, id);

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

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PROJECT_FETCH_ERROR',
        message: 'Failed to fetch project',
      },
    });
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, budget, endDate } = req.body;

    if (!name || !budget) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Name and budget are required',
        },
      });
      return;
    }

    const newProject = await dataStore.createProject(req.user!.userId, {
      name,
      description,
      budget: Number(budget),
      endDate,
    });

    res.status(201).json({ success: true, data: newProject });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PROJECT_CREATE_ERROR',
        message: 'Failed to create project',
      },
    });
  }
});

/**
 * PATCH /api/projects/:id
 * Update a project
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await dataStore.updateProject(req.user!.userId, id, req.body);

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

    res.json({ success: true, data: project, message: 'Project updated' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PROJECT_UPDATE_ERROR',
        message: 'Failed to update project',
      },
    });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await dataStore.deleteProject(req.user!.userId, id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found',
        },
      });
      return;
    }

    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PROJECT_DELETE_ERROR',
        message: 'Failed to delete project',
      },
    });
  }
});

export default router;
