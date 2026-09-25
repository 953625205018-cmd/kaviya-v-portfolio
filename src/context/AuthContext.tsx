import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, checkAuthStatus, loginOwner, logoutOwner } from '../lib/api';

interface AuthContextType {
  isOwner: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);

  const openLoginModal = useCallback(() => setLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setLoginModalOpen(false), []);

  // Check auth session on load
  useEffect(() => {
    let mounted = true;
    checkAuthStatus()
      .then((status) => {
        if (!mounted) return;
        if (status.isAuthenticated && status.role === 'OWNER') {
          setIsOwner(true);
          setUser(status.user);
        } else {
          setIsOwner(false);
          setUser(null);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setIsOwner(false);
        setUser(null);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    // Check if URL specifies login
    if (
      window.location.hash === '#login' || 
      window.location.hash === '#owner' || 
      window.location.search.includes('admin=login')
    ) {
      setLoginModalOpen(true);
    }

    const handleHashChange = () => {
      if (window.location.hash === '#login' || window.location.hash === '#owner') {
        setLoginModalOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      mounted = false;
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await loginOwner(email, password);
      if (res.success && res.user) {
        setIsOwner(true);
        setUser(res.user);
        setLoginModalOpen(false);
        // Clear hash if opened via hash
        if (window.location.hash === '#login' || window.location.hash === '#owner') {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        return { success: true };
      }
      return { success: false, error: res.error || 'Authentication failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutOwner();
      setIsOwner(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isOwner,
        user,
        isLoading,
        loginModalOpen,
        openLoginModal,
        closeLoginModal,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
