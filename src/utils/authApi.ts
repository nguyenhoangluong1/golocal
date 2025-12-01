/**
 * Auth API Client
 * Dedicated axios instance for auth endpoints with HTTPS enforcement
 */
import axios from 'axios';
import { getAuthBaseUrl, ensureHttps } from './apiConfig';

// Auth endpoints are at root level (no /api prefix)
// CRITICAL: Normalize URL to ensure HTTPS
let AUTH_BASE_URL = getAuthBaseUrl();
AUTH_BASE_URL = ensureHttps(AUTH_BASE_URL);

// CRITICAL: Create a dedicated axios instance for auth endpoints with HTTPS enforcement
export const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// CRITICAL: Add interceptor to force HTTPS for production domains
authApi.interceptors.request.use(
  (config) => {
    const productionDomains = ['.railway.app', '.vercel.app', '.render.com', '.fly.dev', '.herokuapp.com'];
    
    // Fix baseURL if needed
    if (config.baseURL) {
      const isProductionDomain = productionDomains.some(domain => config.baseURL!.includes(domain));
      if (isProductionDomain && config.baseURL.startsWith('http://')) {
        console.warn('[authApi] Converting HTTP to HTTPS (baseURL):', config.baseURL);
        config.baseURL = config.baseURL.replace('http://', 'https://');
      }
    }
    
    // Fix absolute URLs in config.url
    if (config.url && (config.url.startsWith('http://') || config.url.startsWith('https://'))) {
      const isProductionDomain = productionDomains.some(domain => config.url!.includes(domain));
      if (isProductionDomain && config.url.startsWith('http://')) {
        console.warn('[authApi] Converting HTTP to HTTPS (url):', config.url);
        config.url = config.url.replace('http://', 'https://');
      }
    }
    
    // Log final URL for debugging (only in production)
    if (import.meta.env.PROD) {
      const finalUrl = (config.baseURL || '') + (config.url || '');
      if (finalUrl.includes('.railway.app') || finalUrl.includes('.vercel.app')) {
        console.log('[authApi] Request URL:', finalUrl);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Export AUTH_BASE_URL for backward compatibility (if needed)
export { AUTH_BASE_URL };

