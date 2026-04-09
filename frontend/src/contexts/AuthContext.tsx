/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authService, tokenStorage, type User } from '@/services/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  appleLogin: (idToken: string, userData?: { name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      if (!tokenStorage.hasTokens()) {
        setUser(null);
        return;
      }

      // Dev mode - restore mock user
      if (import.meta.env.DEV && tokenStorage.getAccessToken() === 'dev-access-token') {
        const mockUser: User = {
          id: 'dev-user-1',
          email: 'dev@test.com',
          name: 'Dev User',
          role: 'user',
          emailVerified: true,
          plan: 'pro',
          createdAt: new Date().toISOString(),
        };
        setUser(mockUser);
        return;
      }

      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch {
      setUser(null);
      tokenStorage.clearTokens();
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await refreshUser();
      setIsLoading(false);
    };
    init();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<void> => {
    // Dev mode - bypass API for testing
    if (import.meta.env.DEV && email === 'dev@test.com' && password === 'dev123') {
      const mockUser: User = {
        id: 'dev-user-1',
        email: 'dev@test.com',
        name: 'Dev User',
        role: 'user',
        emailVerified: true,
        plan: 'pro',
        createdAt: new Date().toISOString(),
      };
      tokenStorage.setTokens('dev-access-token', 'dev-refresh-token');
      setUser(mockUser);
      return;
    }

    const response = await authService.login(email, password);
    tokenStorage.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
    await refreshUser();
  };

  const register = async (name: string, email: string, password: string) => {
    // Just register, don't auto-login - user will login manually
    await authService.register(name, email, password);
  };

  const googleLogin = async (idToken: string): Promise<void> => {
    const response = await authService.googleAuth(idToken);
    tokenStorage.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
    await refreshUser();
  };

  const appleLogin = async (idToken: string, userData?: { name?: string }): Promise<void> => {
    const response = await authService.appleAuth(idToken, userData);
    tokenStorage.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
    await refreshUser();
  };

  const logout = async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
    }
  };

  const forgotPassword = async (email: string) => {
    await authService.forgotPassword(email);
  };

  const resetPassword = async (token: string, password: string) => {
    await authService.resetPassword(token, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        googleLogin,
        appleLogin,
        logout,
        refreshUser,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
