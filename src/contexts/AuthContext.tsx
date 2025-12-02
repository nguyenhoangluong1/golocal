import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../utils/authApi';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  bio?: string;
  location?: string;
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
  role: string;
  avatar?: string;
  rating?: number;
  total_trips: number;
  created_at: string;
  kyc_status?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // OPTIMIZATION: Try to restore user from localStorage to prevent logout flash
  // This prevents showing logout screen when reloading page
  const getStoredUser = (): User | null => {
    try {
      const stored = localStorage.getItem('user_data');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  };

  const [user, setUser] = useState<User | null>(getStoredUser());
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // If we have stored user data, use it immediately (optimistic)
      // Then fetch fresh data in background
      fetchCurrentUser(token);
    } else {
      // No token, clear stored user data
      localStorage.removeItem('user_data');
      setUser(null);
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (token: string) => {
    try {
      // CRITICAL: Use authApi instance instead of raw axios to ensure HTTPS enforcement
      const response = await authApi.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        // Don't throw on network errors - let us handle gracefully
        validateStatus: (status) => status < 500 // Don't throw on 4xx, only 5xx
      });
      
      // Only set user if we got a successful response
      if (response.status === 200 && response.data) {
        setUser(response.data);
        // Store user data in localStorage to prevent logout flash on reload
        localStorage.setItem('user_data', JSON.stringify(response.data));
      } else if (response.status === 401) {
        // Only logout if it's a clear 401 (token invalid)
        console.log('Token invalid on /auth/me, clearing session');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        setUser(null);
      }
    } catch (error: any) {
      console.error('Failed to fetch current user:', error);
      
      // Only logout if it's a clear 401 response
      // For network errors, timeouts, etc. - keep user logged in
      if (error.response?.status === 401) {
        console.log('Token invalid on /auth/me (401), clearing session');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        setUser(null);
      } else {
        // For other errors (network, timeout, server error), keep user logged in
        // They can still use the app, just user data won't be loaded
        // This prevents logout on page reload due to temporary network issues
        console.warn('Non-401 error fetching user, keeping session:', error.message || error.code);
        // Don't clear token or user - let them continue using the app
        // The token might still be valid, just couldn't verify right now
        // Keep stored user data if available
        if (!user) {
          const storedUser = getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.post('/auth/login', {
        email: email.trim(),
        password
      });

      const { access_token, user: userData } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      // Log full error for debugging
      console.error('Login API error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Return detailed error message
      const errorDetail = error.response?.data?.detail;
      if (errorDetail) {
        throw new Error(errorDetail);
      }
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string, name: string, phone?: string) => {
    try {
      // Build request body - only include phone if it's provided
      const requestBody: { email: string; password: string; name: string; phone?: string } = {
        email: email.trim(),
        password,
        name: name.trim(),
      };
      
      // Only include phone if it's not empty/undefined
      if (phone && phone.trim()) {
        requestBody.phone = phone.trim();
      }
      
      const response = await authApi.post('/auth/register', requestBody);

      const { access_token, user: userData } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      // Log full error for debugging
      console.error('Registration API error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Return detailed error message
      const errorDetail = error.response?.data?.detail;
      if (errorDetail) {
        // If it's a validation error, show the specific field error
        if (error.response?.status === 422 && Array.isArray(error.response?.data?.detail)) {
          const validationErrors = error.response.data.detail.map((err: any) => {
            const field = err.loc?.join('.') || 'field';
            return `${field}: ${err.msg}`;
          }).join(', ');
          throw new Error(validationErrors);
        }
        throw new Error(errorDetail);
      }
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = () => {
    // Clear all possible token keys (old and new)
    localStorage.removeItem('access_token');
    localStorage.removeItem('token'); // Clear legacy key from OAuth
    localStorage.removeItem('user_data'); // Clear stored user data
    setUser(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const response = await authApi.get('/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          // Add timeout to prevent hanging
          timeout: 10000
        });
        setUser(response.data);
        localStorage.setItem('user_data', JSON.stringify(response.data));
      } catch (error: any) {
        console.error('Failed to refresh user:', error);
        // Only logout if it's a 401 from /auth/me endpoint
        // This means token is truly invalid
        if (error.response?.status === 401) {
          console.log('Token invalid on refresh, clearing session');
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_data');
          setUser(null);
        }
        // For other errors (network, timeout), don't logout
        // User can still use the app, just user data won't refresh
        // Keep existing user data
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
