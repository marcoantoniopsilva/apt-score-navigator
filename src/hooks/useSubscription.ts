
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isCheckingRef = useRef(false);
  const lastCheckedRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const CHECK_COOLDOWN = 30000; // 30 segundos
  
  const checkSubscription = useCallback(async (force = false) => {
    console.log('useSubscription: checkSubscription called - user:', !!user, 'session:', !!session, 'force:', force);
    
    if (!user || !session) {
      console.log('useSubscription: No user or session, setting default state');
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
      console.log('useSubscription: Already checking, skipping');
      return;
    }
    
    // Verificar cooldown a menos que seja forçado
    const now = Date.now();
    if (!force && lastCheckedRef.current && now - lastCheckedRef.current < CHECK_COOLDOWN) {
      console.log('useSubscription: Cooldown active, skipping');
      return;
    }
    
    try {
      isCheckingRef.current = true;
      setLoading(true);
      setError(null);
      console.log('useSubscription: Starting subscription check for user:', user.id);
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!mountedRef.current) {
        console.log('useSubscription: Component unmounted, aborting');
        return;
      }

      if (error) {
        console.error('useSubscription: Error checking subscription:', error);
        setError('Erro ao verificar assinatura');
        return;
      }

      if (data) {
        const newSubscriptionData = {
          subscribed: data.subscribed || false,
          subscription_tier: data.subscription_tier || null,
          subscription_end: data.subscription_end || null,
        };
        
        console.log('useSubscription: Subscription data received:', newSubscriptionData);
        setSubscriptionData(newSubscriptionData);
      }
      
      lastCheckedRef.current = Date.now();
    } catch (error) {
      console.error('useSubscription: Caught error:', error);
      if (mountedRef.current) {
        setError('Erro ao verificar assinatura');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      isCheckingRef.current = false;
    }
  }, [user?.id, session?.access_token]);

  useEffect(() => {
    console.log('useSubscription: useEffect triggered - user:', !!user, 'session:', !!session);
    
    mountedRef.current = true;
    
    if (user && session) {
      // Delay inicial para dar tempo do auth se estabilizar
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          console.log('useSubscription: Checking subscription after delay');
          checkSubscription();
        }
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        mountedRef.current = false;
      };
    } else {
      console.log('useSubscription: No user/session, setting loading to false');
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
    checkSubscription: () => checkSubscription(true),
    createCheckout,
    openCustomerPortal,
  };
};
