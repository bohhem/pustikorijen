import api from '../lib/axios';
import type { LoginCredentials, RegisterData, AuthResponse, User, SocialProvider } from '../types/auth';

/**
 * Register a new user
 */
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
}

/**
 * Login user
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  return response.data;
}

/**
 * Social login
 */
export async function socialLoginWithProvider(provider: SocialProvider, token: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/social', {
    provider,
    token,
  });
  return response.data;
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<{ user: User }>('/auth/me');
  return response.data.user;
}

/**
 * Update user profile
 */
export async function updateUserProfile(data: Partial<User>): Promise<User> {
  const response = await api.patch<{ user: User }>('/auth/me', data);
  return response.data.user;
}

/**
 * Change password
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/auth/change-password', {
    currentPassword,
    newPassword,
  });
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await api.post<{ accessToken: string }>('/auth/refresh', {
    refreshToken,
  });
  return response.data.accessToken;
}
