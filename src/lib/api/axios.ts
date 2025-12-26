/**
 * Axios Configuration & Interceptors
 *
 * Base axios instance with interceptors for:
 * - Authentication (Bearer token)
 * - Error handling
 * - Request/Response logging
 */

import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// =====================================================
// BASE CONFIGURATION
// =====================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const TIMEOUT = 30000; // 30 seconds

/**
 * Create base axios instance
 */
function createAxiosInstance(baseURL: string = BASE_URL): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// =====================================================
// INTERCEPTORS
// =====================================================

/**
 * Request interceptor - Add auth token
 */
function addAuthInterceptor(instance: AxiosInstance): void {
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // For client-side requests, get token from cookies/localStorage
      if (typeof window !== 'undefined') {
        // Check if this is an admin request
        const isAdminRequest = config.baseURL?.includes('/admin') || config.url?.includes('/admin');

        if (isAdminRequest) {
          // For admin requests, use admin session token
          const adminToken = localStorage.getItem('admin_session_token');
          if (adminToken) {
            config.headers.Authorization = `Bearer ${adminToken}`;
          }
        } else {
          // For client requests, try to get Supabase session token
          const supabaseAuth = localStorage.getItem('supabase.auth.token');
          if (supabaseAuth) {
            try {
              const parsed = JSON.parse(supabaseAuth);
              const accessToken = parsed?.currentSession?.access_token;
              if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
              }
            } catch {
              // Invalid token format
            }
          }
        }
      }

      // Log request in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      }

      return config;
    },
    (error: AxiosError) => {
      console.error('[API] Request error:', error.message);
      return Promise.reject(error);
    }
  );
}

/**
 * Response interceptor - Handle errors
 */
function addErrorInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log response in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] Response ${response.status}:`, response.config.url);
      }
      return response;
    },
    async (error: AxiosError) => {
      const status = error.response?.status;
      const url = error.config?.url;

      // Log error
      console.error(`[API] Error ${status}:`, url, error.message);

      // Handle specific error codes
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          if (typeof window !== 'undefined' && !url?.includes('/auth/')) {
            console.warn('[API] Unauthorized, redirecting to login');
            // Could trigger logout here
          }
          break;

        case 403:
          // Forbidden
          console.warn('[API] Forbidden access');
          break;

        case 404:
          // Not found
          console.warn('[API] Resource not found');
          break;

        case 500:
        case 502:
        case 503:
          // Server error
          console.error('[API] Server error');
          break;
      }

      return Promise.reject(error);
    }
  );
}

/**
 * Retry interceptor - Retry failed requests
 */
function addRetryInterceptor(instance: AxiosInstance, maxRetries: number = 2): void {
  instance.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
      const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

      // Only retry on network errors or 5xx
      if (!config || !error.response || error.response.status < 500) {
        return Promise.reject(error);
      }

      config._retryCount = config._retryCount || 0;

      if (config._retryCount >= maxRetries) {
        return Promise.reject(error);
      }

      config._retryCount += 1;

      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, config._retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      console.log(`[API] Retrying request (${config._retryCount}/${maxRetries}):`, config.url);

      return instance(config);
    }
  );
}

// =====================================================
// AXIOS INSTANCES
// =====================================================

/**
 * Client-side API instance
 * Used for frontend API calls
 */
export const clientAxios = createAxiosInstance('/api');
addAuthInterceptor(clientAxios);
addErrorInterceptor(clientAxios);
addRetryInterceptor(clientAxios, 2);

/**
 * Admin-side API instance
 * Used for admin console API calls
 */
export const adminAxios = createAxiosInstance('/api/admin');
addAuthInterceptor(adminAxios);
addErrorInterceptor(adminAxios);
addRetryInterceptor(adminAxios, 2);

/**
 * Server-side API instance
 * Used for third-party integrations (no auth interceptor)
 */
export function createServerAxios(baseURL: string): AxiosInstance {
  const instance = createAxiosInstance(baseURL);
  addErrorInterceptor(instance);
  addRetryInterceptor(instance, 3);
  return instance;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Extract error message from axios error
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Try to get error message from response
    const responseError = error.response?.data?.error || error.response?.data?.message;
    if (responseError) return responseError;

    // Network error
    if (error.code === 'ERR_NETWORK') {
      return 'Network error. Please check your connection.';
    }

    // Timeout
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Check if error is a specific HTTP status
 */
export function isHttpError(error: unknown, status: number): boolean {
  return axios.isAxiosError(error) && error.response?.status === status;
}

export default clientAxios;
