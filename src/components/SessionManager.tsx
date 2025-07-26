import React, { useEffect } from 'react';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';
import { useSessionRestore } from '@/hooks/useSessionRestore';
import { SessionExpiredMessage } from './SessionExpiredMessage';

/**
 * Componente para gerenciar o estado da sessão e restaurar dados
 * Deve ser usado em componentes principais que dependem de autenticação
 */
export const SessionManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSessionValid, sessionError } = useSessionMonitor();
  const { isSessionValid: sessionRestoreValid } = useSessionRestore();

  // Log session status for debugging
  useEffect(() => {
    console.log('SessionManager: Session status', {
      isSessionValid,
      sessionRestoreValid,
      hasError: !!sessionError
    });
  }, [isSessionValid, sessionRestoreValid, sessionError]);

  // Show session expired message if there are session issues
  if (sessionError && !isSessionValid) {
    return <SessionExpiredMessage error={sessionError} />;
  }

  return <>{children}</>;
};