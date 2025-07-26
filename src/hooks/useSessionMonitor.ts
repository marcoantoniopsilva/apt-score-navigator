import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { sessionValidator, isAuthError } from '@/utils/sessionUtils';

interface SessionMonitorState {
  isSessionValid: boolean;
  sessionError: string | null;
  isMonitoring: boolean;
}

export const useSessionMonitor = () => {
  const { session, user } = useAuth();
  const [state, setState] = useState<SessionMonitorState>({
    isSessionValid: true,
    sessionError: null,
    isMonitoring: false
  });

  const monitoringRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkSession = async () => {
    if (monitoringRef.current || !session) return;

    monitoringRef.current = true;
    setState(prev => ({ ...prev, isMonitoring: true }));

    try {
      const sessionState = await sessionValidator.validateSession();
      
      setState(prev => ({
        ...prev,
        isSessionValid: sessionState.isValid,
        sessionError: sessionState.error || null,
        isMonitoring: false
      }));

      if (!sessionState.isValid && sessionState.error) {
        console.warn('Session validation failed:', sessionState.error);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Session check failed';
      setState(prev => ({
        ...prev,
        isSessionValid: false,
        sessionError: errorMessage,
        isMonitoring: false
      }));
    } finally {
      monitoringRef.current = false;
    }
  };

  // Monitor session every 2 minutes when user is active
  useEffect(() => {
    if (!session || !user) {
      setState({
        isSessionValid: false,
        sessionError: null,
        isMonitoring: false
      });
      return;
    }

    // Initial check
    checkSession();

    // Set up periodic monitoring
    intervalRef.current = setInterval(checkSession, 2 * 60 * 1000); // 2 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session, user]);

  // Check session on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (session && !document.hidden) {
        checkSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [session]);

  return {
    ...state,
    checkSession,
    isAuthError
  };
};