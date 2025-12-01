import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { SearchParams } from '../components/SearchBar';
import Hero from '../components/Hero';
import VehicleCard from '../components/VehicleCard';
import VehicleCardSkeleton from '../components/VehicleCardSkeleton';
import PlaceCardSkeleton from '../components/PlaceCardSkeleton';
import Slideshow from '../components/Slideshow';
import { vehiclesAPI, placesAPI } from '../utils/api';
import { useCountUp } from '../hooks/useCountUp';
import heroImage from '../assets/img/thumbnail2.webp';
import thumbnail1 from '../assets/img/thumbnail1.webp';
import thumbnail2 from '../assets/img/thumbnail2.webp';
import thumbnail3 from '../assets/img/thumbnail3.webp';

const STATS = [
  { value: 1000, label: 'Available Vehicles', hasPlus: true },
  { value: 500, label: 'Destinations', hasPlus: true },
  { value: 5000, label: 'Trips Completed', hasPlus: true },
  { value: 4.9, label: 'Average Rating', decimals: 1 },
];

const SLIDESHOW_SLIDES = [
  {
    image: thumbnail1,
    title: 'Explore Coastal Roads',
    subtitle: 'Discover breathtaking ocean views and hidden beaches along Vietnam\'s stunning coastline',
  },
  {
    image: thumbnail2,
    title: 'Mountain Adventures',
    subtitle: 'Navigate winding mountain passes and experience the beauty of highland landscapes',
  },
  {
    image: thumbnail3,
    title: 'City Exploration',
    subtitle: 'Navigate through vibrant streets and discover local culture at your own pace',
  },
];

// StatItem component with count-up animation
function StatItem({ value, label, hasPlus, decimals, duration }: {
  value: number;
  label: string;
  hasPlus?: boolean;
  decimals?: number;
  duration?: number;
}) {
  const count = useCountUp(value, {
    duration: duration || 2000,
    decimals: decimals || 0,
    startOnMount: true,
  });
  
  const displayValue = decimals 
    ? count.toFixed(decimals)
    : Math.floor(count).toLocaleString('en-US');
  
  return (
    <div>
      <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-3 transition-colors">
        {displayValue}{hasPlus ? '+' : ''}
      </div>
      <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 tracking-wide uppercase transition-colors">
        {label}
      </div>
    </div>
  );
}

