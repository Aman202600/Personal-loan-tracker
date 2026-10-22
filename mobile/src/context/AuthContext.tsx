import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '../types';
import { authApi } from '../api/auth';
import { storage } from '../utils/storage';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestOtp: (phoneNumber: string) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (phoneNumber: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on app launch
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const savedToken = await storage.getToken();
        const savedUser = await storage.getUser();

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);

          // Silently verify or refresh user profile from backend
          try {
            const { user: remoteUser } = await authApi.getMe();
            setUser(remoteUser);
            await storage.setUser(remoteUser);
          } catch {
            // Token might be expired or server unreachable
          }
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const requestOtp = async (phoneNumber: string) => {
    return await authApi.requestOtp(phoneNumber);
  };

  const verifyOtp = async (phoneNumber: string, otp: string) => {
    const response = await authApi.verifyOtp(phoneNumber, otp);
    const { token: jwtToken, user: authUser } = response.data;

    // Securely persist token and user
    await storage.setToken(jwtToken);
    await storage.setUser(authUser);

    setToken(jwtToken);
    setUser(authUser);
  };

  const logout = async () => {
    await storage.clearAll();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { user: remoteUser } = await authApi.getMe();
      setUser(remoteUser);
      await storage.setUser(remoteUser);
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        requestOtp,
        verifyOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
