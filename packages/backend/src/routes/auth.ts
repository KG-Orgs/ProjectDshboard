import { Router, Request, Response } from 'express';
import { LoginRequest, LoginResponse } from '@contractor/shared';
import { AuthService } from '../services/authService';
import { dataStore } from '../services/dataStore';

const router: Router = Router();

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Email and password are required',
        },
      });
      return;
    }

    const user = await dataStore.authenticateUser(email, password);

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
      return;
    }

    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response: LoginResponse = {
      token,
      user,
    };

    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // TODO: Invalidate token in Redis
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: 'Logout failed',
      },
    });
  }
});

/**
 * POST /api/auth/signup
 * Register new user
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Email, password, and name are required',
        },
      });
      return;
    }

    const newUser = await dataStore.registerUser({
      email,
      password,
      name,
      role: 'worker',
    });

    if (!newUser) {
      res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'A user with this email already exists',
        },
      });
      return;
    }

    const token = AuthService.generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    res.status(201).json({
      success: true,
      data: { user: newUser, token },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SIGNUP_ERROR',
        message: 'Signup failed',
      },
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh authentication token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_ERROR',
          message: 'Refresh token is required',
        },
      });
      return;
    }

    const existingToken = authHeader.substring(7);
    const payload = AuthService.verifyToken(existingToken);

    if (!payload) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_ERROR',
          message: 'Token refresh failed',
        },
      });
      return;
    }

    const token = AuthService.generateToken(payload);

    res.json({ success: true, data: { token } });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_ERROR',
        message: 'Token refresh failed',
      },
    });
  }
});

export default router;
