import { useEffect, useCallback, useRef } from 'react';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';
import { useQueryClient } from '@tanstack/react-query';

export const useSessionRefetchOnVisibility = () => {
  const { validateSession, refreshSession } = useSessionMonitor();
  const queryClient = useQueryClient();

  const isHandlingRef = useRef(false);

  const attemptRecovery = useCallback(async () => {
    const valid = await validateSession();
    if (valid) return true;

    const refreshed = await refreshSession();
    return refreshed;
  }, [validateSession, refreshSession]);

  const handleVisibility = useCallback(async () => {
    if (isHandlingRef.current) return;
    isHandlingRef.current = true;

    try {
      const recovered = await attemptRecovery();
      if (recovered) {
        console.log('✅ Sessão OK - refetching todas as queries a