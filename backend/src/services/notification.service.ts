import { randomUUID } from 'crypto';
import prisma from '../utils/prisma';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  actionUrl: string | null;
  priority: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapNotification(notification: any): Notification {
  return {
    id: notification.notification_id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    entityType: notification.entity_type,
    entityId: notification.entity_id,
    actionUrl: notification.action_url,
    priority: notification.priority,
    isRead: notification.is_read,
    readAt: notification.read_at ? notification.read_at.toISOString() : null,
    createdAt: notification.created_at.toISOString(),
  };
}

// ============================================================================
// Notification CRUD Operations
// ============================================================================

/**
 * Create a new notification
 */
export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  const {
    userId,
    type,
    title,
    message,
    entityType,
    entityId,
    actionUrl,
    priority = 'normal',
  } = input;

  // Verify user exists
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: { user_id: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const notification = await prisma.notifications.create({
    data: {
      notification_id: randomUUID(),
      user_id: userId,
      type,
      title,
      message,
      entity_type: entityType || null,
      entity_id: entityId || null,
      action_url: actionUrl || null,
      priority,
      is_read: false,
      created_at: new Date(),
    },
  });

  return mapNotification(notification);
}

/**
 * Get user's notifications with optional filtering
 */
export async function getUserNotifications(
  userId: string,
  unreadOnly: boolean = false,
  limit: number = 50
): Promise<Notification[]> {
  const where: any = { user_id: userId };

  if (unreadOnly) {
    where.is_read = false;
  }

  const notifications = await prisma.notifications.findMany({
    where,
    orderBy: {
      created_at: 'desc',
    },
    take: limit,
  });

  return notifications.map(mapNotification);
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return await prisma.notifications.count({
    where: {
      user_id: userId,
      is_read: false,
    },
  });
}

/**
 * Mark a specific notification as read
 */
export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  const notification = await prisma.notifications.findUnique({
    where: { notification_id: notificationId },
    select: {
      user_id: true,
      is_read: true,
    },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  // Verify the notification belongs to this user
  if (notification.user_id !== userId) {
    throw new Error('Unauthorized: This notification does not belong to you');
  }

  // Already read
  if (notification.is_read) {
    return;
  }

  await prisma.notifications.update({
    where: { notification_id: notificationId },
    data: {
      is_read: true,
      read_at: new Date(),
    },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notifications.updateMany({
    where: {
      user_id: userId,
      is_read: false,
    },
    data: {
      is_read: true,
      read_at: new Date(),
    },
  });

  return result.count;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  const notification = await prisma.notifications.findUnique({
    where: { notification_id: notificationId },
    select: { user_id: true },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  // Verify the notification belongs to this user
  if (notification.user_id !== userId) {
    throw new Error('Unauthorized: This notification does not belong to you');
  }

  await prisma.notifications.delete({
    where: { notification_id: notificationId },
  });
}

/**
 * Delete all read notifications for a user
 */
export async function deleteReadNotifications(userId: string): Promise<number> {
  const result = await prisma.notifications.deleteMany({
    where: {
      user_id: userId,
      is_read: true,
    },
  });

  return result.count;
}
