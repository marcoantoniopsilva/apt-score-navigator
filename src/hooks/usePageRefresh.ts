import { useEffect, useRef } from 'react';

/**
 * Hook para fazer refresh automático da página quando:
 * - Usuário volta para a aba (visibilitychange)
 * - Usuário reabre a página
 * O refresh acontece apenas uma vez por sessão
 */
export const usePageRefresh = () => {
  const hasRefreshedRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    // Marca como não sendo mais o carregamento inicial
    const timer = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 1000);

    const handleVisibilityChange = () => {
      // Se a página voltou a ficar visível e não é o carregamento inicial
      if (document.visibilityState === 'visible' && !isInitialLoadRef.current) {
        // Verifica se já foi feito refresh nesta sessão
        const hasRefreshedInSession = sessionStorage.getItem('page-refreshed');
        
        if (!hasRefreshedInSession && !hasRefreshedRef.current) {
          console.log('Usuário retornou à aba, fazendo refresh automático...');
          hasRefreshedRef.current = true;
          sessionStorage.setItem('page-refreshed', 'true');
          window.location.reload();
        }
      }
    };

    // Detecta quando o usuário volta para a aba
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Detecta quando a página é reaberta (não refresh manual)
    const handlePageShow = (event: PageTransitionEvent) => {
      // Se a página foi restaurada do cache (volta do histórico ou reabertura)
      if (event.persisted) {
        const hasRefreshedInSession = sessionStorage.getItem('page-refreshed');
        
        if (!hasRefreshedInSession && !hasRefreshedRef.current) {
          console.log('Página foi reaberta, fazendo refresh automático...');
          hasRefreshedRef.current = true;
          sessionStorage.setItem('page-refreshed', 'true');
          window.location.reload();
        }
      }
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  return {
    hasRefreshed: hasRefreshedRef.current
  };
};