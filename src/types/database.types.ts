// Database types generated from Supabase schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar: string | null;
          phone: string | null;
          role: 'USER' | 'HOST' | 'ADMIN';
          rating: number;
          total_trips: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          avatar?: string | null;
          phone?: string | null;
          role?: 'USER' | 'HOST' | 'ADMIN';
          rating?: number;
          total_trips?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar?: string | null;
          phone?: string | null;
          role?: 'USER' | 'HOST' | 'ADMIN';
          rating?: number;
          total_trips?: number;
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          name: string;
          type: 'MOTORBIKE' | 'CAR' | 'BICYCLE';
          brand: string;
          year: number;
          price_per_day: number;
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
          total_trips: number;
          license_plate: string | null;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'MOTORBIKE' | 'CAR' | 'BICYCLE';
          brand: string;
          year: number;
          price_per_day: number;
          address: string;
          district: string;
          city: string;
          lat: number;
          lng: number;
          images?: string[];
          description?: string | null;
          features?: string[] | null;
          available?: boolean;
          verified?: boolean;
          rating?: number;
          total_trips?: number;
          license_plate?: string | null;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: 'MOTORBIKE' | 'CAR' | 'BICYCLE';
          brand?: string;
          year?: number;
          price_per_day?: number;
          address?: string;
          district?: string;
          city?: string;
          lat?: number;
          lng?: number;
          images?: string[];
          description?: string | null;
          features?: string[] | null;
          available?: boolean;
          verified?: boolean;
          rating?: number;
          total_trips?: number;
          license_plate?: string | null;
          updated_at?: string;
        };
      };
      places: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string | null;
          address: string;
          city: string;
          lat: number;
          lng: number;
          rating: number;
          photos: string[];
          opening_hours: Record<string, string> | null;
          price_range: string | null;
          phone: string | null;
          website: string | null;
          tags: string[] | null;
          total_reviews: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          description?: string | null;
          address: string;
          city: string;
          lat: number;
          lng: number;
          rating?: number;
          photos?: string[];
          opening_hours?: Record<string, string> | null;
          price_range?: string | null;
          phone?: string | null;
          website?: string | null;
          tags?: string[] | null;
          total_reviews?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          category?: string;
          description?: string | null;
          address?: string;
          city?: string;
          lat?: number;
          lng?: number;
          rating?: number;
          photos?: string[];
          opening_hours?: Record<string, string> | null;
          price_range?: string | null;
          phone?: string | null;
          website?: string | null;
          tags?: string[] | null;
          total_reviews?: number;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          start_date: string;
          end_date: string;
          total_price: number;
          status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
          notes: string | null;
          pickup_location: string | null;
          return_location: string | null;
          user_id: string;
          vehicle_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          start_date: string;
          end_date: string;
          total_price: number;
          status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
          notes?: string | null;
          pickup_location?: string | null;
          return_location?: string | null;
          user_id: string;
          vehicle_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          start_date?: string;
          end_date?: string;
          total_price?: number;
          status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
          notes?: string | null;
          pickup_location?: string | null;
          return_location?: string | null;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          rating: number;
          comment: string | null;
          target_type: 'VEHICLE' | 'PLACE' | 'HOST';
          user_id: string;
          vehicle_id: string | null;
          place_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rating: number;
          comment?: string | null;
          target_type: 'VEHICLE' | 'PLACE' | 'HOST';
          user_id: string;
          vehicle_id?: string | null;
          place_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          rating?: number;
          comment?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
