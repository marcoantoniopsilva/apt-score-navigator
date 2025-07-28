import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para recuperação automática de problemas de sessão
 */
export const useAutoRecovery = () => {
  const { user, session } = useAuth();
  const { validateSession, refreshSession } = useSessionMonitor();
  const { toast } = useToast();
  const recoveryAttempts = useRef(0);
  const lastRecoveryTime = useRef(0);
  const maxRecoveryAttempts = 3;
  const recoveryInterval = 5 * 60 * 1000; // 5 minutos entre tentativas

  const attemptRecovery = useCallback(async (reason: string) => {
    const now = Date.now();
    
    // Limitar tentativas de recuperação
    if (now - lastRecoveryTime.current < recoveryInterval) {
      console.log('🚫 AutoRecovery: Too soon since last attempt');
      return false;
    }

    if (recoveryAttempts.current >= maxRecoveryAttempts) {
      console.log('🚫 AutoRecovery: Max attempts reached');
      toast({
        title: "Falha na recuperação automática",
        description: "Por favor, atualize a página e faça login novamente.",
        variant: "destructive",
      });
      return false;
    }

    console.log(`🔧 AutoRecovery: Attempting recovery due to: ${reason}`);
    recoveryAttempts.current++;
    lastRecoveryTime.current = now;

    try {
      // Primeiro, tentar validar a sessão atual
      const isValid = await validateSession();
      
      if (isValid) {
        console.log('✅ AutoRecovery: Session validation successful');
        recoveryAttempts.current = 0; // Reset counter on success
        return true;
      }

      // Se a validação falhar, tentar refresh
      console.log('🔄 AutoRecovery: Attempting session refresh');
      const refreshed = await refreshSession();
      
      if (refreshed) {
        console.log('✅ AutoRecovery: Session refresh successful');
        recoveryAttempts.current = 0; // Reset counter on success
        toast({
          title: "Sessão recuperada",
          description: "Sua sessão foi automaticamente restaurada.",
        });
        return true;
      }

      console.log('❌ AutoRecovery: Recovery failed');
      return false;

    } catch (error) {
      console.error('💥 AutoRecovery: Recovery error:', error);
      return false;
    }
  }, [validateSession, refreshSession, toast]);

  // Detectar mudanças de visibilidade da aba
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && session) {
        console.log('👁️ AutoRecovery: Tab became visible, checking session');
        
        // Aguardar um pouco antes de verificar para evitar rush
        setTimeout(() => {
          attemptRecovery('tab visibility change');
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, session, attemptRecovery]);

  // Detectar mudanças de foco da janela
  useEffect(() => {
    const handleWindowFocus = () => {
      if (user && session) {
        console.log('🎯 AutoRecovery: Window focused, checking session');
        
        setTimeout(() => {
          attemptRecovery('window focus');
        }, 1000);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [user, session, attemptRecovery]);

  // Reset contador quando usuário faz login/logout
  useEffect(() => {
    recoveryAttempts.current = 0;
    lastRecoveryTime.current = 0;
  }, [user?.id]);

  return {
    attemptRecovery,
    recoveryAttempts: recoveryAttempts.current,
    maxRecoveryAttempts
  };
};