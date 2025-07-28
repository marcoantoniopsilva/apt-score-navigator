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

  const monitoringRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckTime = useRef<number>(0);

  const checkSession = useCallback(async () => {
    // Prevent concurrent checks and basic rate limiting
    const now = Date.now();
    if (monitoringRef.current || !session || (now - lastCheckTime.current) < 2000) {
      return;
    }

    monitoringRef.current = true;
    lastCheckTime.current = now;
    setState(prev => ({ ...prev, isMonitoring: true }));

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
      monitoringRef.current = false;
    }
  }, [session]);

  // Simplified session monitoring - only check on user/session changes
  useEffect(() => {
    if (!session || !user) {
      setState({
        isSessionValid: false,
        sessionError: null,
        isMonitoring: false
      });
      return;
    }

    // Initial check only
    checkSession();

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

  }, [session, user, checkSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    checkSession,
    isAuthError
  };
};