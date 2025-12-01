/**
 * Chatbot Context Builder
 * Collects and builds context information for chatbot interactions
 */

import { useLocation, useParams } from 'react-router-dom';
import type { User } from '../contexts/AuthContext';

export interface ChatbotContext {
  // User context
  user?: {
    id: string;
    name: string;
    email: string;
    location?: string;
    total_trips?: number;
    rating?: number;
  };
  
  // Page context
  page?: {
    route: string;
    pathname: string;
    params?: Record<string, string>;
    searchParams?: Record<string, string>;
  };
  
  // Current viewing context
  viewing?: {
    type: 'vehicle' | 'place' | 'search' | 'profile' | 'booking';
    id?: string;
    name?: string;
    city?: string;
    price?: number;
    vehicleType?: string;
    startDate?: string;
    endDate?: string;
  };
  
  // User location (already exists)
  user_location?: {
    city: string;
    lat: number;
    lng: number;
  };
  
  // Conversation context
  conversation?: {
    messageCount: number;
    recentTopics?: string[];
  };
  
  // Preferences (from user profile or inferred)
  preferences?: string[];
  
  // Budget (if mentioned or from booking)
  budget?: string;
  
  // Travel dates (if mentioned or from search)
  travel_dates?: {
    start?: string;
    end?: string;
  };
}

/**
 * Build context from current app state
 */
export function buildChatbotContext(
  user: User | null,
  location: ReturnType<typeof useLocation>,
  params: ReturnType<typeof useParams>,
  messages: any[],
  additionalData?: {
    viewingVehicle?: any;
    viewingPlace?: any;
    searchFilters?: any;
  }
): ChatbotContext {
  const context: ChatbotContext = {};
  
  // User context
  if (user) {
    context.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      location: user.location,
      total_trips: user.total_trips,
      rating: user.rating,
    };
  }
  
  // Page context
  context.page = {
    route: location.pathname,
    pathname: location.pathname,
    params: params as Record<string, string>,
    searchParams: Object.fromEntries(new URLSearchParams(location.search)),
  };
  
  // Determine viewing context based on route
  const pathname = location.pathname;
  
  if (pathname.startsWith('/vehicle/')) {
    const vehicleId = (params as Record<string, string | undefined>)?.id;
    context.viewing = {
      type: 'vehicle',
      id: vehicleId,
      name: additionalData?.viewingVehicle?.name,
      city: additionalData?.viewingVehicle?.location,
      price: additionalData?.viewingVehicle?.pricePerDay,
      vehicleType: additionalData?.viewingVehicle?.type,
    };
  } else if (pathname.startsWith('/place/')) {
    const placeId = (params as Record<string, string | undefined>)?.id;
    context.viewing = {
      type: 'place',
      id: placeId,
      name: additionalData?.viewingPlace?.name,
      city: additionalData?.viewingPlace?.city,
    };
  } else if (pathname === '/search') {
    const searchParams = new URLSearchParams(location.search);
    context.viewing = {
      type: 'search',
      city: searchParams.get('city') || undefined,
      vehicleType: searchParams.get('type') || undefined,
      startDate: searchParams.get('start') || undefined,
      endDate: searchParams.get('end') || undefined,
    };
  } else if (pathname === '/profile') {
    context.viewing = {
      type: 'profile',
    };
  } else if (pathname === '/payment' || pathname.includes('/booking')) {
    context.viewing = {
      type: 'booking',
    };
  }
  
  // Conversation context
  if (messages.length > 0) {
    context.conversation = {
      messageCount: messages.length,
      // Extract topics from recent messages (simple keyword extraction)
      recentTopics: extractTopics(messages.slice(-5)),
    };
  }
  
  // Extract preferences from user profile or conversation
  if (user?.bio) {
    context.preferences = extractPreferences(user.bio);
  }
  
  // Extract budget and dates from search params or conversation
  const searchParams = new URLSearchParams(location.search);
  if (searchParams.get('start') || searchParams.get('end')) {
    context.travel_dates = {
      start: searchParams.get('start') || undefined,
      end: searchParams.get('end') || undefined,
    };
  }
  
  return context;
}

/**
 * Extract topics from recent messages
 */
function extractTopics(messages: any[]): string[] {
  const topics: string[] = [];
  const keywords = [
    'vehicle', 'motorbike', 'car', 'bicycle',
    'beach', 'mountain', 'city', 'restaurant',
    'itinerary', 'booking', 'price', 'location',
  ];
  
  messages.forEach(msg => {
    if (msg.role === 'user') {
      const content = msg.content.toLowerCase();
      keywords.forEach(keyword => {
        if (content.includes(keyword) && !topics.includes(keyword)) {
          topics.push(keyword);
        }
      });
    }
  });
  
  return topics.slice(0, 5); // Limit to 5 topics
}

/**
 * Extract preferences from user bio
 */
function extractPreferences(bio: string): string[] {
  const preferences: string[] = [];
  const bioLower = bio.toLowerCase();
  
  if (bioLower.includes('adventure') || bioLower.includes('explore')) {
    preferences.push('adventure');
  }
  if (bioLower.includes('relax') || bioLower.includes('beach')) {
    preferences.push('relaxation');
  }
  if (bioLower.includes('food') || bioLower.includes('restaurant')) {
    preferences.push('food');
  }
  if (bioLower.includes('culture') || bioLower.includes('history')) {
    preferences.push('culture');
  }
  
  return preferences;
}

/**
 * Format context for API request
 */
export function formatContextForAPI(context: ChatbotContext): any {
  return {
    user_location: context.user_location,
    preferences: context.preferences,
    budget: context.budget,
    travel_dates: context.travel_dates,
    // Additional context fields
    user_info: context.user ? {
      name: context.user.name,
      location: context.user.location,
      total_trips: context.user.total_trips,
    } : undefined,
    page_info: context.page ? {
      route: context.page.route,
      viewing_type: context.viewing?.type,
      viewing_id: context.viewing?.id,
      viewing_name: context.viewing?.name,
      city: context.viewing?.city,
      vehicle_type: context.viewing?.vehicleType,
      price_range: context.viewing?.price ? {
        min: context.viewing.price * 0.8,
        max: context.viewing.price * 1.2,
      } : undefined,
    } : undefined,
    conversation_info: context.conversation ? {
      message_count: context.conversation.messageCount,
      recent_topics: context.conversation.recentTopics,
    } : undefined,
  };
}

