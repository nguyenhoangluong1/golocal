import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type VehicleRow = Database['public']['Tables']['vehicles']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type ReviewRow = Database['public']['Tables']['reviews']['Row'];
type PlaceRow = Database['public']['Tables']['places']['Row'];
type BookingRow = Database['public']['Tables']['bookings']['Row'];

// ============================================
// VEHICLE API
// ============================================

export interface VehicleSearchParams {
  city?: string;
  district?: string;
  vehicleType?: string;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  verified?: boolean;
}

export interface Vehicle {
  id: string;
  name: string;
  type: string;
  brand: string;
  year: number;
  pricePerDay: number;
  address: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  images: string[];
  description: string | null;
  features: string[] | null;
  available: boolean;
  verified: boolean;
  rating: number;
  totalTrips: number;
  licensePlate: string | null;
  owner: {
    id: string;
    name: string;
    avatar: string | null;
    rating: number;
  };
}

/**
 * Search vehicles with filters
 */
export async function searchVehicles(params: VehicleSearchParams) {
  try {
    let query = supabase
      .from('vehicles')
      .select(`
        *,
        owner:users!vehicles_owner_id_fkey(id, name, avatar, rating)
      `)
      .eq('available', true);

    // Filter by city/district
    if (params.city) {
      // Use smart city matching
      query = query.or(`city.ilike.%${params.city}%,district.ilike.%${params.city}%,address.ilike.%${params.city}%`);
    }

    if (params.district) {
      query = query.ilike('district', `%${params.district}%`);
    }

    // Filter by vehicle type
    if (params.vehicleType) {
      query = query.eq('type', params.vehicleType.toUpperCase());
    }

    // Filter by price range
    if (params.minPrice) {
      query = query.gte('price_per_day', params.minPrice);
    }
    if (params.maxPrice) {
      query = query.lte('price_per_day', params.maxPrice);
    }

    // Filter by verified status
    if (params.verified !== undefined) {
      query = query.eq('verified', params.verified);
    }

    // Order by rating
    query = query.order('rating', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    // Transform data to match frontend format
    type VehicleWithOwnerData = VehicleRow & { owner: UserRow | UserRow[] };
    
    return (data as unknown as VehicleWithOwnerData[]).map((vehicle) => {
      const owner = Array.isArray(vehicle.owner) ? vehicle.owner[0] : vehicle.owner;
      
      return {
        id: vehicle.id,
        name: vehicle.name,
        type: vehicle.type,
        brand: vehicle.brand,
        year: vehicle.year,
        pricePerDay: vehicle.price_per_day,
        address: vehicle.address,
        district: vehicle.district,
        city: vehicle.city,
        location: vehicle.address, // Alias for compatibility
        coordinates: [vehicle.lat, vehicle.lng] as [number, number],
        images: vehicle.images,
        description: vehicle.description,
        features: vehicle.features,
        available: vehicle.available,
        verified: vehicle.verified,
        rating: vehicle.rating,
        reviewCount: vehicle.total_trips, // Approximation
        distance: 0, // Calculate client-side if needed
        owner: {
          id: owner?.id || '',
          name: owner?.name || 'Unknown',
          avatar: owner?.avatar || '',
          rating: owner?.rating || 0,
        },
      };
    });
  } catch (error) {
    console.error('Error searching vehicles:', error);
    throw error;
  }
}

/**
 * Get vehicle by ID with full details
 */
export async function getVehicleById(id: string) {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        owner:users!vehicles_owner_id_fkey(id, name, avatar, rating, total_trips),
        reviews:reviews(
          id,
          rating,
          comment,
          created_at,
          user:users!reviews_user_id_fkey(id, name, avatar)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Vehicle not found');

    type VehicleWithRelationsData = VehicleRow & {
      owner: UserRow & { total_trips: number };
      reviews: Array<ReviewRow & { user: UserRow }>;
    };

    const vehicle = data as unknown as VehicleWithRelationsData;

    return {
      id: vehicle.id,
      name: vehicle.name,
      type: vehicle.type,
      brand: vehicle.brand,
      year: vehicle.year,
      pricePerDay: vehicle.price_per_day,
      address: vehicle.address,
      district: vehicle.district,
      city: vehicle.city,
      location: vehicle.address,
      coordinates: [vehicle.lat, vehicle.lng] as [number, number],
      images: vehicle.images,
      description: vehicle.description,
      features: vehicle.features,
      available: vehicle.available,
      verified: vehicle.verified,
      rating: vehicle.rating,
      totalTrips: vehicle.total_trips,
      licensePlate: vehicle.license_plate,
      owner: {
        id: vehicle.owner.id,
        name: vehicle.owner.name,
        avatar: vehicle.owner.avatar,
        rating: vehicle.owner.rating,
        totalTrips: vehicle.owner.total_trips,
      },
      reviews: vehicle.reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        user: {
          id: review.user.id,
          name: review.user.name,
          avatar: review.user.avatar,
        },
      })),
    };
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    throw error;
  }
}

/**
 * Get featured vehicles (top rated, verified)
 */
