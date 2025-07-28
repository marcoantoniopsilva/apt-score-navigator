import React from 'react';

/**
 * Ultra-simplified session manager - NO events, NO complex hooks
 * Just renders children without any session interference
 */
export const SimpleSessionManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};