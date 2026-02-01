import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { GetCurrentUserResponse } from '@flagbase/types';
import { getCurrentUser, login as loginApi, logout as logoutApi, register as registerApi, type LoginData, type RegisterData } from '~/lib/auth-client';

interface AuthContextValue {
  user: GetCurrentUserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GetCurrentUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refetch().finally(() => setIsLoading(false));
  }, [refetch]);

  const login = useCallback(async (data: LoginData) => {
    const loggedInUser = await loginApi(data);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    await registerApi(data);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
