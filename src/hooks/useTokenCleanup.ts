import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { debugLogger } from '@/utils/debugLogger';

/**
 * Hook para limpeza automática de tokens inválidos
 * Detecta e limpa refresh tokens corrompidos ou expirados
 */
export const useTokenCleanup = () => {
  const { session, signOut } = useAuth();

  const cleanupInvalidTokens = useCallback(async () => {
    try {
      // Verificar se há tokens no localStorage
      const storedSession = localStorage.getItem('sb-eepkixxqvelppxzfwoin-auth-token');
      
      if (!storedSession) {
        debugLogger.session('TokenCleanup', 'No stored session found');
        return;
      }

      const sessionData = JSON.parse(storedSession);
      
      // Se não há refresh_token mas há access_token, limpar
      if (sessionData.refresh_token === null && sessionData.access_token) {
        console.log('🧹 TokenCleanup: Removing invalid session data');
        localStorage.removeItem('sb-eepkixxqvelppxzfwoin-auth-token');
        return;
      }

      // Testar se o refresh token é válido
      if (sessionData.refresh_token) {
        try {
          const { error } = await supabase.auth.refreshSession({
            refresh_token: sessionData.refresh_token
          });
          
          if (error && error.message.includes('Invalid Refresh Token')) {
            console.log('🧹 TokenCleanup: Refresh token invalid, cleaning up');
            localStorage.removeItem('sb-eepkixxqvelppxzfwoin-auth-token');
            await signOut();
          }
        } catch (refreshError) {
          console.log('🧹 TokenCleanup: Error testing refresh token, cleaning up');
          localStorage.removeItem('sb-eepkixxqvelppxzfwoin-auth-token');
        }
      }
      
    } catch (error) {
      console.error('TokenCleanup error:', error);
    }
  }, [signOut]);

  // Executar limpeza na inicialização
  useEffect(() => {
    const timer = setTimeout(cleanupInvalidTokens, 1000);
    return () => clearTimeout(timer);
  }, [cleanupInvalidTokens]);

  // Executar limpeza quando detectar problemas de sessão
  useEffect(() => {
    if (!session) {
      cleanupInvalidTokens();
    }
  }, [session, cleanupInvalidTokens]);

  return { cleanupInvalidTokens };
};