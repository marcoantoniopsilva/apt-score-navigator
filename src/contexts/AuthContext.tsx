
import React, { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('AuthContext: Auth state changed:', event, {
          hasSession: !!session,
          userEmail: session?.user?.email,
          userId: session?.user?.id,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A'
        });
        
        // Always update both session and user for all events
        setSession(session);
        setUser(session?.user ?? null);
        
        // Clear loading after any auth event
        setLoading(false);
        
        // Log the final state
        if (session) {
          console.log('AuthContext: User authenticated successfully');
        } else {
          console.log('AuthContext: User signed out or session invalid');
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      console.log('AuthContext: Initial session check:', {
        hasSession: !!session,
        userEmail: session?.user?.email,
        userId: session?.user?.id,
        error: error?.message,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A'
      });
      
      if (error) {
        console.error('AuthContext: Error getting initial session:', error);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
