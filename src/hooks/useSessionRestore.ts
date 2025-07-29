import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionMonitor } from './useSessionMonitor';

/**
 * Hook para restaurar dados quando a sessão é recuperada
 * Monitora eventos de sessão e dispara recarregamento de dados
 */
export const useSessionRestore = () => {
  const { session, user } = useAuth();
  const { isSessionValid } = useSessionMonitor();

  useEffect(() => {
    const handleSessionRestored = () => {
      console.log('Session restored, triggering data reload...');
      
      // Dispara eventos para recarregar dados críticos
      window.dispatchEvent(new CustomEvent('criteria-updated'));
      window.dispatchEvent(new CustomEvent('reload-properties'));
    };

    const handleSessionExpired = () => {
      console.log('Session expired, clearing local data...');
      
      // Limpa dados locais quando a sessão expira
      localStorage.removeItem('cached-criteria');
      localStorage.removeItem('cached-properties');
    };

    // Escuta eventos de sessão
    window.addEventListener('session-refreshed', handleSessionRestored);
    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('session-refreshed', handleSessionRestored);
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, []);

  // Verifica se a sessão foi restaurada após estar inválida
  useEffect(() => {
    if (session && user && isSessionValid) {
      console.log('Session is now valid, checking if data needs refresh...');
      
      // Se não há dados em cache, dispara recarregamento
      const hasCachedCriteria = localStorage.getItem('cached-criteria');
      if (!hasCachedCriteria) {
        window.dispatchEvent(new CustomEvent('criteria-updated'));
      }
    }
  }, [session, user, isSessionValid]);

  return {
    isSessionValid,
    hasActiveSession: !!(session && user)
  };
};