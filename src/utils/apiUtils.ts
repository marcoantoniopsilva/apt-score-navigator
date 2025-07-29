import { supabase } from '@/integrations/supabase/client';
import { isAuthError, retryWithBackoff } from './sessionUtils';

interface ApiCallOptions {
  retries?: number;
  timeout?: number;
  refreshOnAuth?: boolean;
}

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
          // Notify components about session expiration
          window.dispatchEvent(new CustomEvent('session-expired'));
          throw new Error('Session expired. Please log in again.');
        }

        console.log('Session refreshed successfully, retrying API call');
        // Notify components about session refresh
        window.dispatchEvent(new CustomEvent('session-refreshed'));
        
        // Retry the API call once after refresh
        return await executeWithTimeout();
        
      } catch (refreshError) {
        console.error('Session refresh error:', refreshError);
        window.dispatchEvent(new CustomEvent('session-expired'));
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