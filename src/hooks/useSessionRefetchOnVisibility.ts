import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';
import { useQueryClient } from '@tanstack/react-query';

export const useSessionRefetchOnVisibility = () => {
  const { validateSession, refreshSession } = useSessionMonitor();
  const queryClient = useQueryClient();

  const isHandlingRef = useRef(false);

  const attemptRecovery = useCallback(async () => {
    const valid = await validateSession();
    if (valid) return true;

    const refreshed = await refreshSession();
    return refreshed;
  }, [validateSession, refreshSession]);

  const handleVisibility = useCallback(async () => {
    if (isHandlingRef.current) return;
    isHandlingRef.current = true;

    try {
      const recovered = await attemptRecovery();
      if (recovered) {
        console.log('✅ Sessão OK - refetching queries...');
        await queryClient.refetchQueries({ queryKey: ['getUserData'] }); // Troque pelo nome da query que quer atualizar
      } else {
        console.warn('❌ Sessão inválida - talvez redirecionar para login');
      }
    } catch (err) {
      console.error('Erro no refetch após recuperação:', err);
    } finally {
      isHandlingRef.current = false;
    }
  }, [attemptRecovery, queryClient]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        handleVisibility();
      }
    };
    const onFocus = () => {
      handleVisibility();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [handleVisibility]);
};