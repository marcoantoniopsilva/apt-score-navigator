import { useEffect } from 'react';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';

export const TestSessionRenewal = () => {
  const { refreshSession } = useSessionMonitor();

  useEffect(() => {
    (async () => {
      const ok = await refreshSession();
      console.log('Teste de refreshSession:', ok ? 'Sucesso' : 'Falha');
    })();
  }, [refreshSession]);

  return null;
};