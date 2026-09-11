import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
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
      // Graceful fallback handled by API client role headers
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen to Firebase Auth state with safe iframe error handling
    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          try {
            const token = await fbUser.getIdToken();
            setApiToken(token);
          } catch {
            // Fallback to role token in sandboxed containers
          }
        } else {
          setApiToken(null);
        }
        await fetchProfile();
      },
      () => {
        // Safe recovery for sandboxed preview iframes
        fetchProfile();
      }
    );

    return () => unsubscribe();
  }, []);

  const setActiveRole = async (newRole: string) => {
    setRoleState(newRole);
    setApiRole(newRole);
    await fetchProfile();
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!user) return false;
    if (user.roleCode === 'SUPER_ADMIN') return true;
    return user.permissions.includes(permissionCode);
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      setApiToken(token);
      await fetchProfile();
    } catch (error: any) {
      console.error('Google Sign In failed:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      setApiToken(token);
      await fetchProfile();
    } catch (error: any) {
      console.error('Email/Password Sign In failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setApiToken(null);
      await fetchProfile();
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
