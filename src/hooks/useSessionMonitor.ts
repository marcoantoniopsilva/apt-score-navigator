import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useSessionMonitor = (dependencies: {
  loadProperties?: () => Promise<void>;
  loadOnboardingData?: (userId: string) => Promise<void>;
  checkSubscription?: () => Promise<void>;
}) => {
  const { user, session } = useAuth();
  const lastValidationRef = useRef<number>(0);
  const wasTabInactive = useRef(false);

  // Monitor de visibilidade da aba
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasTabInactive.current = true;
        console.log('SessionMonitor: Tab became inactive');
      } else if (wasTabInactive.current && user) {
        console.log('SessionMonitor: Tab became active again, validating session...');
        validateAndReconnect();
        wasTabInactive.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Monitor periódico da sessão (apenas quando a aba está ativa)
  useEffect(() => {
    if (!user || !session) return;

    const intervalId = setInterval(() => {
      // Só valida se a aba está ativa e não foi validada recentemente
      if (!document.hidden && Date.now() - lastValidationRef.current > 30000) {
        validateSession();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(intervalId);
  }, [user, session]);

  const validateSession = async () => {
    try {
      lastValidationRef.current = Date.now();
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('SessionMonitor: Error validating session:', error);
        return;
      }

      if (!currentSession && user) {
        console.warn('SessionMonitor: Session lost but user still in context');
        // A sessão foi perdida - o AuthContext deve lidar com isso
        return;
      }

      if (currentSession && !user) {
        console.warn('SessionMonitor: Session exists but no user in context');
        // Há uma sessão mas não há usuário no contexto - possível dessincronia
        return;
      }

      console.log('SessionMonitor: Session validation successful');
    } catch (error) {
      console.error('SessionMonitor: Session validation failed:', error);
    }
  };

  const validateAndReconnect = async () => {
    try {
      console.log('SessionMonitor: Starting validation and reconnection...');
      
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('SessionMonitor: Session validation error:', error);
        return;
      }

      if (!currentSession) {
        console.warn('SessionMonitor: No valid session found');
        return;
      }

      console.log('SessionMonitor: Valid session confirmed, reconnecting hooks...');

      // Reconectar hooks de dados apenas se há uma sessão válida
      const reconnectPromises = [];

      if (dependencies.loadProperties) {
        console.log('SessionMonitor: Reconnecting property loader...');
        reconnectPromises.push(
          dependencies.loadProperties().catch(err => 
            console.error('SessionMonitor: Failed to reconnect properties:', err)
          )
        );
      }

      if (dependencies.loadOnboardingData && currentSession.user?.id) {
        console.log('SessionMonitor: Reconnecting onboarding data...');
        reconnectPromises.push(
          dependencies.loadOnboardingData(currentSession.user.id).catch(err => 
            console.error('SessionMonitor: Failed to reconnect onboarding:', err)
          )
        );
      }

      if (dependencies.checkSubscription) {
        console.log('SessionMonitor: Reconnecting subscription data...');
        reconnectPromises.push(
          dependencies.checkSubscription().catch(err => 
            console.error('SessionMonitor: Failed to reconnect subscription:', err)
          )
        );
      }

      // Executar reconexões em paralelo
      await Promise.allSettled(reconnectPromises);
      
      // Notificar outros hooks sobre a reconexão
      window.dispatchEvent(new CustomEvent('session-reconnected'));
      
      console.log('SessionMonitor: Reconnection completed');
    } catch (error) {
      console.error('SessionMonitor: Reconnection failed:', error);
    }
  };

  return { validateAndReconnect, validateSession };
};