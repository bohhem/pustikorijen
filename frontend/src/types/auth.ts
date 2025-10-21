export interface User {
  id: string;
  email: string;
  fullName: string;
  birthYear: number | null;
  currentLocation: string | null;
  preferredLanguage: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  globalRole: 'USER' | 'SUPER_GURU' | 'ADMIN';
  superGuruRegions: SuperGuruRegion[];
}

export interface SuperGuruRegion {
  id: string;
  name: string;
  code: string;
  isPrimary: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export type SocialProvider = 'google' | 'facebook';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  language?: 'en' | 'bs';
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  socialLogin: (provider: SocialProvider, token: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}
