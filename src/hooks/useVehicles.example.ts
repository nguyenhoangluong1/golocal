/**
 * React Query hooks for vehicles
 * Example implementation - replace manual API calls with these hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesAPI } from '@/utils/api';
import type { SearchParams } from '@/types';

// Query keys
export const vehicleKeys = {
  all: ['vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  list: (filters: SearchParams, page: number) => 
    [...vehicleKeys.lists(), filters, page] as const,
  details: () => [...vehicleKeys.all, 'detail'] as const,
  detail: (id: string) => [...vehicleKeys.details(), id] as const,
  featured: () => [...vehicleKeys.all, 'featured'] as const,
  nearby: (lat: number, lng: number, radius: number) => 
    [...vehicleKeys.all, 'nearby', lat, lng, radius] as const,
};

// Get vehicles with filters and pagination
export const useVehicles = (filters: SearchParams, page: number = 1) => {
  return useQuery({
    queryKey: vehicleKeys.list(filters, page),
    queryFn: () => vehiclesAPI.getAll({ ...filters, page }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    keepPreviousData: true, // Smooth pagination
  });
};

// Get featured vehicles
export const useFeaturedVehicles = () => {
  return useQuery({
    queryKey: vehicleKeys.featured(),
    queryFn: () => vehiclesAPI.getFeatured(),
    staleTime: 15 * 60 * 1000, // 15 minutes (matches backend cache)
    gcTime: 30 * 60 * 1000,
  });
};

// Get vehicle by ID
export const useVehicle = (id: string | null) => {
  return useQuery({
    queryKey: vehicleKeys.detail(id!),
    queryFn: () => vehiclesAPI.getById(id!),
    enabled: !!id, // Only fetch if ID exists
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get nearby vehicles
export const useNearbyVehicles = (
  lat: number | null,
  lng: number | null,
  radius: number = 10
) => {
  return useQuery({
    queryKey: vehicleKeys.nearby(lat!, lng!, radius),
    queryFn: () => vehiclesAPI.getNearby(lat!, lng!, radius),
    enabled: !!lat && !!lng,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

// Create vehicle mutation
export const useCreateVehicle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: vehiclesAPI.create,
    onSuccess: () => {
      // Invalidate vehicle lists to refetch
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
  });
};

// Update vehicle mutation
export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      vehiclesAPI.update(id, data),
    onSuccess: (data, variables) => {
      // Update cache with new data
      queryClient.setQueryData(
        vehicleKeys.detail(variables.id),
        data
      );
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
  });
};

// Delete vehicle mutation
export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: vehiclesAPI.delete,
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: vehicleKeys.detail(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
    },
  });
};