export default function HomeTesla() {
  const navigate = useNavigate();
  const [featuredVehicles, setFeaturedVehicles] = useState<any[]>([]);
  const [featuredDestinations, setFeaturedDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [placesLoading, setPlacesLoading] = useState(false);

  // ALGORITHM OPTIMIZATION: Batch both requests in single useEffect
  // This reduces duplicate calls and improves loading performance
  useEffect(() => {
    const loadFeaturedData = async () => {
      try {
        setLoading(true);
        setPlacesLoading(true);
        
        // OPTIMIZATION: Use Promise.allSettled to handle partial failures
        // If one fails, the other can still succeed
        const [vehiclesResult, placesResult] = await Promise.allSettled([
          vehiclesAPI.getFeatured(3),
          placesAPI.getFeatured(6),
        ]);
        
        // Handle vehicles result
        const vehiclesRes = vehiclesResult.status === 'fulfilled' ? vehiclesResult.value : null;
        const placesRes = placesResult.status === 'fulfilled' ? placesResult.value : null;
        
        // Log errors but don't block UI
        if (vehiclesResult.status === 'rejected') {
          console.error('Error loading featured vehicles:', vehiclesResult.reason);
        }
        if (placesResult.status === 'rejected') {
          console.error('Error loading featured places:', placesResult.reason);
        }

        // Transform vehicles
        if (vehiclesRes?.data && vehiclesRes.data.length > 0) {
          const vehicles = vehiclesRes.data.map((vehicle: any) => ({
            id: vehicle.id,
            name: vehicle.name,
            type: vehicle.type,
            brand: vehicle.brand,
            pricePerDay: vehicle.price_per_day,
            location: vehicle.address || '',
            address: vehicle.address || '',
            images: vehicle.images || [],
            rating: vehicle.rating,
            verified: vehicle.verified,
            distance: 0,
            owner: {
              name: vehicle.owner?.name || 'Unknown',
              avatar: '',
              rating: 0,
            },
          }));
          setFeaturedVehicles(vehicles);
        } else {
          // Set empty array if failed to load
          setFeaturedVehicles([]);
        }

        // Transform places
        if (placesRes?.data && placesRes.data.length > 0) {
          const transformedPlaces = placesRes.data.map((place: any) => ({
            id: place.id,
            name: place.name,
            location: place.address || '',
            description: '',
            image: place.photos && place.photos.length > 0 ? place.photos[0] : 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&h=800&fit=crop',
            vehiclesAvailable: 50,
            popularActivities: place.tags || [],
          }));
          setFeaturedDestinations(transformedPlaces);
        } else {
          // Set empty array if failed to load
          setFeaturedDestinations([]);
        }
      } catch (error) {
        console.error('Error loading featured data:', error);
        // Set empty arrays on error to prevent UI crashes
        setFeaturedVehicles([]);
        setFeaturedDestinations([]);
      } finally {
        setLoading(false);
        setPlacesLoading(false);
      }
    };

    loadFeaturedData();
  }, []);

  const handleSearch = (params: SearchParams) => {
    const queryParams = new URLSearchParams();
    if (params.city) queryParams.set('city', params.city);
    if (params.vehicleType) queryParams.set('type', params.vehicleType);
    if (params.startDate) queryParams.set('start', params.startDate);
    if (params.endDate) queryParams.set('end', params.endDate);
    navigate(`/search?${queryParams.toString()}`);
  };

  const handleVehicleClick = (vehicleId: string) => {
    navigate(`/vehicle/${vehicleId}`);
  };

  const handleDestinationClick = (placeId: string) => {
    navigate(`/place/${placeId}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <Hero 
        onSearch={handleSearch}
        backgroundImage={heroImage}
        title="Discover Vietnam"
        subtitle="Over 1,000 quality vehicles ready for every journey"
      />

      {/* Stats Bar */}
      <section className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-16 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center max-w-[1920px] mx-auto">
            <StatItem value={STATS[0].value} label={STATS[0].label} hasPlus={STATS[0].hasPlus} duration={2000} />
            <StatItem value={STATS[1].value} label={STATS[1].label} hasPlus={STATS[1].hasPlus} duration={2200} />
            <StatItem value={STATS[2].value} label={STATS[2].label} hasPlus={STATS[2].hasPlus} duration={2400} />
            <StatItem value={STATS[3].value} label={STATS[3].label} decimals={STATS[3].decimals} duration={2600} />
          </div>
        </div>
      </section>

      {/* Slideshow Section */}
      <Slideshow slides={SLIDESHOW_SLIDES} autoPlayInterval={6000} height="h-[70vh]" />

      {/* Featured Destinations */}
      <section className="py-20 md:py-32 w-full bg-gray-50 dark:bg-gray-800 transition-colors">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="text-center mb-16 md:mb-24 max-w-[1920px] mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight transition-colors">
              Popular Destinations
            </h2>
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-light transition-colors">
              Explore Vietnam's most breathtaking check-in spots
            </p>
          </div>

          {placesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1920px] mx-auto">
              {[...Array(6)].map((_, index) => (
                <PlaceCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1920px] mx-auto">
              {featuredDestinations.map(destination => (
                <div
                  key={destination.id}
                  onClick={() => handleDestinationClick(destination.id)}
                  className="group cursor-pointer bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-2xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50"
                >
                  {/* Image */}
                  <div className="relative h-80 overflow-hidden rounded-t-2xl">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  
                  {/* Badge */}
                  <div className="absolute top-6 right-6 px-4 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-xl shadow-lg">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {destination.vehiclesAvailable}+ Vehicles
                    </span>
                  </div>

                  {/* Title on image */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">
                      {destination.name}
                    </h3>
                    <div className="flex items-center text-white/90 text-sm bg-black/30 backdrop-blur-md w-fit px-3 py-1.5 rounded-lg">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {destination.location}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-b-2xl">
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 transition-colors">
                    {destination.description}
                  </p>

                  {/* Activities */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {destination.popularActivities.map((activity: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 transition-colors rounded-lg"
                      >
                        {activity}
                      </span>
                    ))}
                  </div>

                  {/* Explore Link */}
                  <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                    Explore vehicles
                    <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* View All Destinations Button */}
          <div className="text-center mt-16 md:mt-24 max-w-[1920px] mx-auto">
            <button
              onClick={() => navigate('/places')}
              className="px-12 py-4 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl"
            >
              FIND SUITABLE VEHICLES
            </button>
          </div>
        </div>
      </section>

      {/* Featured Vehicles */}
      <section className="py-20 md:py-32 w-full bg-white dark:bg-gray-900 transition-colors">
        <div className="w-full px-6 lg:px-12 xl:px-20">
          <div className="text-center mb-16 md:mb-24 max-w-[1920px] mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight transition-colors">
              Featured Vehicles
            </h2>
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-light transition-colors">
              Top-rated by the GoLocal community
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-8 max-w-[1920px] mx-auto">
              {[...Array(3)].map((_, index) => (
                <VehicleCardSkeleton key={index} layout="featured" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 max-w-[1920px] mx-auto">
              {featuredVehicles.map(vehicle => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onClick={() => handleVehicleClick(vehicle.id)}
                  layout="featured"
                />
              ))}
            </div>
          )}

          {/* View All Button */}
          <div className="text-center mt-16 md:mt-24 max-w-[1920px] mx-auto">
            <button
              onClick={() => navigate('/search')}
              className="px-12 py-4 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl"
            >
              VIEW ALL VEHICLES
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 bg-gray-900 dark:bg-gray-800 text-white transition-colors w-full">
        <div className="w-full px-6 lg:px-12 xl:px-20 text-center">
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 tracking-tight">
              Ready to host your vehicle?
            </h2>
            <p className="text-lg md:text-xl text-gray-400 dark:text-gray-300 mb-12 font-light max-w-2xl mx-auto transition-colors">
              Earn passive income and join the growing GoLocal network
            </p>
            <button 
              onClick={() => navigate('/become-owner')}
              className="px-12 py-4 text-sm font-medium tracking-widest text-gray-900 bg-white hover:bg-gray-100 transition-all rounded-xl shadow-lg hover:shadow-2xl"
            >
              START HOSTING
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
