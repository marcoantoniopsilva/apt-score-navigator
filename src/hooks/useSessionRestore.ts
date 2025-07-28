import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Simplified session restore hook - no recursive events
 * Only handles data refresh when session becomes valid
 */
export const useSessionRestore = () => {
  const { session, user } = useAuth();
  const lastSessionState = useRef<string>('');
  const refreshCallbacks = useRef<Array<() => void>>([]);

  // Register callback for data refresh
  const registerRefreshCallback = useCallback((callback: () => void) => {
    refreshCallbacks.current.push(callback);
    return () => {
      refreshCallbacks.current = refreshCallbacks.current.filter(cb => cb !== callback);
    };
  }, []);

  // Execute all registered refresh callbacks
  const triggerDataRefresh = useCallback(() => {
    console.log('Session restored, triggering data refresh for', refreshCallbacks.current.length, 'callbacks');
    refreshCallbacks.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in refresh callback:', error);
      }
    });
  }, []);

  // Monitor session state changes
  useEffect(() => {
    const currentState = `${!!session}-${!!user}-${session?.access_token?.slice(-10) || ''}`;
    
    if (lastSessionState.current && lastSessionState.current !== currentState) {
      if (session && user) {
        console.log('Session state changed - session restored');
        triggerDataRefresh();
      } else {
        console.log('Session state changed - session lost, clearing cache');
        localStorage.removeItem('cached-criteria');
        localStorage.removeItem('cached-properties');
      }
    }
    
    lastSessionState.current = currentState;
  }, [session, user, triggerDataRefresh]);

  return {
    isSessionValid: !!(session && user),
    hasActiveSession: !!(session && user),
    registerRefreshCallback
  };
};