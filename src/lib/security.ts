/**
 * Security utilities for CSRF protection and request signing
 */

// CSRF token management
let csrfToken: string | null = null;
let csrfTokenExpiry: number | null = null;
const CSRF_TOKEN_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Get or refresh CSRF token
 */
export async function getCsrfToken(): Promise<string> {
  // Skip CSRF for the new working endpoint
  if (import.meta.env.VITE_API_BASE_URL?.includes('tiktok-analyzer')) {
    return ''; // Return empty string for new endpoint
  }

  const now = Date.now();

  // Return cached token if still valid
  if (csrfToken && csrfTokenExpiry && now < csrfTokenExpiry) {
    return csrfToken;
  }

  try {
    const response = await fetch('/api/csrf', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get CSRF token');
    }

    const data = await response.json();
    csrfToken = data.csrfToken;
    csrfTokenExpiry = now + CSRF_TOKEN_DURATION;

    return csrfToken;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    throw error;
  }
}

/**
 * Create secure headers for API requests
 */
export async function createSecureHeaders(
  body?: any,
  includeAuth: boolean = true
): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add CSRF token
  try {
    const csrf = await getCsrfToken();
    headers['X-CSRF-Token'] = csrf;
  } catch (error) {
    console.warn('Could not get CSRF token:', error);
  }

  // Add auth header if available and requested
  if (includeAuth) {
    const authToken = localStorage.getItem('supabase.auth.token');
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
  }

  return headers;
}

/**
 * Secure fetch wrapper with automatic CSRF and error handling
 */
export async function secureFetch(
  url: string,
  options: RequestInit & { includeAuth?: boolean } = {}
): Promise<Response> {
  const { includeAuth = true, ...fetchOptions } = options;

  // Create secure headers
  const secureHeaders = await createSecureHeaders(
    fetchOptions.body,
    includeAuth
  );

  // Merge with existing headers
  const finalHeaders = {
    ...secureHeaders,
    ...fetchOptions.headers
  };

  const response = await fetch(url, {
    ...fetchOptions,
    headers: finalHeaders,
    credentials: 'include'
  });

  // Handle security errors
  if (response.status === 403) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.error === 'csrf_invalid') {
      // Clear cached CSRF token and retry once
      csrfToken = null;
      csrfTokenExpiry = null;

      const retryHeaders = await createSecureHeaders(
        fetchOptions.body,
        includeAuth
      );

      return fetch(url, {
        ...fetchOptions,
        headers: {
          ...retryHeaders,
          ...fetchOptions.headers
        },
        credentials: 'include'
      });
    }
  }

  return response;
}

/**
 * Rate limit tracker for client-side limiting
 */
interface RateLimitTracker {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimits: RateLimitTracker = {};
const CLIENT_RATE_LIMIT = 10; // requests per window
const CLIENT_RATE_WINDOW = 60 * 1000; // 1 minute

/**
 * Check client-side rate limit before making request
 */
export function checkClientRateLimit(endpoint: string): boolean {
  const now = Date.now();
  const key = endpoint;

  if (!rateLimits[key]) {
    rateLimits[key] = { count: 1, resetTime: now + CLIENT_RATE_WINDOW };
    return true;
  }

  const limit = rateLimits[key];

  // Reset if window expired
  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + CLIENT_RATE_WINDOW;
    return true;
  }

  // Check if limit exceeded
  if (limit.count >= CLIENT_RATE_LIMIT) {
    return false;
  }

  limit.count++;
  return true;
}

/**
 * Generate nonce for HMAC signing
 */
export function generateNonce(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Simple client-side logging for security events
 */
export function logSecurityEvent(event: string, details?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // In production, you might want to send this to a logging service
  console.log('[SECURITY]', logEntry);

  // Store critical events in localStorage for debugging (limit to 100 entries)
  try {
    const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    logs.push(logEntry);

    // Keep only last 100 entries
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }

    localStorage.setItem('security_logs', JSON.stringify(logs));
  } catch (error) {
    console.warn('Could not store security log:', error);
  }
}