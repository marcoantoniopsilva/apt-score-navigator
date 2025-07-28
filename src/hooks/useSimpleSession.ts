import { useAuth } from '@/contexts/AuthContext';

/**
 * Ultra-simple session hook - just provides auth state
 * No complex events, no tab management, no session restoration
 */
export const useSimpleSession = () => {
  const { user, session, loading } = useAuth();

  return {
    user,
    session,
    loading,
    isAuthenticated: !!(user && session),
    isReady: !loading
  };
};