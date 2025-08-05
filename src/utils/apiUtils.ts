import { supabase } from '@/integrations/supabase/client';

interface ApiCallOptions {
  retries?: number;
  timeout?: number;
  refreshOnAuth?: boolean;
}

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

// Enhanced API wrapper with session management
export const apiCall = async <T>(
  apiFunction: () => Promise<T>,
  options: ApiCallOptions = {}
): Promise<T> => {
  const { retries = 2, timeout = 10000, refreshOnAuth = true } = options;

  const executeWithTimeout = async (): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });

    return Promise.race([apiFunction(), timeoutPromise]);
  };

  try {
    return await retryWithBackoff(executeWithTimeout, retries);
  } catch (error) {
    console.error('API call failed:', error);

    // If it's an auth error and refresh is enabled, try to refresh session
    if (refreshOnAuth && isAuthError(error)) {
      console.log('Attempting session refresh due to auth error');
      
      try {
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !session) {
          console.error('Session refresh failed:', refreshError);
          throw new Error('Session expired. Please log in again.');
        }

        console.log('Session refreshed successfully, retrying API call');
        
        // Retry the API call once after refresh
        return await executeWithTimeout();
        
      } catch (refreshError) {
        console.error('Session refresh error:', refreshError);
        throw new Error('Session expired. Please log in again.');
      }
    }

    throw error;
  }
};

// Supabase query wrapper with automatic error handling
export const supabaseQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: ApiCallOptions = {}
): Promise<T> => {
  return apiCall(async () => {
    const { data, error } = await queryFn();
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    if (data === null) {
      throw new Error('No data returned from query');
    }
    
    return data;
  }, options);
};

// Function invocation wrapper with session management
export const supabaseFunction = async <T>(
  functionName: string,
  args?: any,
  options: ApiCallOptions = {}
): Promise<T> => {
  return apiCall(async () => {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: args
    });
    
    if (error) {
      console.error(`Function ${functionName} error:`, error);
      throw error;
    }
    
    return data;
  }, options);
};