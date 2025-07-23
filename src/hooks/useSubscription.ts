import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const hasInitialized = useRef(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!user || !session) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        // Set fallback data instead of leaving in loading state
        setSubscriptionData({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
        });
        return;
      }

      if (data) {
        setSubscriptionData({
          subscribed: data.subscribed || false,
          subscription_tier: data.subscription_tier || null,
          subscription_end: data.subscription_end || null,
        });
      }
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      
      // Check if it's a session expiry error
      if (error.message?.includes('JWT') || error.message?.includes('expired') || error.message?.includes('invalid_token')) {
        console.warn('Session appears to be expired - user needs to login again');
        setSessionError('Sessão expirada. Faça login novamente para continuar.');
        toast.error('Sessão expirada. Faça login novamente.');
        
        // Set fallback data for expired session
        setSubscriptionData({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
        });
      } else {
        // Set fallback data for other errors
        setSubscriptionData({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
        });
      }
    } finally {
      setLoading(false);
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

  // Initialize subscription check when user is available or session changes
  useEffect(() => {
    if (user && session) {
      // Se a sessão mudou ou é a primeira vez
      if (!hasInitialized.current || sessionError) {
        console.log('useSubscription: Initializing or recovering from session error');
        hasInitialized.current = true;
        setSessionError(null); // Clear any previous session errors
        checkSubscription();
      }
    } else if (!user && !session) {
      // Reset when user logs out
      console.log('useSubscription: User logged out, resetting state');
      hasInitialized.current = false;
      setSessionError(null);
      setSubscriptionData({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
      });
      setLoading(false);
    }
  }, [user, session, sessionError, checkSubscription]);

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