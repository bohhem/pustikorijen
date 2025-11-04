import { Request, Response } from 'express';
import {
  getAllUsers,
  getUserById,
  getUserBranches,
  getUserActivity,
  updateUserRole,
  deactivateUser,
  reactivateUser,
  sendUserNotification,
  getPlatformUserStats,
  searchUsers,
} from '../services/user.service';
import {
  listUsersSchema,
  updateUserRoleSchema,
  deactivateUserSchema,
  sendNotificationSchema,
  getUserActivitySchema,
} from '../schemas/user.schema';
import { getErrorMessage, isZodError } from '../utils/error.util';

/**
 * GET /api/v1/admin/users
 * Get all users with filtering, search, and pagination
 */
export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validate query parameters
    const validated = listUsersSchema.parse(req.query);

    const { page, limit, sortBy, sortOrder, search, role, isActive, emailVerified } = validated;

    const filters = {
      search,
      role,
      isActive,
      emailVerified,
    };

    const pagination = {
      page,
      limit,
      sortBy,
      sortOrder,
    };

    const result = await getAllUsers(filters, pagination);

    res.status(200).json(result);
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }

    console.error('Failed to list users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
}

/**
 * GET /api/v1/admin/users/search?q=query
 * Search users by name or email (for autocomplete)
 */
export async function searchUsersEndpoint(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const query = req.query.q as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    if (!query) {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }

    const users = await searchUsers(query, limit);

    res.status(200).json({ users });
  } catch (error: unknown) {
    console.error('Failed to search users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
}

/**
 * GET /api/v1/admin/users/stats
 * Get platform-wide user statistics
 */
export async function getUserStats(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const stats = await getPlatformUserStats();

    res.status(200).json({ stats });
  } catch (error: unknown) {
    console.error('Failed to get user statistics:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
}

/**
 * GET /api/v1/admin/users/:userId
 * Get detailed user information
 */
export async function getUserDetail(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const user = await getUserById(userId);

    res.status(200).json({ user });
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message === 'User not found') {
      res.status(404).json({ error: message });
      return;
    }

    console.error('Failed to get user detail:', error);
    res.status(500).json({ error: 'Failed to get user detail' });
  }
}

/**
 * GET /api/v1/admin/users/:userId/branches
 * Get user's branch memberships
 */
export async function getUserBranchesEndpoint(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const branches = await getUserBranches(userId);

    res.status(200).json({ branches });
  } catch (error: unknown) {
    console.error('Failed to get user branches:', error);
    res.status(500).json({ error: 'Failed to get user branches' });
  }
}

/**
 * GET /api/v1/admin/users/:userId/activity
 * Get user's recent activity
 */
export async function getUserActivityEndpoint(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const validated = getUserActivitySchema.parse(req.query);
    const { limit } = validated;

    const activity = await getUserActivity(userId, limit);

    res.status(200).json({ activity });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }

    console.error('Failed to get user activity:', error);
    res.status(500).json({ error: 'Failed to get user activity' });
  }
}

/**
 * PATCH /api/v1/admin/users/:userId/role
 * Update user's global role
 */
export async function updateUserRoleEndpoint(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const validated = updateUserRoleSchema.parse(req.body);
    const { globalRole, reason } = validated;

    await updateUserRole(userId, globalRole, req.user.userId, reason);

    // Return updated user
    const user = await getUserById(userId);

    res.status(200).json({
      message: 'User role updated successfully',
      user,
    });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }

    const message = getErrorMessage(error);

    if (message === 'User not found') {
      res.status(404).json({ error: message });
      return;
    }

    if (
      message === 'You cannot change your own role' ||
      message === 'ADMIN role is not available in this system'
    ) {
      res.status(403).json({ error: message });
      return;
    }

    console.error('Failed to update user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
}

/**
 * POST /api/v1/admin/users/:userId/deactivate
 * Deactivate user account
 */
export async function deactivateUserEndpoint(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const validated = deactivateUserSchema.parse(req.body);
    const { reason } = validated;

    await deactivateUser(userId, reason, req.user.userId);

    // Return updated user
    const user = await getUserById(userId);

    res.status(200).json({
      message: 'User deactivated successfully',
      user,
    });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }

    const message = getErrorMessage(error);

    if (message === 'User not found') {
      res.status(404).json({ error: message });
      return;
    }

    if (
      message === 'You cannot deactivate your own account' ||
      message === 'Cannot deactivate the last active SuperGuru'
    ) {
      res.status(403).json({ error: message });
      return;
    }

    console.error('Failed to deactivate user:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
}

/**
 * POST /api/v1/admin/users/:userId/reactivate
 * Reactivate user account
 */
export async function reactivateUserEndpoint(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    await reactivateUser(userId, req.user.userId);

    // Return updated user
    const user = await getUserById(userId);

    res.status(200).json({
      message: 'User reactivated successfully',
      user,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message === 'User not found') {
      res.status(404).json({ error: message });
      return;
    }

    console.error('Failed to reactivate user:', error);
    res.status(500).json({ error: 'Failed to reactivate user' });
  }
}

/**
 * POST /api/v1/admin/users/:userId/notify
 * Send notification to a user
 */
export async function sendNotificationEndpoint(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const validated = sendNotificationSchema.parse(req.body);
    const { subject, message, priority, actionUrl } = validated;

    await sendUserNotification(
      userId,
      subject,
      message,
      priority,
      actionUrl || undefined,
      req.user.userId
    );

    res.status(200).json({
      message: 'Notification sent successfully',
    });
  } catch (error: unknown) {
    if (isZodError(error)) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }

    const message = getErrorMessage(error);

    if (message === 'User not found') {
      res.status(404).json({ error: message });
      return;
    }

    console.error('Failed to send notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
}
