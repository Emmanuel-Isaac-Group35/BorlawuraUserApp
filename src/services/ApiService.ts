import { PostgrestError } from '@supabase/supabase-js';
import { MessagingService } from './MessagingService';

/**
 * Standardized Response format for all API calls.
 */
export interface ApiResponse<T> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: any;
  } | null;
  status: number;
}

/**
 * ApiService provides a standardized layer for all backend interactions.
 * It implements retry logic, error normalization, and logging.
 */
export class ApiService {
  private static MAX_RETRIES = 3;

  /**
   * Executes a database/API call with built-in retry logic.
   */
  static async execute<T>(
    operation: () => Promise<{ data: T | null; error: PostgrestError | Error | null }>,
    context?: string
  ): Promise<ApiResponse<T>> {
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await operation();
        
        if (!error) {
          return { data, error: null, status: 200 };
        }

        lastError = error;
        
        // If it's a network error, we might want to retry.
        // For Postgres errors, we usually shouldn't retry unless it's a transient connection issue.
        if (this.isTransientError(error)) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        break; // Non-transient error, stop retrying
      } catch (e) {
        lastError = e;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Standardized Error Normalization
    const errorMessage = lastError?.message || 'An unexpected error occurred';
    
    // Log the error to the audit trail for security tracking
    await MessagingService.logAudit('API_ERROR', context || 'unknown', { error: lastError });

    return {
      data: null,
      error: {
        message: errorMessage,
        code: (lastError as any)?.code || 'API_ERROR',
        details: lastError
      },
      status: 500
    };
  }

  private static isTransientError(error: any): boolean {
    const transientCodes = ['P0001', '57P01', '40001']; // Example Postgres transient codes
    return transientCodes.includes(error?.code) || error?.message?.includes('Network request failed');
  }
}
