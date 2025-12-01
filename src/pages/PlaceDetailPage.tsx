import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, DollarSign, Tag, ChevronLeft, Navigation } from 'lucide-react';
import { placesAPI } from '../utils/api';

interface Place {
  id: string;
  name: string;
  category: string;
  city: string;
  rating: number;
  photos: string[];
  description: string;
  address: string;
  price_range?: string;
  tags?: string[];
  total_reviews: number;
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    user: {
      id: string;
      name: string;
      avatar: string | null;
    };
  }>;
}

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (id) {
      loadPlaceDetails(id);
    }
  }, [id]);

  const loadPlaceDetails = async (placeId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading place details for ID:', placeId);
      
      // Fetch from backend API (with caching)
      const response = await placesAPI.getById(placeId);
      console.log('Place data received:', response.data);
      setPlace(response.data as Place);
    } catch (error) {
      console.error('Error loading place details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load place details';
      setError(errorMessage);
      
      // If place not found in database, show helpful message
      console.log('Place not found in database. Make sure to run seed script.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Place not found</h2>
          {error && (
            <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
          )}
          <button
            onClick={() => navigate('/destinations')}
            className="text-cyan-600  hover:text-cyan-700 font-medium"
          >
            Back to Destinations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors pt-20">
      {/* Back Button */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-20 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-20 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Main Image */}
            <div className="lg:col-span-2">
              <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden">
                <img
                  src={place.photos[selectedImage] || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&h=800&fit=crop'}
                  alt={place.name}
                  className="w-full h-full object-cover"
                  loading={selectedImage === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={selectedImage === 0 ? 'high' : 'low'}
                />
              </div>
            </div>

            {/* Thumbnail Grid */}
            {place.photos.length > 1 && (
              <div className="lg:col-span-2 grid grid-cols-4 gap-4">
                {place.photos.slice(0, 4).map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative h-24 rounded-xl overflow-hidden ${
                      selectedImage === index ? 'ring-4 ring-cyan-500' : ''
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`${place.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-20 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {place.name}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-5 h-5" />
                      <span>{place.city}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">{place.rating}</span>
                      <span>({place.total_reviews} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category & Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-4 py-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-xl font-medium">
                  {place.category}
                </span>
                {place.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl flex items-center gap-1"
                  >
                    <Tag className="w-4 h-4" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About This Place</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {place.description}
              </p>
            </div>

            {/* Reviews */}
            {place.reviews && place.reviews.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Reviews ({place.reviews.length})
                </h2>
                <div className="space-y-6">
                  {place.reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-6 last:pb-0">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                          {review.user.avatar ? (
                            <img src={review.user.avatar} alt={review.user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400 font-semibold">
                              {review.user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white">{review.user.name}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{review.rating}</span>
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">{review.comment}</p>
                          <span className="text-sm text-gray-500 dark:text-gray-500">
                            {new Date(review.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Place Information</h3>
              
              <div className="space-y-4">
                {/* Address */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Address</div>
                    <div className="text-gray-900 dark:text-white">{place.address}</div>
                  </div>
                </div>

                {/* Price Range */}
                {place.price_range && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Price Range</div>
                      <div className="text-gray-900 dark:text-white">{place.price_range}</div>
                    </div>
                  </div>
                )}

                {/* Category */}
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Category</div>
                    <div className="text-gray-900 dark:text-white">{place.category}</div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="mt-8 space-y-3">
                <button
                  onClick={() => navigate(`/search?city=${place.city}`)}
                  className="w-full px-6 py-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition font-medium shadow-md"
                >
                  Find Vehicles in {place.city}
                </button>
                <button
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`, '_blank')}
                  className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium flex items-center justify-center gap-2"
                >
                  <Navigation className="w-5 h-5" />
                  Get Directions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
