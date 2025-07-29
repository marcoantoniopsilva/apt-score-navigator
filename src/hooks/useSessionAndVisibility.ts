import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export const useSessionAndVisibility = () => {
  const { user, session } = useAuth();
  const { validateSession, refreshSession } = useSessionMonitor();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Flag para evitar execuções concorrentes
  const isHandlingRef = useRef(false);

  // Função que valida/renova a sessão
  const attemptRecovery = useCallback(async (source: string): Promise<boolean> => {
    console.log(`🔄 Tentando recovery por: ${source}`);

    // 1) Tenta validar sessão (exemplo, pode ser sua lógica)
    const isValid = await validateSession();
    if (isValid) {
      console.log('✅ Sessão válida');
      return true;
    }

    // 2) Se inválida, tenta renovar
    const refreshed = await refreshSession();
    if (refreshed) {
      console.log('✅ Sessão renovada com sucesso');
      return true;
    }

    // 3) Se não conseguiu validar nem renovar, falhou
    console.warn('❌ Falha ao validar/renovar sessão');
    toast({
      title: 'Sessão expirada',
      description: 'Por favor, faça login novamente.',
      variant: 'destructive',
    });

    return false;
  }, [validateSession, refreshSession, toast]);

  // Função que vai rodar quando aba ou janela ficar ativa
  const handleVisibilityAndFocus = useCallback(async () => {
    if (isHandlingRef.current) {
      console.log('⏳ Reativação já em andamento, ignorando...');
      return;
    }
    isHandlingRef.current = true;

    try {
      const recovered = await attemptRecovery('visibility/focus event');
      if (!recovered) {
        // Aqui você pode colocar redirecionamento para login, se quiser
        // Exemplo: window.location.href = '/login';
        return;
      }

      // Sessão OK, pode refetchar queries críticas
      console.log('🚀 Refetch queries após validação da sessão');
      await queryClient.refetchQueries({ type: 'active' });

      // Dispara evento customizado se precisar (exemplo)
      window.dispatchEvent(new Event('tab-reactivated'));
    } catch (error) {
      console.error('Erro no handleVisibilityAndFocus:', error);
    } finally {
      isHandlingRef.current = false;
    }
  }, [attemptRecovery, queryClient]);

  useEffect(() => {
    // Escuta quando aba fica visível
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleVisibilityAndFocus();
      }
    };

    // Escuta quando a janela ganha foco
    const onFocus = () => {
      handleVisibilityAndFocus();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
  }, [handleVisibilityAndFocus]);

  return null; // Hook não precisa retornar nada
};