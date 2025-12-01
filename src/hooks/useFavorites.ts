import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { favoritesAPI } from '../utils/api';

export function useFavorites() {
  const { isAuthenticated, user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // ALGORITHM OPTIMIZATION: Only load favorites once per user session
  // Use ref to prevent duplicate calls during React StrictMode
  const hasLoadedRef = useRef<string | null>(null);

  // Load user's favorites on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Only load if we haven't loaded for this user yet
      if (hasLoadedRef.current !== user.id) {
        hasLoadedRef.current = user.id;
        loadFavorites();
      }
    } else {
      setFavorites(new Set());
      hasLoadedRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  const loadFavorites = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      setLoading(true);
      const response = await favoritesAPI.getAll();
      const favoriteIds = new Set<string>();
      
      response.data.favorites.forEach((fav: any) => {
        if (fav.vehicle_id) {
          favoriteIds.add(fav.vehicle_id);
        }
        if (fav.place_id) {
          favoriteIds.add(fav.place_id);
        }
      });
      
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFavorited = useCallback((id: string) => {
    return favorites.has(id);
  }, [favorites]);

  const toggleFavorite = useCallback(async (id: string, type: 'vehicle' | 'place') => {
    if (!isAuthenticated || !user) {
      // Redirect to login or show message
      return false;
    }

    const isFav = favorites.has(id);
    
    try {
      if (isFav) {
        // Remove favorite
        if (type === 'vehicle') {
          await favoritesAPI.removeVehicle(id);
        } else {
          await favoritesAPI.removePlace(id);
        }
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        // Add favorite
        if (type === 'vehicle') {
          await favoritesAPI.addVehicle(id);
        } else {
          await favoritesAPI.addPlace(id);
        }
        setFavorites(prev => new Set(prev).add(id));
      }
      return true;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      return false;
    }
  }, [isAuthenticated, user, favorites]);

  return {
    favorites,
    isFavorited,
    toggleFavorite,
    loading,
    refreshFavorites: loadFavorites,
  };
}

