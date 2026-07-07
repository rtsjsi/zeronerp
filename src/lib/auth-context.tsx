/**
 * Auth Context — Client-side authentication state
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  clearStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken,
} from '@/lib/auth-token';

interface AppUser {
  id: string;
  username: string;
  fullName: string;
  storeId: string | null;
  tenantName?: string;
  avatarUrl?: string;
  role: 'ADMIN' | 'USER' | 'SUPER_ADMIN';
}

interface AuthContextValue {
  user: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchAppUser = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { success: boolean; data?: AppUser; message?: string };
        if (json.success && json.data) {
          setUser(json.data);
        } else {
          console.error('[Auth] Profile fetch failed:', json.message);
          clearStoredAuthToken();
          setAccessToken(null);
          setUser(null);
        }
      } else {
        clearStoredAuthToken();
        setAccessToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('[Auth] Failed to fetch user profile', err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const token = getStoredAuthToken();
      if (!token) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      setAccessToken(token);
      await fetchAppUser(token);
      if (!cancelled) setIsLoading(false);
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [fetchAppUser]);

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const json = (await res.json()) as {
        success: boolean;
        data?: { token: string };
        message?: string;
      };

      if (!res.ok || !json.success || !json.data?.token) {
        return { error: json.message || 'Sign in failed' };
      }

      setStoredAuthToken(json.data.token);
      setAccessToken(json.data.token);
      await fetchAppUser(json.data.token);
      return { error: null };
    } catch {
      return { error: 'Sign in failed' };
    }
  }, [fetchAppUser]);

  const signOut = useCallback(async () => {
    clearStoredAuthToken();
    setUser(null);
    setAccessToken(null);
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    const token = getStoredAuthToken();
    if (token) {
      await fetchAppUser(token);
    }
  }, [fetchAppUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!accessToken && !!user,
        accessToken,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
