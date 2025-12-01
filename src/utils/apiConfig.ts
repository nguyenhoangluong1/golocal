/**
 * API Configuration Utilities
 * Handles URL normalization and base URL construction
 */

/**
 * Normalize API URL - ensures it's a complete absolute URL
 * Handles cases where VITE_API_URL might be missing protocol
 */
export const normalizeApiUrl = (url: string | undefined): string => {
  if (!url) {
    return 'http://localhost:5000/api';
  }

  // If URL already has protocol, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If URL looks like a domain (contains dots and doesn't start with /)
  if (url.includes('.') && !url.startsWith('/')) {
    // Add https:// for production domains
    if (url.includes('.railway.app') || url.includes('.vercel.app') || url.includes('.')) {
      return `https://${url}`;
    }
  }

  // For relative paths or localhost without protocol
  if (url.startsWith('localhost') || url.startsWith('127.0.0.1')) {
    return `http://${url}`;
  }

  // Default: assume it's a relative path (for development)
  return url;
};

/**
 * Get API base URL (with /api suffix)
 */
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  return normalizeApiUrl(envUrl);
};

/**
 * Get Auth base URL (without /api suffix)
 * Auth endpoints are at root level
 */
export const getAuthBaseUrl = (): string => {
  const apiUrl = getApiBaseUrl();
  return apiUrl.replace('/api', '') || 'http://localhost:5000';
};

