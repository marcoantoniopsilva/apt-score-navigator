
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Anti-loop protection refs
  const isRefreshingRef = useRef(false);
  const lastRefreshRef = useRef<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Debounced session refresh to prevent loops
  const debouncedRefreshSession = useCallback(async () => {
    const now = Date.now();
    const minInterval = 5000; // 5 seconds minimum between refreshes
    
    if (isRefreshingRef.current || (now - lastRefreshRef.current) < minInterval) {
      console.log('Session refresh skipped - too frequent or already in progress');
      return;
    }

    isRefreshingRef.current = true;
    lastRefreshRef.current = now;

    try {
      console.log('Refreshing session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!mountedRef.current) return;
      
      if (error) {
        console.error('Session refresh error:', error);
        return;
      }

      if (session) {
        console.log('Session refreshed successfully');
        setSession(session);
        setUser(session.user);
      } else {
        console.log('No session found during refresh');
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // Page Visibility API implementation
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && session) {
        // Clear any existing timeout
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        // Debounce session check when tab becomes visible
        refreshTimeoutRef.current = setTimeout(() => {
          debouncedRefreshSession();
        }, 1000); // 1 second delay after tab becomes visible
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [session, debouncedRefreshSession]);

  // Session validation every 5 minutes for active sessions
  useEffect(() => {
    if (!session) return;

    const validateSession = async () => {
      if (!mountedRef.current || isRefreshingRef.current) return;
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!mountedRef.current) return;
        
        if (error || !user) {
          console.log('Session validation failed, clearing session');
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Session validation error:', error);
      }
    };

    const interval = setInterval(validateSession, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    mountedRef.current = true;
    console.log('AuthContext: Setting up auth state listener');

    // Set up auth state listener with anti-loop protection
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mountedRef.current) return;
        
        console.log('Auth state changed:', event, newSession?.user?.email);
        
        // Prevent loops by checking if session actually changed
        const sessionChanged = 
          (!session && newSession) || 
          (session && !newSession) ||
          (session?.access_token !== newSession?.access_token);

        if (sessionChanged) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          console.log('Session updated:', !!newSession);
        }
        
        setLoading(false);
      }
    );

    // Initial session check with timeout
    console.log('AuthContext: Checking for existing session');
    const sessionCheckTimeout = setTimeout(async () => {
      if (!mountedRef.current) return;
      
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (!mountedRef.current) return;
        
        if (error) {
          console.error('Initial session check error:', error);
        } else {
          console.log('Initial session found:', !!initialSession);
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }, 100); // Small delay to prevent race conditions

    return () => {
      console.log('AuthContext: Cleanup');
      mountedRef.current = false;
      clearTimeout(sessionCheckTimeout);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to prevent loops

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
