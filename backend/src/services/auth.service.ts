import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { generateTokens, verifyRefreshToken, generateAccessToken, type TokenPair, type JwtPayload } from '../utils/jwt';
import type { RegisterInput, LoginInput, SocialLoginInput } from '../schemas/auth.schema';
import prisma from '../utils/prisma';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

interface SocialProfile {
  email: string | null;
  fullName: string | null;
  emailVerified: boolean;
}

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

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v1/certs';
let googleCertCache: { certs: Record<string, string>; expiresAt: number } | null = null;

function parseMaxAge(header: string | null): number {
  if (!header) {
    return 3600;
  }

  const match = header.match(/max-age=(\d+)/i);
  if (match) {
    const parsed = Number(match[1]);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return 3600;
}

async function getGoogleCerts(): Promise<Record<string, string>> {
  if (googleCertCache && googleCertCache.expiresAt > Date.now()) {
    return googleCertCache.certs;
  }

  const response = await fetch(GOOGLE_CERTS_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch Google certificates');
  }

  const certs = (await response.json()) as Record<string, string>;
  const cacheControl = response.headers.get('cache-control');
  const maxAgeSeconds = parseMaxAge(cacheControl);
  googleCertCache = {
    certs,
    expiresAt: Date.now() + maxAgeSeconds * 1000,
  };
  return certs;
}

async function verifyGoogleIdToken(token: string): Promise<SocialProfile> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google client ID not configured');
  }

  const decoded = jwt.decode(token, { complete: true }) as jwt.Jwt | null;
  if (!decoded || typeof decoded === 'string' || !decoded.header || !decoded.header.kid) {
    throw new Error('Invalid Google token');
  }

  const certs = await getGoogleCerts();
  let cert = certs[decoded.header.kid];

  if (!cert) {
    // Cache may be stale, refetch once
    googleCertCache = null;
    const freshCerts = await getGoogleCerts();
    cert = freshCerts[decoded.header.kid];
  }

  if (!cert) {
    throw new Error('Unable to match Google token certificate');
  }

  const payload = jwt.verify(token, cert, {
    algorithms: ['RS256'],
    audience: GOOGLE_CLIENT_ID,
  }) as jwt.JwtPayload;

  if (!payload.email) {
    throw new Error('Google account did not provide an email address');
  }

  return {
    email: typeof payload.email === 'string' ? payload.email : null,
    fullName:
      typeof payload.name === 'string'
        ? payload.name
        : [payload.given_name, payload.family_name].filter(Boolean).join(' ') || null,
    emailVerified: payload.email_verified === undefined ? true : Boolean(payload.email_verified),
  };
}

async function verifyFacebookToken(accessToken: string): Promise<SocialProfile> {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    throw new Error('Facebook app credentials not configured');
  }

  const appToken = `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;
  const debugUrl = new URL('https://graph.facebook.com/debug_token');
  debugUrl.searchParams.set('input_token', accessToken);
  debugUrl.searchParams.set('access_token', appToken);

  const debugResponse = await fetch(debugUrl);
  const debugData = (await debugResponse.json()) as {
    data?: { is_valid?: boolean; user_id?: string; expires_at?: number; scopes?: string[] };
    error?: { message?: string };
  };

  if (!debugResponse.ok || !debugData.data?.is_valid || !debugData.data.user_id) {
    throw new Error(debugData.error?.message || 'Invalid Facebook token');
  }

  const userId = debugData.data.user_id;
  const profileUrl = new URL(`https://graph.facebook.com/${userId}`);
  profileUrl.searchParams.set('fields', 'id,name,email');
  profileUrl.searchParams.set('access_token', accessToken);

  const profileResponse = await fetch(profileUrl);
  const profile = (await profileResponse.json()) as { id?: string; name?: string; email?: string; error?: { message?: string } };

  if (!profileResponse.ok || !profile.id) {
    throw new Error(profile.error?.message || 'Unable to fetch Facebook profile');
  }

  if (!profile.email) {
    throw new Error('Facebook account did not provide an email address');
  }

  return {
    email: profile.email,
    fullName: profile.name ?? null,
    emailVerified: true,
  };
}

async function fetchUserWithRegions(userId: string): Promise<{ user: SanitizedUser; payload: JwtPayload }> {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true,
      email: true,
      full_name: true,
      birth_year: true,
      current_location: true,
      preferred_language: true,
      email_verified: true,
      created_at: true,
      updated_at: true,
      global_role: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const assignments = (await prisma.superGuruAssignment.findMany({
    where: { user_id: userId },
    include: {
      admin_regions: {
        select: {
          region_id: true,
          name: true,
          code: true,
        },
      },
    },
  })) as Array<{
    region_id: string;
    is_primary: boolean;
    admin_regions: { region_id: string; name: string; code: string } | null;
  }>;

  const superGuruRegions: SuperGuruRegionSummary[] = assignments
    .filter((assignment) => assignment.admin_regions)
    .map((assignment) => {
      const region = assignment.admin_regions!;
      return {
        id: region.region_id,
        name: region.name,
        code: region.code,
        isPrimary: assignment.is_primary,
      };
    });

  const sanitizedUser: SanitizedUser = {
    id: user.user_id,
    email: user.email,
    fullName: user.full_name,
    birthYear: user.birth_year ?? null,
    currentLocation: user.current_location ?? null,
    preferredLanguage: user.preferred_language,
    emailVerified: user.email_verified,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    globalRole: user.global_role,
    superGuruRegions,
  };

  const payload: JwtPayload = {
    userId: user.user_id,
    email: user.email,
    globalRole: user.global_role,
    regionIds: superGuruRegions.map((region) => region.id),
  };

  return { user: sanitizedUser, payload };
}

