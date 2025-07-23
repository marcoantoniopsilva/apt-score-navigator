import { useState, useEffect, useCallback, useRef } from 'react';
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
  const isCheckingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const checkSubscription = useCallback(async () => {
    if (!user || !session || isCheckingRef.current) {
      if (!user || !session) {
        setLoading(false);
      }
      return;
    }

    try {
      isCheckingRef.current = true;
      setLoading(true);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, 10000); // 10 second timeout
      });

      const requestPromise = supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const { data, error } = await Promise.race([requestPromise, timeoutPromise]) as any;

      // Clear timeout on successful response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

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
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Set fallback data instead of leaving in loading state
      setSubscriptionData({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
      });
    } finally {
      setLoading(false);
      isCheckingRef.current = false;
      // Clear timeout on completion
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
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
    checkSubscription();
  }, [checkSubscription]);

  // Handle page visibility changes - revalidate when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && session) {
        // Small delay to ensure session is stable after tab becomes visible
        setTimeout(() => {
          checkSubscription();
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [checkSubscription, user, session]);

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