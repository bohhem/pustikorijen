import { Request, Response } from 'express';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../schemas/auth.schema';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  getUserById,
  updateUserProfile,
  changeUserPassword,
} from '../services/auth.service';

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);

    // Register user
    const result = await registerUser(validatedData);

    res.status(201).json({
      message: 'User registered successfully',
      user: result.user,
      tokens: result.tokens,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    if (error.message.includes('already exists')) {
      res.status(409).json({ error: error.message });
      return;
    }

    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);

    // Login user
    const result = await loginUser(validatedData);

    res.status(200).json({
      message: 'Login successful',
      user: result.user,
      tokens: result.tokens,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    if (error.message.includes('Invalid')) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
}

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    // Validate input
    const validatedData = refreshTokenSchema.parse(req.body);

    // Refresh token
    const result = await refreshAccessToken(validatedData.refreshToken);

    res.status(200).json({
      message: 'Token refreshed successfully',
      accessToken: result.accessToken,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      res.status(403).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
}

/**
 * Get current user profile
 * GET /api/auth/me
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await getUserById(req.user.userId);

    res.status(200).json({ user });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
}

/**
 * Update user profile
 * PATCH /api/auth/me
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate input
    const validatedData = updateProfileSchema.parse(req.body);

    // Update profile
    const user = await updateUserProfile(req.user.userId, validatedData);

    res.status(200).json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

/**
 * Change user password
 * POST /api/auth/change-password
 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate input
    const validatedData = changePasswordSchema.parse(req.body);

    // Change password
    await changeUserPassword(req.user.userId, validatedData.currentPassword, validatedData.newPassword);

    res.status(200).json({
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    if (error.message.includes('incorrect')) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
}
