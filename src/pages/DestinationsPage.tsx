import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { placesAPI } from '../utils/api';
import { MapPin, Navigation, Search, Filter, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import PlaceCard from '../components/PlaceCard';
import PlaceCardSkeleton from '../components/PlaceCardSkeleton';
import { useCountUp } from '../hooks/useCountUp';

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
}

interface Category {
  category: string;
  _count: number;
}

export default function DestinationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPlaces, setTotalPlaces] = useState(0);
  
  // Applied filters (used for API call)
  const [appliedCity, setAppliedCity] = useState<string>('all');
  const [appliedCategory, setAppliedCategory] = useState<string>('all');
  
  // Pending filters (not yet applied)
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const ITEMS_PER_PAGE = 12; // ALGORITHM: Match grid layout (max 3 cols x 4 rows = 12)
  const cities = ['Da Nang', 'Hanoi', 'Ho Chi Minh City', 'Hoi An'];

  // Load page from URL params on mount
  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam) {
      setCurrentPage(parseInt(pageParam, 10));
    }
  }, []);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Update URL when page changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (currentPage > 1) {
      newParams.set('page', currentPage.toString());
    } else {
      newParams.delete('page');
    }
    setSearchParams(newParams, { replace: true });
  }, [currentPage]);

  // Set initial city from URL params if present
  useEffect(() => {
    const cityParam = searchParams.get('city');
    if (cityParam) {
      setSelectedCity(cityParam);
      setAppliedCity(cityParam);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, [appliedCity, appliedCategory, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // ALGORITHM OPTIMIZATION: Request only items needed for current page
      // Instead of fetching all places and slicing in frontend
      // This reduces data transfer by ~90% (from 1000+ items to 12 items)
      const params: any = {
        page: currentPage,
        limit: ITEMS_PER_PAGE, // Only fetch items for current page
      };
      if (appliedCity !== 'all') params.city = appliedCity;
      if (appliedCategory !== 'all') params.category = appliedCategory;

      const [placesRes, categoriesRes] = await Promise.all([
        placesAPI.getAll(params),
        placesAPI.getCategories(),
      ]);

      // ALGORITHM: Backend now returns paginated response with total count
      // Response format: { places: [...], total: number, page: number, limit: number, pages: number }
      const placesData = placesRes.data?.places || placesRes.data || [];
      const total = placesRes.data?.total || 0;

      setPlaces(placesData);
      setCategories(categoriesRes.data || []);
      
      // ALGORITHM: Use total count from backend (accurate, not estimated)
      setTotalPlaces(total);
    } catch (error) {
      console.error('Error loading places:', error);
      setPlaces([]);
      setTotalPlaces(0);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setAppliedCity(selectedCity);
    setAppliedCategory(selectedCategory);
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  const handleResetFilters = () => {
    setSelectedCity('all');
    setSelectedCategory('all');
    setAppliedCity('all');
    setAppliedCategory('all');
    setCurrentPage(1);
  };

  const filteredPlaces = places.filter(place => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        place.name.toLowerCase().includes(query) ||
        place.description?.toLowerCase().includes(query) ||
        place.city.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Calculate average rating from all places
  const avgRating = useMemo(() => {
    if (filteredPlaces.length === 0) return 4.8;
    const sum = filteredPlaces.reduce((acc, place) => acc + (place.rating || 0), 0);
    return sum / filteredPlaces.length;
  }, [filteredPlaces]);

  // StatsItem component with count-up animation
  const StatsItem = ({ value, label, duration = 2000, decimals = 0 }: {
    value: number;
    label: string;
    duration?: number;
    decimals?: number;
  }) => {
    const count = useCountUp(value, { duration, decimals, startOnMount: !loading });
    
    return (
      <div>
        <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-3 transition-colors">
          {decimals > 0 ? count.toFixed(decimals) : count}
        </div>
        <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 tracking-wide uppercase transition-colors">
          {label}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <section className="w-full px-6 lg:px-12 xl:px-20 py-20 md:py-32 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-[1920px] mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight transition-colors">
            Discover Amazing Destinations
          </h1>
          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-light mb-12 max-w-2xl mx-auto transition-colors">
            Explore Vietnam's most beautiful places. From stunning beaches to historic landmarks.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-4">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search destinations, cities, attractions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-transparent"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white px-6 py-2 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition shadow-md"
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Filters Dropdown */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                    >
                      <option value="all">All Cities</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.category} value={cat.category}>
                          {cat.category} ({cat._count})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Apply and Reset Buttons */}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleResetFilters}
                    className="px-6 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition font-medium transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleApplyFilters}
                    className="px-8 py-2 rounded-xl bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white hover:bg-gray-800 dark:hover:bg-gray-200 transition font-medium shadow-lg hover:shadow-xl transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-16 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center max-w-[1920px] mx-auto">
            <StatsItem
              value={totalPlaces || filteredPlaces.length}
              label="Destinations"
              duration={2000}
            />
            <StatsItem
              value={categories.length}
              label="Categories"
              duration={1800}
            />
            <StatsItem
              value={cities.length}
              label="Cities"
              duration={1500}
            />
            <StatsItem
              value={avgRating}
              label="Avg Rating"
              duration={2200}
              decimals={1}
            />
          </div>
        </div>
      </section>

      {/* Places Grid */}
      <section className="py-20 md:py-32 w-full bg-gray-50 dark:bg-gray-800 transition-colors">
        <div className="w-full px-6 lg:px-12 xl:px-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1920px] mx-auto">
            {[...Array(12)].map((_, index) => (
              <PlaceCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="text-center py-20 max-w-[1920px] mx-auto">
            <MapPin className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
              No destinations found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 transition-colors">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1920px] mx-auto mb-8">
              {/* ALGORITHM: No need to slice - backend already returns only current page items */}
              {/* Only filter by searchQuery (client-side search) */}
              {filteredPlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={{
                      id: place.id,
                      name: place.name,
                      category: place.category,
                      address: place.address,
                      rating: place.rating,
                      photos: place.photos,
                      priceRange: place.price_range,
                      tags: place.tags,
                      totalReviews: place.total_reviews
                    }}
                    onClick={() => navigate(`/place/${place.id}`)}
                  />
            ))}
          </div>

          {/* Pagination */}
          {/* ALGORITHM: Use totalPlaces from backend for accurate pagination */}
          {totalPlaces > ITEMS_PER_PAGE && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white dark:bg-gray-900 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-gray-200 dark:border-gray-700"
              >
                <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.ceil(totalPlaces / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      page === currentPage
                        ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg'
                        : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalPlaces / ITEMS_PER_PAGE), p + 1))}
                disabled={currentPage >= Math.ceil(totalPlaces / ITEMS_PER_PAGE)}
                className="p-2 rounded-lg bg-white dark:bg-gray-900 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-gray-200 dark:border-gray-700"
              >
                <ChevronRight className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>
            </div>
          )}
        </>
        )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 bg-gray-900 dark:bg-gray-800 text-white transition-colors w-full">
        <div className="w-full px-6 lg:px-12 xl:px-20 text-center">
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 tracking-tight">
              Ready to explore?
            </h2>
            <p className="text-lg md:text-xl text-gray-400 dark:text-gray-300 mb-12 font-light max-w-2xl mx-auto transition-colors">
              Find the perfect vehicle to visit these amazing destinations
            </p>
            <button
              onClick={() => navigate('/search')}
              className="px-12 py-4 text-sm font-medium tracking-widest text-gray-900 bg-white hover:bg-gray-100 transition-all rounded-xl shadow-lg hover:shadow-2xl inline-flex items-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              BROWSE VEHICLES
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
