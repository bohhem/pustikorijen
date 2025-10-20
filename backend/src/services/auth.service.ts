import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateTokens, verifyRefreshToken, generateAccessToken, type TokenPair, type JwtPayload } from '../utils/jwt';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema';

const prisma = new PrismaClient();

interface SuperGuruRegionSummary {
  id: string;
  name: string;
  code: string;
  isPrimary: boolean;
}

interface SanitizedUser {
  id: string;
  email: string;
  fullName: string;
  birthYear: number | null;
  currentLocation: string | null;
  preferredLanguage: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  globalRole: 'USER' | 'SUPER_GURU' | 'ADMIN';
  superGuruRegions: SuperGuruRegionSummary[];
}

interface AuthBuildResult {
  user: SanitizedUser;
  tokens: TokenPair;
}

async function fetchUserWithRegions(userId: string): Promise<{ user: SanitizedUser; payload: JwtPayload }> {
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
      globalRole: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const assignments = await prisma.superGuruAssignment.findMany({
    where: { userId },
    include: {
      region: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  }) as Array<{
    regionId: string;
    isPrimary: boolean;
    region: { id: string; name: string; code: string };
  }>;

  const superGuruRegions: SuperGuruRegionSummary[] = assignments.map((assignment) => ({
    id: assignment.regionId,
    name: assignment.region.name,
    code: assignment.region.code,
    isPrimary: assignment.isPrimary,
  }));

  const sanitizedUser: SanitizedUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    birthYear: user.birthYear ?? null,
    currentLocation: user.currentLocation ?? null,
    preferredLanguage: user.preferredLanguage,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    globalRole: user.globalRole,
    superGuruRegions,
  };

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    globalRole: user.globalRole,
    regionIds: superGuruRegions.map((region) => region.id),
  };

  return { user: sanitizedUser, payload };
}

async function buildAuthResponse(userId: string): Promise<AuthBuildResult> {
  const { user, payload } = await fetchUserWithRegions(userId);
  const tokens = generateTokens(payload);
  return { user, tokens };
}

/**
 * User registration service
 */
export async function registerUser(data: RegisterInput): Promise<AuthBuildResult> {
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

  return buildAuthResponse(user.id);
}

/**
 * User login service
 */
export async function loginUser(data: LoginInput): Promise<AuthBuildResult> {
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

  return buildAuthResponse(user.id);
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
  const { payload: authPayload } = await fetchUserWithRegions(user.id);

  const accessToken = generateAccessToken(authPayload);

  return { accessToken };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const { user } = await fetchUserWithRegions(userId);
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

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  const { user } = await fetchUserWithRegions(userId);
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
