// TypeScript types for the application

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  location?: string;
  role: 'USER' | 'OWNER' | 'ADMIN';
  rating: number;
  totalTrips: number;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  name: string;
  type: 'MOTORBIKE' | 'CAR' | 'BICYCLE';
  brand: string;
  year: number;
  pricePerDay: number;
  location: string;
  city: string;
  lat: number;
  lng: number;
  images: string[];
  description?: string;
  features?: string[];
  available: boolean;
  verified: boolean;
  rating: number;
  totalTrips: number;
  licensePlate?: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
  };
}

export interface Place {
  id: string;
  name: string;
  category: string;
  description?: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  rating: number;
  photos: string[];
  openingHours?: Record<string, string>;
  priceRange?: string;
  phone?: string;
  website?: string;
  tags?: string[];
  totalReviews: number;
}

export interface Booking {
  id: string;
  userId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  pickupLocation?: string;
  returnLocation?: string;
  createdAt: string;
  vehicle?: Vehicle;
}

export interface Review {
  id: string;
  userId: string;
  vehicleId?: string;
  placeId?: string;
  rating: number;
  comment?: string;
  photos?: string[];
  createdAt: string;
  user: {
    name: string;
    avatar?: string;
  };
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  read: boolean;
  createdAt: string;
  sender: {
    name: string;
    avatar?: string;
  };
}

export interface CartItem {
  id: string;
  userId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  vehicle: Vehicle;
  totalPrice: number;
}

export interface SearchParams {
  city?: string;
  vehicleType?: string;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

// Supabase Database types (will be generated)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'createdAt'>;
        Update: Partial<Omit<User, 'id' | 'createdAt'>>;
      };
      vehicles: {
        Row: Vehicle;
        Insert: Omit<Vehicle, 'id' | 'createdAt'>;
        Update: Partial<Omit<Vehicle, 'id' | 'createdAt'>>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'createdAt'>;
        Update: Partial<Omit<Booking, 'id' | 'createdAt'>>;
      };
      // Add more tables as needed
    };
  };
}
