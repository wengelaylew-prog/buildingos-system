import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setApiRole, getApiRole, setApiToken } from '../api/client.ts';
import { AuthUser } from '../types/index.ts';

interface AuthContextType {
  user: AuthUser | null;
  activeRole: string;
  setActiveRole: (role: string) => void;
  hasPermission: (permissionCode: string) => boolean;
  signInWithGoogle: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AVAILABLE_ROLES = [
  { code: 'SUPER_ADMIN', name: 'Super Administrator', badge: 'All Permissions' },
  { code: 'PROPERTY_MANAGER', name: 'Property Manager', badge: 'Operations & Leases' },
  { code: 'ACCOUNTANT', name: 'Accountant', badge: 'Financials & Reports' },
  { code: 'MAINTENANCE', name: 'Maintenance Technician', badge: 'Work Orders & Tickets' },
  { code: 'SECURITY', name: 'Security Guard', badge: 'Gate & Scanners' },
  { code: 'RECEPTION', name: 'Front Desk / Reception', badge: 'Check-in & Inquiries' },
  { code: 'TENANT', name: 'Tenant Portal', badge: 'Self-Service & Leases' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeRole, setRoleState] = useState<string>(getApiRole());
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profile = await api.getCurrentUser();
      setUser(profile);
      if (profile) {
        setRoleState(profile.roleCode);
      }
    } catch {
      // API client will handle the fallback or logout
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('buildingos_token');
      if (storedToken) {
        setApiToken(storedToken);
      } else {
        setApiToken(null);
      }
      await fetchProfile();
    };

    initializeAuth();
  }, []);

  const setActiveRole = (role: string) => {
    setRoleState(role);
    setApiRole(role);
  };

  const hasPermission = (permissionCode: string) => {
    if (!user) return false;
    if (user.roleCode === 'SUPER_ADMIN') return true;
    return user.permissions?.includes(permissionCode) ?? false;
  };

  const signInWithGoogle = async () => {
    throw new Error('Google Sign-in is temporarily disabled. Please use email and password.');
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.data && data.data.token) {
        localStorage.setItem('buildingos_token', data.data.token);
        setApiToken(data.data.token);
        await fetchProfile();
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('buildingos_token');
      setApiToken(null);
      setUser(null);
    } catch (error) {
      console.error('Sign Out failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole,
        setActiveRole,
        hasPermission,
        signInWithGoogle,
        login,
        signOut,
        refreshUser: fetchProfile,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
