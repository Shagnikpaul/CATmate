import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { api } from '../api/apiService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userId: string, pass: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  switchQuickUser: (role: 'operator' | 'manager') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => api.getCurrentUser());
  const [token, setToken] = useState<string | null>(() => api.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = api.subscribe(() => {
      setUser(api.getCurrentUser());
      setToken(api.getToken());
    });
    return unsubscribe;
  }, []);

  const login = async (userId: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(userId, pass);
      if (res.success && res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        return { success: true, user: res.user };
      }
      return { success: false, error: res.error || 'Invalid credentials' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchQuickUser = async (targetRole: 'operator' | 'manager') => {
    if (targetRole === 'operator') {
      await login('OP1001', 'pass123');
    } else {
      await login('MGR01', 'pass123');
    }
  };

  const value = {
    user,
    token,
    role: user ? user.role : null,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    logout,
    switchQuickUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
