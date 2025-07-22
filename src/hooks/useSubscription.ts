import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

export const useSubscription = () => {
  const { user, session } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    subscribed: false,
    subscription_tier: null,
    subscription_end: null,
  });
  const [loading, setLoading] = useState(false); // Iniciar como false para evitar carregamento infinito
  const [error, setError] = useState<string | null>(null);
  
  // Refs para controle de requisições e estado
  const isCheckingRef = useRef(false);
  const lastCheckedRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // Apenas fazer requisição a cada 30 segundos no máximo
  const CHECK_COOLDOWN = 30000; // 30 segundos
  
  const checkSubscription = useCallback(async (force = false) => {
    if (!user || !session) {
      setSubscriptionData({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
      });
      setLoading(false);
      setError(null);
      return;
    }
    
    // Evitar requisições simultâneas
    if (isCheckingRef.current) {
      console.log('useSubscription: Já existe uma verificação em andamento');
      return;
    }
    
    // Verificar cooldown a menos que seja forçado
    const now = Date.now();
    if (!force && lastCheckedRef.current && now - lastCheckedRef.current < CHECK_COOLDOWN) {
      console.log('useSubscription: Verificação muito recente, ignorando');
      return;
    }
    
    try {
      isCheckingRef.current = true;
      setLoading(true);
      setError(null);
      console.log('useSubscription: Verificando assinatura para usuário:', user.id);
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      // Verificar se o componente ainda está montado
      if (!mountedRef.current) return;

      if (error) {
        console.error('useSubscription: Erro ao verificar assinatura:', error);
        setError('Erro ao verificar assinatura');
        // Em caso de erro, manter estado anterior
        return;
      }

      if (data) {
        const newSubscriptionData = {
          subscribed: data.subscribed || false,
          subscription_tier: data.subscription_tier || null,
          subscription_end: data.subscription_end || null,
        };
        
        console.log('useSubscription: Dados da assinatura recebidos:', newSubscriptionData);
        
        // Atualizar apenas se os dados realmente mudaram para evitar re-renders desnecessários
        if (JSON.stringify(subscriptionData) !== JSON.stringify(newSubscriptionData)) {
          setSubscriptionData(newSubscriptionData);
        }
      }
      
      // Marcar última verificação
      lastCheckedRef.current = Date.now();
    } catch (error) {
      console.error('useSubscription: Erro geral ao verificar assinatura:', error);
      if (mountedRef.current) {
        setError('Erro ao verificar assinatura');
      }
      // Em caso de erro, não resetar o estado
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      isCheckingRef.current = false;
    }
  }, [user?.id, session?.access_token, subscriptionData]);

  useEffect(() => {
    console.log('useSubscription: useEffect disparado - user:', !!user, 'session:', !!session);
    
    mountedRef.current = true;
    // Verificar assinatura apenas uma vez na montagem, 
    // não a cada vez que a visibilidade muda
    if (user && session) {
      checkSubscription();
    } else {
      setLoading(false);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [user?.id, session?.access_token, checkSubscription]);

  const createCheckout = useCallback(async (planType: 'monthly' | 'annual') => {
    if (!user || !session) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Error creating checkout session');
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  }, [user?.id, session?.access_token]);

  const openCustomerPortal = useCallback(async () => {
    if (!user || !session) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Error opening customer portal');
      }

      if (data?.url) {
        // Open customer portal in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      throw error;
    }
  }, [user?.id, session?.access_token]);

  const isPro = subscriptionData.subscribed;

  return {
    ...subscriptionData,
    isPro,
    loading,
    error,
    checkSubscription: () => checkSubscription(true), // Função pública sempre força verificação
    createCheckout,
    openCustomerPortal,
  };
};