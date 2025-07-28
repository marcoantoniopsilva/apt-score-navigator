import { supabase } from '@/integrations/supabase/client';

export interface SessionState {
  isValid: boolean;
  needsRefresh: boolean;
  error?: string;
}

// Simplified session validator without circuit breaker
class SessionValidator {
  private isValidating = false;

  async validateSession(): Promise<SessionState> {
    // Prevent concurrent validations
    if (this.isValidating) {
      console.log('Session validation already in progress, skipping...');
      return { isValid: true, needsRefresh: false };
    }

    this.isValidating = true;
    
    try {
      console.log('SessionValidator: Starting session validation...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('SessionValidator: Session error:', error.message);
        return { isValid: false, needsRefresh: true, error: error.message };
      }

      if (!session) {
        console.log('SessionValidator: No session found');
        return { isValid: false, needsRefresh: false };
      }

      // Check if token is about to expire (within 5 minutes)
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const fiveMinutes = 5 * 60;
      
      if (expiresAt && (expiresAt - now) < fiveMinutes) {
        console.log('SessionValidator: Session expires soon, needs refresh');
        return { isValid: true, needsRefresh: true };
      }

      console.log('SessionValidator: Session is valid');
      return { isValid: true, needsRefresh: false };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('SessionValidator: Validation failed:', errorMessage);
      return { 
        isValid: false, 
        needsRefresh: true, 
        error: errorMessage
      };
    } finally {
      this.isValidating = false;
    }
  }

  reset() {
    this.isValidating = false;
    console.log('SessionValidator: Reset validation state');
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