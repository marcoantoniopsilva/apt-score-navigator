import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { debugLogger } from '@/utils/debugLogger';

/**
 * Hook para monitoramento ativo da sessão com detecção de problemas
 */
export const useSessionMonitor = () => {
  const { session, user } = useAuth();
  const { toast } = useToast();
  const lastSessionCheckRef = useRef<number>(0);
  const isCheckingRef = useRef(false);

  const checkSessionHealth = useCallback(async () => {
    // Evitar verificações muito frequentes
    const now = Date.now();
    if (now - lastSessionCheckRef.current < 30000) { // 30 segundos
      return { isHealthy: true, needsRefresh: false };
    }

    if (isCheckingRef.current) {
      return { isHealthy: true, needsRefresh: false };
    }

    isCheckingRef.current = true;
    lastSessionCheckRef.current = now;

    try {
      debugLogger.session('SessionMonitor', 'Checking session health...');
      
      // Verificar se temos sessão local
      if (!session || !user) {
        debugLogger.warning('SessionMonitor', 'No local session/user');
        return { isHealthy: false, needsRefresh: false };
      }

      // Verificar sessão no Supabase
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ SessionMonitor: Session check error:', error);
        return { isHealthy: false, needsRefresh: true, error: error.message };
      }

      if (!currentSession) {
        console.log('❌ SessionMonitor: No session in Supabase');
        return { isHealthy: false, needsRefresh: false };
      }

      // Verificar se o token está próximo do vencimento
      const expiresAt = currentSession.expires_at;
      if (expiresAt) {
        const timeUntilExpiry = expiresAt * 1000 - Date.now();
        if (timeUntilExpiry < 5 * 60 * 1000) { // 5 minutos
          console.log('⚠️ SessionMonitor: Session expires soon');
          return { isHealthy: true, needsRefresh: true };
        }
      }

      // Testar se conseguimos fazer uma chamada autenticada
      try {
        const { error: testError } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1);
        
        if (testError && testError.message.includes('JWT')) {
          console.log('❌ SessionMonitor: JWT validation failed');
          return { isHealthy: false, needsRefresh: true };
        }
      } catch (testError) {
        console.log('❌ SessionMonitor: Auth test failed');
        return { isHealthy: false, needsRefresh: true };
      }

      console.log('✅ SessionMonitor: Session is healthy');
      return { isHealthy: true, needsRefresh: false };

    } catch (error) {
      console.error('💥 SessionMonitor: Health check failed:', error);
      return { 
        isHealthy: false, 
        needsRefresh: true, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      isCheckingRef.current = false;
    }
  }, [session, user]);

  const refreshSession = useCallback(async () => {
    try {
      console.log('🔄 SessionMonitor: Refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ SessionMonitor: Refresh failed:', error);
        toast({
          title: "Erro de sessão",
          description: "Sua sessão expirou. Por favor, faça login novamente.",
          variant: "destructive",
        });
        return false;
      }

      if (data.session) {
        console.log('✅ SessionMonitor: Session refreshed successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('💥 SessionMonitor: Refresh error:', error);
      return false;
    }
  }, [toast]);

  // Monitoramento contínuo
  useEffect(() => {
    if (!session || !user) return;

    const interval = setInterval(async () => {
      const health = await checkSessionHealth();
      
      if (!health.isHealthy && health.needsRefresh) {
        console.log('🚨 SessionMonitor: Session unhealthy, attempting refresh');
        const refreshed = await refreshSession();
        
        if (!refreshed) {
          toast({
            title: "Sessão expirada",
            description: "Por favor, atualize a página e faça login novamente.",
            variant: "destructive",
          });
        }
      }
    }, 2 * 60 * 1000); // Verificar a cada 2 minutos

    return () => clearInterval(interval);
  }, [session, user, checkSessionHealth, refreshSession, toast]);

  // Verificação on-demand
  const validateSession = useCallback(async () => {
    const health = await checkSessionHealth();
    
    if (!health.isHealthy) {
      if (health.needsRefresh) {
        const refreshed = await refreshSession();
        return refreshed;
      }
      return false;
    }
    
    return true;
  }, [checkSessionHealth, refreshSession]);

  return {
    checkSessionHealth,
    refreshSession,
    validateSession
  };
};