export async function getFeaturedVehicles(limit = 6) {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        owner:users!vehicles_owner_id_fkey(id, name, avatar, rating)
      `)
      .eq('verified', true)
      .eq('available', true)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;

    type VehicleWithOwnerData = VehicleRow & { owner: UserRow | UserRow[] };

    return (data as unknown as VehicleWithOwnerData[]).map((vehicle) => {
      const owner = Array.isArray(vehicle.owner) ? vehicle.owner[0] : vehicle.owner;
      
      return {
        id: vehicle.id,
        name: vehicle.name,
        type: vehicle.type,
        brand: vehicle.brand,
        pricePerDay: vehicle.price_per_day,
        location: vehicle.address,
        address: vehicle.address,
        city: vehicle.city,
        district: vehicle.district,
        coordinates: [vehicle.lat, vehicle.lng] as [number, number],
        images: vehicle.images,
        rating: vehicle.rating,
        verified: vehicle.verified,
        distance: 0, // Add missing field
        owner: {
          name: owner?.name || 'Unknown',
          avatar: owner?.avatar || '',
          rating: owner?.rating || 0,
        },
      };
    });
  } catch (error) {
    console.error('Error fetching featured vehicles:', error);
    throw error;
  }
}

// ============================================
// BOOKING API
// ============================================

export interface CreateBookingParams {
  vehicleId: string;
  userId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  notes?: string;
  pickupLocation?: string;
  returnLocation?: string;
}

/**
 * Create a new booking
 */
export async function createBooking(params: CreateBookingParams) {
  try {
    const insertData = {
      vehicle_id: params.vehicleId,
      user_id: params.userId,
      start_date: params.startDate,
      end_date: params.endDate,
      total_price: params.totalPrice,
      notes: params.notes,
      pickup_location: params.pickupLocation,
      return_location: params.returnLocation,
      status: 'PENDING' as const,
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert(insertData as any)
      .select()
      .single();

    if (error) throw error;
    return data as BookingRow;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

/**
 * Get user bookings
 */
export async function getUserBookings(userId: string) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        vehicle:vehicles(id, name, images, brand, type, price_per_day)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
}

/**
 * Get user's vehicles (if they are a vehicle owner)
 */
export async function getUserVehicles(userId: string) {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user vehicles:', error);
    throw error;
  }
}


/**
 * Check vehicle availability for dates
 */
export async function checkVehicleAvailability(
  vehicleId: string,
  startDate: string,
  endDate: string
) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .in('status', ['PENDING', 'CONFIRMED'])
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

    if (error) throw error;
    return data.length === 0; // Available if no overlapping bookings
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
}

// ============================================
// REVIEW API
// ============================================

export interface CreateReviewParams {
  userId: string;
  vehicleId?: string;
  placeId?: string;
  rating: number;
  comment?: string;
  targetType: 'VEHICLE' | 'PLACE' | 'HOST';
}

/**
 * Create a review
 */
export async function createReview(params: CreateReviewParams) {
  try {
    const insertData = {
      user_id: params.userId,
      vehicle_id: params.vehicleId,
      place_id: params.placeId,
      rating: params.rating,
      comment: params.comment,
      target_type: params.targetType,
    };

    const { data, error } = await supabase
      .from('reviews')
      .insert(insertData as any)
      .select()
      .single();

    if (error) throw error;
    return data as ReviewRow;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
}

/**
 * Get vehicle reviews
 */
export async function getVehicleReviews(vehicleId: string) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        user:users!reviews_user_id_fkey(id, name, avatar)
      `)
      .eq('vehicle_id', vehicleId)
      .eq('target_type', 'VEHICLE')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
}

// ============================================
// PLACE API
// ============================================

/**
 * Get featured places (top rated)
 */
export async function getFeaturedPlaces(limit = 6) {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as PlaceRow[];
  } catch (error) {
    console.error('Error fetching featured places:', error);
    throw error;
  }
}

/**
 * Get places by city
 */
export async function getPlacesByCity(city: string, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .ilike('city', `%${city}%`)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as PlaceRow[];
  } catch (error) {
    console.error('Error fetching places:', error);
    throw error;
  }
}

/**
 * Get place by ID
 */
export async function getPlaceById(id: string) {
  try {
    console.log('[getPlaceById] Fetching place with ID:', id);
    
    // First, get the place
    const { data: placeData, error: placeError } = await supabase
      .from('places')
      .select('*')
      .eq('id', id)
      .single();

    console.log('[getPlaceById] Place response:', { data: placeData, error: placeError });

    if (placeError) {
      console.error('[getPlaceById] Supabase error:', placeError);
      throw placeError;
    }
    
    if (!placeData) {
      console.error('[getPlaceById] No data returned');
      throw new Error('Place not found');
    }
    
    // Then, get reviews for this place (if any)
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        user:users!reviews_user_id_fkey(id, name, avatar)
      `)
      .eq('place_id', id)
      .eq('target_type', 'PLACE')
      .order('created_at', { ascending: false });
    
    type PlaceWithReviewsData = PlaceRow & {
      reviews: Array<ReviewRow & { user: UserRow }>;
    };
    
    const result: PlaceWithReviewsData = {
      ...(placeData as PlaceRow),
      reviews: reviewsData || []
    } as PlaceWithReviewsData;
    
    console.log('[getPlaceById] Successfully fetched place:', result.name, 'with', result.reviews?.length || 0, 'reviews');
    return result;
  } catch (error) {
    console.error('Error fetching place:', error);
    throw error;
  }
}

// ============================================
// USER API
// ============================================

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: {
  name?: string;
  avatar?: string;
  phone?: string;
}) {
  try {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const query = supabase.from('users') as any;
    const { data, error } = await query
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserRow;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

