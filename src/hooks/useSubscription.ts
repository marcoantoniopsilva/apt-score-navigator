import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { retryWithBackoff, isAuthError } from '@/utils/sessionUtils';
import { useTabVisibility } from '@/hooks/useTabVisibility';
// Session restore removed for optimization

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

export const useSubscription = () => {
  const { user, session } = useAuth();
  const { onTabReactivated } = useTabVisibility();
  // Session restore removed for optimization
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    subscribed: false,
    subscription_tier: null,
    subscription_end: null,
  });
  const [loading, setLoading] = useState(true);
  const hasInitialized = useRef(false);
  const isCheckingRef = useRef(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const checkSubscription = useCallback(async (isRetry = false) => {
    if (!user || !session) {
      console.log('useSubscription: No user or session, setting defaults');
      setSubscriptionData({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
      });
      setLoading(false);
      return;
    }

    // Prevent concurrent subscription checks
    if (isCheckingRef.current && !isRetry) {
      console.log('useSubscription: Already checking subscription, skipping...');
      return subscriptionData; // Return current data instead of undefined
    }

    isCheckingRef.current = true;
    setLoading(true);
    setSessionError(null);

    try {
      console.log('useSubscription: Checking subscription status...');
      
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          throw new Error(error.message || 'Failed to check subscription');
        }

        return data;
      }, 2, 1000);

      if (result) {
        const newSubscriptionData = {
          subscribed: result.subscribed || false,
          subscription_tier: result.subscription_tier || null,
          subscription_end: result.subscription_end || null,
        };
        
        console.log('useSubscription: Subscription data updated:', newSubscriptionData);
        setSubscriptionData(newSubscriptionData);
      }

    } catch (error: any) {
      console.error('useSubscription: Failed to check subscription:', error);
      
      // Check if it's an authentication error
      if (isAuthError(error)) {
        console.warn('useSubscription: Authentication error detected');
        setSessionError('Sessão expirada. Faça login novamente para continuar.');
        
        // Don't show toast on retry attempts to avoid spam
        if (!isRetry) {
          toast.error('Sessão expirada. Faça login novamente.');
        }
      }
      
      // Set fallback data for any error
      setSubscriptionData({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
      });

      // Implementar fallback automático em caso de falha
      if (!isRetry) {
        console.log('useSubscription: Agendando retry automático em 5 segundos...');
        setTimeout(() => {
          console.log('useSubscription: Executando retry automático...');
          checkSubscription(true);
        }, 5000);
      }
      
    } finally {
      setLoading(false);
      isCheckingRef.current = false;
    }
  }, [user, session]);

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
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      throw error;
    }
  };

  // Session restore callback removed for optimization

  // Initialize subscription check when user becomes available
  useEffect(() => {
    if (user && session && !hasInitialized.current) {
      hasInitialized.current = true;
      setSessionError(null);
      console.log('useSubscription: User authenticated, checking subscription');
      checkSubscription();
    } else if (!user && !session) {
      // Reset when user logs out
      hasInitialized.current = false;
      isCheckingRef.current = false;
      setSessionError(null);
      console.log('useSubscription: User logged out, resetting subscription data');
      setSubscriptionData({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
      });
      setLoading(false);
    }
  }, [user, session, checkSubscription]);

  // Reagir à reativação da aba
  useEffect(() => {
    const cleanup = onTabReactivated(() => {
      console.log('useSubscription: Aba reativada - revalidando subscription');
      checkSubscription();
    });

    return cleanup;
  }, [onTabReactivated, checkSubscription]);

  const isPro = subscriptionData.subscribed;

  return {
    ...subscriptionData,
    isPro,
    loading,
    sessionError,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};