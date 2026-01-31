import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../services/apiClient';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'moderator';
  avatar?: string;
  permissions?: string[];
}

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'admin_auth';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setAdmin(data.admin);
        apiClient.setToken(data.token);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<{ user: Admin; token: string }>('/admin/login', {
        email,
        password,
      });

      if (response.success && response.data) {
        const adminData = { ...response.data.user, permissions: [] };
        setAdmin(adminData);
        apiClient.setToken(response.data.token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          admin: adminData,
          token: response.data.token,
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setAdmin(null);
    apiClient.setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasPermission = (permission: string): boolean => {
    if (!admin) return false;
    if (admin.role === 'superadmin') return true;
    return admin.permissions?.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider value={{
      admin,
      isAuthenticated: !!admin,
      isLoading,
      login,
      logout,
      hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
