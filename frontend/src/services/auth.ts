import api from './api';
import { ENDPOINTS } from '@/config/api';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: string;
  emailVerified: boolean;
  plan: 'free' | 'pro' | 'team';
  billingCycle?: 'monthly' | 'yearly' | null;
  educationLevel?: string;
  subjects?: string[];
  profileCompleted?: boolean;
  createdAt: string;
}

export const authService = {
  // Email/Password Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post(ENDPOINTS.auth.login, { email, password });
    return response.data;
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await api.post(ENDPOINTS.auth.register, { name, email, password });
    return response.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post(ENDPOINTS.auth.logout, { refreshToken });
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await api.post(ENDPOINTS.auth.refresh, { refreshToken });
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get(ENDPOINTS.auth.me);
    return response.data;
  },

  // OAuth
  async googleAuth(idToken: string): Promise<AuthResponse> {
    const response = await api.post(ENDPOINTS.auth.google, { idToken });
    return response.data;
  },

  async appleAuth(idToken: string, userData?: { name?: string }): Promise<AuthResponse> {
    const response = await api.post(ENDPOINTS.auth.apple, { idToken, userData });
    return response.data;
  },

  // Password Reset
  async forgotPassword(email: string): Promise<void> {
    await api.post(ENDPOINTS.auth.forgotPassword, { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post(ENDPOINTS.auth.resetPassword, { token, password });
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post(ENDPOINTS.auth.changePassword, { oldPassword, newPassword });
  },

  // Email Verification
  async verifyEmail(token: string): Promise<void> {
    await api.post(ENDPOINTS.auth.verifyEmail, { token });
  },

  async resendVerification(): Promise<void> {
    await api.post(ENDPOINTS.auth.resendVerification);
  },
};

// Token storage helpers
export const tokenStorage = {
  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  },

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  hasTokens(): boolean {
    return !!localStorage.getItem('accessToken');
  },
};
