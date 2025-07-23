import { useState, useEffect, useCallback } from 'react';

export const useTabVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [wasHidden, setWasHidden] = useState(false);

  const handleVisibilityChange = useCallback(() => {
    const isCurrentlyVisible = !document.hidden;
    setIsVisible(isCurrentlyVisible);
    
    if (!isCurrentlyVisible) {
      setWasHidden(true);
    } else if (wasHidden) {
      // Tab became visible after being hidden
      // This is when we want to trigger revalidations
      setTimeout(() => {
        // Reset the wasHidden flag after a brief delay
        setWasHidden(false);
      }, 100);
    }
  }, [wasHidden]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  return {
    isVisible,
    wasHidden,
    isReturning: isVisible && wasHidden, // True when tab just became visible after being hidden
  };
};