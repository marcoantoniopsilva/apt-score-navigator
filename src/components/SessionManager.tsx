import React, { useEffect } from 'react';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';
import { useSessionRestore } from '@/hooks/useSessionRestore';
import { useTabFocusManager } from '@/hooks/useTabFocusManager';
import { SessionExpiredMessage } from './SessionExpiredMessage';

/**
 * Simplified session manager - only manages session state
 * No complex event handling or recursive behaviors
 */
export const SessionManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSessionValid, sessionError } = useSessionMonitor();
  const { isSessionValid: sessionRestoreValid } = useSessionRestore();
  const { registerVisibilityCallback } = useTabFocusManager();

  // Register visibility callback for session validation
  useEffect(() => {
    return registerVisibilityCallback((isVisible) => {
      if (isVisible) {
        console.log('SessionManager: Tab became visible, session will be checked automatically');
        // Session will be checked automatically by the monitor
      }
    });
  }, [registerVisibilityCallback]);

  // Log session status for debugging
  useEffect(() => {
    console.log('SessionManager: Session status', {
      isSessionValid,
      sessionRestoreValid,
      hasError: !!sessionError
    });
  }, [isSessionValid, sessionRestoreValid, sessionError]);

  // Show session expired message only for critical errors
  if (sessionError && !isSessionValid && !sessionRestoreValid) {
    return <SessionExpiredMessage error={sessionError} />;
  }

  return <>{children}</>;
};