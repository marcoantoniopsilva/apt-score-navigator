
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

  // Enhanced visibility change handling with force refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && session) {
        console.log('AuthContext: Tab became visible, force checking session');
        
        // Clear any existing timeout
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        // Force session refresh when tab becomes visible
        refreshTimeoutRef.current = setTimeout(async () => {
          try {
            const { data: { session: currentSession }, error } = await supabase.auth.getSession();
            
            if (!mountedRef.current) return;
            
            if (error) {
              console.error('Visibility session check error:', error);
              return;
            }

            if (currentSession) {
              console.log('AuthContext: Session validated on visibility');
              // Force update session and user even if they appear the same
              setSession(currentSession);
              setUser(currentSession.user);
            } else {
              console.log('AuthContext: No session found on visibility check');
              setSession(null);
              setUser(null);
            }
          } catch (error) {
            console.error('AuthContext: Visibility session check failed:', error);
          }
        }, 500); // Shorter delay for more responsive feel
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [session]);

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
    console.log('🚀 AuthContext: Setting up auth state listener');

    // Set up auth state listener with anti-loop protection
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mountedRef.current) return;
        
        console.log('🔄 Auth state changed:', event);
        console.log('👤 User email:', newSession?.user?.email || 'No user');
        console.log('🎫 Has access token:', !!newSession?.access_token);
        console.log('🎟️ Has refresh token:', !!newSession?.refresh_token);
        
        // Prevent loops by checking if session actually changed
        const sessionChanged = 
          (!session && newSession) || 
          (session && !newSession) ||
          (session?.access_token !== newSession?.access_token);

        if (sessionChanged) {
          console.log('✅ Session state updated:', !!newSession);
          setSession(newSession);
          setUser(newSession?.user ?? null);
        } else {
          console.log('⏭️ Session unchanged, skipping update');
        }
        
        setLoading(false);
      }
    );

    // Initial session check with timeout
    console.log('🔍 AuthContext: Checking for existing session');
    const sessionCheckTimeout = setTimeout(async () => {
      if (!mountedRef.current) return;
      
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (!mountedRef.current) return;
        
        if (error) {
          console.error('❌ Initial session check error:', error);
        } else {
          console.log('📊 Initial session check result:');
          console.log('   - Has session:', !!initialSession);
          console.log('   - User email:', initialSession?.user?.email || 'No user');
          console.log('   - Access token:', !!initialSession?.access_token);
          console.log('   - Refresh token:', !!initialSession?.refresh_token);
          
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }
      } catch (error) {
        console.error('💥 Session check failed:', error);
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
    console.log('🔐 AuthContext: Attempting sign in for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('📊 Sign in result:');
    console.log('   - Error:', error?.message || 'None');
    console.log('   - Has session:', !!data.session);
    console.log('   - User email:', data.user?.email || 'No user');
    
    return { error };
  };

  const signOut = async () => {
    console.log('🚪 AuthContext: Signing out and clearing all tokens');
    
    // Limpar localStorage primeiro
    localStorage.removeItem('sb-eepkixxqvelppxzfwoin-auth-token');
    
    // Depois fazer logout no Supabase
    await supabase.auth.signOut();
    
    // Garantir que o estado local está limpo
    setSession(null);
    setUser(null);
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
