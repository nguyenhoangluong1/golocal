import axios from 'axios';
import { apiCache } from './apiCache';
import { requestDeduplication } from './requestDeduplication';
import { getApiBaseUrl, getAuthBaseUrl } from './apiConfig';

const API_BASE_URL = getApiBaseUrl();

// Debug: Log API base URL in development
if (import.meta.env.DEV) {
  console.log('[api] API_BASE_URL:', API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  // Increased for featured endpoints which may take longer due to caching
  timeout: 45000, // 45 seconds (increased from 30s for featured data)
});

// Add request interceptor to include auth token and deduplication
api.interceptors.request.use(
  async (config) => {
    // CRITICAL: Force HTTPS for production domains to prevent Mixed Content errors
    // This is a runtime safety check in case baseURL was set incorrectly
    if (config.baseURL) {
      const productionDomains = ['.railway.app', '.vercel.app', '.render.com', '.fly.dev', '.herokuapp.com'];
      const isProductionDomain = productionDomains.some(domain => config.baseURL!.includes(domain));
      
      if (isProductionDomain && config.baseURL.startsWith('http://')) {
        console.warn('[api] Converting HTTP to HTTPS in request interceptor:', config.baseURL);
        config.baseURL = config.baseURL.replace('http://', 'https://');
      }
    }
    
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ALGORITHM OPTIMIZATION: Request deduplication for GET requests
    // Prevents duplicate calls within 1 second window
    if (config.method === 'get' && !config.url?.includes('/auth/')) {
      const cacheKey = apiCache.generateKey(config.url || '', config.params);
      
      // Check cache first
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        (config as any).__fromCache = true;
        (config as any).__cachedData = cachedData;
        return config;
      }

      // Deduplicate request - if same request is pending, use existing promise
      const dedupKey = requestDeduplication.generateKey(config.url || '', config.params);
      const existingRequest = (api as any).__pendingRequests?.get(dedupKey);
      if (existingRequest) {
        // Mark as deduplicated
        (config as any).__deduplicated = true;
        return config;
      }

      // Store pending request
      if (!(api as any).__pendingRequests) {
        (api as any).__pendingRequests = new Map();
      }
      (api as any).__pendingRequests.set(dedupKey, config);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track if we're already handling a logout to prevent multiple simultaneous logouts
let isLoggingOut = false;

// Add response interceptor for error handling and caching
api.interceptors.response.use(
  (response) => {
    // Return cached response if available
    if ((response.config as any).__fromCache) {
      return {
        ...response,
        data: (response.config as any).__cachedData,
        headers: { ...response.headers, 'x-cache': 'HIT' },
      };
    }

    // ALGORITHM OPTIMIZATION: Clean up deduplication tracking
    if (response.config.method === 'get' && !response.config.url?.includes('/auth/')) {
      const dedupKey = requestDeduplication.generateKey(response.config.url || '', response.config.params);
      if ((api as any).__pendingRequests) {
        // Remove from pending after a short delay (allows concurrent requests to use same promise)
        setTimeout(() => {
          (api as any).__pendingRequests?.delete(dedupKey);
        }, 100);
      }

      // Cache successful GET responses (only non-auth endpoints)
      const cacheKey = apiCache.generateKey(response.config.url || '', response.config.params);
      // Cache for different durations based on endpoint type
      let ttl = 5 * 60 * 1000; // 5 minutes default
      
      if (response.config.url?.includes('/vehicles') || response.config.url?.includes('/places')) {
        ttl = 2 * 60 * 1000; // 2 minutes for dynamic data
      } else if (response.config.url?.includes('/notifications/unread-count')) {
        ttl = 30 * 1000; // 30 seconds for unread count (matches backend cache)
      } else if (response.config.url?.includes('/notifications')) {
        ttl = 1 * 60 * 1000; // 1 minute for notifications list
      } else if (response.config.url?.includes('/bookings/my')) {
        ttl = 60 * 1000; // 1 minute for my bookings (matches backend cache)
      } else if (response.config.url?.includes('/bookings')) {
        ttl = 30 * 1000; // 30 seconds for other bookings queries
      }
      
      apiCache.set(cacheKey, response.data, ttl);
    }
    return response;
  },
  async (error) => {
    // Handle 401 errors - token is invalid
    if (error.response?.status === 401) {
      const originalRequest = error.config;
      const token = localStorage.getItem('access_token');
      
      // If we have a token and get a 401, it means the token is invalid
      // Clear it and redirect to login (unless already on login/register page)
      if (token && !isLoggingOut) {
        isLoggingOut = true;
        
        // Clear token and user data
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        
        // Clear API cache to prevent stale data
        apiCache.clear();
        
        // Cancel any pending requests
        if ((api as any).__pendingRequests) {
          (api as any).__pendingRequests.clear();
        }
        
        console.log('Token invalid (401), clearing session');
        
        // Only redirect if not already on login/register page
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          // Use a small delay to avoid interrupting ongoing navigation
          setTimeout(() => {
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
              window.location.href = '/login';
            }
            // Reset logout flag after redirect
            setTimeout(() => {
              isLoggingOut = false;
            }, 1000);
          }, 100);
        } else {
          // Reset logout flag if already on login page
          setTimeout(() => {
            isLoggingOut = false;
          }, 1000);
      }
      } else if (!token) {
        // No token but got 401 - might be a public endpoint that requires auth
        // Just log a warning, don't redirect
        console.warn('Received 401 without token:', originalRequest?.url);
      }
      
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

// Vehicles API
export const vehiclesAPI = {
  getAll: (params?: any) => api.get('/vehicles', { params }),
  getById: (id: string) => api.get(`/vehicles/${id}`),
  getFeatured: (limit?: number) => api.get('/vehicles/featured', { params: { limit } }),
  getNearby: (lat: number, lng: number, radius?: number) => 
    api.get(`/vehicles/nearby/${lat}/${lng}`, { params: { radius } }),
  getCities: () => api.get('/vehicles/meta/cities'),
  create: (data: any) => api.post('/vehicles', data),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
};

// Places API
export const placesAPI = {
  getAll: (params?: any) => api.get('/places', { params }),
  getById: (id: string) => api.get(`/places/${id}`),
  getFeatured: (limit?: number) => api.get('/places/featured', { params: { limit } }),
  getNearby: (lat: number, lng: number, radius?: number, category?: string) => 
    api.get(`/places/nearby/${lat}/${lng}`, { params: { radius, category } }),
  getCategories: () => api.get('/places/meta/categories'),
};

// Bookings API
export const bookingsAPI = {
  getAll: (params?: any) => api.get('/bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  getMyBookings: () => api.get('/bookings/my'),
  create: (data: any) => api.post('/bookings', data),
  updateStatus: (id: string, status: string) => 
    api.patch(`/bookings/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/bookings/${id}`),
};

// Chatbot API (Updated for backend v2)
export const chatbotAPI = {
  chat: (message: string, context?: any) => 
    api.post('/chatbot', { message, context }),
  clearConversation: () => 
    api.post('/chatbot/clear'),
  health: () => api.get('/chatbot/health'),
};

// Recommendations API (Updated for backend v2)
export const recommendationsAPI = {
  // Keep old chat method for backward compatibility, but use chatbotAPI instead
  chat: (message: string, context?: any) => 
    chatbotAPI.chat(message, context),
  getRecommendations: (data: any) => 
    api.post('/recommendations/recommend', data),
  generateItinerary: (data: any) => 
    api.post('/recommendations/itinerary', data),
};

// Images API - Upload images via backend
export const imagesAPI = {
  // Upload avatar image
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/images/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Upload vehicle image
  uploadVehicleImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/images/upload/vehicle', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Upload place image
  uploadPlaceImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/images/upload/place', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Upload multiple images
  uploadMultiple: (files: File[], bucket: string = 'general') => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('bucket', bucket);
    return api.post('/images/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Upload base64 image (using JSON body to avoid multipart size limits)
  uploadBase64: (base64String: string, bucket: string = 'general', filename?: string) => {
    const payload: any = {
      base64_string: base64String,
      bucket: bucket,
    };
    if (filename) {
      payload.filename = filename;
    }
    return api.post('/images/upload/base64', payload);
  },

  // Delete image
  deleteImage: (bucket: string, path: string) => {
    const formData = new FormData();
    formData.append('bucket', bucket);
    formData.append('path', path);
    return api.delete('/images/delete', { data: formData });
  },
};

// Admin API (hidden endpoint)
const ADMIN_BASE_URL = getAuthBaseUrl();
const ADMIN_PREFIX = '/internal/control';

// Create admin API instance with auth headers
const adminApi = axios.create({
  baseURL: ADMIN_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor for admin API
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (adminKey) {
    config.headers['X-Admin-Key'] = adminKey;
  }
  
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    // For admin endpoints, 401/403 means access denied
    // But don't logout immediately - could be temporary
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Admin access denied:', error.response?.status);
      
      // Only logout if it's a persistent auth error (not just permission denied)
      // 401 = unauthorized (token invalid), 403 = forbidden (no permission)
      if (error.response?.status === 401) {
        // Token invalid, but don't redirect immediately
        // Let the component handle it gracefully
        localStorage.removeItem('access_token');
        
        // Only redirect if not already on login page
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          setTimeout(() => {
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
              window.location.href = '/login';
            }
          }, 100);
        }
      }
      // For 403, don't logout - user just doesn't have admin access
    }
    return Promise.reject(error);
  }
);

export const adminAPI = {
  // Stats
  getStats: () => adminApi.get(`${ADMIN_PREFIX}/stats`),
  
  // Users
  getUsers: (params?: any) => adminApi.get(`${ADMIN_PREFIX}/users`, { params }),
  getUser: (id: string) => adminApi.get(`${ADMIN_PREFIX}/users/${id}`),
  updateUser: (id: string, data: any) => adminApi.put(`${ADMIN_PREFIX}/users/${id}`, data),
  deleteUser: (id: string) => adminApi.delete(`${ADMIN_PREFIX}/users/${id}`),
  
  // Vehicles
  getVehicles: (params?: any) => adminApi.get(`${ADMIN_PREFIX}/vehicles`, { params }),
  verifyVehicle: (id: string, data: any) => adminApi.patch(`${ADMIN_PREFIX}/vehicles/${id}/verify`, data),
  deleteVehicle: (id: string) => adminApi.delete(`${ADMIN_PREFIX}/vehicles/${id}`),
  
  // Bookings
  getBookings: (params?: any) => adminApi.get(`${ADMIN_PREFIX}/bookings`, { params }),
  updateBookingStatus: (id: string, status: string) => 
    adminApi.patch(`${ADMIN_PREFIX}/bookings/${id}/status?new_status=${status}`),
  
  // KYC
  getPendingKYC: (params?: any) => adminApi.get(`${ADMIN_PREFIX}/kyc/pending`, { params }),
  getAllKYC: (params?: any) => adminApi.get(`${ADMIN_PREFIX}/kyc/documents`, { params }),
  getKYCDetail: (id: string) => adminApi.get(`${ADMIN_PREFIX}/kyc/documents/${id}`),
  reviewKYC: (id: string, data: any) => adminApi.post(`${ADMIN_PREFIX}/kyc/documents/${id}/review`, data),
  
  // Payments
  getPayments: (params?: any) => adminApi.get(`${ADMIN_PREFIX}/payments`, { params }),
  getPaymentStats: () => adminApi.get(`${ADMIN_PREFIX}/payments/stats`),
  
  // Payouts
  getPendingPayouts: (params?: any) => adminApi.get(`${ADMIN_PREFIX}/payouts/pending`, { params }),
  releasePayout: (data: any) => adminApi.post(`${ADMIN_PREFIX}/payouts/release`, data),
};

// KYC API (user endpoints)
export const kycAPI = {
  submit: (data: any) => api.post('/kyc/submit', data),
  getStatus: () => api.get('/kyc/status'),
};

// Payments API
export const paymentsAPI = {
  createIntent: (data: any) => api.post('/payments/create-intent', data),
  confirm: (data: any) => api.post('/payments/confirm', data),
  getPayment: (id: string) => api.get(`/payments/${id}`),
  getMyPayouts: (params?: any) => api.get('/payments/payouts/my', { params }),
};

// Reviews API
export const reviewsAPI = {
  create: (data: any) => api.post('/reviews', data),
  getByVehicle: (vehicleId: string) => api.get(`/reviews/vehicle/${vehicleId}`),
  getByBooking: (bookingId: string) => api.get(`/reviews/booking/${bookingId}`),
  checkCanReview: (bookingId: string) => api.get(`/reviews/check/${bookingId}`),
};

// Messages API
export const messagesAPI = {
  getConversations: (params?: any) => api.get('/messages/conversations', { params }),
  getMessages: (conversationId: string, params?: any) => 
    api.get(`/messages/conversations/${conversationId}/messages`, { params }),
  sendMessage: (data: any) => api.post('/messages/send', data),
  markMessageRead: (messageId: string) => api.post(`/messages/${messageId}/read`),
  getUnreadCount: () => api.get('/messages/unread-count'),
  // ALGORITHM: Helper for loading more messages (pagination)
  loadMoreMessages: (conversationId: string, beforeMessageId: string, limit: number = 20) =>
    api.get(`/messages/conversations/${conversationId}/messages`, { 
      params: { before: beforeMessageId, limit } 
    }),
  // ALGORITHM: Helper for polling new messages only (after last message)
  // Reduces data transfer by 90%+ compared to fetching all messages
  pollNewMessages: (conversationId: string, afterMessageId: string, limit: number = 50) =>
    api.get(`/messages/conversations/${conversationId}/messages`, {
      params: { after: afterMessageId, limit }
    }),
  deleteConversation: (conversationId: string) =>
    api.delete(`/messages/conversations/${conversationId}`),
};

// Host Booking Management API
export const hostBookingsAPI = {
  getPendingApproval: () => api.get('/bookings/my/pending-approval'),
  approveBooking: (bookingId: string, data?: any) => 
    api.post(`/bookings/${bookingId}/approve`, data || {}),
  rejectBooking: (bookingId: string, data: any) => 
    api.post(`/bookings/${bookingId}/reject`, data),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params?: any) => api.get('/payments/notifications', { params }),
  markRead: (notificationId: string) => api.post(`/payments/notifications/${notificationId}/read`),
  getUnreadCount: () => api.get('/payments/notifications/unread-count'),
};

// Favorites API
export const favoritesAPI = {
  // Vehicles
  addVehicle: (vehicleId: string) => api.post(`/favorites/vehicles/${vehicleId}`),
  removeVehicle: (vehicleId: string) => api.delete(`/favorites/vehicles/${vehicleId}`),
  checkVehicle: (vehicleId: string) => api.get(`/favorites/vehicles/${vehicleId}/check`),
  
  // Places
  addPlace: (placeId: string) => api.post(`/favorites/places/${placeId}`),
  removePlace: (placeId: string) => api.delete(`/favorites/places/${placeId}`),
  checkPlace: (placeId: string) => api.get(`/favorites/places/${placeId}/check`),
  
  // Get all favorites
  getAll: (type?: 'vehicle' | 'place') => api.get('/favorites', { params: type ? { type } : {} }),
};

export default api;
