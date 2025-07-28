import { useState, useEffect, useRef, useCallback } from 'react';
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

  const lastCheckTime = useRef<number>(0);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkSession = useCallback(async () => {
    // Basic rate limiting - prevent too frequent checks
    const now = Date.now();
    if (!session || (now - lastCheckTime.current) < 1000) {
      return;
    }

    lastCheckTime.current = now;
    setState(prev => ({ ...prev, isMonitoring: true }));

    // Set timeout to reset monitoring state if check takes too long
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    checkTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isMonitoring: false }));
    }, 10000); // 10 second timeout

    try {
      console.log('useSessionMonitor: Checking session validity...');
      const sessionState = await sessionValidator.validateSession();
      
      setState(prev => ({
        ...prev,
        isSessionValid: sessionState.isValid,
        sessionError: sessionState.error || null,
        isMonitoring: false
      }));

      console.log('useSessionMonitor: Session state updated:', {
        isValid: sessionState.isValid,
        hasError: !!sessionState.error
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Session check failed';
      console.error('useSessionMonitor: Session check error:', errorMessage);
      setState(prev => ({
        ...prev,
        isSessionValid: false,
        sessionError: errorMessage,
        isMonitoring: false
      }));
    } finally {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
    }
  }, [session]);

  // Monitor session changes
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
  }, [session, user, checkSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    checkSession,
    isAuthError
  };
};