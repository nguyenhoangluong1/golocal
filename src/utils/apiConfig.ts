/**
 * API Configuration Utilities
 * Handles URL normalization and base URL construction
 */

/**
 * Normalize API URL - ensures it's a complete absolute URL
 * Handles cases where VITE_API_URL might be missing protocol or using http:// for production
 */
export const normalizeApiUrl = (url: string | undefined): string => {
  if (!url) {
    return 'http://localhost:5000/api';
  }

  // Production domains that should always use HTTPS
  const productionDomains = ['.railway.app', '.vercel.app', '.render.com', '.fly.dev', '.herokuapp.com'];
  const isProductionDomain = productionDomains.some(domain => url.includes(domain));

  // If URL already has protocol
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Force HTTPS for production domains (fix Mixed Content errors)
    if (isProductionDomain && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  }

  // If URL looks like a domain (contains dots and doesn't start with /)
  if (url.includes('.') && !url.startsWith('/')) {
    // Add https:// for production domains
    if (isProductionDomain) {
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
  const normalized = normalizeApiUrl(envUrl);
  
  // Runtime safety check: Force HTTPS for production domains
  // This is a double-check in case normalizeApiUrl didn't catch it
  const productionDomains = ['.railway.app', '.vercel.app', '.render.com', '.fly.dev', '.herokuapp.com'];
  const isProductionDomain = productionDomains.some(domain => normalized.includes(domain));
  
  if (isProductionDomain && normalized.startsWith('http://')) {
    console.warn('[apiConfig] Converting HTTP to HTTPS for production domain:', normalized);
    return normalized.replace('http://', 'https://');
  }
  
  return normalized;
};

/**
 * Get Auth base URL (without /api suffix)
 * Auth endpoints are at root level
 */
export const getAuthBaseUrl = (): string => {
  const apiUrl = getApiBaseUrl();
  let authUrl = apiUrl.replace('/api', '') || 'http://localhost:5000';
  
  // CRITICAL: Ensure HTTPS for production domains
  const productionDomains = ['.railway.app', '.vercel.app', '.render.com', '.fly.dev', '.herokuapp.com'];
  const isProductionDomain = productionDomains.some(domain => authUrl.includes(domain));
  
  if (isProductionDomain && authUrl.startsWith('http://')) {
    console.warn('[apiConfig] Converting HTTP to HTTPS for auth base URL:', authUrl);
    authUrl = authUrl.replace('http://', 'https://');
  }
  
  return authUrl;
};

/**
 * Normalize any URL to ensure HTTPS for production domains
 * Use this function for any URL that might be used with axios or fetch
 */
export const ensureHttps = (url: string): string => {
  if (!url) return url;
  
  const productionDomains = ['.railway.app', '.vercel.app', '.render.com', '.fly.dev', '.herokuapp.com'];
  const isProductionDomain = productionDomains.some(domain => url.includes(domain));
  
  if (isProductionDomain && url.startsWith('http://')) {
    console.warn('[apiConfig] ensureHttps: Converting HTTP to HTTPS:', url);
    return url.replace('http://', 'https://');
  }
  
  return url;
};