async function buildAuthResponse(userId: string): Promise<AuthBuildResult> {
  const { user, payload } = await fetchUserWithRegions(userId);
  const tokens = generateTokens(payload);
  return { user, tokens };
}

export async function socialLogin(data: SocialLoginInput): Promise<AuthBuildResult> {
  const { provider, token } = data;

  if (!token) {
    throw new Error('Missing social authentication token');
  }

  if (provider !== 'google' && provider !== 'facebook') {
    throw new Error('Unsupported social provider');
  }

  let profile: SocialProfile;

  if (provider === 'google') {
    profile = await verifyGoogleIdToken(token);
  } else if (provider === 'facebook') {
    profile = await verifyFacebookToken(token);
  } else {
    throw new Error('Unsupported social provider');
  }

  if (!profile.email) {
    throw new Error('Social account did not provide an email address');
  }

  const rawEmail = profile.email.trim();
  const normalizedEmail = rawEmail.toLowerCase();
  const displayName =
    profile.fullName && profile.fullName.trim().length > 0
      ? profile.fullName.trim()
      : rawEmail.split('@')[0] || 'New User';

  let existingUser = await prisma.user.findUnique({
    where: { email: rawEmail },
  });

  if (!existingUser && normalizedEmail !== rawEmail) {
    existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
  }

  if (existingUser) {
    const updateData: {
      email_verified?: boolean;
      full_name?: string;
      last_login?: Date;
      updated_at?: Date;
    } = {};

    if (profile.emailVerified && !existingUser.email_verified) {
      updateData.email_verified = true;
    }

    const existingName = existingUser.full_name?.trim() ?? '';
    if (!existingName || existingName === existingUser.email) {
      updateData.full_name = displayName;
    }

    updateData.last_login = new Date();
    updateData.updated_at = new Date();

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date();
      await prisma.user.update({
        where: { user_id: existingUser.user_id },
        data: updateData,
      });
    }

    return buildAuthResponse(existingUser.user_id);
  }

  const secretSeed = `social-${provider}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const placeholderPassword = await bcrypt.hash(secretSeed, 10);

  const user = await prisma.user.create({
    data: {
      user_id: randomUUID(),
      email: rawEmail,
      password_hash: placeholderPassword,
      full_name: displayName,
      preferred_language: 'en',
      email_verified: profile.emailVerified,
      last_login: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  return buildAuthResponse(user.user_id);
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
      user_id: randomUUID(),
      email,
      password_hash: hashedPassword,
      full_name: `${firstName} ${lastName}`,
      preferred_language: language || 'en',
      email_verified: false,
      last_login: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  return buildAuthResponse(user.user_id);
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

  if (!user || !user.password_hash) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  await prisma.user.update({
    where: { user_id: user.user_id },
    data: {
      last_login: new Date(),
      updated_at: new Date(),
    },
  });

  return buildAuthResponse(user.user_id);
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);

  // Check if user still exists
  const user = await prisma.user.findUnique({
    where: { user_id: payload.userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Generate new access token
  const { payload: authPayload } = await fetchUserWithRegions(user.user_id);

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
  const updateData: {
    full_name?: string;
    current_location?: string | null;
    preferred_language?: string;
    updated_at?: Date;
  } = {};

  // Map frontend field names to Prisma field names
  if (data.firstName || data.lastName) {
    // Get current user to merge names
    const currentUser = await prisma.user.findUnique({ where: { user_id: userId } });
    if (currentUser) {
      const names = currentUser.full_name.split(' ');
      const firstName = data.firstName || names[0] || '';
      const lastName = data.lastName || names.slice(1).join(' ') || '';
      updateData.full_name = `${firstName} ${lastName}`.trim();
    }
  }

  if (data.location !== undefined) {
    updateData.current_location = data.location;
  }

  if (data.language) {
    updateData.preferred_language = data.language;
  }

  updateData.updated_at = new Date();

  await prisma.user.update({
    where: { user_id: userId },
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
    where: { user_id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.password_hash) {
    throw new Error('Current password is incorrect');
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { user_id: userId },
    data: {
      password_hash: hashedPassword,
      updated_at: new Date(),
    },
  });
}
