import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for managing tab focus and visibility changes
 * Prevents race conditions and excessive API calls during tab switching
 */
export const useTabFocusManager = () => {
  const lastVisibilityChange = useRef<number>(0);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTabActive = useRef<boolean>(true);

  const debounceDelay = 1000; // 1 second debounce

  const handleVisibilityChange = useCallback(() => {
    const now = Date.now();
    lastVisibilityChange.current = now;
    isTabActive.current = !document.hidden;

    // Clear any pending focus timeout
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }

    if (!document.hidden) {
      console.log('Tab became visible');
      // Debounce focus event to prevent excessive calls
      focusTimeoutRef.current = setTimeout(() => {
        if (isTabActive.current && Date.now() - lastVisibilityChange.current >= debounceDelay) {
          console.log('Tab focus stabilized - dispatching refresh event');
          window.dispatchEvent(new CustomEvent('tab-focus-stabilized'));
        }
      }, debounceDelay);
    } else {
      console.log('Tab became hidden');
    }
  }, []);

  const handleWindowFocus = useCallback(() => {
    const now = Date.now();
    
    // Only process if enough time has passed since last visibility change
    if (now - lastVisibilityChange.current >= debounceDelay && isTabActive.current) {
      console.log('Window focused and tab active');
      window.dispatchEvent(new CustomEvent('tab-focus-stabilized'));
    }
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [handleVisibilityChange, handleWindowFocus]);

  const registerFocusCallback = useCallback((callback: () => void) => {
    const handleFocusStabilized = () => {
      try {
        callback();
      } catch (error) {
        console.error('Error in focus callback:', error);
      }
    };

    window.addEventListener('tab-focus-stabilized', handleFocusStabilized);
    
    return () => {
      window.removeEventListener('tab-focus-stabilized', handleFocusStabilized);
    };
  }, []);

  return {
    isTabActive: isTabActive.current,
    registerFocusCallback
  };
};