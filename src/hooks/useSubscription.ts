import { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user || !session) {
      setSubscriptionData({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('useSubscription: Verificando assinatura para usuário:', user.id);
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('useSubscription: Erro ao verificar assinatura:', error);
        // Em caso de erro, manter estado anterior em vez de resetar
        return;
      }

      if (data) {
        const newSubscriptionData = {
          subscribed: data.subscribed || false,
          subscription_tier: data.subscription_tier || null,
          subscription_end: data.subscription_end || null,
        };
        
        console.log('useSubscription: Dados da assinatura recebidos:', newSubscriptionData);
        setSubscriptionData(newSubscriptionData);
      }
    } catch (error) {
      console.error('useSubscription: Erro geral ao verificar assinatura:', error);
      // Em caso de erro, não resetar o estado
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async (planType: 'monthly' | 'annual') => {
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
  };

  const openCustomerPortal = async () => {
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
  };

  useEffect(() => {
    console.log('useSubscription: useEffect disparado - user:', !!user, 'session:', !!session);
    checkSubscription();
    
    // Listener para quando a página volta a ter foco
    const handleFocus = () => {
      console.log('useSubscription: Página voltou ao foco, revalidando assinatura');
      if (user && session) {
        checkSubscription();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id, session?.access_token]); // Dependências mais específicas

  const isPro = subscriptionData.subscribed;

  return {
    ...subscriptionData,
    isPro,
    loading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};