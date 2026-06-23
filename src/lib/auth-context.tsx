/**
 * Auth Context — Client-side authentication state
 * 
 * Provides user session, tenant info, and auth actions (login, logout)
 * to all client components via React context.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Session, User as SupabaseUser, SupabaseClient } from '@supabase/supabase-js';

interface AppUser {
  id: string;
  email: string;
  fullName: string;
  storeId: string | null;
  tenantName?: string;
  avatarUrl?: string;
  role: 'ADMIN' | 'USER' | 'SUPER_ADMIN';
}

interface AuthContextValue {
  session: Session | null;
  supabaseUser: SupabaseUser | null;
  user: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const supabase: SupabaseClient | null = getSupabaseBrowser();
  const isConfigured = !!supabase;

  /** Fetch the application user profile from our API */
  const fetchAppUser = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setUser(json.data);
        } else {
          console.error('[Auth] Profile fetch failed:', json.message);
        }
      } else {
        console.error('[Auth] Profile fetch HTTP error:', res.status);
      }
    } catch (err) {
      console.error('[Auth] Failed to fetch user profile', err);
    }
  }, []);

  /** Initialise auth state on mount */
  useEffect(() => {
    const sb = supabase;
    if (!sb) {
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;

    const init = async () => {
      try {
        const { data: { session: currentSession } } = await sb.auth.getSession();
        if (cancelled) return;
        setSession(currentSession);
        setSupabaseUser(currentSession?.user ?? null);

        if (currentSession?.access_token) {
          await fetchAppUser(currentSession.access_token);
        }
      } catch (err) {
        console.error('[Auth] Init failed', err);
      }
      if (!cancelled) setIsLoading(false);
    };

    init();

    // Listen for auth changes
    const { data: { subscription } } = sb.auth.onAuthStateChange(
      async (event, newSession) => {
        if (cancelled) return;
        setSession(newSession);
        setSupabaseUser(newSession?.user ?? null);

        if (newSession?.access_token) {
          await fetchAppUser(newSession.access_token);
        } else {
          setUser(null);
          if (event === 'SIGNED_OUT') {
            router.push('/login');
          }
        }
      },
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, fetchAppUser, router]);

  /** Email + password sign in */
  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: 'Supabase is not configured.' };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }, [supabase]);

  /** Sign out */
  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setSupabaseUser(null);
    router.push('/login');
  }, [supabase, router]);

  /** Manually refresh user data */
  const refreshUser = useCallback(async () => {
    if (session?.access_token) {
      await fetchAppUser(session.access_token);
    }
  }, [session, fetchAppUser]);

  return (
    <AuthContext.Provider
      value={{
        session,
        supabaseUser,
        user,
        isLoading,
        isAuthenticated: !!session && !!user,
        isConfigured,
        accessToken: session?.access_token ?? null,
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
