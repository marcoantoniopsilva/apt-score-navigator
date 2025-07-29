import { supabase } from '@/integrations/supabase/client';

export interface SessionState {
  isValid: boolean;
  needsRefresh: boolean;
  error?: string;
}

// Circuit breaker pattern for session validation
class SessionValidator {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly maxFailures = 3;
  private readonly timeout = 30000; // 30 seconds

  async validateSession(): Promise<SessionState> {
    // Circuit breaker - if too many failures, wait before trying again
    if (this.failureCount >= this.maxFailures) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure < this.timeout) {
        return { 
          isValid: false, 
          needsRefresh: false, 
          error: 'Circuit breaker open - too many failures' 
        };
      } else {
        // Reset circuit breaker
        this.failureCount = 0;
      }
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.recordFailure();
        return { isValid: false, needsRefresh: true, error: error.message };
      }

      if (!session) {
        return { isValid: false, needsRefresh: false };
      }

      // Check if token is about to expire (within 5 minutes)
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const fiveMinutes = 5 * 60;
      
      if (expiresAt && (expiresAt - now) < fiveMinutes) {
        return { isValid: true, needsRefresh: true };
      }

      // Reset failure count on success
      this.failureCount = 0;
      return { isValid: true, needsRefresh: false };

    } catch (error) {
      this.recordFailure();
      return { 
        isValid: false, 
        needsRefresh: true, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  reset() {
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

export const sessionValidator = new SessionValidator();

// Utility to check if error is related to authentication
export const isAuthError = (error: any): boolean => {
  if (!error) return false;
  
  const authErrorMessages = [
    'JWT expired',
    'Invalid token',
    'No session',
    'Unauthorized',
    'Authentication required',
    'Token has expired',
    'Invalid JWT'
  ];

  const errorMessage = error.message || error.toString() || '';
  return authErrorMessages.some(msg => 
    errorMessage.toLowerCase().includes(msg.toLowerCase())
  );
};

// Retry mechanism with exponential backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) break;
      
      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};