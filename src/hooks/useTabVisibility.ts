import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para detectar mudanças de visibilidade da aba e reagir adequadamente
 * Implementa os requisitos específicos do usuário para evitar problemas após tab switch
 */
export const useTabVisibility = () => {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();
  const isReactivatingRef = useRef(false);
  const lastVisibilityChangeRef = useRef(Date.now());

  const validateAuth = useCallback(async () => {
    console.log('🔍 Validando autenticação após reativação da aba...');
    
    // Verifica se a sessão ainda é válida
    if (!session || !user) {
      console.warn('⚠️ Sessão não encontrada após reativação da aba');
      return false;
    }

    // Verifica se o token ainda não expirou
    const now = Math.floor(Date.now() / 1000);
    const tokenExpiry = session.expires_at;
    
    if (tokenExpiry && now >= tokenExpiry) {
      console.warn('⚠️ Token expirado após reativação da aba');
      return false;
    }

    console.log('✅ Autenticação válida após reativação da aba');
    return true;
  }, [session, user]);

  const handleTabReactivation = useCallback(async () => {
    if (isReactivatingRef.current) {
      console.log('🔄 Reativação já em progresso, ignorando...');
      return;
    }

    console.log('🔄 Aba reativada - iniciando processo de atualização');
    isReactivatingRef.current = true;

    try {
      // 1. Validar autenticação
      const isAuthValid = await validateAuth();
      if (!isAuthValid) {
        console.error('❌ Autenticação inválida, redirecionando para login...');
        // Aqui você pode adicionar lógica para redirecionar para login
        return;
      }

      // 2. Invalidar e refazer queries críticas
      console.log('🔄 Refetch iniciado - invalidando queries...');
      
      // Invalida queries específicas baseadas no usuário
      if (user?.id) {
        // Invalidar todas as queries do usuário
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return Array.isArray(queryKey) && queryKey.includes(user.id);
          }
        });
        
        // Invalidar queries específicas
        await queryClient.invalidateQueries({
          queryKey: ['properties', user.id]
        });
        
        await queryClient.invalidateQueries({
          queryKey: ['criteria', true, user.id]
        });

        await queryClient.invalidateQueries({
          queryKey: ['subscription', user.id]
        });

        // Invalidar cache de edge functions que podem ter falhado
        await queryClient.invalidateQueries({
          queryKey: ['extract-property-data']
        });
      }

      // 3. Refazer queries críticas
      console.log('🔄 Refazendo queries críticas...');
      await queryClient.refetchQueries({
        type: 'active',
        stale: true
      });

      // 4. Disparar evento customizado para hooks que precisam reagir
      window.dispatchEvent(new CustomEvent('tab-reactivated', {
        detail: { userId: user?.id, timestamp: Date.now() }
      }));

      console.log('✅ Processo de reativação concluído com sucesso');

    } catch (error) {
      console.error('❌ Erro durante processo de reativação:', error);
      
      // Fallback: tentar refazer queries básicas
      try {
        console.log('🔄 Tentando fallback básico...');
        await queryClient.invalidateQueries();
        console.log('✅ Fallback básico executado');
      } catch (fallbackError) {
        console.error('❌ Falha no fallback:', fallbackError);
      }
    } finally {
      isReactivatingRef.current = false;
    }
  }, [queryClient, user?.id, validateAuth]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now();
      const timeSinceLastChange = now - lastVisibilityChangeRef.current;
      
      if (document.visibilityState === 'visible') {
        console.log('👁️ Aba ficou visível');
        
        // Só reativa se passou tempo suficiente desde a última mudança (evita spam)
        if (timeSinceLastChange > 1000) { // 1 segundo
          handleTabReactivation();
        }
      } else {
        console.log('👁️ Aba ficou oculta');
      }
      
      lastVisibilityChangeRef.current = now;
    };

    // Adiciona listener para mudanças de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Adiciona listener para foco da janela (fallback adicional)
    const handleWindowFocus = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const timeSinceLastChange = now - lastVisibilityChangeRef.current;
        
        if (timeSinceLastChange > 2000) { // 2 segundos para focus
          console.log('🎯 Janela recebeu foco - validando estado');
          handleTabReactivation();
        }
      }
    };

    window.addEventListener('focus', handleWindowFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [handleTabReactivation]);

  // Função utilitária para componentes que querem reagir à reativação
  const onTabReactivated = useCallback((callback: () => void) => {
    const handleReactivation = () => {
      console.log('🔄 Executando callback de reativação...');
      callback();
    };

    window.addEventListener('tab-reactivated', handleReactivation);
    
    return () => {
      window.removeEventListener('tab-reactivated', handleReactivation);
    };
  }, []);

  return {
    onTabReactivated,
    isReactivating: isReactivatingRef.current
  };
};