import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Simplified tab focus manager - tracks visibility only
 * No complex custom events, just direct visibility tracking
 */
export const useTabFocusManager = () => {
  const [isTabActive, setIsTabActive] = useState(!document.hidden);
  const visibilityCallbacks = useRef<Array<(isVisible: boolean) => void>>([]);

  const handleVisibilityChange = useCallback(() => {
    const isVisible = !document.hidden;
    setIsTabActive(isVisible);
    
    console.log(`Tab became ${isVisible ? 'visible' : 'hidden'}`);
    
    // Directly call all registered callbacks
    visibilityCallbacks.current.forEach(callback => {
      try {
        callback(isVisible);
      } catch (error) {
        console.error('Error in visibility callback:', error);
      }
    });
  }, []);

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  // Register callback for visibility changes
  const registerVisibilityCallback = useCallback((callback: (isVisible: boolean) => void) => {
    visibilityCallbacks.current.push(callback);
    return () => {
      visibilityCallbacks.current = visibilityCallbacks.current.filter(cb => cb !== callback);
    };
  }, []);

  return {
    isTabActive,
    registerVisibilityCallback
  };
};