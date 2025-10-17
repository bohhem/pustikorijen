import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateTokens, verifyRefreshToken, generateAccessToken, type TokenPair } from '../utils/jwt';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema';

const prisma = new PrismaClient();

/**
 * User registration service
 */
export async function registerUser(data: RegisterInput): Promise<{ user: any; tokens: TokenPair }> {
  const { email, password, firstName, lastName, language } = data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      fullName: `${firstName} ${lastName}`,
      preferredLanguage: language || 'en',
      emailVerified: false,
    },
  });

  // Generate tokens
  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
  });

  // Remove password from response
  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    tokens,
  };
}

/**
 * User login service
 */
export async function loginUser(data: LoginInput): Promise<{ user: any; tokens: TokenPair }> {
  const { email, password } = data;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Generate tokens
  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
  });

  // Remove password from response
  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    tokens,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);

  // Check if user still exists
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Generate new access token
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
  });

  return { accessToken };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      birthYear: true,
      currentLocation: true,
      preferredLanguage: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, data: { firstName?: string; lastName?: string; location?: string; language?: string }) {
  const updateData: any = {};

  // Map frontend field names to Prisma field names
  if (data.firstName || data.lastName) {
    // Get current user to merge names
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (currentUser) {
      const names = currentUser.fullName.split(' ');
      const firstName = data.firstName || names[0] || '';
      const lastName = data.lastName || names.slice(1).join(' ') || '';
      updateData.fullName = `${firstName} ${lastName}`.trim();
    }
  }

  if (data.location !== undefined) {
    updateData.currentLocation = data.location;
  }

  if (data.language) {
    updateData.preferredLanguage = data.language;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      fullName: true,
      birthYear: true,
      currentLocation: true,
      preferredLanguage: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

/**
 * Change user password
 */
export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });
}
